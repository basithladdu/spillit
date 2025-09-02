import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved dark mode preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    applyDarkMode(isDark);
  }, []);

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // This would trigger a map center event if we were on the home page
        window.dispatchEvent(new CustomEvent('userLocation', {
          detail: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location');
      }
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-lg flex items-center justify-between px-4 py-3 font-semibold border-b border-gray-800 dark:bg-gray-900">
      <div className="flex items-center space-x-3">
        <Link to="/" className="text-2xl font-extrabold tracking-tight drop-shadow">
          📍 fixit
        </Link>
        <Link
          to="/"
          className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1"
          title="Map View"
        >
          🗺️ <span className="hidden sm:inline">Map</span>
        </Link>
        <Link
          to="/dashboard"
          className="text-base font-medium no-underline px-3 py-1 rounded hover:bg-blue-800 transition flex items-center gap-1"
          title="Dashboard"
        >
          📊 <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <Link
          to="/team"
          className="text-base font-medium px-3 no-underline py-1 rounded hover:bg-blue-800 transition flex items-center gap-1"
          title="Team"
        >
          🧑‍💻 <span className="hidden sm:inline">Team</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={locateUser}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
          title="Locate Me"
        >
          📌 locate
        </button>
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition"
          title="Toggle Dark Mode"
        >
          {darkMode ? '☀️ light mode' : '🌙 dark mode'}
        </button>
        
        {currentUser ? (
          <>
            <span className="text-sm text-gray-300">
              {currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
            >
              🚪 logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition"
          >
            🔧 login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;