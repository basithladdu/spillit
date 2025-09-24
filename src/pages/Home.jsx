import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { SiGoogledocs } from "react-icons/si";
import { useNavigate, Link } from 'react-router-dom';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [allIssues, setAllIssues] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Pothole',
    severity: 'Low',
    desc: '',
    image: null,
    status: 'New'
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const CLOUDINARY_CREDENTIALS = [
    { cloudName: 'fixit', uploadPreset: 'fixit_unsigned' },
    { cloudName: 'fixit1', uploadPreset: 'fixit1' }
  ];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleUpvote = async (issueId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const issueRef = doc(db, 'issues', issueId);
    try {
      const issue = allIssues[issueId];
      if (!issue) return;

      const userHasVoted = issue.upvoters?.includes(user.uid);

      if (userHasVoted) {
        await updateDoc(issueRef, {
          upvotes: increment(-1),
          upvoters: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(issueRef, {
          upvotes: increment(1),
          upvoters: arrayUnion(user.uid)
        });
      }
      toast.success("Upvote action successful!");
    } catch (error) {
      console.error("Error upvoting issue:", error);
      toast.error("Failed to upvote.");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-600';
      case 'Medium': return 'bg-yellow-600';
      case 'High': return 'bg-red-600';
      case 'Critical': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  useEffect(() => {
    window.upvoteFromPopup = handleUpvote;
    window.viewReportFromPopup = (id) => navigate(`/report/${id}`);
    window.copyText = (text, message) => {
      navigator.clipboard.writeText(text).then(() => {
        alert(message);
      }).catch(err => {
        console.error('Could not copy text:', err);
      });
    };
    return () => {
      delete window.upvoteFromPopup;
      delete window.viewReportFromPopup;
      delete window.copyText;
    };
  }, [handleUpvote, navigate]);

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

  const getDepartment = (issueType) => {
    switch (issueType) {
      case 'Pothole':
        return 'Public Works Department (PWD)';
      case 'Streetlight Outage':
        return 'Electric Division';
      case 'Garbage':
        return 'Solid Waste Management Department';
      case 'Water Leak':
        return 'Water Utilities Department';
      case 'Public Nuisance':
        return 'Public Nuisance Dept.';
      default:
        return 'General Administration Dept.';
    }
  };

  useEffect(() => {
    if (!map) return;
    const icons = {
      Low: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      }),
      Medium: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      }),
      High: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      }),
      Critical: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      })
    };

    Object.values(markers).forEach(marker => map.removeLayer(marker));
    const newMarkers = {};

    Object.entries(allIssues).forEach(([id, issue]) => {
      if (!selectedType || issue.type.toLowerCase() === selectedType.toLowerCase()) {
        let icon = icons[issue.severity] || icons.Low;
        const department = getDepartment(issue.type);
        const marker = L.marker([issue.lat, issue.lng], { icon: icon }).addTo(map);
        const popupContent = L.DomUtil.create('div');
        const hasUpvoted = user && issue.upvoters?.includes(user.uid);
        
        popupContent.innerHTML = `
          <div class="bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-white/20">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold text-lg">${issue.type}</h3>
              <span class="text-xs font-bold text-white px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}">${issue.severity}</span>
            </div>
            ${issue.imageUrl ? `<img src="${issue.imageUrl}" class="mb-2 rounded-md w-full h-24 object-cover" alt="Issue photo" />` : ''}
            <p class="text-sm text-gray-400 mb-2 truncate">${issue.desc}</p>
            <div class="text-xs text-gray-400 mb-2">
              <p>Status: <span class="font-semibold">${issue.status}</span></p>
              <p>Assigned to: <span class="font-semibold">${department}</span></p>
            </div>
            <div class="mt-4 flex justify-between items-center">
              <button 
                onclick="window.upvoteFromPopup('${issue.id}')"
                class="flex items-center space-x-2 text-sm transition ${hasUpvoted ? 'text-green-400' : 'text-gray-400 hover:text-green-200'}"
              >
                <span class="text-lg">👍</span>
                <span>${issue.upvotes || 0}</span>
              </button>
              <button onclick="window.viewReportFromPopup('${issue.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm">
                View Details
              </button>
            </div>
            <div class="mt-4 text-xs space-y-1">
              <div class="flex justify-between items-center text-gray-500">
                <span>ID: ${issue.id}</span>
                <button onclick="window.copyText('${issue.id}', 'ID copied!')" class="ml-2 px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition">Copy</button>
              </div>
              <div class="flex justify-between items-center text-gray-500">
                <span>Coords: ${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}</span>
                <button onclick="window.copyText('${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}', 'Coordinates copied!')" class="ml-2 px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition">Copy</button>
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, {
          closeButton: true,
          className: 'custom-compact-popup'
        });
        newMarkers[id] = marker;
      }
    });
    setMarkers(newMarkers);
  }, [map, allIssues, selectedType, user]);

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
    const lat = 15.8281;
    const lng = 78.0373;
    setIsLoading(true);
    
    try {
      setShowForm(false);
      toast.info('Submitting report...', { autoClose: 3000 });

      const imageUrl = await uploadToCloudinary(formData.image);
      const department = getDepartment(formData.type);
      const docRef = await addDoc(collection(db, 'issues'), {
        type: formData.type,
        severity: formData.severity,
        desc: formData.desc,
        lat, lng, imageUrl, ts: serverTimestamp(),
        department, status: 'new', upvotes: 0
      });

      toast.success(`Report submitted successfully! It has been routed to the ${department}. Redirecting...`);
      setTimeout(() => {
        navigate(`/report/${docRef.id}`);
      }, 3000);
      setFormData({ type: 'Pothole', severity: 'Low', desc: '', image: null, status: 'New' });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report: ' + error.message);
      setShowForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover style={{ zIndex: 9999 }} />
      <div className="h-20"></div>

      {isLoading && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
            <p className="mt-4 text-white text-lg font-semibold">Submitting report...</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isLoading && setShowForm(false)} />
          <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-8 rounded-lg relative">
            <button onClick={() => !isLoading && setShowForm(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold" disabled={isLoading}>×</button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Report a New Issue</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>Pothole</option><option>Garbage</option><option>Water Leak</option><option>Streetlight Outage</option><option>Public Nuisance</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} rows="3" placeholder="Describe the issue..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:bg-blue-400">
                  {isLoading ? 'Submitting...' : '🚀 Submit'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} disabled={isLoading} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition disabled:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mt-6 mb-2">
          <div className="flex space-x-2">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"><SiGoogledocs/> Report Issue</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition">🔧 Moderation</button>
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/10 dark:bg-gray-700 dark:border-gray-600 dark:text-white backdrop-blur-sm">
            <option value="">All types</option>
            <option>Pothole</option><option>Garbage</option><option>Water Leak</option><option>Streetlight Outage</option><option>Public Nuisance</option><option>Other</option>
          </select>
        </div>
        <div ref={mapRef} style={{ height: "500px", width: "100%" }} className="mb-4 rounded-2xl shadow-2xl border border-white/40 glass"></div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            <span className="font-semibold text-red-500">Caution:</span> The map data from OpenStreetMap may not be fully up-to-date. We are working on integrating Google Maps in the future for more accurate location data.
        </p>

        <section className="max-w-2xl mx-auto p-6 bg-white/10 dark:bg-gray-900 text-center text-base mb-8 rounded-lg shadow-lg">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Fixit</span> is a student-built civic tracker for reporting and mapping local issues in your community.
        </section>
      </main>
      
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl max-w-sm w-full relative text-center">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Sign In to Upvote</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be signed in to show your support.</p>
            <div className="flex flex-col gap-4">
              <Link to="/login" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">Login</Link>
              <Link to="/register" className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition">Register</Link>
            </div>
            <button onClick={() => setShowLoginModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;