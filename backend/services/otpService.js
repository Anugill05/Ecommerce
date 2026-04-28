// /**
//  * SMS Service — Provider abstraction layer.
//  *
//  * To switch providers: change the `sendViaSMS` function below.
//  * The OTP lifecycle (generate, store, verify, consume) is provider-agnostic.
//  *
//  * Supported: Mock (dev) | Twilio | MSG91
//  * Set TWILIO_* or MSG91_* env vars and uncomment the relevant section.
//  */

// const { getRedis } = require("../config/redis");

// const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_SECONDS) || 300;
// const OTP_PREFIX = "otp:";
// const OTP_ATTEMPTS_PREFIX = "otp_attempts:";
// const MAX_ATTEMPTS = 5;

// // ── Provider: Send SMS ────────────────────────────────────────────────────────

// const sendViaSMS = async (phone, otp) => {
//   const isProduction = process.env.NODE_ENV === "production";

//   if (!isProduction) {
//     // Development mock: log to console
//     console.log(`\n${"=".repeat(40)}`);
//     console.log(`  OTP for +91-${phone}: ${otp}`);
//     console.log(`  Expires in ${OTP_EXPIRY}s`);
//     console.log("=".repeat(40) + "\n");
//     return { provider: "mock", success: true };
//   }

//   // ── Twilio (uncomment to use) ─────────────────────────────────────────────
//   // const twilio = require("twilio");
//   // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//   // await client.messages.create({
//   //   body: `Your FlashKart OTP is: ${otp}. Valid for ${OTP_EXPIRY / 60} minutes. Do not share.`,
//   //   from: process.env.TWILIO_PHONE_NUMBER,
//   //   to: `+91${phone}`,
//   // });
//   // return { provider: "twilio", success: true };

//   // ── MSG91 (uncomment to use) ──────────────────────────────────────────────
//   // const axios = require("axios");
//   // await axios.post("https://api.msg91.com/api/v5/otp", {
//   //   template_id: process.env.MSG91_TEMPLATE_ID,
//   //   mobile: `91${phone}`,
//   //   authkey: process.env.MSG91_AUTH_KEY,
//   //   otp,
//   // });
//   // return { provider: "msg91", success: true };

//   throw new Error("No SMS provider configured for production. Set TWILIO_* or MSG91_* env vars.");
// };

// // ── OTP Lifecycle ─────────────────────────────────────────────────────────────

// /**
//  * Generate a 6-digit OTP, store in Redis, send via SMS.
//  */
// const generateAndSendOTP = async (phone) => {
//   const redis = getRedis();

//   // Check attempt limit to prevent abuse
//   const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;
//   const attempts = await redis.incr(attemptsKey);
//   if (attempts === 1) await redis.expire(attemptsKey, 3600); // 1 hour window
//   if (attempts > MAX_ATTEMPTS) {
//     const ttl = await redis.ttl(attemptsKey);
//     throw Object.assign(
//       new Error(`Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minutes.`),
//       { statusCode: 429 }
//     );
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const key = `${OTP_PREFIX}${phone}`;

//   await redis.set(key, otp, "EX", OTP_EXPIRY);
//   await sendViaSMS(phone, otp);

//   return { sent: true, expiresIn: OTP_EXPIRY };
// };

// /**
//  * Verify OTP. Consumes it on success (one-time use).
//  * Returns true | false.
//  */
// const verifyOTP = async (phone, otp) => {
//   const redis = getRedis();
//   const key = `${OTP_PREFIX}${phone}`;
//   const stored = await redis.get(key);

//   if (!stored || stored !== String(otp)) return false;

//   // Consume the OTP immediately after successful verification
//   await redis.del(key);
//   // Reset attempt counter on success
//   await redis.del(`${OTP_ATTEMPTS_PREFIX}${phone}`);

//   return true;
// };

// module.exports = { generateAndSendOTP, verifyOTP };


// "use strict";

