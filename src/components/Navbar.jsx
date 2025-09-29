import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  FaMap, FaChartBar, FaUsers, FaUser, 
  FaSignInAlt, FaSignOutAlt, FaQuestionCircle, FaStar 
} from 'react-icons/fa';

// Bubble animation component
const BubbleAnimation = ({ children, onClick, className = "" }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e) => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {isAnimating && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-bubble absolute w-4 h-4 bg-white/30 rounded-full scale-0 opacity-70"></span>
        </span>
      )}
    </button>
  );
};

function Navbar() {
  const [searchId, setSearchId] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
      setIsSearchExpanded(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchId(e.target.value);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] text-white flex items-center justify-between px-4 py-3 font-semibold bg-gray-800/90 backdrop-blur-sm">
      {/* Left links */}
      <div className="flex items-center space-x-4">
        <BubbleAnimation 
          className="text-base font-medium no-underline px-3 py-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" 
          title="Map View"
        >
          <Link to="/" className="flex items-center gap-1">
            <FaMap /> <span className="hidden sm:inline p-1 text-lg">Map</span>
          </Link>
        </BubbleAnimation>

        <BubbleAnimation 
          className="text-base font-medium no-underline px-3 py-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" 
          title="Gallery"
        >
          <Link to="/gallery" className="flex items-center gap-1">
            <FaUsers /> <span className="hidden sm:inline p-1 text-lg">Gallery</span>
          </Link>
        </BubbleAnimation>

        <BubbleAnimation 
          className="text-base font-medium no-underline px-3 py-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" 
          title="Help"
        >
          <Link to="/help" className="flex items-center gap-1">
            <FaQuestionCircle /> <span className="hidden sm:inline p-1 text-lg">Help</span>
          </Link>
        </BubbleAnimation>

        <BubbleAnimation 
          className="text-base font-medium no-underline px-3 py-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" 
          title="Leaderboard"
        >
          <Link to="/leaderboard" className="flex items-center gap-1">
            <FaStar /> <span className="hidden sm:inline p-1 text-lg">Leaderboard</span>
          </Link>
        </BubbleAnimation>

        {currentUser && (
          <BubbleAnimation 
            className="text-base font-medium no-underline px-3 py-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" 
            title="Dashboard"
          >
            <Link to="/dashboard" className="flex items-center gap-1">
              <FaChartBar /> <span className="hidden sm:inline p-1 text-lg">Dashboard</span>
            </Link>
          </BubbleAnimation>
        )}
      </div>

      {/* Center Branding */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
        <span className="font-extrabold text-2xl sm:text-3xl bg-gradient-to-r from-orange-400 to-green-600 text-transparent bg-clip-text">
          SIH 2025
        </span>
        {/* Sun-like SVG */}
        <svg className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="currentColor"/>
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="4" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="20" y2="12"/>
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
          </g>
        </svg>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Animated Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center">
          <div
            className={`p-2 overflow-hidden bg-gray-900 shadow-[2px_2px_20px_rgba(0,0,0,0.08)] rounded-full flex group items-center transition-all duration-300 ${
              isSearchExpanded ? 'w-[270px]' : 'w-[60px] hover:w-[270px]'
            }`}
            onMouseEnter={() => setIsSearchExpanded(true)}
            onMouseLeave={() => !searchId && setIsSearchExpanded(false)}
          >
            <div className="flex items-center justify-center text-white ml-2">
              🔍
            </div>
            <input
              type="text"
              value={searchId}
              onChange={handleSearchInputChange}
              placeholder="Search by ID"
              className="outline-none text-lg bg-transparent w-full text-white font-normal px-4 placeholder-white/80"
            />
          </div>
        </form>

        {currentUser ? (
          <>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-gray-300">
                <FaUser className="text-xl" />
                <span className="text-lg">{currentUser.email}</span>
              </div>
              <BubbleAnimation 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-2xl transition flex items-center gap-2"
              >
                <FaSignOutAlt /> <span className="hidden sm:inline text-lg">Logout</span>
              </BubbleAnimation>
            </div>
          </>
        ) : (
          <BubbleAnimation className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-2xl transition flex items-center gap-2">
            <Link to="/login" className="flex items-center gap-2">
              <FaSignInAlt /> <span className="hidden sm:inline text-lg">Login</span>
            </Link>
          </BubbleAnimation>
        )}
      </div>

      {/* Add CSS for bubble animation */}
      <style jsx>{`
        @keyframes bubble {
          0% {
            transform: scale(0);
            opacity: 0.7;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble 0.6s ease-out forwards;
        }
      `}</style>
    </nav>
  );
}

export default Navbar;