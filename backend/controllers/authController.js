"use strict";

/**
 * controllers/authController.js
 *
 * Email OTP authentication flow:
 *   POST /api/auth/send-otp    → generate OTP, email it
 *   POST /api/auth/verify-otp  → verify OTP, find/create user, return JWT
 *   POST /api/auth/resend-otp  → resend with cooldown
 *   GET  /api/auth/otp-status  → frontend timer restore
 *   POST /api/auth/admin/login → password login for admins
 *   GET  /api/auth/me          → profile
 *   PATCH /api/auth/me         → update profile
 */

const bcrypt               = require("bcryptjs");
const User                 = require("../models/User");
const { sendOTP, verifyOTP, getOTPMeta } = require("../services/otpService");
const { signToken }        = require("../utils/jwt");
const { sendSuccess }      = require("../utils/response");
const AppError             = require("../utils/AppError");

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildUserPayload = (user) => ({
  id:         user._id,
  email:      user.email,
  name:       user.name,
  role:       user.role,
  isVerified: user.isVerified,
});

const sendAuthResponse = (res, user, statusCode, message) => {
  const token = signToken({ id: user._id, role: user.role });
  sendSuccess(res, { token, user: buildUserPayload(user) }, message, statusCode);
};

// ── OTP Controllers ───────────────────────────────────────────────────────────

// POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const meta = await sendOTP(email);
  sendSuccess(res, {
    expiresIn:   meta.expiresIn,
    resendAfter: meta.resendAfter,
  }, "Verification code sent to your email");
};

// POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  const meta = await sendOTP(email);
  sendSuccess(res, {
    expiresIn:   meta.expiresIn,
    resendAfter: meta.resendAfter,
  }, "Verification code resent");
};

// GET /api/auth/otp-status?email=user@example.com
exports.otpStatus = async (req, res, next) => {
  const { email } = req.query;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError("Valid email address is required", 400));
  }
  const meta = await getOTPMeta(email);
  sendSuccess(res, meta);
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { email, otp, name } = req.body;

  // Throws AppError on invalid/expired/brute-forced OTP
  await verifyOTP(email, String(otp));

  let user      = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      email,
      name:       name?.trim() || "",
      isVerified: true,
      role:       "user",
    });
    isNewUser = true;
  } else {
    user.isVerified = true;
    if (name?.trim() && !user.name) user.name = name.trim();
    await user.save({ validateBeforeSave: false });
  }

  return sendAuthResponse(
    res, user,
    isNewUser ? 201 : 200,
    isNewUser ? "Account created successfully" : "Login successful"
  );
};

// ── Admin Login ───────────────────────────────────────────────────────────────

// POST /api/auth/admin/login
exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: "admin" }).select("+password");

  // Constant-time comparison even when user not found — prevents timing enumeration
  const dummyHash     = "$2a$12$dummyhashtopreventtimingattacksonuserenumerati00000";
  const hashToCompare = user ? user.password : dummyHash;
  const isMatch       = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) return next(new AppError("Invalid credentials", 401));
  if (!user.isActive)    return next(new AppError("Account has been deactivated", 401));

  return sendAuthResponse(res, user, 200, "Admin login successful");
};

// ── Profile ───────────────────────────────────────────────────────────────────

// GET /api/auth/me
exports.getMe = async (req, res) => {
  sendSuccess(res, { user: buildUserPayload(req.user) }, "Profile fetched");
};

// PATCH /api/auth/me
exports.updateMe = async (req, res, next) => {
  const ALLOWED = ["name", "address"];
  const updates = {};
  ALLOWED.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) {
    return next(new AppError("No updatable fields provided", 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true,
  });

  sendSuccess(res, { user: buildUserPayload(user) }, "Profile updated");
};