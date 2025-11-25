import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Replaced react-icons with lucide-react for compatibility
import { 
  Map, BarChart3, Users, LogIn, LogOut, 
  Search, HelpCircle, Star, UserCircle, Menu, X 
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const [searchId, setSearchId] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
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
      navigate(`/report/${searchId}`);
      setSearchId('');
      setIsMenuOpen(false);
    }
  };

  // Helper Component for Navigation Links
  const NavItem = ({ to, icon: Icon, label, colorClass = "text-gray-300", onClick }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link to={to} onClick={onClick} className="relative group w-full md:w-auto">
        <div className={`flex items-center gap-3 md:gap-2 px-4 py-3 md:py-2 rounded-xl md:rounded-full transition-all duration-300 ${isActive ? 'text-cyan-400 bg-white/10' : `${colorClass} hover:text-cyan-400 hover:bg-white/5`}`}>
          <span className="relative z-10"><Icon size={20} className="md:w-[18px] md:h-[18px]" /></span>
          <span className="font-medium text-base md:text-sm relative z-10">{label}</span>
          
          {/* Active/Hover Glow Effect (Desktop) */}
          {isActive && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 rounded-xl md:rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] hidden md:block"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 md:px-6 py-3 md:py-4 pointer-events-none"
      >
        {/* --- Mobile Header (Logo & Hamburger) --- */}
        <div className="md:hidden pointer-events-auto flex items-center gap-2 bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-lg">
           <div className="font-black text-white tracking-widest">FIXIT</div>
        </div>

        {/* --- Desktop Menu Pill --- */}
        <div className="hidden md:flex pointer-events-auto bg-[#0F172A]/80 backdrop-blur-xl border border-cyan-500/30 rounded-full p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)] items-center gap-1">
          <NavItem to="/" icon={Map} label="Map" />
          <NavItem to="/gallery" icon={Users} label="Gallery" />
          <NavItem to="/leaderboard" icon={Star} label="Leaderboard" />
          <NavItem to="/help" icon={HelpCircle} label="Help" />
          
          {currentUser && (
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          )}
          
          {currentUser && (
            <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
          )}
        </div>

        {/* --- Right Actions (Desktop & Mobile Toggle) --- */}
        <div className="flex items-center gap-3 pointer-events-auto">
          
          {/* Search Bar (Desktop) */}
          <form 
            onSubmit={handleSearch} 
            className="hidden md:flex relative items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full overflow-hidden transition-all duration-300 w-40 focus-within:w-64 group hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <button type="submit" className="p-3 text-cyan-400 hover:text-white transition-colors z-10">
              <Search size={18} />
            </button>
            <input 
              type="text" 
              placeholder="Search ID..." 
              value={searchId} 
              onChange={(e) => setSearchId(e.target.value)} 
              className="bg-transparent border-none outline-none text-white text-sm w-full pr-4 placeholder-gray-500 h-full absolute inset-0 pl-10 focus:relative" 
            />
          </form>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <AnimatePresence mode="wait">
              {currentUser ? (
                <>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="hidden xl:flex items-center gap-2 bg-[#0F172A]/80 backdrop-blur-md border border-cyan-500/20 px-4 py-2 rounded-full"
                  >
                    <UserCircle size={16} className="text-cyan-400" />
                    <span className="text-xs text-gray-300 font-mono">{currentUser.email?.split('@')[0]}</span>
                  </motion.div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout} 
                    className="bg-red-500/10 text-red-400 border border-red-500/30 p-3 rounded-full hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md transition-all"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </motion.button>
                </>
              ) : (
                <Link to="/login">
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-5 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-white/10 transition-all"
                  >
                    <LogIn size={18} /> 
                    <span className="text-sm">Login</span>
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 text-white shadow-lg active:scale-95 transition-all"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[900] bg-[#0A0A1E]/95 backdrop-blur-xl pt-24 px-6 pb-6 md:hidden flex flex-col overflow-y-auto"
          >
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6 relative">
              <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search Issue ID..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:bg-white/10 transition-all outline-none"
              />
            </form>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-2 mb-8">
              <NavItem to="/" icon={Map} label="Map View" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/gallery" icon={Users} label="Community Gallery" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/leaderboard" icon={Star} label="Leaderboard" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/help" icon={HelpCircle} label="Help & Support" onClick={() => setIsMenuOpen(false)} />
              {currentUser && (
                <NavItem to="/dashboard" icon={BarChart3} label="Admin Dashboard" onClick={() => setIsMenuOpen(false)} />
              )}
            </div>

            {/* Mobile Auth */}
            <div className="mt-auto border-t border-white/10 pt-6">
              {currentUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Signed in as</div>
                      <div className="text-gray-400 text-xs font-mono">{currentUser.email}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <LogIn size={18} /> Login
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;