// /**
//  * services/otpService.js
//  *
//  * Production OTP service using MSG91's native OTP API (/api/v5/otp).
//  *
//  * How MSG91 OTP API works:
//  *   - POST /api/v5/otp   → MSG91 generates & sends OTP internally, returns request_id
//  *   - POST /api/v5/otp/verify → you send the OTP the user typed; MSG91 validates it
//  *   - POST /api/v5/otp/retry  → MSG91 resends the OTP it already generated
//  *
//  * This means:
//  *   - We do NOT generate our own OTP number
//  *   - We do NOT store the OTP in Redis (MSG91 owns it)
//  *   - We DO store request_id in Redis (needed for verify & retry calls)
//  *   - Redis is still used for rate limiting and cooldown enforcement
//  *
//  * Only env vars needed:
//  *   MSG91_AUTH_KEY   — your MSG91 API key (no DLT, no template, no sender ID required)
//  */

// const axios     = require("axios");
// const { getRedis } = require("../config/redis");
// const AppError  = require("../utils/AppError");

// // ── Config ────────────────────────────────────────────────────────────────────

// const OTP_TTL_SECONDS     = parseInt(process.env.OTP_EXPIRY_SECONDS, 10)        || 300; // 5 min
// const RATE_WINDOW_SECONDS = parseInt(process.env.OTP_RATE_WINDOW_SECONDS, 10)   || 300; // 5 min
// const MAX_SEND_ATTEMPTS   = parseInt(process.env.OTP_MAX_SEND_ATTEMPTS, 10)     || 3;
// const MAX_VERIFY_ATTEMPTS = parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS, 10)   || 5;
// const RESEND_COOLDOWN_SEC = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30;

// const MSG91_BASE          = "https://control.msg91.com/api/v5/otp";
// const MSG91_TIMEOUT_MS    = 8000;

// // ── Redis key namespaces ──────────────────────────────────────────────────────

// const K = {
//   requestId:      (phone) => `otp:reqid:${phone}`,     // stores MSG91 request_id
//   sendCount:      (phone) => `otp:send_count:${phone}`,
//   verifyAttempts: (phone) => `otp:verify_attempts:${phone}`,
//   lastSentAt:     (phone) => `otp:last_sent:${phone}`,
// };

// // ── MSG91 HTTP client ─────────────────────────────────────────────────────────

// const msg91 = () => {
//   const authKey = process.env.MSG91_AUTH_KEY;
//   if (!authKey) throw new AppError("MSG91_AUTH_KEY is not configured", 500);

//   return axios.create({
//     baseURL: MSG91_BASE,
//     timeout: MSG91_TIMEOUT_MS,
//     headers: {
//       authkey:        authKey,
//       "Content-Type": "application/json",
//       accept:         "application/json",
//     },
//   });
// };

// /**
//  * Parse MSG91 API response.
//  * MSG91 always returns HTTP 200 even on logical errors.
//  * Actual result is in response.data.type: "success" | "error"
//  */
// const parseMSG91Response = (response, context) => {
//   const data = response.data;
//   if (data?.type !== "success") {
//     const reason = data?.message || data?.msg || "Unknown MSG91 error";
//     throw new AppError(`OTP ${context} failed: ${reason}`, 502);
//   }
//   return data;
// };

// // ── Rate limiting helpers ─────────────────────────────────────────────────────

// const enforceResendCooldown = async (redis, phone) => {
//   const lastSent  = await redis.get(K.lastSentAt(phone));
//   if (!lastSent) return;

//   const elapsed   = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
//   const remaining = RESEND_COOLDOWN_SEC - elapsed;

//   if (remaining > 0) {
//     throw new AppError(
//       `Please wait ${remaining} second(s) before requesting a new OTP.`,
//       429
//     );
//   }
// };

// const enforceSendRateLimit = async (redis, phone) => {
//   const key   = K.sendCount(phone);
//   const count = await redis.incr(key);
//   if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);

//   if (count > MAX_SEND_ATTEMPTS) {
//     const ttl = await redis.ttl(key);
//     throw new AppError(
//       `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minute(s).`,
//       429
//     );
//   }

//   return MAX_SEND_ATTEMPTS - count; // attemptsLeft
// };

