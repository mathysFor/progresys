import admin from 'firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Path to the service account key file (relative to project root)
    const serviceAccountPath = path.join(process.cwd(), 'progresys-35773-firebase-adminsdk-fbsvc-eb0ad9af58.json');
    const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export default admin;

