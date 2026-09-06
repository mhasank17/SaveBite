import * as admin from 'firebase-admin';
import { ENV } from './env';

let isFirebaseInitialized = false;

if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY,
      }),
    });
    isFirebaseInitialized = true;
    console.log('[Firebase Admin] Successfully initialized.');
  } catch (error) {
    console.warn('[Firebase Admin] Failed to initialize with provided credentials:', (error as Error).message);
  }
} else {
  console.log('[Firebase Admin] Credentials not configured yet in .env (Phase 1 placeholder state).');
}

export const firebaseAdmin = admin;
export const isFirebaseAuthReady = () => isFirebaseInitialized;
