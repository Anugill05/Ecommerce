// // const bcrypt = require("bcryptjs");
// // const User = require("../models/User");
// // const { generateAndSendOTP, verifyOTP } = require("../services/smsService");
// // const { signToken } = require("../utils/jwt");
// // const { sendSuccess } = require("../utils/response");
// // const AppError = require("../utils/AppError");

// // // ── Token Response Helper ─────────────────────────────────────────────────────

// // const createTokenResponse = (user, statusCode, res, message) => {
// //   const token = signToken({ id: user._id, role: user.role });
// //   const userData = {
// //     id: user._id,
// //     phone: user.phone,
// //     name: user.name,
// //     email: user.email,
// //     role: user.role,
// //     isVerified: user.isVerified,
// //   };
// //   sendSuccess(res, { token, user: userData }, message, statusCode);
// // };

// // // ── Controllers ───────────────────────────────────────────────────────────────

// // // POST /api/auth/send-otp
// // exports.sendOtp = async (req, res, next) => {
// //   const { phone } = req.body;
// //   const result = await generateAndSendOTP(phone);
// //   sendSuccess(res, result, "OTP sent successfully");
// // };

// // // POST /api/auth/verify-otp
// // exports.verifyOtp = async (req, res, next) => {
// //   const { phone, otp, name } = req.body;

// //   const isValid = await verifyOTP(phone, otp);
// //   if (!isValid) return next(new AppError("Invalid or expired OTP. Please try again.", 400));

// //   let user = await User.findOne({ phone });

// //   if (!user) {
// //     // New user registration
// //     user = await User.create({
// //       phone,
// //       name: name?.trim() || "",
// //       isVerified: true,
// //       role: "user",
// //     });
// //     return createTokenResponse(user, 201, res, "Account created successfully");
// //   }

// //   // Existing user login
// //   user.isVerified = true;
// //   if (name?.trim() && !user.name) user.name = name.trim();
// //   await user.save({ validateBeforeSave: false });

// //   createTokenResponse(user, 200, res, "Login successful");
// // };

// // // POST /api/auth/admin/login
// // exports.adminLogin = async (req, res, next) => {
// //   const { phone, password } = req.body;

// //   const user = await User.findOne({ phone, role: "admin" }).select("+password");
// //   if (!user) return next(new AppError("Invalid credentials", 401));

// //   const isMatch = await bcrypt.compare(password, user.password);
// //   if (!isMatch) return next(new AppError("Invalid credentials", 401));

// //   if (!user.isActive) return next(new AppError("Account has been deactivated", 401));

// //   createTokenResponse(user, 200, res, "Admin login successful");
// // };

// // // GET /api/auth/me
// // exports.getMe = async (req, res) => {
// //   sendSuccess(res, { user: req.user }, "Profile fetched");
// // };

// // // PATCH /api/auth/me
// // exports.updateMe = async (req, res, next) => {
// //   const { name, email, address } = req.body;
// //   const updates = {};
// //   if (name !== undefined) updates.name = name;
// //   if (email !== undefined) updates.email = email;
// //   if (address !== undefined) updates.address = address;

// //   const user = await User.findByIdAndUpdate(req.user._id, updates, {
// //     new: true,
// //     runValidators: true,
// //   });

// //   sendSuccess(res, { user }, "Profile updated");
// // };

// "use strict";

// /**
//  * controllers/authController.js
//  */

