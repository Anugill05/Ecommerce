/**
 * hooks/useFirebaseAuth.js
 *
 * Custom hook that encapsulates the complete Firebase Phone Auth flow.
 *
 * Step 1 — sendOTP(phone):
 *   - Sets up an invisible reCAPTCHA verifier on the page
 *   - Calls Firebase signInWithPhoneNumber → Firebase sends SMS automatically
 *   - Stores the confirmationResult (handle needed for verification)
 *
 * Step 2 — verifyOTP(otp):
 *   - Calls confirmationResult.confirm(otp) → Firebase verifies the code
 *   - On success: gets the Firebase ID Token
 *   - Sends the ID Token to our backend POST /api/auth/firebase-login
 *   - Backend verifies it and returns our own JWT
 *
 * State exposed:
 *   step            "idle" | "sending" | "otpSent" | "verifying" | "done" | "error"
 *   resendCountdown seconds remaining before resend is allowed
 *   error           string | null
 *   sendOTP(phone)  function
 *   verifyOTP(otp)  function → returns { token, user } on success
 *   resetFlow()     function — resets to initial state
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { firebaseLogin } from "../api";

const RESEND_COOLDOWN_SEC = 30;
const RECAPTCHA_CONTAINER = "recaptcha-container";

export const useFirebaseAuth = () => {
  const [step,            setStep]            = useState("idle");
  const [error,           setError]           = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const confirmationRef  = useRef(null);    // Firebase confirmation object
  const recaptchaRef     = useRef(null);    // RecaptchaVerifier instance
  const countdownRef     = useRef(null);    // setInterval handle
  const currentPhoneRef  = useRef(null);    // phone being verified

  // ── Countdown timer ─────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN_SEC);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── reCAPTCHA setup ─────────────────────────────────────────────────────────
  const setupRecaptcha = useCallback(() => {
    // Tear down any existing verifier first (handles re-sends)
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }

    recaptchaRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER, {
      size:     "invisible",   // invisible reCAPTCHA — no checkbox shown to user
      callback: () => {},      // called when reCAPTCHA resolves (auto)
      "expired-callback": () => {
        // reCAPTCHA token expired — clear and let user try again
        setError("Security check expired. Please try again.");
        setStep("idle");
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        }
      },
    });

    return recaptchaRef.current;
  }, []);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
  const sendOTP = useCallback(async (phone) => {
    setError(null);
    setStep("sending");
    currentPhoneRef.current = phone;

    try {
      const verifier = setupRecaptcha();

      // Firebase expects E.164 format: +91XXXXXXXXXX
      const phoneE164 = `+91${phone}`;
      confirmationRef.current = await signInWithPhoneNumber(auth, phoneE164, verifier);

      setStep("otpSent");
      startCountdown();
    } catch (err) {
      const message = mapFirebaseError(err);
      setError(message);
      setStep("error");

      // Clean up reCAPTCHA on failure so user can retry
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      throw new Error(message);
    }
  }, [setupRecaptcha, startCountdown]);

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────────
  const verifyOTP = useCallback(async (otp, name = "") => {
    if (!confirmationRef.current) {
      throw new Error("No active OTP session. Please request a new OTP.");
    }

    setError(null);
    setStep("verifying");

    try {
      // Firebase verifies the OTP entered by the user
      const result = await confirmationRef.current.confirm(otp);

      // Get the Firebase ID Token — this is what we send to our backend
      const idToken = await result.user.getIdToken();

      // Sign out of Firebase immediately — we use our own JWT from here
      // Firebase session is not needed after we get the ID token
      await signOut(auth);

      // Exchange Firebase ID Token for our own JWT
      const { data } = await firebaseLogin({ idToken, name: name.trim() });

      setStep("done");
      return data.data; // { token, user }
    } catch (err) {
      const message = mapFirebaseError(err);
      setError(message);
      setStep("otpSent"); // allow retry — don't reset to idle
      throw new Error(message);
    }
  }, []);

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const resendOTP = useCallback(async () => {
    if (resendCountdown > 0) {
      throw new Error(`Please wait ${resendCountdown}s before resending`);
    }
    if (!currentPhoneRef.current) {
      throw new Error("No phone number to resend to");
    }
    await sendOTP(currentPhoneRef.current);
  }, [resendCountdown, sendOTP]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetFlow = useCallback(() => {
    setStep("idle");
    setError(null);
    setResendCountdown(0);
    confirmationRef.current = null;
    currentPhoneRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  return {
    step,
    error,
    resendCountdown,
    isOtpSent:   step === "otpSent" || step === "verifying",
    isSending:   step === "sending",
    isVerifying: step === "verifying",
    sendOTP,
    verifyOTP,
    resendOTP,
    resetFlow,
  };
};

// ── Firebase error code → human message map ──────────────────────────────────

const mapFirebaseError = (err) => {
  const code = err?.code || "";
  const MAP  = {
    "auth/invalid-phone-number":         "Invalid phone number. Enter a valid 10-digit Indian mobile number.",
    "auth/too-many-requests":            "Too many attempts. Please try again after some time.",
    "auth/invalid-verification-code":    "Incorrect OTP. Please check and try again.",
    "auth/code-expired":                 "OTP has expired. Please request a new one.",
    "auth/session-expired":              "Session expired. Please request a new OTP.",
    "auth/captcha-check-failed":         "Security check failed. Please refresh and try again.",
    "auth/quota-exceeded":               "SMS quota exceeded. Please try again later.",
    "auth/user-disabled":                "This account has been disabled.",
    "auth/network-request-failed":       "Network error. Please check your connection.",
    "auth/missing-phone-number":         "Phone number is required.",
    "auth/invalid-app-credential":       "App authentication failed. Please refresh the page.",
  };
  return MAP[code] || err?.message || "Something went wrong. Please try again.";
};