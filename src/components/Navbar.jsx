import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Map, Camera, Star, LogIn, LogOut, Menu, X, Flame, CircleUser } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/gallery', icon: Camera, label: 'Archive' },
  { to: '/leaderboard', icon: Star, label: 'Top Spills' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuToggleRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const menu = mobileMenuRef.current;
    const getFocusable = () => menu
      ? [...menu.querySelectorAll('a, button')].filter((element) => !element.disabled)
      : [];
    getFocusable()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    const menuToggle = menuToggleRef.current;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuToggle?.focus();
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      // Session may already be cleared
    }
  };

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <Motion.nav
        id="navbar-root"
        aria-label="Main navigation"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 md:px-8 h-14 bg-[#FFF5F9] border-b-2 border-foreground transition-shadow duration-200 ${
          isScrolled ? 'shadow-[0_4px_24px_rgba(74,74,104,0.08)]' : ''
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff7ec9] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-pink-500/30">
          <Flame size={13} className="text-white" aria-hidden="true" />
          </div>
          <span className="heading-font text-foreground font-black text-sm tracking-wider uppercase">
            Spill It
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, icon: NavIcon, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={isActive(to) ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive(to)
                  ? 'bg-accent text-white shadow-pop'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <NavIcon size={13} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-foreground shadow-pop hover:bg-muted transition-all">
                <CircleUser size={13} className="text-accent" />
                <span className="text-[11px] text-foreground font-black uppercase tracking-tight">
                  {currentUser.email?.split('@')[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-500 hover:text-red-500 font-bold uppercase transition-all"
              >
                <LogOut size={13} strokeWidth={2.5} />
                <span className="hidden lg:inline">Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-foreground hover:bg-muted transition-all uppercase tracking-widest border-2 border-foreground shadow-pop hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active"
            >
              <LogIn size={13} strokeWidth={2.5} aria-hidden />
              Login
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            ref={menuToggleRef}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-foreground text-foreground shadow-pop transition-all"
          >
          {isMenuOpen ? <X size={15} strokeWidth={2.5} aria-hidden="true" /> : <Menu size={15} strokeWidth={2.5} aria-hidden="true" />}
          </button>
        </div>
      </Motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <Motion.div
            ref={mobileMenuRef}
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[900] bg-background pt-14 flex flex-col md:hidden border-b-2 border-border"
          >
            <div className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map(({ to, icon: NavIcon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(to) ? 'page' : undefined}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
                    isActive(to)
                      ? 'bg-accent text-white border-2 border-foreground shadow-pop'
                      : 'text-foreground hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <NavIcon size={20} strokeWidth={2.5} />
                  <span className="heading-font font-bold text-base uppercase tracking-wide">{label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-auto p-4 border-t-2 border-border flex flex-col gap-3">
              {currentUser ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="w-full py-4 rounded-full bg-card border-2 border-foreground text-foreground font-bold heading-font uppercase tracking-widest flex items-center justify-center gap-3 shadow-pop">
                    <CircleUser size={18} strokeWidth={2.5} /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-4 rounded-full bg-muted border-2 border-border text-muted-foreground font-bold heading-font uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <LogOut size={18} strokeWidth={2.5} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-4 rounded-full bg-card border-2 border-foreground text-foreground font-bold heading-font uppercase tracking-widest shadow-pop text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-4 rounded-full bg-secondary border-2 border-foreground text-white font-bold heading-font uppercase tracking-widest shadow-pop text-center"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
