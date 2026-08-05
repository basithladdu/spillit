import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { isValidEmail } from '../utils/format';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, resetPassword, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    if (currentUser) navigate(redirectTo, { replace: true });
  }, [currentUser, navigate, redirectTo]);

  const clearError = (field) => {
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    if (errors.general) setErrors(p => ({ ...p, general: '' }));
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrors({ email: 'Enter your email to reset your password.' });
      return;
    }
    if (!isValidEmail(trimmed)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setResetting(true);
    try {
      await resetPassword(trimmed);
      toast.success('Password reset link sent — check your inbox.');
    } catch (error) {
      toast.error(error?.message || 'Could not send reset email. Try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Enter your password.' });
      return;
    }
    setLoading(true);
    try {
      await login(trimmed, password);
    } catch (error) {
      setLoading(false);
      const message = error?.message?.toLowerCase() ?? '';
      if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
        setErrors({ general: 'Invalid email or password.' });
      } else if (message.includes('invalid email')) {
        setErrors({ email: 'Please enter a valid email address.' });
      } else if (message.includes('too many requests') || message.includes('rate limit')) {
        setErrors({ general: 'Too many attempts. Try again later.' });
      } else {
        setErrors({ general: 'Login failed. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-6">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-10 left-10 w-40 h-40 bg-tertiary rounded-full opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-56 h-56 bg-secondary rounded-full opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/4 w-24 h-24 bg-accent rounded-full opacity-10 blur-xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-pop p-10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-accent border-2 border-foreground flex items-center justify-center text-white mx-auto mb-6 shadow-pop">
              <Heart size={32} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
            </div>
            <h1 className="heading-font text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to Spill It.</p>
          </div>

          {/* Error Banner */}
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

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`w-full bg-input border-2 ${errors.email ? 'border-red-400' : 'border-border'} rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all`}
                  placeholder="name@email.com"
                  required
                />
              </div>
              {errors.email && <p id="login-email-error" className="text-red-500 text-xs font-bold">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting || loading}
                  aria-busy={resetting}
                  className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-secondary transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className="w-full bg-input border-2 border-border rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all"
                  placeholder="••••••••"
                  required
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
              {errors.password && <p id="login-password-error" className="text-red-500 text-xs font-bold">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? 'Signing in' : undefined}
              className="w-full mt-2 py-4 rounded-full bg-accent text-white border-2 border-foreground font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active disabled:opacity-50 flex items-center justify-center gap-3 heading-font uppercase tracking-widest transition-all"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Enter Spill It</span><ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" /></>
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-8 text-muted-foreground text-sm">
            New here?{' '}
            <Link to="/register" state={{ from: redirectTo }} className="text-accent font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
