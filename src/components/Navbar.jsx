import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FaMap, FaChartBar, FaUsers, FaUser, FaSignInAlt, FaSignOutAlt, FaTools, FaSearch, FaQuestionCircle, FaStar } from 'react-icons/fa';

function Navbar() {
  const [searchId, setSearchId] = useState('');
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
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm text-white shadow-lg flex items-center justify-between px-4 py-3 font-semibold border-b border-gray-800 dark:bg-gray-900">
      <div className="flex items-center space-x-3">
        <Link to="/" className="text-2xl font-extrabold tracking-tight drop-shadow flex items-center gap-2">
          <FaTools className="text-blue-500" />
          <span>Fixit</span>
        </Link>
        <Link to="/" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Map View">
          <FaMap /> <span className="hidden sm:inline">Map</span>
        </Link>
        <Link to="/gallery" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Gallery">
          <FaUsers /> <span className="hidden sm:inline">Gallery</span>
        </Link>
        <Link to="/team" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Team">
          <FaUsers /> <span className="hidden sm:inline">Team</span>
        </Link>
        <Link to="/help" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Help">
          <FaQuestionCircle /> <span className="hidden sm:inline">Help</span>
        </Link>
        <Link to="/leaderboard" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Leaderboard">
          <FaStar /> <span className="hidden sm:inline">Leaderboard</span>
        </Link>
        
        {currentUser && (
          <Link to="/dashboard" className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1" title="Dashboard">
            <FaChartBar /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          
        )}
      </div>

      <div className="flex items-center space-x-2">
        <form onSubmit={handleSearch} className="hidden sm:flex items-center">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by ID"
            className="bg-white/10 text-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-l-lg py-1 px-1 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg px-3 py-2 text-sm transition"
          >
            🔍
          </button>
        </form>

        {currentUser ? (
          <>
            <span className="text-sm text-gray-300 hidden md:inline">
              <FaUser className="inline mr-1" />
              {currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition flex items-center gap-1"
            >
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition flex items-center gap-1"
          >
            <FaSignInAlt /> <span className="hidden sm:inline">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