// const enforceVerifyRateLimit = async (redis, phone) => {
//   const key      = K.verifyAttempts(phone);
//   const attempts = await redis.incr(key);
//   if (attempts === 1) await redis.expire(key, OTP_TTL_SECONDS);

//   if (attempts > MAX_VERIFY_ATTEMPTS) {
//     // Wipe request_id so no further verify calls can succeed
//     await redis.del(K.requestId(phone));
//     throw new AppError(
//       "Too many incorrect attempts. Please request a new OTP.",
//       429
//     );
//   }
// };

// // ── Mock provider (development only) ─────────────────────────────────────────

// const MOCK_REQUEST_ID = "mock_reqid_dev";

// const sendMock = async (phone) => {
//   // In mock mode we store a fake request_id and a known OTP (1234 for tests)
//   // The verifyMock function accepts any 6-digit input in dev for convenience,
//   // OR you can set MOCK_OTP in env to enforce a specific value.
//   process.stdout.write(
//     JSON.stringify({
//       level:      "DEBUG",
//       event:      "OTP_MOCK_SENT",
//       phone:      `+91-${phone.slice(0, 5)}XXXXX`,
//       mock_otp:   process.env.MOCK_OTP || "123456",
//       expires_in: `${OTP_TTL_SECONDS}s`,
//       note:       "This is a mock. No SMS was sent.",
//       ts:         new Date().toISOString(),
//     }) + "\n"
//   );
//   return MOCK_REQUEST_ID;
// };

// const verifyMock = async (phone, otp) => {
//   const expected = process.env.MOCK_OTP || "123456";
//   if (String(otp) !== expected) {
//     throw new AppError("Invalid OTP. Please check and try again.", 400);
//   }
// };

// // ── Public API ────────────────────────────────────────────────────────────────

// /**
//  * sendOTP(phone)
//  *
//  * Sends OTP via MSG91 OTP API. MSG91 generates the OTP internally.
//  * Stores the returned request_id in Redis (required for verify & retry).
//  *
//  * @param   {string} phone  10-digit Indian mobile, no country code
//  * @returns {{ expiresIn, resendAfter, attemptsLeft }}
//  */
// const sendOTP = async (phone) => {
//   const redis = getRedis();

//   await enforceResendCooldown(redis, phone);
//   const attemptsLeft = await enforceSendRateLimit(redis, phone);

//   let requestId;

//   if (process.env.NODE_ENV !== "production") {
//     requestId = await sendMock(phone);
//   } else {
//     const client   = msg91();
//     const response = await client.post("", {
//       mobile:     `91${phone}`,
//       otp_length: 6,
//       otp_expiry: Math.ceil(OTP_TTL_SECONDS / 60), // MSG91 accepts minutes
//     }).catch((err) => {
//       // Network-level errors (DNS failure, timeout, etc.)
//       const msg = err.code === "ECONNABORTED"
//         ? "OTP service timed out. Please try again."
//         : "OTP service is temporarily unavailable. Please try again.";
//       throw new AppError(msg, 503);
//     });

//     const data = parseMSG91Response(response, "send");
//     requestId  = data.request_id;

//     if (!requestId) {
//       throw new AppError("OTP sent but request_id missing from MSG91 response.", 502);
//     }
//   }

//   // Store request_id in Redis — this is the handle for verify & retry
//   await Promise.all([
//     redis.set(K.requestId(phone), requestId, "EX", OTP_TTL_SECONDS),
//     redis.del(K.verifyAttempts(phone)),   // reset bad-attempt counter for fresh OTP
//     redis.set(K.lastSentAt(phone), Date.now().toString(), "EX", RESEND_COOLDOWN_SEC + 10),
//   ]);

//   return {
//     expiresIn:   OTP_TTL_SECONDS,
//     resendAfter: RESEND_COOLDOWN_SEC,
//     attemptsLeft,
//   };
// };

// /**
//  * verifyOTP(phone, otp)
//  *
//  * Calls MSG91's verify endpoint with the request_id stored in Redis
//  * and the OTP the user entered. MSG91 performs the comparison server-side.
//  *
//  * On success: cleans up all Redis keys for this phone.
//  * On failure: throws AppError (invalid, expired, or brute-forced).
//  *
//  * @param {string} phone  10-digit Indian mobile
//  * @param {string} otp    6-digit OTP entered by user
//  */
// const verifyOTP = async (phone, otp) => {
//   const redis     = getRedis();
//   const requestId = await redis.get(K.requestId(phone));

