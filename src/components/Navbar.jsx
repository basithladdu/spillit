import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Camera, Star, LogIn, LogOut, Menu, X, Flame, CircleUser } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/gallery', icon: Camera, label: 'Archive' },
  { to: '/leaderboard', icon: Star, label: 'Top Spills' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); } catch (_) {}
  };

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <motion.nav
        id="navbar-root"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 md:px-8 h-14 bg-black/60 backdrop-blur-xl border-b border-white/10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff7ec9] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Flame size={13} className="text-white" />
          </div>
          <span className="heading-font text-white font-black text-sm tracking-wider uppercase">
            Spill It
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                isActive(to)
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <CircleUser size={13} className="text-[#ff7ec9]" />
                <span className="text-[11px] text-white/70 font-medium">
                  {currentUser.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={13} strokeWidth={2} />
                <span className="hidden lg:inline">Out</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <LogIn size={13} strokeWidth={2} />
                Login
              </button>
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
          >
            {isMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[900] bg-black/95 backdrop-blur-2xl pt-14 flex flex-col md:hidden"
          >
            <div className="flex flex-col p-6 gap-1">
              {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                    isActive(to)
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="font-semibold text-base">{label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-auto p-6 border-t border-white/10 flex flex-col gap-3">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold flex items-center justify-center gap-3"
                >
                  <LogOut size={18} strokeWidth={2} /> Sign Out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold">
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-white font-bold shadow-lg shadow-pink-500/20">
                      Create Account
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
