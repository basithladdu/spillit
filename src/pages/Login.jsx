import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaArrowRight, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (userRole === 'municipal_admin') {
        navigate('/municipal-dashboard');
      } else if (userRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, userRole, navigate]);

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--muni-bg)] relative overflow-hidden p-4 font-sans">

      {/* --- Background Elements --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF671F]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* --- Glass Card --- */}
        <div className="bg-[var(--muni-surface)]/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 sm:p-10 overflow-hidden relative">

          {/* Decor Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] opacity-50"></div>

          {/* Header */}
          <div className="text-center mb-10">
            <img
              src="/aplogo.svg"
              alt="AP Logo"
              className="w-24 h-24 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              LOGIN As <span className="text-[#FF671F]">Roads and Buildings</span> Department Admin
            </h1>
            <p className="text-[var(--muni-text-muted)] text-sm">Access the specialized internal command center.</p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm"
            >
              <FaExclamationCircle className="shrink-0" />
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <FaEnvelope aria-hidden="true" className="absolute left-4 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`w-full bg-black/50 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 outline-none focus:border-[#FF671F] focus:shadow-[0_0_15px_rgba(255,103,31,0.2)] transition-all`}
                  placeholder="admin@gmail.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <FaLock aria-hidden="true" className="absolute left-4 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white placeholder-gray-600 outline-none focus:border-[#FF671F] focus:shadow-[0_0_15px_rgba(255,103,31,0.2)] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-[var(--muni-text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] text-black font-bold py-3.5 rounded-xl shadow-lg shadow-[#FF671F]/20 transition-all transform hover:scale-[1.02] active:scale-0.98 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>Login <FaArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-[var(--muni-text-muted)] text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#046A38] hover:text-[#046A38]/80 font-semibold hover:underline transition-colors">
              Register here
            </Link>
          </p>
          <p className="text-center text-[var(--muni-text-muted)] text-xs mt-4">
            Are you a municipality looking to access dashboard?{' '}
            <Link to="/municipal-register" className="text-[#FF671F] hover:text-[#FF671F]/80 font-semibold hover:underline transition-colors">
              Register here
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}

export default Login;