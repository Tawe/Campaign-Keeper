import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let _authConnected = false;

/**
 * Returns the Firebase Auth instance.
 * Call this inside event handlers or useEffect — never at module level.
 * This prevents build-time errors when env vars are absent.
 */
export function getFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true" && !_authConnected) {
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      _authConnected = true;
    } catch {
      // Already connected
    }
  }

  return auth;
}
