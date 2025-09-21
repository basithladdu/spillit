import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { SiGoogledocs } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add this CSS to your main stylesheet (e.g., App.css or index.css)
// to fix the popup border and padding issues.
/*
.leaflet-popup-content-wrapper {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}
.leaflet-popup-content {
  margin: 0 !important;
}
.leaflet-popup-tip {
  background: transparent !important;
  box-shadow: none !important;
}
*/

function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [allIssues, setAllIssues] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Pothole',
    severity: 'Low',
    desc: '',
    image: null,
    status: 'New'
  });
  const navigate = useNavigate();

  // Cloudinary credentials
  const CLOUDINARY_CREDENTIALS = [
    { cloudName: 'fixit', uploadPreset: 'fixit_unsigned' },
    { cloudName: 'fixit1', uploadPreset: 'fixit1' }
  ];

  // Initialize map safely
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

  // Real-time sync
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

  // Function to determine the department based on issue type
  const getDepartment = (issueType) => {
    switch (issueType) {
      case 'Pothole':
        return 'Public Works Department (PWD)';
      case 'Streetlight Outage':
        return 'Electricity Department';
      case 'Garbage':
        return 'Municipal Corporation / Sanitation Department';
      case 'Water Leak':
        return 'Water Supply and Sewerage Board';
      case 'Public Nuisance':
        return 'Law Enforcement / District Administration';
      default:
        return 'General Administration Department';
    }
  };

  // Update markers with pin icons and improved popup using L.popup
  useEffect(() => {
    if (!map) return;

    // Define custom icons for each severity level
    const icons = {
      Low: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      }),
      Medium: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      }),
      High: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      }),
      Critical: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })
    };

    // Clear old markers
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    const newMarkers = {};

    Object.entries(allIssues).forEach(([id, issue]) => {
      if (!selectedType || issue.type.toLowerCase() === selectedType.toLowerCase()) {
        
        let icon = icons[issue.severity] || icons.Low;
        const department = getDepartment(issue.type);
        
        const marker = L.marker([issue.lat, issue.lng], { icon: icon }).addTo(map);
        
        const popupContent = L.DomUtil.create('div');
        popupContent.innerHTML = `
          <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-gray-800 dark:text-gray-200">
            <h3 class="font-bold text-lg mb-2">${issue.type}</h3>
            <div class="space-y-1 text-sm">
              <p><span class="font-semibold">Severity:</span> ${issue.severity}</p>
              <p><span class="font-semibold">Status:</span> ${issue.status || 'N/A'}</p>
              <p><span class="font-semibold">Department:</span> ${department}</p>
              <p><span class="font-semibold">ID:</span> ${issue.id} <button onclick="navigator.clipboard.writeText('${issue.id}').then(() => alert('ID copied!'))" class="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Copy</button></p>
              <p><span class="font-semibold">Coords:</span> ${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)} <button onclick="navigator.clipboard.writeText('${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}').then(() => alert('Coordinates copied!'))" class="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Copy</button></p>
            </div>
            ${issue.imageUrl ? `<img src="${issue.imageUrl}" class="mt-4 rounded-md w-full h-auto object-cover" alt="Issue photo" />` : ''}
            <div class="mt-4 text-center">
              <button onclick="window.viewReport('${issue.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                View Details
              </button>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          closeButton: true,
          className: 'custom-leaflet-popup'
        });

        newMarkers[id] = marker;
      }
    });

    setMarkers(newMarkers);
  }, [map, allIssues, selectedType]);

  // Global viewReport function for popups
  useEffect(() => {
    window.viewReport = (id) => {
      navigate(`/report/${id}`);
    };
    return () => { delete window.viewReport; };
  }, [navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      toast.error('Please upload an image.');
      return;
    }
    
    // Using hardcoded location as requested
    const lat = 15.8281;
    const lng = 78.0373;

    try {
      toast.info('Uploading image...', { autoClose: 2000 });
      const imageUrl = await uploadToCloudinary(formData.image);
      const department = getDepartment(formData.type);

      // Store the report and get its unique ID
      const docRef = await addDoc(collection(db, 'issues'), {
        type: formData.type,
        severity: formData.severity,
        desc: formData.desc,
        lat,
        lng,
        imageUrl,
        ts: serverTimestamp(),
        department,
        status: 'New' // Ensure status is saved as 'New'
      });

      // Show proper reported toast and redirect
      toast.success(`Report submitted successfully! It has been routed to the ${department}. Redirecting...`);
      setTimeout(() => {
        navigate(`/report/${docRef.id}`);
      }, 3000);
      setShowForm(false);
      setFormData({ type: 'Pothole', severity: 'Low', desc: '', image: null, status: 'New' });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report: ' + error.message);
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="h-20"></div> {/* Navbar spacing */}

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
      
      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mt-6 mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              <SiGoogledocs/> Report Issue
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              🔧 Moderation
            </button>
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