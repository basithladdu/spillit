import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { AuthContext } from '../context/AuthContext';

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
  const [currentUser, setCurrentUser] = useState(null);
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  useEffect(() => {
    let active = true;
    let authChanged = false;
    // Supabase owns session persistence; the old display cache is not a session.
    try { localStorage.removeItem('spillit_user'); } catch { /* Storage unavailable. */ }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authChanged = true;
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authChanged) return;
      setCurrentUser(error ? null : data?.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (!active || authChanged) return;
      setCurrentUser(null);
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
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