//   if (!requestId) {
//     throw new AppError(
//       "OTP has expired or was never sent. Please request a new OTP.",
//       400
//     );
//   }

//   // Brute-force gate — counted before the actual API call
//   await enforceVerifyRateLimit(redis, phone);

//   if (process.env.NODE_ENV !== "production") {
//     await verifyMock(phone, otp);
//   } else {
//     const client   = msg91();
//     const response = await client.get("/verify", {
//       params: {
//         request_id: requestId,
//         otp:        String(otp),
//       },
//     }).catch((err) => {
//       const msg = err.code === "ECONNABORTED"
//         ? "OTP verification timed out. Please try again."
//         : "OTP service is temporarily unavailable. Please try again.";
//       throw new AppError(msg, 503);
//     });

//     // MSG91 returns type:"success" on match, type:"error" + message on mismatch
//     if (response.data?.type !== "success") {
//       const reason = response.data?.message || "";
//       // Distinguish expired vs wrong OTP from MSG91's message
//       if (/expire/i.test(reason)) {
//         throw new AppError("OTP has expired. Please request a new one.", 400);
//       }
//       throw new AppError("Invalid OTP. Please check and try again.", 400);
//     }
//   }

//   // OTP verified — clean up all Redis keys for this phone atomically
//   await Promise.all([
//     redis.del(K.requestId(phone)),
//     redis.del(K.verifyAttempts(phone)),
//     redis.del(K.sendCount(phone)),
//     redis.del(K.lastSentAt(phone)),
//   ]);
// };

// /**
//  * resendOTP(phone)
//  *
//  * Uses MSG91's retry endpoint to resend the OTP it already generated.
//  * This preserves the same request_id, so no new Redis entry is needed.
//  * Cooldown and rate limiting still apply.
//  *
//  * retrytype: "text" = resend as SMS (use "voice" for voice call fallback)
//  *
//  * @param   {string} phone  10-digit Indian mobile
//  * @returns {{ expiresIn, resendAfter }}
//  */
// const resendOTP = async (phone) => {
//   const redis     = getRedis();
//   const requestId = await redis.get(K.requestId(phone));

//   if (!requestId) {
//     // No active OTP session — fall back to a fresh send
//     return sendOTP(phone);
//   }

//   await enforceResendCooldown(redis, phone);
//   await enforceSendRateLimit(redis, phone);

//   if (process.env.NODE_ENV !== "production") {
//     await sendMock(phone); // re-log in dev
//   } else {
//     const client   = msg91();
//     const response = await client.get("/retry", {
//       params: {
//         request_id: requestId,
//         retrytype:  "text",            // "voice" for IVR fallback
//       },
//     }).catch((err) => {
//       throw new AppError("OTP resend failed. Please try again.", 503);
//     });

//     parseMSG91Response(response, "resend");
//   }

//   // Refresh the TTL on the stored request_id so it doesn't expire mid-session
//   await Promise.all([
//     redis.expire(K.requestId(phone), OTP_TTL_SECONDS),
//     redis.set(K.lastSentAt(phone), Date.now().toString(), "EX", RESEND_COOLDOWN_SEC + 10),
//     redis.del(K.verifyAttempts(phone)),
//   ]);

//   return {
//     expiresIn:   OTP_TTL_SECONDS,
//     resendAfter: RESEND_COOLDOWN_SEC,
//   };
// };

// /**
//  * getOTPMeta(phone)
//  *
//  * Returns cooldown and expiry state for the frontend countdown timer.
//  * Does NOT expose the OTP or request_id.
//  *
//  * @param   {string} phone
//  * @returns {{ exists, ttl, resendAvailable, resendAfter }}
//  */
// const getOTPMeta = async (phone) => {
//   const redis = getRedis();

