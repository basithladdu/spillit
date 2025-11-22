import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Replaced react-icons with lucide-react for compatibility
import { 
  Map, BarChart3, Users, LogIn, LogOut, 
  Search, HelpCircle, Star, UserCircle 
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const [searchId, setSearchId] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    }
  };

  // Helper Component for Navigation Links
  const NavItem = ({ to, icon: Icon, label, colorClass = "text-gray-300" }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link to={to} className="relative group">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'text-cyan-400 bg-white/10' : `${colorClass} hover:text-cyan-400 hover:bg-white/5`}`}>
          <span className="relative z-10"><Icon size={18} /></span>
          <span className="hidden lg:inline font-medium text-sm relative z-10">{label}</span>
          
          {/* Active/Hover Glow Effect */}
          {isActive && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
      </Link>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-6 py-4 pointer-events-none"
    >
      {/* --- Left Menu Pill --- */}
      <div className="pointer-events-auto bg-[#0F172A]/80 backdrop-blur-xl border border-cyan-500/30 rounded-full p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-1">
        <NavItem to="/" icon={Map} label="Map" />
        <NavItem to="/gallery" icon={Users} label="Gallery" />
        <NavItem to="/leaderboard" icon={Star} label="Leaderboard" />
        <NavItem to="/help" icon={HelpCircle} label="Help" />
        <NavItem to="/SIH2025" icon={Star} label="SIH 2025" colorClass="text-yellow-400" />
        
        {currentUser && (
          <div className="hidden md:block h-6 w-[1px] bg-white/10 mx-1"></div>
        )}
        
        {currentUser && (
          <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
        )}
      </div>

      {/* --- Right Actions Pill --- */}
      <div className="flex items-center gap-4 pointer-events-auto">
        
        {/* Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className="relative flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full overflow-hidden transition-all duration-300 w-10 sm:w-40 focus-within:w-64 group hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <button type="submit" className="p-3 text-cyan-400 hover:text-white transition-colors z-10">
            <Search size={18} />
          </button>
          <input 
            type="text" 
            placeholder="Search ID..." 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value)} 
            className="bg-transparent border-none outline-none text-white text-sm w-full pr-4 placeholder-gray-500 h-full absolute inset-0 pl-10 sm:relative sm:inset-auto sm:pl-0 opacity-0 sm:opacity-100 focus:opacity-100 focus:relative" 
          />
        </form>

        {/* Auth Buttons */}
        <AnimatePresence mode="wait">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* User Email Chip (Desktop only) */}
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
            </div>
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
    </motion.nav>
  );
}

export default Navbar;