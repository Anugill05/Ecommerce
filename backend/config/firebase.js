"use strict";

/**
 * config/firebase.js
 *
 * Firebase Admin SDK — initialised once as a singleton.
 *
 * The Admin SDK is used exclusively on the backend to:
 *   - Verify Firebase ID tokens sent from the frontend after phone OTP auth
 *   - Extract the verified phone number from the decoded token
 *
 * The frontend handles the entire OTP UI flow (Firebase client SDK).
 * The backend never sends SMS, never stores OTPs — Firebase does all of that.
 *
 * Service Account setup:
 *   Firebase Console → Project Settings → Service Accounts
 *   → Generate New Private Key → download JSON
 *   → Set FIREBASE_SERVICE_ACCOUNT_JSON env var to the file contents (minified)
 *   OR set individual FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY vars
 */

// const admin = require("firebase-admin");

// let app;

// const initFirebase = () => {
//   if (app) return app;

//   let credential;

//   // Option A: full service account JSON as a single env var (recommended for Docker/cloud)
//   if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
//     try {
//       const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
//       credential = admin.credential.cert(serviceAccount);
//     } catch {
//       throw new Error(
//         "FIREBASE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON. " +
//         "Make sure it is the minified contents of your service account key file."
//       );
//     }
//   }
//   // Option B: individual env vars (useful for platforms like Heroku/Railway)
//   else if (
//     process.env.FIREBASE_PROJECT_ID &&
//     process.env.FIREBASE_CLIENT_EMAIL &&
//     process.env.FIREBASE_PRIVATE_KEY
//   ) {
//     credential = admin.credential.cert({
//       projectId:   process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       // Newlines are escaped in env vars — unescape them
//       privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//     });
//   } else {
//     throw new Error(
//       "Firebase credentials not configured. " +
//       "Set FIREBASE_SERVICE_ACCOUNT_JSON  OR  " +
//       "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
//     );
//   }

//   app = admin.initializeApp({ credential });
//   console.log("Firebase Admin SDK initialised");
//   return app;
// };

// /**
//  * Returns the initialised Firebase Admin app.
//  * Call initFirebase() once at server startup; use getFirebaseAdmin() everywhere else.
//  */
// const getFirebaseAdmin = () => {
//   if (!app) throw new Error("Firebase Admin not initialised. Call initFirebase() first.");
//   return admin;
// };

// module.exports = { initFirebase, getFirebaseAdmin };

"use strict";

const admin = require("firebase-admin");

let app;

const initFirebase = () => {
  if (app) return app;

  // Ensure required env vars exist
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error(
      "Firebase credentials missing in .env file. " +
      "Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  const credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });

  app = admin.initializeApp({ credential });

  console.log("Firebase Admin SDK initialised");

  return app;
};

const getFirebaseAdmin = () => {
  if (!app) {
    throw new Error("Firebase Admin not initialised. Call initFirebase() first.");
  }
  return admin;
};

module.exports = { initFirebase, getFirebaseAdmin };