//   const [reqIdTTL, lastSent] = await Promise.all([
//     redis.ttl(K.requestId(phone)),
//     redis.get(K.lastSentAt(phone)),
//   ]);

//   const exists = reqIdTTL > 0;
//   let resendAfter = 0;

//   if (lastSent) {
//     const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
//     resendAfter   = Math.max(0, RESEND_COOLDOWN_SEC - elapsed);
//   }

//   return {
//     exists,
//     ttl:             exists ? reqIdTTL : 0,
//     resendAvailable: resendAfter === 0,
//     resendAfter,
//   };
// };

// module.exports = { sendOTP, verifyOTP, resendOTP, getOTPMeta };


// "use strict";

// const axios = require("axios");
// const { getRedis } = require("../config/redis");
// const AppError = require("../utils/AppError");

// // ───────────────── CONFIG ─────────────────

// const OTP_TTL_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300;
// const RATE_WINDOW_SECONDS = parseInt(process.env.OTP_RATE_WINDOW_SECONDS, 10) || 300;
// const MAX_SEND_ATTEMPTS = parseInt(process.env.OTP_MAX_SEND_ATTEMPTS, 10) || 3;
// const MAX_VERIFY_ATTEMPTS = parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS, 10) || 5;
// const RESEND_COOLDOWN_SEC = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30;

// const MSG91_BASE = "https://api.msg91.com/api/v5/otp";
// const MSG91_TIMEOUT_MS = 8000;

// // ───────────────── REDIS KEYS ─────────────────

// const K = {
//   requestId: (p) => `otp:req:${p}`,
//   sendCount: (p) => `otp:send:${p}`,
//   verifyAttempts: (p) => `otp:verify:${p}`,
//   lastSentAt: (p) => `otp:last:${p}`,
// };

// // ───────────────── MSG91 CLIENT ─────────────────

// const msg91 = () => {
//   if (!process.env.MSG91_AUTH_KEY) {
//     throw new AppError("MSG91_AUTH_KEY missing in environment", 500);
//   }

//   return axios.create({
//     baseURL: MSG91_BASE,
//     timeout: MSG91_TIMEOUT_MS,
//     headers: {
//       authkey: process.env.MSG91_AUTH_KEY,
//       "Content-Type": "application/json",
//       accept: "application/json",
//     },
//   });
// };

// // ───────────────── SAFE PARSER ─────────────────

// const parseMSG91 = (response, context) => {
//   if (!response || !response.data) {
//     throw new AppError(`OTP ${context} failed: Empty response from MSG91`, 502);
//   }

//   if (response.data.type !== "success") {
//     throw new AppError(
//       `OTP ${context} failed: ${response.data.message || "Unknown error"}`,
//       502
//     );
//   }

//   return response.data;
// };

// // ───────────────── REDIS SAFE WRAPPER ─────────────────

// const safeRedis = async (fn, fallback = null) => {
//   try {
//     return await fn();
//   } catch (err) {
//     console.error("Redis error:", err.message);
//     return fallback;
//   }
// };

// // ───────────────── RATE LIMITERS ─────────────────

// const checkSendLimit = async (redis, phone) => {
//   const key = K.sendCount(phone);

//   const count = await redis.incr(key);
//   if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);

//   if (count > MAX_SEND_ATTEMPTS) {
//     const ttl = await redis.ttl(key);
//     throw new AppError(
//       `Too many OTP requests. Try again after ${Math.ceil(ttl / 60)} min`,
//       429
//     );
//   }

//   return MAX_SEND_ATTEMPTS - count;
// };

// const checkCooldown = async (redis, phone) => {
//   const last = await redis.get(K.lastSentAt(phone));
//   if (!last) return;

//   const diff = Math.floor((Date.now() - Number(last)) / 1000);
//   const remaining = RESEND_COOLDOWN_SEC - diff;

//   if (remaining > 0) {
//     throw new AppError(`Wait ${remaining}s before retrying OTP`, 429);
//   }
// };

// const checkVerifyLimit = async (redis, phone) => {
//   const key = K.verifyAttempts(phone);
//   const attempts = await redis.incr(key);

