/**
 * src/config/firebase.js
 *
 * Firebase Client SDK — initialised once, imported everywhere that needs it.
 *
 * The client SDK handles:
 *   - Sending OTP SMS to the user's phone
 *   - reCAPTCHA verification (invisible, prevents bot abuse)
 *   - OTP code verification
 *   - Returning an ID Token after successful verification
 *
 * All values come from Firebase Console → Project Settings → General → Your apps.
 * These are PUBLIC keys — safe to commit / expose in the browser.
 * Security is enforced by Firebase App Check and authorized domains.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// Prevent re-initialisation on hot reload in development
const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Disable app verification in development/test (Cypress, Jest, emulator)
// NEVER set this in production — it disables reCAPTCHA and security checks
if (process.env.REACT_APP_FIREBASE_USE_EMULATOR === "true") {
  auth.settings.appVerificationDisabledForTesting = true;
}

export { auth };
export default app;