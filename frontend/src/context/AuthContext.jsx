import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

// User-provided Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5V5IWm6bODgOSYnR1TyJxU_ZcgLXxYg8",
  authDomain: "want-a-bai.firebaseapp.com",
  projectId: "want-a-bai",
  storageBucket: "want-a-bai.firebasestorage.app",
  messagingSenderId: "42721459190",
  appId: "1:42721459190:web:2b1bf60a4528870863a5d7",
  measurementId: "G-J700KJ8L1Y"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBypassed, setIsBypassed] = useState(false);

  // Sync session profile from backend using token or bypass Uid
  const syncProfile = async () => {
    try {
      const response = await profileAPI.getMe();
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to sync profile from backend:', error.message);
      setUser(null);
    }
  };

  // Monitor Firebase Auth State changes
  useEffect(() => {
    // Check if bypass credentials exist in localStorage
    const bypassUid = localStorage.getItem('wab_bypass_uid');
    if (bypassUid) {
      setIsBypassed(true);
      setLoading(true);
      syncProfile().finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem('wab_token', token);
          localStorage.removeItem('wab_bypass_uid');
          await syncProfile();
        } catch (err) {
          console.error('Error syncing auth token:', err);
        }
      } else {
        localStorage.removeItem('wab_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email login
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('wab_token', token);
      localStorage.removeItem('wab_bypass_uid');
      setIsBypassed(false);
      
      // Fetch synced user profile
      const syncRes = await authAPI.sync();
      setUser(syncRes.data.user);
      return result.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Email registration
  const signupWithEmail = async (email, password, role) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('wab_token', token);
      localStorage.removeItem('wab_bypass_uid');
      setIsBypassed(false);

      // Sync role selection to database
      const syncRes = await authAPI.sync(role);
      setUser(syncRes.data.user);
      return result.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Google OAuth Sign-in
  const loginWithGoogle = async (role = 'CLIENT') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem('wab_token', token);
      localStorage.removeItem('wab_bypass_uid');
      setIsBypassed(false);

      // Sync with backend (updates or creates user)
      const syncRes = await authAPI.sync(role);
      setUser(syncRes.data.user);
      return result.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Development bypass login helper for quick local E2E validation
  const devBypassLogin = async (roleType) => {
    setLoading(true);
    try {
      let uid = 'client-firebase-uid-1';
      if (roleType === 'MAID') {
        uid = 'maid-firebase-uid-1';
      } else if (roleType === 'ADMIN') {
        uid = 'admin-firebase-uid-123';
      }

      localStorage.removeItem('wab_token');
      localStorage.setItem('wab_bypass_uid', uid);
      setIsBypassed(true);

      // Call sync auth route to create user if not exists or fetch profile
      // In bypass mode, authAPI.sync passes x-bypass-uid in interceptor
      const syncRes = await authAPI.sync(roleType);
      setUser(syncRes.data.user);
      setFirebaseUser({
        uid,
        email: syncRes.data.user.email,
        phone: syncRes.data.user.phone,
        displayName: roleType + ' Dev Bypass User'
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Bypass login failed:', error);
    }
  };

  // Sign out
  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('wab_token');
    localStorage.removeItem('wab_bypass_uid');
    setIsBypassed(false);
    setUser(null);
    setFirebaseUser(null);
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('Firebase signOut error:', error);
    }
    setLoading(false);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    isBypassed,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    devBypassLogin,
    logout,
    refreshProfile: syncProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