//   if (attempts === 1) await redis.expire(key, OTP_TTL_SECONDS);

//   if (attempts > MAX_VERIFY_ATTEMPTS) {
//     await redis.del(K.requestId(phone));
//     throw new AppError("Too many invalid attempts. Request new OTP.", 429);
//   }
// };

// // ───────────────── SEND OTP ─────────────────
// console.log("🔥 sendOTP CALLED");
// const sendOTP = async (phone) => {
//   const redis = getRedis();

//   try {
//     if (!/^[6-9]\d{9}$/.test(phone)) {
//       throw new AppError("Invalid phone number", 400);
//     }

//     await checkCooldown(redis, phone);
//     const attemptsLeft = await checkSendLimit(redis, phone);

//     let requestId;

//     const client = msg91();

//     const response = await axios.post(
//   "https://api.msg91.com/api/v5/otp",
//   {
//     mobile: `91${phone}`,
//     otp_length: 6,
//     otp_expiry: Math.ceil(OTP_TTL_SECONDS / 60),
//   },
//   {
//     headers: {
//       authkey: process.env.MSG91_AUTH_KEY.trim(),
//       "Content-Type": "application/json",
//     },
//   }
// );

//     const data = parseMSG91(response, "send");
//     requestId = data.request_id;

//     if (!requestId) {
//       throw new AppError("MSG91 did not return request_id", 502);
//     }

//     await Promise.all([
//       redis.set(K.requestId(phone), requestId, "EX", OTP_TTL_SECONDS),
//       redis.set(K.lastSentAt(phone), Date.now().toString(), "EX", RESEND_COOLDOWN_SEC + 10),
//       redis.del(K.verifyAttempts(phone)),
//     ]);

//     return {
//       expiresIn: OTP_TTL_SECONDS,
//       resendAfter: RESEND_COOLDOWN_SEC,
//       attemptsLeft,
//     };

//   } catch (err) {
//     console.error("sendOTP error:", err.message);

//     if (err instanceof AppError) throw err;

//     throw new AppError("Failed to send OTP. Try again later.", 500);
//   }
// };

// // ───────────────── VERIFY OTP ─────────────────

// const verifyOTP = async (phone, otp) => {
//   const redis = getRedis();

//   try {
//     const requestId = await redis.get(K.requestId(phone));

//     if (!requestId) {
//       throw new AppError("OTP expired or not found", 400);
//     }

//     await checkVerifyLimit(redis, phone);

//     const client = msg91();

//     const response = await client.post("/verify", {
//       mobile: `91${phone}`,
//       otp: String(otp),
//     });

//     const data = parseMSG91(response, "verify");

//     if (data.type !== "success") {
//       throw new AppError("Invalid OTP", 400);
//     }

//     await Promise.all([
//       redis.del(K.requestId(phone)),
//       redis.del(K.sendCount(phone)),
//       redis.del(K.verifyAttempts(phone)),
//       redis.del(K.lastSentAt(phone)),
//     ]);

//   } catch (err) {
//     console.error("verifyOTP error:", err.message);

//     if (err instanceof AppError) throw err;

//     throw new AppError("OTP verification failed", 500);
//   }
// };

// // ───────────────── RESEND OTP ─────────────────

// const resendOTP = async (phone) => {
//   const redis = getRedis();

//   try {
//     const requestId = await redis.get(K.requestId(phone));

//     if (!requestId) {
//       return sendOTP(phone);
//     }

//     await checkCooldown(redis, phone);
//     await checkSendLimit(redis, phone);

//     const client = msg91();

//     const response = await client.post("/retry", {
//       mobile: `91${phone}`,
//       retrytype: "text",
//     });

//     parseMSG91(response, "resend");

//     await redis.expire(K.requestId(phone), OTP_TTL_SECONDS);

//     return {
//       expiresIn: OTP_TTL_SECONDS,
//       resendAfter: RESEND_COOLDOWN_SEC,
//     };

//   } catch (err) {
//     console.error("resendOTP error:", err.message);

//     if (err instanceof AppError) throw err;

//     throw new AppError("Failed to resend OTP", 500);
//   }
// };

