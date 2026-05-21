import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
] as const;

const missingEnvKeys = requiredEnvKeys.filter((key) => !import.meta.env[key]);

let services: FirebaseServices | undefined;
let setupError: string | undefined =
  missingEnvKeys.length > 0
    ? `Firebase is not configured. Missing env vars: ${missingEnvKeys.join(", ")}.`
    : undefined;

if (!setupError) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

    services = {
      app,
      auth: getAuth(app),
      db: getFirestore(app)
    };
  } catch (error) {
    setupError =
      error instanceof Error
        ? `Firebase failed to initialize: ${error.message}`
        : "Firebase failed to initialize.";
  }
}

export const getFirebaseSetupError = (): string | undefined => setupError;

export const getFirebaseServices = (): FirebaseServices => {
  if (!services) {
    throw new Error(setupError ?? "Firebase is not available.");
  }

  return services;
};
