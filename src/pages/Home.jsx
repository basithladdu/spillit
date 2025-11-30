import React, { useState, useEffect, useRef } from 'react';
import {
  collection, onSnapshot, addDoc, serverTimestamp,
  orderBy, query, limit
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import imageCompression from 'browser-image-compression';

// --- Icons ---
import {
  FaMap, FaChartBar, FaUsers, FaSignInAlt, FaSignOutAlt, FaTools,
  FaSearch, FaLayerGroup, FaTimes, FaPaperPlane, FaCamera, FaCrosshairs,
  FaStar, FaBars, FaArrowRight
} from 'react-icons/fa';
import { SiGoogledocs } from 'react-icons/si';
import { MdGpsFixed, MdCheckCircle } from 'react-icons/md';

import ReportCard from './ReportCard';
import Navbar from '../components/Navbar';
import '../styles/municipal.css';

// --- Leaflet Assets Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Configuration ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';
const CLOUDINARY_CREDENTIALS = [{ cloudName: 'fixit', uploadPreset: 'fixit_unsigned' }];

const MAP_STYLES = [
  { name: 'Midnight', id: 'mapbox/navigation-night-v1', color: 'bg-blue-900' },
  { name: 'Dark', id: 'mapbox/dark-v11', color: 'bg-gray-900' },
  { name: 'Satellite', id: 'mapbox/satellite-streets-v12', color: 'bg-green-900' },
  { name: 'Light', id: 'mapbox/light-v11', color: 'bg-gray-200' },
  { name: 'Street', id: 'mapbox/outdoors-v12', color: 'bg-green-200' }
];

// --- Onboarding Tour Data ---
const TOUR_STEPS = [
  {
    title: "Welcome to FixIt! 👋",
    content: "Join the movement to build better cities. FixIt empowers you to report civic issues.",
    action: "Start",
    placement: 'center'
  },
  {
    title: "Report an Issue 📸",
    content: "Tap here to snap a photo and report a problem. We'll capture your location automatically.",
    action: "Next",
    targetRefKey: 'reportBtn',
    placement: 'top'
  },
  {
    title: "Track Resolution ⏳",
    content: "Monitor the status of your reports from 'New' to 'Resolved' right here.",
    action: "Next",
    targetId: 'navbar-root',
    placement: 'bottom'
  },
  {
    title: "Community Impact 🗺️",
    content: "See what others are reporting on the map and upvote issues that matter.",
    action: "Next",
    targetId: 'map-root',
    placement: 'center'
  },
  {
    title: "Let's Fix It! 🚀",
    content: "Ready to make a difference? Your first report is just a click away.",
    action: "Report Issue",
    placement: 'center'
  }
];

// --- Custom Hook for Positioning ---
const useOnboardingTarget = (targetId, targetRef) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const updateRect = () => {
      let el = null;
      if (targetRef && targetRef.current) {
        el = targetRef.current;
      } else if (targetId) {
        el = document.getElementById(targetId);
      }

      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            bottom: r.bottom,
            right: r.right,
          });
        }
      } else {
        setRect(null);
      }
    };

    updateRect();

    const interval = setInterval(updateRect, 100);
    const timeout = setTimeout(() => clearInterval(interval), 1000);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetId, targetRef]);

  return rect;
};

