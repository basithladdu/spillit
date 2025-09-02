import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';

// Import Leaflet CSS and JS (you'll need to add these to your index.html or install via npm)
// For now, assuming they're loaded globally

function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [allIssues, setAllIssues] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Pothole',
    desc: '',
    image: null
  });
  const [userLocationMarker, setUserLocationMarker] = useState(null);

  // Cloudinary credentials
  const CLOUDINARY_CREDENTIALS = [
    { cloudName: 'fixit', uploadPreset: 'fixit_unsigned' },
    { cloudName: 'fixit1', uploadPreset: 'fixit1' }
  ];

  // Initialize map
  useEffect(() => {
    if (typeof L !== 'undefined' && mapRef.current && !map) {
      const mapInstance = L.map(mapRef.current).setView([15.8281, 78.0373], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);
      setMap(mapInstance);
    }
  }, [map]);

  // Listen for user location events from navbar
  useEffect(() => {
    const handleUserLocation = (event) => {
      if (map) {
        const { lat, lng } = event.detail;
        map.setView([lat, lng], 16);
        
        if (userLocationMarker && map) {
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

  // Real-time sync for issues
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newIssues = {};
      snapshot.forEach((doc) => {
        newIssues[doc.id] = { id: doc.id, ...doc.data() };
      });
      setAllIssues(newIssues);
    });

    return () => unsubscribe();
  }, []);

  // Update map markers when issues or filter changes
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    const newMarkers = {};

    // Add filtered markers
    Object.entries(allIssues).forEach(([id, issue]) => {
      if (!selectedType || issue.type.toLowerCase() === selectedType.toLowerCase()) {
        const marker = L.marker([issue.lat, issue.lng]).addTo(map);
        
        const timestamp = issue.ts ? new Date(issue.ts.toDate()).toLocaleString() : 'N/A';
        marker.bindPopup(`
          <div class="text-sm">
            <b>${issue.type}</b><br>
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

  // Expose removeIssue function globally for popup buttons
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

    return () => {
      delete window.removeIssue;
    };
  }, []);

  const showToast = (message, type = 'info') => {
    // Simple toast implementation
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a proper toast system here
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
        if (!resp.ok) {
          throw new Error(`Upload failed for ${creds.cloudName}`);
        }
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

      try {
        showToast('Uploading image...', 'info');
        const imageUrl = await uploadToCloudinary(formData.image);
        
        await addDoc(collection(db, 'issues'), {
          type: formData.type,
          desc: formData.desc,
          lat,
          lng,
          imageUrl,
          ts: serverTimestamp()
        });

        showToast('Report submitted successfully!', 'success');
        setShowForm(false);
        setFormData({ type: 'Pothole', desc: '', image: null });
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
      <div className="h-20"></div> {/* Navbar spacing */}
      
      {/* Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-8 rounded-lg relative z-[120]">
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
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              📝 Report Issue
            </button>
            <button
              onClick={() => setShowModeration(!showModeration)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              🔧 Moderation
            </button>
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          className="mb-10 rounded-2xl shadow-2xl border border-white/40"
          style={{ minHeight: '400px' }}
        ></div>

        {/* Moderation Panel */}
        {showModeration && (
          <section className="max-w-2xl mx-auto my-8 bg-white/80 dark:bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Moderator Panel
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(allIssues).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No issues reported yet.</p>
              ) : (
                Object.entries(allIssues).map(([id, issue]) => (
                  <div key={id} className="py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="text-sm mb-2 sm:mb-0">
                      <p className="font-bold text-gray-800 dark:text-white">{issue.type}</p>
                      <p className="text-gray-700 dark:text-gray-300">{issue.desc}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Lat: {issue.lat?.toFixed(4)}, Lng: {issue.lng?.toFixed(4)}
                      </p>
                      {issue.ts && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Reported: {new Date(issue.ts.toDate()).toLocaleString()}
                        </p>
                      )}
                      {issue.imageUrl && (
                        <img
                          src={issue.imageUrl}
                          className="mt-1 rounded w-24 h-24 object-cover"
                          alt="Issue photo"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => window.removeIssue(id)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold px-2 py-1 rounded transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <section className="max-w-2xl mx-auto p-6 bg-white/80 dark:bg-gray-900 text-center text-base mb-8 rounded-lg shadow-lg">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Fixit</span> is a
          student-built civic tracker for reporting and mapping local issues in your community.
        </section>
      </main>
    </div>
  );
}

export default Home;