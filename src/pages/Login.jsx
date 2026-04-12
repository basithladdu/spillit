import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Heart } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const clearError = (field) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrors({ general: 'Invalid email or password.' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Please enter a valid email address.' });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many attempts. Try again later.' });
      } else {
        setErrors({ general: `Login failed: ${error.message}` });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--spillit-bg)] relative overflow-hidden p-6 font-sans">

      {/* --- Background Elements --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--spillit-primary)]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* --- Glass Card --- */}
        <div className="bg-[var(--spillit-surface)] backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl p-10 overflow-hidden relative">

          {/* Decor Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--spillit-primary)] via-[var(--spillit-secondary)] to-[var(--spillit-primary)] opacity-50"></div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-[var(--spillit-primary)] to-[var(--spillit-secondary)] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-[var(--spillit-primary)]/20 transition-transform hover:scale-110">
              <Heart size={32} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight heading-font uppercase">
              Welcome Back
            </h1>
            <p className="text-[var(--spillit-text-muted)] text-sm">Sign in to Spill It.</p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold"
            >
              <AlertCircle size={16} />
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold text-[var(--spillit-text-muted)] uppercase tracking-[0.2em] ml-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--spillit-text-muted)] group-focus-within:text-[var(--spillit-primary)] transition-colors" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/5'} rounded-2xl py-4 pl-14 pr-4 text-white placeholder-slate-600 outline-none focus:border-[var(--spillit-primary)]/50 transition-all`}
                  placeholder="name@email.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-400 text-[10px] ml-2 font-bold">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-bold text-[var(--spillit-text-muted)] uppercase tracking-[0.2em] ml-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--spillit-text-muted)] group-focus-within:text-[var(--spillit-primary)] transition-colors" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-14 text-white placeholder-slate-600 outline-none focus:border-[var(--spillit-primary)]/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--spillit-text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-[var(--spillit-primary)] to-[var(--spillit-secondary)] text-white font-bold shadow-xl shadow-[var(--spillit-primary)]/20 transition-all hover:scale-[1.02] active:scale-0.98 disabled:opacity-50 flex items-center justify-center gap-3 heading-font uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Enter Spill It <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-10">
             <p className="text-[var(--spillit-text-muted)] text-sm">
                New here?{' '}
                <Link to="/register" className="text-[var(--spillit-primary)] hover:underline font-bold transition-all">
                Create an account
                </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default Login;