// // ───────────────── META ─────────────────

// const getOTPMeta = async (phone) => {
//   const redis = getRedis();

//   try {
//     const ttl = await redis.ttl(K.requestId(phone));
//     const last = await redis.get(K.lastSentAt(phone));

//     let resendAfter = 0;

//     if (last) {
//       const diff = Math.floor((Date.now() - Number(last)) / 1000);
//       resendAfter = Math.max(0, RESEND_COOLDOWN_SEC - diff);
//     }

//     return {
//       exists: ttl > 0,
//       ttl: Math.max(0, ttl),
//       resendAvailable: resendAfter === 0,
//       resendAfter,
//     };

//   } catch (err) {
//     console.error("getOTPMeta error:", err.message);
//     throw new AppError("Failed to fetch OTP status", 500);
//   }
// };

// module.exports = {
//   sendOTP,
//   verifyOTP,
//   resendOTP,
//   getOTPMeta,
// };


"use strict";

const axios = require("axios");
const { getRedis } = require("../config/redis");
const AppError = require("../utils/AppError");

// ───────────────── CONFIG ─────────────────

const OTP_TTL_SECONDS =
  parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300;

const RATE_WINDOW_SECONDS =
  parseInt(process.env.OTP_RATE_WINDOW_SECONDS, 10) || 300;

const MAX_SEND_ATTEMPTS =
  parseInt(process.env.OTP_MAX_SEND_ATTEMPTS, 10) || 3;

const MAX_VERIFY_ATTEMPTS =
  parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS, 10) || 5;

const RESEND_COOLDOWN_SEC =
  parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30;

// IMPORTANT: correct MSG91 endpoint
const MSG91_BASE = "https://control.msg91.com/api/v5/otp";
const MSG91_TIMEOUT_MS = 8000;

// ───────────────── REDIS KEYS ─────────────────

const K = {
  requestId: (p) => `otp:req:${p}`,
  sendCount: (p) => `otp:send:${p}`,
  verifyAttempts: (p) => `otp:verify:${p}`,
  lastSentAt: (p) => `otp:last:${p}`,
};

// ───────────────── MSG91 CLIENT ─────────────────

const msg91 = () => {
  const key = process.env.MSG91_AUTH_KEY;

  if (!key) {
    throw new AppError("MSG91_AUTH_KEY missing in environment", 500);
  }

  return axios.create({
    baseURL: MSG91_BASE,
    timeout: MSG91_TIMEOUT_MS,
    headers: {
      authkey: key.trim(),
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });
};

// ───────────────── RESPONSE PARSER ─────────────────

const parseMSG91 = (response, context) => {
  if (!response?.data) {
    throw new AppError(`MSG91 ${context} failed: empty response`, 502);
  }

  console.log(`📩 MSG91 RESPONSE [${context}]:`, response.data);

  if (response.data.type !== "success") {
    throw new AppError(
      `MSG91 ${context} failed: ${
        response.data.message || "Unknown error"
      }`,
      502
    );
  }

  return response.data;
};

// ───────────────── RATE LIMITERS ─────────────────

const checkSendLimit = async (redis, phone) => {
  const key = K.sendCount(phone);

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);

  if (count > MAX_SEND_ATTEMPTS) {
    const ttl = await redis.ttl(key);
    throw new AppError(
      `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} min`,
      429
    );
  }

  return MAX_SEND_ATTEMPTS - count;
};

const checkCooldown = async (redis, phone) => {
  const last = await redis.get(K.lastSentAt(phone));
  if (!last) return;

  const diff = Math.floor((Date.now() - Number(last)) / 1000);
  const remaining = RESEND_COOLDOWN_SEC - diff;

  if (remaining > 0) {
    throw new AppError(`Wait ${remaining}s before retrying OTP`, 429);
  }
};

const checkVerifyLimit = async (redis, phone) => {
  const key = K.verifyAttempts(phone);

  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, OTP_TTL_SECONDS);

  if (attempts > MAX_VERIFY_ATTEMPTS) {
    await redis.del(K.requestId(phone));
    throw new AppError("Too many invalid attempts. Request new OTP.", 429);
  }
};

