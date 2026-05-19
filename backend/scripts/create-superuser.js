import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const apiKey = "AIzaSyD5V5IWm6bODgOSYnR1TyJxU_ZcgLXxYg8";
const email = "prodkasafar@gmail.com";
const password = "prodkasafar";

async function main() {
  console.log(`Starting superuser registration for: ${email}...`);

  // 1. Attempt to register via Firebase Auth REST API
  let uid = null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const data = await res.json();
    if (res.ok) {
      uid = data.localId;
      console.log(`Successfully registered user in Firebase Auth with UID: ${uid}`);
    } else {
      if (data.error && data.error.message === 'EMAIL_EXISTS') {
        console.log('User already exists in Firebase Auth. Attempting to sign in to fetch UID...');
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          uid = loginData.localId;
          console.log(`Retrieved existing Firebase Auth UID: ${uid}`);
        } else {
          throw new Error(loginData.error?.message || 'Failed to sign in');
        }
      } else {
        throw new Error(data.error?.message || 'Failed to sign up');
      }
    }
  } catch (err) {
    console.error('Firebase Auth operation failed:', err.message);
    // Fall back to a dedicated local bypass UID if offline/blocked
    uid = 'admin-firebase-uid-prodkasafar';
    console.log(`Falling back to local bypass UID: ${uid}`);
  }

  // 2. Insert or update user in our database with ADMIN role
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firebaseUid: uid,
        role: 'ADMIN'
      },
      create: {
        email,
        firebaseUid: uid,
        role: 'ADMIN'
      }
    });
    console.log('Superuser registered in database successfully:', user);
  } catch (dbErr) {
    console.error('Database insertion failed:', dbErr.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
