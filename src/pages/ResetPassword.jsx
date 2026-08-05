import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';
import { PageSpinner } from '../components/UI/PageStatus';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) setReady(true);
      setChecking(false);
    }).catch(() => {
      if (active) setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (errors.general) setErrors((p) => ({ ...p, general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated — sign in with your new password.');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      setErrors({ general: error?.message || 'Could not update password. Try the reset link again.' });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <PageSpinner label="Verifying reset link" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border-2 border-foreground rounded-2xl shadow-pop p-10 text-center">
          <AlertCircle size={32} className="mx-auto mb-4 text-red-500" aria-hidden="true" />
          <h1 className="heading-font text-2xl font-bold text-foreground mb-3">Link expired</h1>
          <p className="text-muted-foreground text-sm mb-8">
            This password reset link is invalid or has expired. Request a new one from the login page.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-accent text-white border-2 border-foreground font-bold shadow-pop heading-font uppercase tracking-widest text-sm"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center bg-background relative overflow-hidden p-6">
      <div className="pointer-events-none absolute top-10 left-10 w-40 h-40 bg-tertiary rounded-full opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-56 h-56 bg-secondary rounded-full opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-pop p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-accent border-2 border-foreground flex items-center justify-center text-white mx-auto mb-6 shadow-pop">
              <KeyRound size={32} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h1 className="heading-font text-4xl font-bold text-foreground mb-2">New Password</h1>
            <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
          </div>

          {errors.general && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-400 flex items-center gap-3 text-red-700 text-sm font-bold"
            >
              <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="new-password" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} aria-hidden="true" />
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'reset-password-error' : undefined}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className={`w-full bg-input border-2 ${errors.password ? 'border-red-400' : 'border-border'} rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} aria-hidden="true" /> : <Eye size={18} strokeWidth={2.5} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="reset-password-error" className="text-red-500 text-xs font-bold">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} aria-hidden="true" />
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirm)}
                  aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearError('confirm'); }}
                  className={`w-full bg-input border-2 ${errors.confirm ? 'border-red-400' : confirm && password === confirm ? 'border-green-500' : 'border-border'} rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {errors.confirm && <p id="reset-confirm-error" className="text-red-500 text-xs font-bold">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full mt-2 py-4 rounded-full bg-accent text-white border-2 border-foreground font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active disabled:opacity-50 flex items-center justify-center gap-3 heading-font uppercase tracking-widest transition-all"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Update password</span><ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" /></>
              }
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
