import admin from 'firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Use environment variables instead of file
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      throw new Error('Firebase Admin credentials not found. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // In production, we might want to allow graceful degradation
    // but for now, we'll throw to catch configuration issues early
    throw error;
  }
}

export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export default admin;