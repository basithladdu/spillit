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
import { FaMap, FaChartBar, FaUsers, FaSignInAlt, FaSignOutAlt, FaTools, FaSearch, FaQuestionCircle, FaStar, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import ReportCard from './ReportCard'; // Adjust path if needed
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

// =========================================================
// ✅ REFINED HELPER FUNCTIONS FOR POPUP STYLING (UNCHANGED)
// =========================================================

const getSeverityColor = (severity) => {
  // Use Tailwind-like color codes for consistency and conciseness
  switch (severity) {
    case 'Critical': return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c', icon: '🚨' }; // Red-300 / Red-500 / Red-700
    case 'High': return { bg: '#fff7ed', border: '#f97316', text: '#c2410c', icon: '⚠️' };    // Orange-100 / Orange-600 / Orange-800
    case 'Medium': return { bg: '#fefce8', border: '#eab308', text: '#a16207', icon: '🔔' }; // Yellow-100 / Yellow-600 / Yellow-800
    case 'Low': return { bg: '#ecfdf5', border: '#10b981', text: '#047857', icon: '✅' };     // Emerald-50 / Emerald-500 / Emerald-700
    default: return { bg: '#f3f4f6', border: '#6b7280', text: '#374151', icon: '❓' };      // Gray-100 / Gray-500 / Gray-700
  }
};

const getStatusColor = (status) => {
  const statusLower = (status || 'new').toLowerCase().replace(' ', '_');
  switch (statusLower) {
    case 'resolved': return { bg: '#dcfce7', text: '#059669' };    // Green-100 / Green-600
    case 'in_progress': return { bg: '#e0f2fe', text: '#0284c7' }; // Sky-100 / Sky-600
    case 'new': return { bg: '#fef3c7', text: '#b45309' };         // Amber-100 / Amber-700
    default: return { bg: '#f3f4f6', text: '#4b5563' };          // Gray-100 / Gray-600
  }
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

  // Cloudinary credentials (Placeholder)
  const CLOUDINARY_CREDENTIALS = [
    { cloudName: 'fixit', uploadPreset: 'fixit_unsigned' },
  ];

  // Helper function for status/severity color (kept for form/summary)
  const getStatusStyles = (severity) => {
    switch (severity) {
      case 'Critical':
        return { color: 'bg-red-500', icon: <FaExclamationTriangle className="inline mr-2" /> };
      case 'High':
        return { color: 'bg-orange-500', icon: <FaExclamationTriangle className="inline mr-2" /> };
      case 'Medium':
        return { color: 'bg-yellow-500', icon: <FaExclamationTriangle className="inline mr-2" /> };
      case 'Low':
        return { color: 'bg-green-500', icon: <FaCheckCircle className="inline mr-2" /> };
      default:
        return { color: 'bg-gray-500', icon: <FaQuestionCircle className="inline mr-2" /> };
    }
  };

  // ✅ Initialize map safely
  useEffect(() => {
    if (mapRef.current && !map) {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }

      const mapInstance = L.map(mapRef.current, {
        dragging: true,
        zoomControl: false
      }).setView([15.8281, 78.0373], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

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

  // ✅ Update markers with pin icons and IMPROVED POPUP (This is the critical section)
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

    // =========================================================
    // ✅ REPLACED BIND POPUP SECTION WITH DIRECT IMAGE DISPLAY AND COPY ID
    // =========================================================

    Object.entries(allIssues).forEach(([id, issue]) => {
      if (!selectedType || issue.type.toLowerCase() === selectedType.toLowerCase()) {

        let icon;
        switch (issue.severity) {
          case 'Low': icon = lowIcon; break;
          case 'Medium': icon = mediumIcon; break;
          case 'High': icon = highIcon; break;
          case 'Critical': icon = criticalIcon; break;
          default: icon = lowIcon;
        }

        const marker = L.marker([issue.lat, issue.lng], { icon: icon }).addTo(map);

        const timestamp = issue.ts ? new Date(issue.ts.toDate()).toLocaleString() : 'N/A';
        const severityStyle = getSeverityColor(issue.severity);
        const statusStyle = getStatusColor(issue.status);
        const fullId = id; // Use full ID for copying
        const shortId = id.substring(0, 8);

        // Define a function to copy the ID to the clipboard (must be added to window object later)
        window.copyIssueId = (id) => {
          navigator.clipboard.writeText(id).then(() => {
            // Simple visual feedback (since we can't use React state/toasts in Leaflet popups easily)
            const btn = document.getElementById(`copy-btn-${id}`);
            if (btn) {
                btn.textContent = '✅ Copied!';
                setTimeout(() => {
                    btn.innerHTML = '📋 Copy ID';
                }, 1500);
            }
          }).catch(err => {
              console.error('Failed to copy ID: ', err);
              alert('Failed to copy ID. Please copy manually.');
          });
        };


        // ✨ CONCISE, STYLED, IMAGE-DISPLAYING POPUP HTML WITH COPY BUTTON ✨
        marker.bindPopup(`
          <div style="
            font-family: system-ui, -apple-system, sans-serif;
            min-width: 280px; max-width: 320px;
            background: white; border-radius: 12px; overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15); /* Stronger shadow */
          ">
            
            <div style="
              background: ${severityStyle.bg};
              border-left: 5px solid ${severityStyle.border}; /* Thicker border */
              padding: 12px 16px; border-bottom: 1px solid #e5e7eb;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #1f2937;">
                  ${issue.type}
                </h3>
                <span style="font-size: 26px;">${severityStyle.icon}</span>
              </div>
              <div style="
                display: flex; align-items: center; justify-content: space-between; margin-top: 4px;
              ">
                <div style="font-size: 10px; color: #6b7280; font-family: monospace; letter-spacing: 0.5px;">
                  ID: ${shortId}...
                </div>
                <button
                  id="copy-btn-${fullId}"
                  onclick="window.copyIssueId('${fullId}')"
                  style="
                    background: #f3f4f6; color: #4b5563;
                    padding: 3px 8px; border-radius: 4px;
                    font-size: 10px; font-weight: 600; border: 1px solid #d1d5db;
                    cursor: pointer; transition: all 0.1s;
                  "
                  onmouseover="this.style.background='#e5e7eb';"
                  onmouseout="this.style.background='#f3f4f6';"
                >
                  📋 Copy ID
                </button>
              </div>
            </div>
            
            <div style="padding: 16px;">
              
              <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
                <span style="
                  background: ${severityStyle.bg}; color: ${severityStyle.text};
                  border: 1px solid ${severityStyle.border};
                  padding: 3px 10px; border-radius: 9999px; /* Pill shape */
                  font-size: 11px; font-weight: 600; text-transform: uppercase;
                ">
                  ${issue.severity}
                </span>
                <span style="
                  background: ${statusStyle.bg}; color: ${statusStyle.text};
                  padding: 3px 10px; border-radius: 9999px;
                  font-size: 11px; font-weight: 600; text-transform: capitalize;
                ">
                  ${(issue.status || 'new').replace('_', ' ')}
                </span>
              </div>
              
              ${issue.imageUrl ? `
                <div style="margin-bottom: 12px; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb;">
                  <img src="${issue.imageUrl}" alt="Issue Photo" style="
                    width: 100%; height: auto; display: block; max-height: 150px; object-fit: cover;
                  " />
                </div>
              ` : ''}

              <div style="
                background: #f9fafb; padding: 10px; border-radius: 6px;
                margin-bottom: 12px; border-left: 3px solid ${severityStyle.border};
              ">
                <p style="
                  margin: 0; font-size: 13px; line-height: 1.5; color: #4b5563;
                  font-style: italic; max-height: 50px; overflow-y: auto;
                ">${issue.desc || 'No description provided.'}</p>
              </div>
              
              <div style="
                background: #eef2ff; padding: 8px 10px; border-radius: 6px;
                font-size: 12px; margin-bottom: 12px;
              ">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 12px;">📍</span>
                  <span style="color: #4f46e5; font-weight: 500;">Location:</span>
                  <span style="color: #4f46e5; font-family: monospace; font-size: 11px;">
                    ${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}
                  </span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <span style="font-size: 12px;">📅</span>
                  <span style="color: #4f46e5; font-weight: 500;">Reported:</span>
                  <span style="color: #4f46e5; font-size: 11px;">${timestamp}</span>
                </div>
              </div>
              
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <a
                  href="/report/${id}"
                  target="_blank"
                  style="
                    flex: 1; background: #3b82f6; color: white;
                    padding: 8px 12px; border-radius: 6px;
                    text-decoration: none; font-size: 13px; font-weight: 600;
                    text-align: center; transition: all 0.1s; border: none;
                    cursor: pointer; display: inline-block;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  "
                  onmouseover="this.style.background='#2563eb';"
                  onmouseout="this.style.background='#3b82f6';"
                >
                  📋 Details
                </a>
                
                ${(currentUser && ['admin', 'moderator'].includes(currentUser.role)) ? `
                <button
                  onclick="window.removeIssue('${id}')"
                  style="
                    background: #ef4444; color: white;
                    padding: 8px 12px; border-radius: 6px;
                    font-size: 13px; font-weight: 600; border: none;
                    cursor: pointer; transition: all 0.1s;
                  "
                  onmouseover="this.style.background='#dc2626';"
                  onmouseout="this.style.background='#ef4444';"
                >
                  🗑️
                </button>
                ` : ''}

              </div>
              
            </div>
          </div>
        `, { maxWidth: 340, className: 'custom-popup' });

        newMarkers[id] = marker;
      }
    });

    setMarkers(newMarkers);
  }, [map, allIssues, selectedType, currentUser]);

  // Global removeIssue and copyIssueId functions are required for Leaflet popup interaction
  useEffect(() => {
    // --- removeIssue (for deletion button) ---
    window.removeIssue = async (id) => {
      const showToastInPopup = (message, type = 'info') => {
        console.log(`[Popup Toast] ${type.toUpperCase()}: ${message}`);
        alert(message);
      };

      if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
        showToastInPopup('Permission denied.', 'error');
        return;
      }
      if (!confirm('Are you sure you want to delete this issue?')) return;
      try {
        await deleteDoc(doc(db, 'issues', id));
        showToastInPopup('Issue deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting issue:', error);
        showToastInPopup('Error deleting issue: ' + error.message, 'error');
      }
    };
    
    // --- copyIssueId (for copy ID button) ---
    // Note: The logic for this function is defined within the marker loop above, 
    // but the actual function execution relies on it being attached to the window.
    // We attach a placeholder/fallback here to ensure the window object is clean on component unmount.
    const originalCopyIssueId = window.copyIssueId;

    return () => { 
        delete window.removeIssue; 
        // Restore/delete if necessary
        if (window.copyIssueId === originalCopyIssueId) {
            delete window.copyIssueId;
        }
    };
  }, [currentUser]);


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
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // Check for duplicates within 10 minutes
    const q = query(issuesRef, where('ts', '>', tenMinutesAgo));
    const snapshot = await getDocs(q);

    let isDuplicate = false;
    snapshot.forEach(doc => {
      const issue = doc.data();
      const distance = getDistance(lat, lng, issue.lat, issue.lng);
      if (distance < 50) { // 50 meters tolerance
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
          department: assignedDepartment,
          reportedDate: new Date().toLocaleString()
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
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchId(e.target.value);
  };

  // --- Component Rendering ---

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
             <BubbleAnimation className="text-base font-medium no-underline px-3 py-1 bg-gray-900 p-2 rounded-2xl hover:bg-blue-800 transition flex items-center gap-1" title="Leaderboard">
            <Link to="/sih2025" className="flex items-center gap-1">
              <FaStar /> <span className="hidden sm:inline p-1 text-lg">SIH2025</span>
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

      <div className="flex-grow">
        {/* Empty space in the center */}
      </div>

        <div className="flex items-center space-x-2">
          {/* ✅ Static Minimal Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div
              className={`p-2 bg-gray-900 shadow-[2px_2px_20px_rgba(0,0,0,0.08)] rounded-full flex items-center transition-all duration-300 w-[270px]`}
            >
              <div className="flex items-center justify-center fill-white p-1">
                {/* Search Icon */}
                <FaSearch size={22} className='text-white' />
              </div>
              <input
                type="text"
                value={searchId}
                onChange={handleSearchInputChange}
                placeholder="Search by ID"
                className="outline-none text-[18px] bg-transparent flex-grow text-white font-normal px-2 placeholder-white/80"
              />
            </div>
          </form>

          {currentUser ? (
            <>
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

      {/* Report Form Modal (Place your Report Form component logic here) */}
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

      {/* Report Summary Modal (Place your ReportCard component logic here) */}
      {showSummary && (
          <ReportCard summaryData={summaryData} setShowSummary={setShowSummary} />
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