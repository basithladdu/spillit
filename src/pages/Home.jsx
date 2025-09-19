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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';


// ✅ Proper Leaflet imports
import L from "leaflet";
// "leaflet/dist/leaflet.css" is now imported in App.jsx

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
  const { currentUser } = useAuth();

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

      const mapInstance = L.map(mapRef.current, { dragging: true }).setView([15.8281, 78.0373], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
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

  // ✅ Update markers
  useEffect(() => {
    if (!map) return;

    // Custom icons for severity levels
    const lowIcon = L.divIcon({ className: 'custom-div-icon low-severity' });
    const mediumIcon = L.divIcon({ className: 'custom-div-icon medium-severity' });
    const highIcon = L.divIcon({ className: 'custom-div-icon high-severity' });
    const criticalIcon = L.divIcon({ className: 'custom-div-icon critical-severity' });

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
            icon = L.divIcon({ className: 'custom-div-icon default-severity' });
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
            ${issue.imageUrl ? `<img src="${issue.imageUrl}" class="mt-2 rounded w-48 h-auto object-cover" alt="Issue photo" />` : ''}<br>
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

  // ✅ Global removeIssue
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
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  return (
    <div>
      <div className="h-20"></div>

      {/* Report Form Modal */}
      {showForm && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowForm(false)}
    />

    {/* Modal Content */}
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

      {/* Form stays the same */}
      <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Type
                </label>
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

              {/* Added Severity selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Severity
                </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  🚀 Submit
                </button>
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
              Report Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Thank you for your report. Here is a summary of the issue. You can use the ID below to track its status.
            </p>
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

      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mt-6 mb-2">
      <div className="flex space-x-2">
  <button
    onClick={() => setShowForm(true)}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
  >
    <SiGoogledocs /> Report Issue
  </button>

  <button
    onClick={() => {
      if (!navigator.geolocation) return alert('Geolocation not supported');
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 16);

        if (userLocationMarker) map.removeLayer(userLocationMarker);

        const marker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup('You are here')
          .openPopup();
        setUserLocationMarker(marker);
      });
    }}
    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition flex items-center gap-1"
  >
    📍 Locate Me
  </button>

  {currentUser && (
    <button
      onClick={() => navigate('/dashboard')}
      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
    >
      🔧 Moderation
    </button>
  )}
</div>


          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/10 dark:bg-gray-700 dark:border-gray-600 dark:text-white backdrop-blur-sm"
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

        <div
          ref={mapRef}
          style={{ height: "500px", width: "100%" }}
          className="mb-10 rounded-2xl shadow-2xl border border-white/40 glass"
        ></div>

        <section className="max-w-2xl mx-auto p-6 bg-white/10 dark:bg-gray-900 text-center text-base mb-8 rounded-lg shadow-lg">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Fixit</span> is a
          student-built civic tracker for reporting and mapping local issues in your community.
        </section>
      </main>
    </div>
  );
}

export default Home;
