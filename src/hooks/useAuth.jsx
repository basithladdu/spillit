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
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('spillit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Register user with email/password
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login user with email/password
  function login(email, password) {
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
    localStorage.removeItem('spillit_user');
    setCurrentUser(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('spillit_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('spillit_user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
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
