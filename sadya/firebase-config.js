// Firebase web app config (public by design; security comes from firestore.rules and Cloud Functions).
export const firebaseConfig = {
  apiKey: "AIzaSyD5rDHGGQy_OQ8sZ_nJv0Wp5CkO0AZ290U",
  authDomain: "ptmalayalisamajam.firebaseapp.com",
  projectId: "ptmalayalisamajam",
  storageBucket: "ptmalayalisamajam.firebasestorage.app",
  messagingSenderId: "713492734826",
  appId: "1:713492734826:web:8928a3a3641e6eddd23b13",
};

// reCAPTCHA v3 site key for Firebase App Check (bot protection). Leave "" until set up.
export const APP_CHECK_SITE_KEY = "";

// Must match REGION in functions/index.js
export const FUNCTIONS_REGION = "asia-south1";
