import React, { useState, useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp,
  orderBy, query, limit
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import imageCompression from 'browser-image-compression';

// --- Icons ---
import {
  FaMap, FaChartBar, FaUsers, FaSignInAlt, FaSignOutAlt, FaTools,
  FaSearch, FaLayerGroup, FaTimes, FaPaperPlane, FaCamera, FaCrosshairs,
  FaMapMarkerAlt, FaCalendarAlt, FaCopy, FaStar
} from 'react-icons/fa';
import { SiGoogledocs } from 'react-icons/si';
import { MdGpsFixed, MdWarning, MdError, MdCheckCircle } from 'react-icons/md';

import ReportCard from './ReportCard';

// --- Leaflet Assets Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Configuration ---
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';
const CLOUDINARY_CREDENTIALS = [{ cloudName: 'fixit', uploadPreset: 'fixit_unsigned' }];

const MAP_STYLES = [
  { name: 'Midnight', id: 'mapbox/navigation-night-v1', color: 'bg-blue-900' },
  { name: 'Dark', id: 'mapbox/dark-v11', color: 'bg-gray-900' },
  { name: 'Satellite', id: 'mapbox/satellite-streets-v12', color: 'bg-green-900' },
  { name: 'Light', id: 'mapbox/light-v11', color: 'bg-gray-200' },
  { name: 'Street', id: 'mapbox/outdoors-v12', color: 'bg-green-200' }
];


// --- Style Helpers for Popups (Inline Styles for Leaflet HTML) ---
const getSeverityColors = (severity) => {
  switch (severity) {
    case 'Critical': return { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#FCA5A5' };
    case 'High': return { bg: 'rgba(249, 115, 22, 0.2)', border: '#F97316', text: '#FDBA74' };
    case 'Medium': return { bg: 'rgba(234, 179, 8, 0.2)', border: '#EAB308', text: '#FDE047' };
    default: return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', text: '#6EE7B7' };
  }
};

function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [allIssues, setAllIssues] = useState({});

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [formData, setFormData] = useState({ type: 'Pothole', severity: 'Low', desc: '', image: null, status: 'new' });
  const [searchId, setSearchId] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox/navigation-night-v1');

  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // --- Map Initialization ---
  const loadMapboxStyle = (mapInstance, styleId) => {
    mapInstance.eachLayer((layer) => { if (layer instanceof L.TileLayer) mapInstance.removeLayer(layer); });
    L.tileLayer(
      `https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      { attribution: '© Mapbox', tileSize: 512, zoomOffset: -1, maxZoom: 19 }
    ).addTo(mapInstance);
  };

  useEffect(() => {
    if (mapRef.current && !map) {
      if (mapRef.current._leaflet_id) mapRef.current._leaflet_id = null;
      const mapInstance = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        .setView([15.8281, 78.0373], 15); // Default View

      loadMapboxStyle(mapInstance, mapStyle);
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
      setMap(mapInstance);
    }
  }, []);

  useEffect(() => { if (map) loadMapboxStyle(map, mapStyle); }, [mapStyle, map]);

  // --- Data & Markers ---
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const issues = {};
      snap.forEach(d => issues[d.id] = { id: d.id, ...d.data() });
      setAllIssues(issues);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers (simple approach)
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const getIconUrl = (color) => `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`;

    Object.entries(allIssues).forEach(([id, issue]) => {
      let color = 'green';
      if (issue.severity === 'Medium') color = 'yellow';
      if (issue.severity === 'High') color = 'orange';
      if (issue.severity === 'Critical') color = 'red';

      const icon = L.icon({
        iconUrl: getIconUrl(color),
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      });

      const sevStyle = getSeverityColors(issue.severity);

      // Custom HTML Popup Construction
      const popupHtml = `
          <div style="font-family: sans-serif; min-width: 200px; max-width: 260px; background: #0F172A; border: 1px solid ${sevStyle.border}; border-radius: 12px; overflow: hidden; color: white;">
            <div style="background: ${sevStyle.bg}; padding: 10px 15px; border-bottom: 1px solid ${sevStyle.border}; display: flex; justify-content: space-between; align-items: center;">
              <strong style="text-transform: uppercase; color: ${sevStyle.text}; font-size: 12px;">${issue.type}</strong>
              <span style="font-size: 10px; background: #000; padding: 2px 6px; border-radius: 4px;">${issue.severity}</span>
            </div>
            <div style="padding: 15px;">
              ${issue.imageUrl ? `<div style="width: 100%; height: 100px; background-image: url('${getOptimizedImageUrl(issue.imageUrl, 300)}'); background-size: cover; background-position: center; border-radius: 6px; margin-bottom: 10px; border: 1px solid #334155;"></div>` : ''}
              <p style="margin: 0 0 10px; font-size: 12px; color: #94A3B8; line-height: 1.4;">${issue.desc || 'No description.'}</p>
              <div style="display: flex; gap: 5px; margin-top: 10px;">
                  <a href="/report/${id}" target="_blank" style="flex: 1; text-align: center; background: #06B6D4; color: #000; text-decoration: none; padding: 6px; border-radius: 6px; font-weight: bold; font-size: 11px;">DETAILS</a>
                  <button onclick="window.copyIssueId('${id}')" style="background: #334155; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;">📋</button>
              </div>
            </div>
          </div>
        `;

      L.marker([issue.lat, issue.lng], { icon }).addTo(map)
        .bindPopup(popupHtml, { maxWidth: 300, className: 'custom-leaflet-popup' });
    });
  }, [map, allIssues]);

  // --- Global Actions ---
  useEffect(() => {
    window.copyIssueId = (id) => navigator.clipboard.writeText(id).then(() => alert('ID Copied!'));
    return () => { delete window.copyIssueId; };
  }, []);

  // --- Handlers ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId && allIssues[searchId]) {
      const issue = allIssues[searchId];
      map.setView([issue.lat, issue.lng], 18);
      setSearchId('');
    } else {
      alert("Issue ID not found");
    }
  };

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CREDENTIALS[0].cloudName}/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_CREDENTIALS[0].uploadPreset);
    const res = await fetch(url, { method: 'POST', body: form });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return alert("Please attach a photo.");

    setIsSubmitting(true);

    // Image Compression
    let imageFile = formData.image;
    try {
      const options = {
        maxSizeMB: 0.15, // 150KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      imageFile = await imageCompression(formData.image, options);
      console.log(`Image compressed from ${formData.image.size / 1024}KB to ${imageFile.size / 1024}KB`);
    } catch (error) {
      console.error("Image compression failed:", error);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const imgUrl = await uploadToCloudinary(imageFile);
          const { image, ...cleanData } = formData;

          const newDoc = await addDoc(collection(db, "issues"), {
            ...cleanData,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            imageUrl: imgUrl,
            ts: serverTimestamp(),
            userId: currentUser ? currentUser.uid : "guest",
            upvotes: 0,
          });

          setSummaryData({ ...cleanData, imageUrl: imgUrl, id: newDoc.id });
          setShowForm(false);
          setShowSummary(true);
          setFormData({ type: "Pothole", severity: "Low", desc: "", image: null, status: "new" });
        } catch (err) {
          console.error(err);
          alert("Upload Failed");
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        alert("Location access denied. Cannot report without location.");
        setIsSubmitting(false);
      }
    );
  };

  // --- Navigation Item Component ---
  const NavItem = ({ to, icon, label }) => (
    <Link to={to} className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all group">
      <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
      <span className="hidden lg:inline font-bold text-xs uppercase tracking-wider">{label}</span>
    </Link>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A1E] text-white font-sans">

      {/* --- THE MAP --- */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* --- HUD: Navbar (Local) --- */}
      <motion.nav
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none"
      >
        {/* Desktop: Glass Pill Menu */}
        <div className="hidden md:flex absolute top-6 left-0 right-0 justify-between px-6 items-center">
          <div className="flex items-center gap-1 pointer-events-auto bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-xl shadow-black/20">
            <NavItem to="/" icon={<FaMap />} label="Map" />
            <NavItem to="/gallery" icon={<FaUsers />} label="Gallery" />
            <NavItem to="/leaderboard" icon={<FaStar />} label="Rankings" />
            {currentUser && <NavItem to="/dashboard" icon={<FaChartBar />} label="Admin" />}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Locate ID..."
                value={searchId} onChange={(e) => setSearchId(e.target.value)}
                className="w-40 focus:w-64 transition-all bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 text-white text-sm rounded-full py-2.5 pl-10 pr-4 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
            </form>

            {currentUser ? (
              <button onClick={() => { logout(); navigate('/'); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all backdrop-blur-xl">
                <FaSignOutAlt />
              </button>
            ) : (
              <Link to="/login" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 backdrop-blur-xl">
                <FaSignInAlt /> <span className="text-xs uppercase tracking-wide">Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
          <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-lg font-black text-white tracking-widest text-sm">
            FIXIT
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsStyleOpen(!isStyleOpen)} className="w-10 h-10 rounded-full bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <FaLayerGroup />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* --- HUD: Floating Controls --- */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-4 md:bottom-24 md:right-6 z-[900] flex flex-col gap-4 items-end pointer-events-auto">

        {/* Style Switcher (Desktop Position / Mobile handled in header or here) */}
        <div className="relative hidden md:block">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsStyleOpen(!isStyleOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all ${isStyleOpen ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-[#0F172A]/80 text-gray-400 border-white/10 hover:text-white'}`}
          >
            <FaLayerGroup />
          </motion.button>

          <AnimatePresence>
            {isStyleOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-2 right-14 bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-48 shadow-2xl"
              >
                <div className="text-[10px] font-bold text-gray-500 px-2 py-1 uppercase mb-1">Map Layers</div>
                <div className="space-y-1">
                  {MAP_STYLES.map(s => (
                    <button key={s.id} onClick={() => { setMapStyle(s.id); setIsStyleOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${mapStyle === s.id ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-gray-300'}`}>
                      <div className={`w-3 h-3 rounded-full ${s.color}`}></div> {s.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Locate Me */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigator.geolocation.getCurrentPosition(pos => map.setView([pos.coords.latitude, pos.coords.longitude], 16))}
          className="w-12 h-12 rounded-full bg-[#0F172A]/80 text-white border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-xl hover:bg-white/10 hover:text-cyan-400 transition-colors"
        >
          <MdGpsFixed size={20} />
        </motion.button>

        {/* BIG REPORT BUTTON */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-white/20 backdrop-blur-md group"
        >
          <SiGoogledocs className="text-xl group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-wide hidden md:inline">REPORT ISSUE</span>
          <span className="font-bold tracking-wide md:hidden">REPORT</span>
        </motion.button>
      </div>

      {/* --- HUD: Branding (Bottom Left - Desktop Only) --- */}
      <div className="fixed bottom-8 left-8 z-[900] pointer-events-none hidden md:block">
        <div className="flex items-center gap-3 bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl">
          <div className="bg-cyan-500 text-black p-2 rounded-lg"><FaTools /></div>
          <div>
            <div className="text-white font-black text-xl tracking-widest leading-none">FIXIT</div>
            <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Community Ops</div>
          </div>
        </div>
      </div>

      {/* --- Modal: New Report Form --- */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full h-[85vh] md:h-auto md:max-w-lg bg-[#0F172A] border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaCrosshairs className="text-cyan-500" /> New Incident Report
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition"><FaTimes /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Issue Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition appearance-none"
                    >
                      <option>Pothole</option><option>Garbage</option><option>Water Leak</option><option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={e => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition appearance-none"
                    >
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={formData.desc}
                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full h-24 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Evidence</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition group">
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-cyan-400">
                      {formData.image ? <MdCheckCircle size={24} className="text-emerald-500" /> : <FaCamera size={24} />}
                      <span className="text-xs font-bold">{formData.image ? 'Photo Attached' : 'Upload Photo'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                  </label>
                </div>

                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 mt-4">
                  <FaPaperPlane /> SUBMIT REPORT
                </button>
                <div className="h-8 md:hidden"></div> {/* Safe area spacer */}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Success Modal --- */}
      {showSummary && <ReportCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      {isSubmitting && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-300 font-bold tracking-widest text-xs uppercase">
            Submitting report...
          </p>
        </div>
      )}

      {/* --- CSS Overrides for Leaflet --- */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border: none !important; }
        .leaflet-popup-tip { display: none !important; }
        .leaflet-control-zoom { border: none !important; margin-bottom: 20px !important; margin-right: 20px !important; }
        .leaflet-control-zoom a { background-color: rgba(15, 23, 42, 0.9) !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px); border-radius: 8px !important; margin-bottom: 5px !important; }
        .leaflet-control-zoom a:hover { background-color: #06B6D4 !important; color: black !important; }
      `}</style>
    </div>
  );
}

export default Home;