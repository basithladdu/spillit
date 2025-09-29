import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { SiGoogledocs } from "react-icons/si";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaMap, FaChartBar, FaUsers, FaUser, FaSignInAlt, FaSignOutAlt, FaTools, FaSearch, FaQuestionCircle, FaStar } from 'react-icons/fa';

// ✅ Proper Leaflet imports
import L from "leaflet";
// "leaflet/dist/leaflet.css" is now imported in App.jsx

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [allIssues, setAllIssues] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Pothole',
    severity: 'Low',
    desc: '',
    image: null,
    status: 'new'
  });
  const [userLocationMarker, setUserLocationMarker] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Cloudinary credentials
  const CLOUDINARY_CREDENTIALS = [
    { cloudName: 'fixit', uploadPreset: 'fixit_unsigned' },
    { cloudName: 'fixit1', uploadPreset: 'fixit1' }
  ];

  // ✅ Initialize map safely
  useEffect(() => {
    if (mapRef.current && !map) {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }

      const mapInstance = L.map(mapRef.current, {
        dragging: true,
        zoomControl: false // Temporarily disable default zoom control
      }).setView([15.8281, 78.0373], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Add zoom control explicitly to the bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstance);

      setMap(mapInstance);
    }
  }, [map]);

  // ✅ Listen for user location
  useEffect(() => {
    const handleUserLocation = (event) => {
      if (map) {
        const { lat, lng } = event.detail;
        map.setView([lat, lng], 16);

        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }

        const marker = L.marker([lat, lng]).addTo(map)
          .bindPopup('You are here')
          .openPopup();
        setUserLocationMarker(marker);
      }
    };

    window.addEventListener('userLocation', handleUserLocation);
    return () => window.removeEventListener('userLocation', handleUserLocation);
  }, [map, userLocationMarker]);

  // ✅ Real-time sync
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newIssues = {};
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        newIssues[doc.id] = data;
      });
      setAllIssues(newIssues);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Update markers with pin icons
  useEffect(() => {
    if (!map) return;

    // Define custom icons for each severity level using pin images
    const lowIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    const mediumIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    const highIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    const criticalIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    // Clear old markers
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    const newMarkers = {};

    Object.entries(allIssues).forEach(([id, issue]) => {
      if (!selectedType || issue.type.toLowerCase() === selectedType.toLowerCase()) {
        
        let icon;
        switch (issue.severity) {
          case 'Low':
            icon = lowIcon;
            break;
          case 'Medium':
            icon = mediumIcon;
            break;
          case 'High':
            icon = highIcon;
            break;
          case 'Critical':
            icon = criticalIcon;
            break;
          default:
            icon = lowIcon; // Default to a green pin
        }
        
        const marker = L.marker([issue.lat, issue.lng], { icon: icon }).addTo(map);

        const timestamp = issue.ts ? new Date(issue.ts.toDate()).toLocaleString() : 'N/A';
        marker.bindPopup(`
          <div class="text-sm">
            <b>${issue.type}</b><br>
            <b>Severity:</b> ${issue.severity}<br>
            <b>Status:</b> ${issue.status || 'N/A'}<br>
            ${issue.desc}<br>
            <span class="text-xs text-gray-500">Lat: ${issue.lat.toFixed(5)}, Lng: ${issue.lng.toFixed(5)}</span><br>
            <span class="text-xs text-gray-500">Reported: ${timestamp}</span><br>
            <button onclick="window.removeIssue('${id}')" class="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition">
              🚫 Remove
            </button>
          </div>
        `);
        newMarkers[id] = marker;
      }
    });

    setMarkers(newMarkers);
  }, [map, allIssues, selectedType]);

  // Global removeIssue from Navbar component logic
  useEffect(() => {
    window.removeIssue = async (id) => {
      if (!confirm('Are you sure you want to delete this issue?')) return;
      try {
        await deleteDoc(doc(db, 'issues', id));
        showToast('Issue deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting issue:', error);
        showToast('Error deleting issue: ' + error.message, 'error');
      }
    };
    return () => { delete window.removeIssue; };
  }, []);

  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const uploadToCloudinary = async (file) => {
    let lastError = null;
    for (const creds of CLOUDINARY_CREDENTIALS) {
      const url = `https://api.cloudinary.com/v1_1/${creds.cloudName}/upload`;
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', creds.uploadPreset);
      try {
        const resp = await fetch(url, { method: 'POST', body: form });
        if (!resp.ok) throw new Error(`Upload failed for ${creds.cloudName}`);
        const data = await resp.json();
        return data.secure_url;
      } catch (err) {
        lastError = err;
        console.warn(`Upload failed for ${creds.cloudName}, trying next...`);
      }
    }
    throw lastError || new Error('All uploads failed');
  };

  // ✅ Duplicate report detection logic
  const checkDuplicateReports = async (lat, lng) => {
    const issuesRef = collection(db, 'issues');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const q = query(issuesRef, where('ts', '>', twoHoursAgo));
    const snapshot = await getDocs(q);

    let isDuplicate = false;
    snapshot.forEach(doc => {
      const issue = doc.data();
      const distance = getDistance(lat, lng, issue.lat, issue.lng);
      if (distance < 50) {
        isDuplicate = true;
      }
    });
    return isDuplicate;
  };

  // Helper function to calculate distance between two points (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getAssignedDepartment = (issueType) => {
    switch (issueType) {
      case 'Garbage':
        return 'Sanitation';
      case 'Pothole':
      case 'Water Leak':
        return 'Public Works';
      case 'Streetlight Outage':
        return 'Electricity';
      default:
        return 'Other';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      showToast('Please upload an image.', 'error');
      return;
    }

    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const isDuplicate = await checkDuplicateReports(lat, lng);
      if (isDuplicate) {
        showToast('A similar report was recently submitted nearby.', 'error');
        return;
      }

      try {
        showToast('Uploading image...', 'info');
        const imageUrl = await uploadToCloudinary(formData.image);

        const userId = currentUser ? currentUser.uid : 'guest';
        const assignedDepartment = getAssignedDepartment(formData.type);

        const docRef = await addDoc(collection(db, 'issues'), {
          type: formData.type,
          severity: formData.severity,
          status: formData.status,
          desc: formData.desc,
          lat,
          lng,
          imageUrl,
          ts: serverTimestamp(),
          userId: userId,
          department: assignedDepartment
        });

        setSummaryData({
          id: docRef.id,
          ...formData,
          lat,
          lng,
          imageUrl,
          department: assignedDepartment
        });
        setShowForm(false);
        setShowSummary(true);
        setFormData({ type: 'Pothole', severity: 'Low', desc: '', image: null, status: 'new' });
      } catch (error) {
        console.error('Error submitting report:', error);
        showToast('Failed to submit report: ' + error.message, 'error');
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      showToast('Unable to retrieve location. Please enable GPS.', 'error');
    });
  };

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
    <div className="relative w-full h-screen">
      {/* Map occupies the whole screen */}
      <div
        ref={mapRef}
        className="w-full h-full"
      ></div>

      {/* Primary navigation bar on top of the map */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] text-white flex items-center justify-between px-4 py-3 font-semibold">
        <div className="flex items-center space-x-7">
          {/* Removed Fixit logo from navbar */}
          
          <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" title="Map View">
            <Link to="/" className="flex items-center gap-1">
              <FaMap /> <span className="hidden sm:inline p-1 text-lg">Map</span>
            </Link>
          </BubbleAnimation>

          <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 p-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" title="Gallery">
            <Link to="/gallery" className="flex items-center gap-1">
              <FaUsers /> <span className="hidden sm:inline p-1 text-lg">Gallery</span>
            </Link>
          </BubbleAnimation>

          <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 p-2 rounded-2xl bg-gray-900 hover:bg-blue-800 transition flex items-center gap-1" title="Help">
            <Link to="/help" className="flex items-center gap-1">
              <FaQuestionCircle /> <span className="hidden sm:inline p-1 text-lg">Help</span>
            </Link>
          </BubbleAnimation>

          <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 bg-gray-900 p-2 rounded-2xl hover:bg-blue-800 transition flex items-center gap-1" title="Leaderboard">
            <Link to="/leaderboard" className="flex items-center gap-1">
              <FaStar /> <span className="hidden sm:inline p-1 text-lg">Leaderboard</span>
            </Link>
          </BubbleAnimation>
          
          {currentUser && (
            <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 bg-gray-900 p-2 rounded-2xl hover:bg-blue-800 transition flex items-center gap-1" title="Dashboard">
              <Link to="/dashboard" className="flex items-center gap-1">
                <FaChartBar /> <span className="hidden sm:inline p-1 text-lg">Dashboard</span>
              </Link>
            </BubbleAnimation>
          )}
        </div>

     {/* Center Branding */}
      <div className="absolute ml-10 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
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

        <div className="flex items-center space-x-2">
          {/* Animated Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div
              className={`p-2 overflow-hidden bg-gray-900 shadow-[2px_2px_20px_rgba(0,0,0,0.08)] rounded-full flex group items-center transition-all duration-300 ${
                isSearchExpanded ? 'w-[270px]' : 'w-[60px] hover:w-[270px]'
              }`}
              onMouseEnter={() => setIsSearchExpanded(true)}
              onMouseLeave={() => !searchId && setIsSearchExpanded(false)}
            >
              <div className="flex items-center justify-center fill-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id="Isolation_Mode"
                  data-name="Isolation Mode"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                >
                  <path
                    d="M18.9,16.776A10.539,10.539,0,1,0,16.776,18.9l5.1,5.1L24,21.88ZM10.5,18A7.5,7.5,0,1,1,18,10.5,7.507,7.507,0,0,1,10.5,18Z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                value={searchId}
                onChange={handleSearchInputChange}
                placeholder="Search by ID"
                className="outline-none text-[20px] bg-transparent w-full text-white font-normal px-4 placeholder-white/80"
              />
            </div>
          </form>

          {currentUser ? (
            <>
              <span className="text-lg text-gray-600 hidden md:inline">
                <FaUser className="inline mr-5 ml-5 text-5xl bg-gray-900 p-3 rounded-full border-black" />
              </span>
              <BubbleAnimation 
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-xl text-sm transition flex items-center gap-1"
              >
                <FaSignOutAlt /> <span className="hidden sm:inline text-lg">Logout</span>
              </BubbleAnimation>
            </>
          ) : (
            <BubbleAnimation className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition flex items-center gap-1">
              <Link to="/login" className="flex items-center gap-1">
                <FaSignInAlt /> <span className="hidden sm:inline">Login</span>
              </Link>
            </BubbleAnimation>
          )}
        </div>
      </nav>

      {/* Fixit Logo in Bottom Left Corner */}
      <div className="fixed bottom-4 left-4 z-[1000]">
        <Link 
          to="/" 
          className="bg-gray-900/90 backdrop-blur-sm p-5 rounded-2xl text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105"
        >
          <FaTools className="text-blue-500" />
          <span>Fixit</span>
        </Link>
      </div>

      {/* Control buttons and filters overlaid on the map, below the navbar */}
      <div className="absolute top-20 left-4 right-4 z-[1000] flex flex-col items-start space-y-4 md:flex-row md:justify-between md:items-center">
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <BubbleAnimation 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-lg"
          >
            <SiGoogledocs /> Report Issue
          </BubbleAnimation>
          
          <BubbleAnimation 
            onClick={() => {
              if (!navigator.geolocation) return alert('Geolocation not supported');
              navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16);
                if (userLocationMarker) map.removeLayer(userLocationMarker);
                const marker = L.marker([latitude, longitude]).addTo(map).bindPopup('You are here').openPopup();
                setUserLocationMarker(marker);
              });
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition flex items-center gap-1 shadow-lg"
          >
            📍 Locate Me
          </BubbleAnimation>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/70 dark:bg-gray-700 dark:border-gray-600 dark:text-white backdrop-blur-md shadow-lg"
        >
          <option value="">All types</option>
          <option>Pothole</option>
          <option>Garbage</option>
          <option>Water Leak</option>
          <option>Streetlight Outage</option>
          <option>Public Nuisance</option>
          <option>Other</option>
        </select>
      </div>

      {/* Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-8 rounded-lg relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Report a New Issue
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option>Pothole</option>
                  <option>Garbage</option>
                  <option>Water Leak</option>
                  <option>Streetlight Outage</option>
                  <option>Public Nuisance</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  rows="3"
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <BubbleAnimation 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  🚀 Submit
                </BubbleAnimation>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Summary Modal */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          />
          <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-8 rounded-lg relative">
            <button
              onClick={() => setShowSummary(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Report Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Thank you for your report. Here is a summary of the issue. You can use the ID below to track its status.</p>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-semibold w-24">ID:</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm break-all">{summaryData.id}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Type:</span>
                <span className="text-gray-700 dark:text-gray-300">{summaryData.type}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Severity:</span>
                <span className="text-gray-700 dark:text-gray-300">{summaryData.severity}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Coordinates:</span>
                <span className="text-gray-700 dark:text-gray-300">{summaryData.lat?.toFixed(5)}, {summaryData.lng?.toFixed(5)}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold mb-1">Description:</span>
                <p className="text-gray-700 dark:text-gray-300">{summaryData.desc}</p>
              </div>
              {summaryData.imageUrl && (
                <div className="flex justify-center mt-4">
                  <img src={summaryData.imageUrl} alt="Reported issue" className="max-w-xs rounded-lg shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default Home;