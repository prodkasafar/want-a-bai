import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseAdmin = null;

const projectId = process.env.FIREBASE_PROJECT_ID || 'want-a-bai';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

if (clientEmail && privateKey) {
  try {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  console.warn('Firebase Service Account credentials missing. Firebase token verification will be bypassed if BYPASS_FIREBASE_VERIFICATION=true.');
}

export default firebaseAdmin;
