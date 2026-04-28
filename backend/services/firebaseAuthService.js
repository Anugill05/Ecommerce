"use strict";

/**
 * services/firebaseAuthService.js
 *
 * Firebase Phone Auth — server-side token verification service.
 *
 * Flow (how Firebase phone auth works):
 *
 *   [Frontend]
 *   1. User enters phone number
 *   2. Firebase client SDK sends OTP SMS automatically (reCAPTCHA verified)
 *   3. User enters the 6-digit OTP
 *   4. Firebase client SDK verifies OTP and returns an ID Token (a signed JWT)
 *   5. Frontend sends that ID Token to our backend
 *
 *   [Backend — this file]
 *   6. We call admin.auth().verifyIdToken(idToken) → Firebase validates it
 *   7. Decoded token contains: uid, phone_number, and verification metadata
 *   8. We extract the phone number and find/create the user in MongoDB
 *   9. We issue our own JWT for subsequent API requests
 *
 * Security guarantees from Firebase:
 *   - OTP was genuinely sent and correctly entered by the user
 *   - Token is signed by Firebase and has not been tampered with
 *   - Token has not expired (1 hour max lifetime)
 *   - Phone number in the token is verified
 *
 * Redis is still used for:
 *   - Rate limiting: max token verifications per IP per minute
 *   - Replay protection: each Firebase ID token can only be exchanged once
 */

const { getFirebaseAdmin } = require("../config/firebase");
const { getRedis }          = require("../config/redis");
const AppError              = require("../utils/AppError");

const REPLAY_TTL_SECONDS     = 3600;       // match Firebase token lifetime (1 hour)
const RATE_WINDOW_SECONDS    = 60;
const MAX_VERIFY_PER_MINUTE  = parseInt(process.env.FIREBASE_VERIFY_RATE_LIMIT, 10) || 10;

// Redis key namespaces
const K = {
  usedToken: (uid, iat) => `fb:used_token:${uid}:${iat}`,  // replay prevention
  rateLimit:  (ip)      => `fb:rate:${ip}`,                 // per-IP rate limit
};

// ── Rate limiting ─────────────────────────────────────────────────────────────

const enforceRateLimit = async (redis, ip) => {
  const key   = K.rateLimit(ip);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);

  if (count > MAX_VERIFY_PER_MINUTE) {
    const ttl = await redis.ttl(key);
    throw new AppError(
      `Too many login attempts. Please try again in ${ttl} second(s).`,
      429
    );
  }
};

// ── Replay prevention ─────────────────────────────────────────────────────────

const preventTokenReplay = async (redis, uid, iat) => {
  const key    = K.usedToken(uid, iat);
  // SET NX — only succeeds if the key does NOT already exist
  const result = await redis.set(key, "1", "NX", "EX", REPLAY_TTL_SECONDS);

  if (result !== "OK") {
    throw new AppError(
      "This login token has already been used. Please sign in again.",
      401
    );
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * verifyFirebaseToken(idToken, ip)
 *
 * Verifies a Firebase ID token issued after successful phone OTP verification.
 * Returns the verified phone number (normalised to 10-digit Indian format).
 *
 * @param {string} idToken  Firebase ID token from frontend
 * @param {string} ip       Client IP (for rate limiting)
 * @returns {{ phone: string, firebaseUid: string }}
 */
const verifyFirebaseToken = async (idToken, ip = "unknown") => {
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("Firebase ID token is required", 400);
  }

  const redis = getRedis();

  // 1. Rate limit per IP
  await enforceRateLimit(redis, ip);

  // 2. Verify token with Firebase Admin SDK
  let decoded;
  try {
    const admin = getFirebaseAdmin();
    decoded = await admin.auth().verifyIdToken(idToken, true); // checkRevoked = true
  } catch (err) {
    // Map Firebase error codes to clean user-facing messages
    const code    = err.code || "";
    const message =
      code === "auth/id-token-expired"
        ? "Your login session has expired. Please sign in again."
        : code === "auth/id-token-revoked"
        ? "Your login was revoked. Please sign in again."
        : code === "auth/argument-error"
        ? "Invalid login token. Please sign in again."
        : "Login verification failed. Please try again.";

    throw new AppError(message, 401);
  }

  // 3. Ensure this is a phone-auth token
  if (!decoded.phone_number) {
    throw new AppError(
      "Only phone number authentication is supported.",
      400
    );
  }

  // 4. Replay prevention — each token can only be exchanged once
  await preventTokenReplay(redis, decoded.uid, decoded.iat);

  // 5. Normalise phone number — strip country code prefix, return 10 digits
  //    Firebase stores as E.164 format: "+919876543210"
  const rawPhone = decoded.phone_number;
  const phone    = rawPhone.replace(/^\+91/, "").replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new AppError(
      "Only Indian mobile numbers (+91) are supported.",
      400
    );
  }

  return {
    phone,
    firebaseUid: decoded.uid,
  };
};

module.exports = { verifyFirebaseToken };