// ───────────────── SEND OTP ─────────────────

const sendOTP = async (phone) => {
  const redis = getRedis();

  try {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new AppError("Invalid phone number", 400);
    }

    await checkCooldown(redis, phone);
    const attemptsLeft = await checkSendLimit(redis, phone);

    const client = msg91();

    const response = await client.post("", {
      mobile: `91${phone}`,
      otp_length: 6,
      otp_expiry: Math.ceil(OTP_TTL_SECONDS / 60),
    });

    const data = parseMSG91(response, "send");

    const requestId = data.request_id;

    if (!requestId) {
      throw new AppError("MSG91 did not return request_id", 502);
    }

    await Promise.all([
      redis.set(K.requestId(phone), requestId, "EX", OTP_TTL_SECONDS),
      redis.set(
        K.lastSentAt(phone),
        Date.now().toString(),
        "EX",
        RESEND_COOLDOWN_SEC + 10
      ),
      redis.del(K.verifyAttempts(phone)),
    ]);

    return {
      expiresIn: OTP_TTL_SECONDS,
      resendAfter: RESEND_COOLDOWN_SEC,
      attemptsLeft,
    };
  } catch (err) {
    console.error("❌ sendOTP error:", err.message);

    if (err instanceof AppError) throw err;

    throw new AppError("Failed to send OTP. Try again later.", 500);
  }
};

// ───────────────── VERIFY OTP ─────────────────

const verifyOTP = async (phone, otp) => {
  const redis = getRedis();

  try {
    const requestId = await redis.get(K.requestId(phone));

    if (!requestId) {
      throw new AppError("OTP expired or not found", 400);
    }

    await checkVerifyLimit(redis, phone);

    const client = msg91();

    const response = await client.get("/verify", {
      params: {
        request_id: requestId,
        otp: String(otp),
      },
    });

    const data = parseMSG91(response, "verify");

    if (data.type !== "success") {
      throw new AppError("Invalid OTP", 400);
    }

    await Promise.all([
      redis.del(K.requestId(phone)),
      redis.del(K.sendCount(phone)),
      redis.del(K.verifyAttempts(phone)),
      redis.del(K.lastSentAt(phone)),
    ]);
  } catch (err) {
    console.error("❌ verifyOTP error:", err.message);

    if (err instanceof AppError) throw err;

    throw new AppError("OTP verification failed", 500);
  }
};

// ───────────────── RESEND OTP ─────────────────

const resendOTP = async (phone) => {
  const redis = getRedis();

  try {
    const requestId = await redis.get(K.requestId(phone));

    if (!requestId) {
      return sendOTP(phone);
    }

    await checkCooldown(redis, phone);
    await checkSendLimit(redis, phone);

    const client = msg91();

    const response = await client.get("/retry", {
      params: {
        request_id: requestId,
        retrytype: "text",
      },
    });

    parseMSG91(response, "resend");

    await redis.expire(K.requestId(phone), OTP_TTL_SECONDS);

    return {
      expiresIn: OTP_TTL_SECONDS,
      resendAfter: RESEND_COOLDOWN_SEC,
    };
  } catch (err) {
    console.error("❌ resendOTP error:", err.message);

    if (err instanceof AppError) throw err;

    throw new AppError("Failed to resend OTP", 500);
  }
};

// ───────────────── META ─────────────────

const getOTPMeta = async (phone) => {
  const redis = getRedis();

  try {
    const ttl = await redis.ttl(K.requestId(phone));
    const last = await redis.get(K.lastSentAt(phone));

    let resendAfter = 0;

    if (last) {
      const diff = Math.floor((Date.now() - Number(last)) / 1000);
      resendAfter = Math.max(0, RESEND_COOLDOWN_SEC - diff);
    }

    return {
      exists: ttl > 0,
      ttl: Math.max(0, ttl),
      resendAvailable: resendAfter === 0,
      resendAfter,
    };
  } catch (err) {
    console.error("❌ getOTPMeta error:", err.message);
    throw new AppError("Failed to fetch OTP status", 500);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
  getOTPMeta,
};