// --- Onboarding Component ---
const OnboardingTour = ({ onComplete, targetRefs, setShowForm }) => {
  const [step, setStep] = useState(0);
  const currentStepData = TOUR_STEPS[step];

  const targetRef = currentStepData.targetRefKey ? targetRefs[currentStepData.targetRefKey] : null;
  const rect = useOnboardingTarget(currentStepData.targetId, targetRef);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
      if (currentStepData.action === "Report Issue") {
        setShowForm(true);
      }
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div className="fixed inset-0 z-[3000] pointer-events-none">
      {/* Dimmed Background (Only if no target, otherwise spotlight shadow handles it) */}
      {!rect && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500" />
      )}

      {/* Spotlight Box (Highlighting the target with massive shadow) */}
      {rect && (
        <motion.div
          layoutId="spotlight"
          initial={false}
          animate={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute border-2 border-[#FF671F] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none box-content"
        />
      )}

      {/* Centered Tooltip Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto bg-[#18181b] border border-[#27272a] p-6 rounded-2xl shadow-2xl flex flex-col gap-4 w-full max-w-sm relative z-[3002]"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">{currentStepData.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{currentStepData.content}</p>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-gray-500 hover:text-white transition-colors px-3 py-2"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-[#FF671F] to-[#FF8F50] text-black text-sm font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-[#FF671F]/20 transition-all flex items-center gap-2"
            >
              {currentStepData.action} <FaArrowRight size={12} />
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5 mt-1">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#FF671F]' : 'w-1.5 bg-gray-700'}`} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Style Helpers for Popups ---
const getSeverityColors = (severity) => {
  switch (severity) {
    case 'Critical': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#FCA5A5' };
    case 'High': return { bg: 'rgba(249, 115, 22, 0.1)', border: '#F97316', text: '#FDBA74' };
    case 'Medium': return { bg: 'rgba(234, 179, 8, 0.1)', border: '#EAB308', text: '#FDE047' };
    default: return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#86efac' };
  }
};

function Home() {
  const mapRef = useRef(null);
  const reportBtnRef = useRef(null);
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
  const [mapStyle, setMapStyle] = useState('mapbox/outdoors-v12');

  // Onboarding State
  const [showTour, setShowTour] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('fixit_has_seen_onboarding');
    if (!hasSeenOnboarding) {
      setShowTour(true);
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('fixit_has_seen_onboarding', 'true');
  };

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
      L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance);
      setMap(mapInstance);
    }
  }, []);

  // Update map style when mapStyle state changes
  useEffect(() => {
    if (map) loadMapboxStyle(map, mapStyle);
  }, [mapStyle, map]);

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

      const popupHtml = `
          <div class="muni-card" style="font-family: 'Inter', sans-serif; min-width: 240px; background: #09090b; border: 1px solid #27272a; border-radius: 0.5rem; overflow: hidden; color: white;">
            <div style="background: ${sevStyle.bg}; padding: 12px 16px; border-bottom: 1px solid ${sevStyle.border}; display: flex; justify-content: space-between; align-items: center;">
              <strong style="text-transform: uppercase; color: ${sevStyle.text}; font-size: 12px; letter-spacing: 0.05em; font-weight: 700;">${issue.type}</strong>
              <span style="font-size: 10px; background: #000; color: ${sevStyle.text}; padding: 4px 8px; border-radius: 9999px; border: 1px solid ${sevStyle.border}; font-weight: 600;">${issue.severity}</span>
            </div>
            <div style="padding: 16px;">
              ${issue.imageUrl ? `<div style="width: 100%; height: 120px; background-image: url('${getOptimizedImageUrl(issue.imageUrl, 300)}'); background-size: cover; background-position: center; border-radius: 0.375rem; margin-bottom: 12px; border: 1px solid #27272a;"></div>` : ''}
              <p style="margin: 0 0 12px; font-size: 13px; color: #a1a1aa; line-height: 1.5;">${issue.desc || 'No description provided.'}</p>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <a href="/report/${id}" target="_blank" style="flex: 1; text-align: center; background: #22c55e; color: #000; text-decoration: none; padding: 8px; border-radius: 0.375rem; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border: none;">View Details</a>
                  <button onclick="window.copyIssueId('${id}')" style="background: transparent; color: #a1a1aa; border: 1px solid #27272a; padding: 8px 12px; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s;">📋</button>
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

    let imageFile = formData.image;
    try {
      const options = {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      imageFile = await imageCompression(formData.image, options);
    } catch (error) {
      console.error("Image compression failed:", error);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const imgUrl = await uploadToCloudinary(imageFile);
          const { image: _unused, ...cleanData } = formData;

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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--muni-bg)] text-white font-sans">

      {/* --- THE MAP --- */}
      <div id="map-root" ref={mapRef} className="w-full h-full z-0" />

      {/* --- HUD: Navbar (Global) --- */}
      <Navbar />

      {/* --- Onboarding Tour --- */}
      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={handleTourComplete} targetRefs={{ reportBtn: reportBtnRef }} setShowForm={setShowForm} />}
      </AnimatePresence>

      {/* --- HUD: Floating Controls --- */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-4 md:bottom-24 md:right-6 z-[900] flex flex-col gap-4 items-end pointer-events-auto">

        {/* Style Switcher (Desktop Only) */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsStyleOpen(!isStyleOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all ${isStyleOpen ? 'bg-[var(--muni-accent)] text-black border-[var(--muni-accent)]' : 'bg-black/80 text-[var(--muni-text-muted)] border-[var(--muni-border)] hover:text-white'}`}
          >
            <FaLayerGroup />
          </motion.button>

          <AnimatePresence>
            {isStyleOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-2 right-14 bg-black/95 backdrop-blur-xl border border-[var(--muni-border)] rounded-2xl p-2 w-48 shadow-2xl"
              >
                <div className="text-[10px] font-bold text-[var(--muni-text-muted)] px-2 py-1 uppercase mb-1">Map Layers</div>
                <div className="space-y-1">
                  {MAP_STYLES.map(s => (
                    <button key={s.id} onClick={() => { setMapStyle(s.id); setIsStyleOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${mapStyle === s.id ? 'bg-[var(--muni-accent)]/20 text-[var(--muni-accent)]' : 'hover:bg-white/5 text-gray-300'}`}>
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
          className="w-12 h-12 rounded-full bg-black/80 text-white border border-[var(--muni-border)] flex items-center justify-center shadow-lg backdrop-blur-xl hover:bg-white/10 hover:text-[var(--muni-accent)] transition-colors"
        >
          <MdGpsFixed size={20} />
        </motion.button>

        {/* BIG REPORT BUTTON */}
        <motion.button
          ref={reportBtnRef}
          id="report-btn"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] text-black rounded-full shadow-[0_0_30px_rgba(4,106,56,0.4)] border border-white/20 backdrop-blur-md group"
        >
          <SiGoogledocs className="text-xl group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-wide hidden md:inline">REPORT ISSUE</span>
          <span className="font-bold tracking-wide md:hidden">REPORT</span>
        </motion.button>
      </div>

      {/* --- HUD: Branding (Top Left - Desktop Only) --- */}
      <div className="fixed top-28 left-8 z-[900] pointer-events-none hidden md:block">
        <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-[var(--muni-border)] px-5 py-3 rounded-2xl shadow-2xl">
          <div className="bg-[var(--muni-accent)] text-black p-2 rounded-lg"><FaTools /></div>
          <div>
            <div className="text-white font-black text-xl tracking-widest leading-none flex items-center gap-1">
              <span className="text-[#FF671F]">Lets</span><span className="text-white">Fix</span><span className="text-[#046A38]">India</span>
            </div>
            <div className="text-[10px] text-[var(--muni-accent)] font-mono uppercase tracking-widest">Community Ops</div>
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
              className="relative w-full h-[85vh] md:h-auto md:max-w-lg bg-[var(--muni-surface)] border-t md:border border-[var(--muni-border)] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--muni-border)] flex justify-between items-center bg-white/5 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaCrosshairs className="text-[var(--muni-accent)]" /> New Incident Report
                </h2>
                <button onClick={() => setShowForm(false)} className="text-[var(--muni-text-muted)] hover:text-white transition"><FaTimes /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Issue Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-black/50 border border-[var(--muni-border)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--muni-accent)] transition appearance-none"
                    >
                      <option>Pothole</option><option>Garbage</option><option>Water Leak</option><option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={e => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full bg-black/50 border border-[var(--muni-border)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--muni-accent)] transition appearance-none"
                    >
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Description</label>
                  <textarea
                    value={formData.desc}
                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full h-24 bg-black/50 border border-[var(--muni-border)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--muni-accent)] transition resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Evidence</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[var(--muni-border)] rounded-xl cursor-pointer hover:border-[var(--muni-accent)]/50 hover:bg-[var(--muni-accent)]/5 transition group">
                    <div className="flex flex-col items-center gap-2 text-[var(--muni-text-muted)] group-hover:text-[var(--muni-accent)]">
                      {formData.image ? <MdCheckCircle size={24} className="text-emerald-500" /> : <FaCamera size={24} />}
                      <span className="text-xs font-bold">{formData.image ? 'Photo Attached' : 'Upload Photo'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                  </label>
                </div>

                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] rounded-xl text-black font-bold shadow-lg shadow-[var(--muni-accent)]/20 hover:shadow-[var(--muni-accent)]/40 transition-all flex items-center justify-center gap-2 mt-4">
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
          <div className="w-12 h-12 border-4 border-[var(--muni-accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muni-accent)] font-bold tracking-widest text-xs uppercase">
            Submitting report...
          </p>
        </div>
      )}

      {/* --- CSS Overrides for Leaflet --- */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border: none !important; }
        .leaflet-popup-tip { display: none !important; }
        .leaflet-control-zoom { border: none !important; margin-bottom: 30px !important; margin-right: 30px !important; }
        .leaflet-control-zoom a { background-color: rgba(15, 23, 42, 0.9) !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px); border-radius: 8px !important; margin-bottom: 5px !important; }
        .leaflet-control-zoom a:hover { background-color: var(--muni-accent) !important; color: black !important; }
      `}</style>
    </div>
  );
}

export default Home;