// const bcrypt   = require("bcryptjs");
// const User     = require("../models/User");
// const { sendOTP, verifyOTP, resendOTP, getOTPMeta } = require("../services/otpService");
// const { signToken }   = require("../utils/jwt");
// const { sendSuccess } = require("../utils/response");
// const AppError        = require("../utils/AppError");

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const buildUserPayload = (user) => ({
//   id:         user._id,
//   phone:      user.phone,
//   name:       user.name,
//   email:      user.email,
//   role:       user.role,
//   isVerified: user.isVerified,
// });

// const sendAuthResponse = (res, user, statusCode, message) => {
//   const token    = signToken({ id: user._id, role: user.role });
//   const userData = buildUserPayload(user);
//   sendSuccess(res, { token, user: userData }, message, statusCode);
// };

// // ── Controllers ───────────────────────────────────────────────────────────────

// // POST /api/auth/send-otp
// exports.sendOtp = async (req, res, next) => {
//   const { phone } = req.body;
//   const meta = await sendOTP(phone);
//   sendSuccess(res, {
//     expiresIn:   meta.expiresIn,
//     resendAfter: meta.resendAfter,
//     attemptsLeft: meta.attemptsLeft,
//   }, "OTP sent successfully");
// };

// // POST /api/auth/resend-otp
// exports.resendOtp = async (req, res, next) => {
//   const { phone } = req.body;
//   const meta = await resendOTP(phone);
//   sendSuccess(res, {
//     expiresIn:   meta.expiresIn,
//     resendAfter: meta.resendAfter,
//   }, "OTP resent successfully");
// };

// // GET /api/auth/otp-status?phone=xxxxxxxxxx
// exports.otpStatus = async (req, res, next) => {
//   const { phone } = req.query;
//   if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
//     return next(new AppError("Valid 10-digit Indian mobile number is required", 400));
//   }
//   const meta = await getOTPMeta(phone);
//   sendSuccess(res, meta);
// };

// // POST /api/auth/verify-otp
// exports.verifyOtp = async (req, res, next) => {
//   const { phone, otp, name } = req.body;

//   // Throws on failure — never returns false
//   await verifyOTP(phone, otp);

//   let user     = await User.findOne({ phone });
//   let isNewUser = false;

//   if (!user) {
//     user = await User.create({
//       phone,
//       name:       name?.trim() || "",
//       isVerified: true,
//       role:       "user",
//     });
//     isNewUser = true;
//   } else {
//     user.isVerified = true;
//     if (name?.trim() && !user.name) user.name = name.trim();
//     await user.save({ validateBeforeSave: false });
//   }

//   return sendAuthResponse(
//     res,
//     user,
//     isNewUser ? 201 : 200,
//     isNewUser ? "Account created successfully" : "Login successful"
//   );
// };

// // POST /api/auth/admin/login
// exports.adminLogin = async (req, res, next) => {
//   const { phone, password } = req.body;

//   const user = await User.findOne({ phone, role: "admin" }).select("+password");

//   // Constant-time compare even when user is not found — prevents timing attacks
//   const dummyHash     = "$2a$12$dummyhashtopreventtimingattacksonuserenumeration000000";
//   const hashToCompare = user ? user.password : dummyHash;
//   const isMatch       = await bcrypt.compare(password, hashToCompare);

//   if (!user || !isMatch) return next(new AppError("Invalid credentials", 401));
//   if (!user.isActive)    return next(new AppError("Account has been deactivated", 401));

//   return sendAuthResponse(res, user, 200, "Admin login successful");
// };

// // GET /api/auth/me
// exports.getMe = async (req, res) => {
//   sendSuccess(res, { user: buildUserPayload(req.user) }, "Profile fetched");
// };

// // PATCH /api/auth/me
// exports.updateMe = async (req, res, next) => {
//   const ALLOWED = ["name", "email", "address"];
//   const updates = {};
//   ALLOWED.forEach((field) => {
//     if (req.body[field] !== undefined) updates[field] = req.body[field];
//   });

//   if (Object.keys(updates).length === 0) {
//     return next(new AppError("No updatable fields provided", 400));
//   }

//   const user = await User.findByIdAndUpdate(req.user._id, updates, {
//     new: true, runValidators: true,
//   });

//   sendSuccess(res, { user: buildUserPayload(user) }, "Profile updated");
// };


"use strict";

/**
 * controllers/authController.js
 *
 * Firebase Phone Auth flow:
 *
 *   Frontend does everything OTP-related (Firebase client SDK handles SMS + verification).
 *   After the user verifies the OTP, the Firebase SDK returns an ID Token.
 *   The frontend sends that ID Token to POST /api/auth/firebase-login.
 *   We verify it with Firebase Admin SDK, extract the phone number, and issue our JWT.
 *
 * No OTP sending, no Redis OTP storage, no SMS provider — Firebase handles all of that.
 */

const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const { verifyFirebaseToken } = require("../services/firebaseAuthService");
const { signToken }   = require("../utils/jwt");
const { sendSuccess } = require("../utils/response");
const AppError        = require("../utils/AppError");

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildUserPayload = (user) => ({
  id:         user._id,
  phone:      user.phone,
  name:       user.name,
  email:      user.email,
  role:       user.role,
  isVerified: user.isVerified,
});

const sendAuthResponse = (res, user, statusCode, message) => {
  const token    = signToken({ id: user._id, role: user.role });
  const userData = buildUserPayload(user);
  sendSuccess(res, { token, user: userData }, message, statusCode);
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/firebase-login
 *
 * Single endpoint for Firebase phone auth.
 * Frontend sends: { idToken, name? }
 *   - idToken: the Firebase ID token obtained after OTP verification
 *   - name:    optional display name (only used on first-time registration)
 *
 * Backend:
 *   1. Verifies the Firebase ID token (calls Firebase Admin SDK)
 *   2. Extracts the verified phone number
 *   3. Finds or creates the user in MongoDB
 *   4. Returns our own JWT for subsequent API requests
 */
exports.firebaseLogin = async (req, res, next) => {
  const { idToken, name } = req.body;

  if (!idToken) {
    return next(new AppError("Firebase ID token is required", 400));
  }

  // Get real client IP (works behind proxies/load balancers)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;

  // Verify token → throws AppError on any failure
  const { phone, firebaseUid } = await verifyFirebaseToken(idToken, ip);

  // Find or create user in MongoDB
  let user      = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      phone,
      name:        name?.trim() || "",
      isVerified:  true,
      role:        "user",
      firebaseUid,
    });
    isNewUser = true;
  } else {
    // Returning user — update verification status and Firebase UID
    user.isVerified  = true;
    user.firebaseUid = firebaseUid;
    // Set name only if the user doesn't already have one
    if (name?.trim() && !user.name) user.name = name.trim();
    await user.save({ validateBeforeSave: false });
  }

  return sendAuthResponse(
    res,
    user,
    isNewUser ? 201 : 200,
    isNewUser ? "Account created successfully" : "Login successful"
  );
};

