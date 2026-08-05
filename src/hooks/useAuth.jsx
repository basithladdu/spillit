import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { AuthContext } from '../context/AuthContext';

const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('spillit_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    try { localStorage.removeItem('spillit_user'); } catch { /* Storage unavailable. */ }
    return null;
  }
};

const clearStoredUser = () => {
  try { localStorage.removeItem('spillit_user'); } catch { /* Storage unavailable. */ }
};

const saveStoredUser = (user) => {
  try { localStorage.setItem('spillit_user', JSON.stringify(user)); } catch { /* Storage unavailable. */ }
};

// The hook and provider intentionally share this module so consumers have one auth entry point.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  // Register user with email/password
  async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  // Login user with email/password
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // Login with Google
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  }

  // Logout user
  async function logout() {
    clearStoredUser();
    setCurrentUser(null);
    return supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        saveStoredUser(session.user);
      }
      setLoading(false);
    }).catch(() => {
      // Auth initialization can fail offline; let the public app remain usable.
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        saveStoredUser(session.user);
      } else {
        clearStoredUser();
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
