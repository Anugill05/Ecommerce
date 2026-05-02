"use strict";

/**
 * routes/auth.js
 */

const router   = require("express").Router();
const ctrl     = require("../controllers/authController");
const { protect }                     = require("../middleware/auth");
const { authLimiter, generalLimiter } = require("../middleware/rateLimiter");
const Joi      = require("joi");
const AppError = require("../utils/AppError");

// ── Inline validator ──────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,
    stripUnknown:  true,
  });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/['"]/g, "")).join("; ");
    return next(new AppError(msg, 422));
  }
  req.body = value;
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const emailSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email":   "Enter a valid email address",
    "any.required":   "Email is required",
  }),
});

const verifySchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  otp:   Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length":       "OTP must be exactly 6 digits",
    "string.pattern.base": "OTP must contain only digits",
    "any.required":        "OTP is required",
  }),
  name:  Joi.string().trim().min(2).max(60).optional().allow(""),
});

const adminLoginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/send-otp",   authLimiter, validate(emailSchema),      ctrl.sendOtp);
router.post("/resend-otp", authLimiter, validate(emailSchema),      ctrl.resendOtp);
router.post("/verify-otp", authLimiter, validate(verifySchema),     ctrl.verifyOtp);
router.get ("/otp-status", generalLimiter,                          ctrl.otpStatus);
router.post("/admin/login",authLimiter, validate(adminLoginSchema), ctrl.adminLogin);

router.get  ("/me", protect, generalLimiter, ctrl.getMe);
router.patch("/me", protect, generalLimiter, ctrl.updateMe);

module.exports = router;