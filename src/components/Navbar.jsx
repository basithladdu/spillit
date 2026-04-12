import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Camera,
  LogIn,
  LogOut,
  Search,
  Star,
  CircleUser,
  Menu,
  X,
  Heart,
  Flame
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

// Helper Component for Navigation Links
const NavItem = ({ to, icon: IconComponent, label, onClick }) => {
  const location = useLocation();
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <Link to={to} onClick={onClick} className="relative group w-full md:w-auto">
      <div
        className={`flex items-center gap-3 md:gap-2 px-4 py-3 md:py-2 rounded-md md:rounded-full transition-all duration-300 border-2 ${
          isActive
            ? 'border-accent text-accent bg-muted'
            : 'border-transparent text-foreground hover:border-accent hover:bg-muted'
        }`}
      >
        <span className="relative z-10">
          <IconComponent size={20} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" />
        </span>
        <span className="font-body font-medium text-base md:text-sm relative z-10">{label}</span>
      </div>
    </Link>
  );
};

function Navbar() {
  const [searchId, setSearchId] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId) {
      navigate(`/memory/${searchId}`);
      setSearchId('');
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        id="navbar-root"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 md:px-6 py-3 md:py-4 pointer-events-none bg-background border-b-2 border-border"
      >
        {/* --- Left Side (Identity & Navigation) --- */}
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Logo Identity */}
          <Link to="/" className="flex items-center gap-2 bg-card border-2 border-foreground rounded-full px-4 py-2 shadow-pop group hover:-translate-x-1 hover:-translate-y-1 hover:shadow-pop-hover transition-all">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart size={16} className="text-white fill-current" />
            </div>
            <div className="heading-font text-foreground tracking-wide text-sm font-bold flex items-center gap-1">
              <span>Spill It</span>
            </div>
          </Link>

          {/* --- Desktop Menu --- */}
          <div className="hidden lg:flex bg-card border-2 border-foreground rounded-full p-2 shadow-pop items-center gap-2">
            <NavItem to="/" icon={Map} label="Map" />
            <NavItem to="/gallery" icon={Camera} label="Archive" />
            <NavItem to="/leaderboard" icon={Star} label="Hall of Fame" />
          </div>
        </div>

        {/* --- Right Actions (Desktop & Mobile Toggle) --- */}
        <div className="flex items-center gap-3 pointer-events-auto">

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex relative items-center bg-input border-2 border-border rounded-full overflow-hidden transition-all duration-300 w-48 focus-within:w-64"
          >
            <button type="submit" aria-label="Search" className="p-3 text-accent">
              <Search size={18} strokeWidth={2.5} />
            </button>
            <input
              type="text"
              placeholder="Search spill id..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground text-sm w-full pr-4 placeholder-muted-foreground h-full absolute inset-0 pl-10 focus:relative"
            />
          </form>

          {/* CTA + Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Spill CTA */}
            <Link to="/#spill">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-white font-bold shadow-pop hover:shadow-pop-hover transition-all heading-font text-xs uppercase tracking-widest border-2 border-foreground"
              >
                <Flame size={16} />
                <span>Spill</span>
              </motion.button>
            </Link>

            <AnimatePresence mode="wait">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="hidden xl:flex items-center gap-2 bg-muted border-2 border-border px-4 py-2 rounded-full"
                  >
                    <CircleUser size={16} className="text-accent" />
                    <span className="text-xs text-foreground font-medium">
                      {currentUser.email?.split('@')[0]}
                    </span>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="bg-card text-foreground border-2 border-border p-2.5 rounded-full hover:bg-red-100 hover:text-red-600 hover:border-red-400 transition-all shadow-pop"
                    title="Logout"
                  >
                    <LogOut size={18} strokeWidth={2.5} />
                  </motion.button>
                </div>
              ) : (
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-secondary text-white border-2 border-foreground px-5 py-2.5 rounded-full shadow-pop hover:shadow-pop-hover transition-all text-sm font-bold heading-font uppercase tracking-wide"
                  >
                    <LogIn size={18} strokeWidth={2.5} />
                    <span>Login</span>
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Spill CTA */}
          <Link to="/#spill" className="md:hidden">
            <button
              className="px-5 py-2.5 rounded-full bg-accent text-white text-xs font-bold heading-font uppercase shadow-pop active:translate-x-1 active:translate-y-1 active:shadow-pop-active transition-all border-2 border-foreground"
            >
              Spill
            </button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-foreground text-foreground shadow-pop active:shadow-pop-active transition-all"
          >
            {isMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </motion.nav>

      {/* --- Mobile Menu Overlay --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="fixed inset-0 z-[900] bg-background border-b-2 border-border backdrop-blur-3xl pt-24 px-6 pb-6 md:hidden flex flex-col"
          >
            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-3 mb-8">
              <NavItem to="/" icon={Map} label="Map" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/gallery" icon={Camera} label="Archive" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/leaderboard" icon={Star} label="Hall of Fame" onClick={() => setIsMenuOpen(false)} />
            </div>

            {/* Mobile Auth/CTA */}
            <div className="mt-auto flex flex-col gap-4 border-t-2 border-border pt-8">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-100 text-red-600 border-2 border-red-400 rounded-lg font-bold flex items-center justify-center gap-3 heading-font"
                >
                  <LogOut size={20} strokeWidth={2.5} /> Logout
                </button>
              ) : (
                <>
                  <Link to="/#spill" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full py-4 rounded-lg bg-accent text-white font-bold heading-font text-sm uppercase tracking-widest shadow-pop border-2 border-foreground flex items-center justify-center gap-2">
                      <Flame size={20} strokeWidth={2.5} /> Spill
                    </button>
                  </Link>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full py-4 bg-secondary border-2 border-foreground text-white rounded-lg font-bold heading-font uppercase tracking-wide shadow-pop">
                      Login
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