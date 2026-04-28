// const router = require("express").Router();
// const ctrl = require("../controllers/authController");
// const { protect } = require("../middleware/auth");
// const { authLimiter } = require("../middleware/rateLimiter");
// const { validate, schemas } = require("../validators");

// router.post("/send-otp", authLimiter, validate(schemas.sendOtp), ctrl.sendOtp);
// router.post("/verify-otp", authLimiter, validate(schemas.verifyOtp), ctrl.verifyOtp);
// router.post("/admin/login", authLimiter, validate(schemas.adminLogin), ctrl.adminLogin);
// router.get("/me", protect, ctrl.getMe);
// router.patch("/me", protect, ctrl.updateMe);

// module.exports = router;


"use strict";

/**
 * routes/auth.js
 */

const router  = require("express").Router();
const ctrl    = require("../controllers/authController");
const { protect }                     = require("../middleware/auth");
const { authLimiter, generalLimiter } = require("../middleware/rateLimiter");
const Joi     = require("joi");
const AppError = require("../utils/AppError");

// ── Inline validator ──────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/['"]/g, "")).join("; ");
    return next(new AppError(msg, 422));
  }
  req.body = value;
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const firebaseLoginSchema = Joi.object({
  idToken: Joi.string().min(20).required().messages({
    "any.required": "Firebase ID token is required",
    "string.min":   "Invalid Firebase ID token",
  }),
  name: Joi.string().trim().min(2).max(60).optional().allow(""),
});

const adminLoginSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    "string.pattern.base": "Enter a valid 10-digit Indian mobile number",
  }),
  password: Joi.string().min(6).required(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/firebase-login
 *
 * Single endpoint for all Firebase phone auth logins (new + returning users).
 * Frontend sends the Firebase ID Token obtained after OTP verification.
 * Rate limited strictly — 10 req/min per IP.
 */
router.post(
  "/firebase-login",
  authLimiter,
  validate(firebaseLoginSchema),
  ctrl.firebaseLogin
);

/**
 * POST /api/auth/admin/login
 * Admin-only password login. Strict rate limit.
 */
router.post(
  "/admin/login",
  authLimiter,
  validate(adminLoginSchema),
  ctrl.adminLogin
);

/**
 * GET  /api/auth/me      → get profile
 * PATCH /api/auth/me     → update profile
 */
router.get("/me",   protect, generalLimiter, ctrl.getMe);
router.patch("/me", protect, generalLimiter, ctrl.updateMe);

module.exports = router;