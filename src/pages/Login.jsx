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
    if (currentUser) navigate('/');
  }, [currentUser, navigate]);

  const clearError = (field) => {
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    if (errors.general) setErrors(p => ({ ...p, general: '' }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ general: 'Invalid email or password.' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Please enter a valid email address.' });
      } else if (error.code === 'auth/too-many-requests') {
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
              <Heart size={32} strokeWidth={2.5} fill="currentColor" />
            </div>
            <h1 className="heading-font text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to Spill It.</p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-400 flex items-center gap-3 text-red-700 text-sm font-bold"
            >
              <AlertCircle size={16} className="shrink-0" />
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
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`w-full bg-input border-2 ${errors.email ? 'border-red-400' : 'border-border'} rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all`}
                  placeholder="name@email.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-bold">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className="w-full bg-input border-2 border-border rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder-muted-foreground outline-none focus:border-accent focus:shadow-focus transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-full bg-accent text-white border-2 border-foreground font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active disabled:opacity-50 flex items-center justify-center gap-3 heading-font uppercase tracking-widest transition-all"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Enter Spill It</span><ArrowRight size={18} strokeWidth={2.5} /></>
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-8 text-muted-foreground text-sm">
            New here?{' '}
            <Link to="/register" className="text-accent font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
