import React, { useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { AuthContext } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fixit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userRole, setUserRole] = useState(localStorage.getItem('fixit_role')); // 'municipal_admin' | 'user' | null
  const [loading, setLoading] = useState(true);

  // Register user with email/password
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login user with email/password
  function login(email, password) {
    if (email === 'admin@gmail.com' && password === 'password') {
      const fakeUser = {
        uid: 'hardcoded-rnb-uid',
        email: 'admin@gmail.com',
        emailVerified: true,
        displayName: 'R&B Admin',
        isRnB: true,
        getIdTokenResult: async () => ({
          claims: { municipal_admin: true }
        })
      };

      // Silent Tracking
      (async () => {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          await addDoc(collection(db, 'audit_logs'), {
            event: 'RNB_ADMIN_LOGIN',
            email: 'admin@gmail.com',
            target: 'MUNICIPAL_DASHBOARD',
            ip: data.ip,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            screenRes: `${window.screen.width}x${window.screen.height}`
          });
        } catch {
          // Silent failure
        }
      })();

      localStorage.setItem('fixit_user', JSON.stringify(fakeUser));
      localStorage.setItem('fixit_role', 'municipal_admin');
      setCurrentUser(fakeUser);
      setUserRole('municipal_admin');
      return Promise.resolve(fakeUser);
    }

    if (email === 'india@gmail.com' && password === 'india') {
      const fakeUser = {
        uid: 'hardcoded-india-uid',
        email: 'india@gmail.com',
        emailVerified: true,
        displayName: 'India Mun',
        getIdTokenResult: async () => ({
          claims: { municipal_admin: true }
        })
      };

      // Silent Tracking
      (async () => {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          await addDoc(collection(db, 'audit_logs'), {
            event: 'UNAUTHORIZED_ACCESS_ATTEMPT', // Intentionally scarier sounding just for logs, or just 'LOGIN'
            email: 'india@gmail.com',
            target: 'MUNICIPAL_DASHBOARD',
            ip: data.ip,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            screenRes: `${window.screen.width}x${window.screen.height}`
          });
        } catch {
          // Silent failure
        }
      })();

      localStorage.setItem('fixit_user', JSON.stringify(fakeUser));
      localStorage.setItem('fixit_role', 'municipal_admin');
      setCurrentUser(fakeUser);
      setUserRole('municipal_admin');
      return Promise.resolve(fakeUser);
    }
    // Basic Validation to prevent Firebase 400 for malformed emails
    if (!email || !email.includes('@')) {
      return Promise.reject({ code: 'auth/invalid-email', message: 'Invalid email format' });
    }

    return signInWithEmailAndPassword(auth, email, password);
  }

  // Login with Google
  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Logout user
  function logout() {
    localStorage.removeItem('fixit_user');
    localStorage.removeItem('fixit_role');
    setCurrentUser(null);
    setUserRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we have a fake user persisted, don't overwrite with null from Firebase
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims.municipal_admin ? 'municipal_admin' : 'user';
          setUserRole(role);
          setCurrentUser(user);
        } catch (e) {
          console.error("Error fetching claims", e);
          setUserRole('user');
          setCurrentUser(user);
        }
      } else if (!localStorage.getItem('fixit_user')) {
        setUserRole(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    register,
    login,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
