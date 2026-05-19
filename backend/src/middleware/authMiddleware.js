import firebaseAdmin from '../config/firebase.js';
import prisma from '../config/db.js';

export async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  const bypassEnabled = process.env.BYPASS_FIREBASE_VERIFICATION === 'true';

  // 1. If no token, check bypass mode
  if (!token) {
    if (bypassEnabled) {
      // In bypass mode, check if a specific uid is provided in the headers, or default to a dummy client
      const bypassUid = req.headers['x-bypass-uid'] || 'client-firebase-uid-1';
      return await handleBypassAuth(bypassUid, req, res, next);
    }
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // 2. Token is present, try verification
  try {
    if (firebaseAdmin) {
      // Verify token with Firebase SDK
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      const { uid, email, phone_number } = decodedToken;

      const user = await prisma.user.findUnique({
        where: { firebaseUid: uid },
        include: {
          clientProfile: true,
          maidProfile: true
        }
      });

      if (user) {
        req.user = user;
      } else {
        // User not synced yet, save Firebase details for registration
        req.firebaseUser = {
          uid,
          email,
          phone: phone_number
        };
      }
      return next();
    } else {
      // Firebase not initialized, check bypass mode
      if (bypassEnabled) {
        // Try to decode as JWT first to get real user details
        const decoded = decodeJwt(token);
        if (decoded) {
          return await handleDecodedBypassAuth(decoded, req, res, next);
        }
        // Allow using Firebase UID as token directly for local testing
        return await handleBypassAuth(token, req, res, next);
      }
      return res.status(500).json({ error: 'Auth service unconfigured' });
    }
  } catch (error) {
    console.error('Firebase Auth Verification Error:', error.message);
    if (bypassEnabled) {
      const decoded = decodeJwt(token);
      if (decoded) {
        return await handleDecodedBypassAuth(decoded, req, res, next);
      }
      // Fall back to bypass if validation failed in dev mode
      return await handleBypassAuth(token, req, res, next);
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Decodes JWT payload without verifying signature (useful in local dev bypass mode)
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return {
      uid: payload.sub,
      email: payload.email,
      phone: payload.phone_number
    };
  } catch (e) {
    return null;
  }
}

// Helper to handle decoded Firebase token details during bypass
async function handleDecodedBypassAuth(decoded, req, res, next) {
  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    include: {
      clientProfile: true,
      maidProfile: true
    }
  });

  if (user) {
    req.user = user;
  } else {
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone || null
    };
  }
  return next();
}

// Helper to handle developer/local offline auth bypass (string-based)
async function handleBypassAuth(uid, req, res, next) {
  const user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
    include: {
      clientProfile: true,
      maidProfile: true
    }
  });

  if (user) {
    req.user = user;
  } else {
    // Treat the bypassed uid as Firebase Auth payload for synchronization
    req.firebaseUser = {
      uid,
      email: uid.includes('client') ? 'client@example.com' : uid.includes('maid') ? 'maid@example.com' : 'admin@wantabai.com',
      phone: null // Avoid using static '+919999999999' which triggers unique constraints on multiple signups
    };
  }
  return next();
}
