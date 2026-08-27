'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// --- Singleton Initialization ---
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let analytics: Analytics | undefined;

const isServer = typeof window === 'undefined';
const hasConfig = !!firebaseConfig.apiKey;

// Check if Firebase has already been initialized
if (!getApps().length) {
  const isProduction = process.env.NODE_ENV === 'production';
  const configToUse = firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: 'dummy-key-for-build' };
  
  if (configToUse.apiKey === 'dummy-key-for-build' && !isServer) {
    if (isProduction) {
      console.error("CRITICAL: Firebase initialized with dummy key in PRODUCTION. Authentication will fail.");
    } else {
      console.warn("Firebase initialized with dummy key. Auth will not work.");
    }
  }
  
  firebaseApp = initializeApp(configToUse);
} else {
  firebaseApp = getApp();
}

// Safely initialize Auth
try {
  auth = getAuth(firebaseApp);
} catch (e) {
  // Fallback for build time
  auth = {} as Auth;
}

// Safely initialize Firestore with modern persistence
try {
  if (!isServer && hasConfig) {
    firestore = initializeFirestore(firebaseApp, {
      cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    } as any);
  } else {
    firestore = initializeFirestore(firebaseApp, {});
  }
} catch (e) {
  // Fallback for build time
  firestore = {} as Firestore;
}

// Safely initialize Analytics on client
if (!isServer && hasConfig) {
  try {
    analytics = getAnalytics(firebaseApp);
  } catch (e) {
    console.warn("Firebase Analytics initialization failed:", e);
  }
}

// Explicitly set persistence to LOCAL (persists across sessions/tabs)
if (!isServer && hasConfig) {
  setPersistence(auth, browserLocalPersistence)
    .catch((err) => console.error("Firebase Auth persistence error:", err));
}

export const googleProvider = new GoogleAuthProvider();
export const db = firestore;

// --- Exports ---
export { firebaseApp, auth, firestore, analytics };