/**
 * POST /api/auth/admin/login
 *
 * Password-based login for admin panel access only.
 * Admins do NOT use Firebase auth — they use phone + password.
 *
 * Uses constant-time comparison to prevent user enumeration via timing.
 */
exports.adminLogin = async (req, res, next) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone, role: "admin" }).select("+password");

  // Always run bcrypt even if user not found — prevents timing-based enumeration
  const dummyHash     = "$2a$12$dummyhashtopreventtimingattacksonuserenumeration000000";
  const hashToCompare = user ? user.password : dummyHash;
  const isMatch       = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) return next(new AppError("Invalid credentials", 401));
  if (!user.isActive)    return next(new AppError("Account has been deactivated", 401));

  return sendAuthResponse(res, user, 200, "Admin login successful");
};

/**
 * GET /api/auth/me
 * Returns authenticated user's profile. req.user set by protect middleware.
 */
exports.getMe = async (req, res) => {
  sendSuccess(res, { user: buildUserPayload(req.user) }, "Profile fetched");
};

/**
 * PATCH /api/auth/me
 * Update mutable profile fields. Phone and role cannot be changed here.
 */
exports.updateMe = async (req, res, next) => {
  const ALLOWED = ["name", "email", "address"];
  const updates = {};

  ALLOWED.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError("No updatable fields provided", 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true,
  });

  sendSuccess(res, { user: buildUserPayload(user) }, "Profile updated");
};