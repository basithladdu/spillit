import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import L from "leaflet";
import {
  FaMapMarkerAlt, FaCalendarAlt, FaShareAlt, FaHeart, FaRegHeart,
  FaExclamationTriangle, FaHashtag, FaLayerGroup, FaArrowLeft, FaLock, FaTwitter
} from 'react-icons/fa';
import { MdCheckCircle, MdWarning, MdError, MdPending } from 'react-icons/md';

// --- Configuration & Helpers ---

const SEVERITY_CONFIG = {
  Critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', shadow: 'shadow-red-500/20', icon: MdError },
  High: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', shadow: 'shadow-orange-500/20', icon: MdWarning },
  Medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', shadow: 'shadow-yellow-400/20', icon: FaExclamationTriangle },
  Low: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', shadow: 'shadow-emerald-400/20', icon: MdCheckCircle },
  Default: { color: 'text-gray-400', bg: 'bg-gray-700/30', border: 'border-gray-600/30', shadow: 'shadow-gray-500/10', icon: FaLayerGroup }
};

const STATUS_CONFIG = {
  resolved: { color: 'text-[#046A38]', bg: 'bg-[#046A38]/20', label: 'Resolved' },
  'in-progress': { color: 'text-[#06038D]', bg: 'bg-[#06038D]/20', label: 'In Progress' },
  new: { color: 'text-[#FF671F]', bg: 'bg-[#FF671F]/20', label: 'Open Report' }
};

// --- Sub-Components ---

const InfoBlock = ({ label, value, icon, mono = false }) => (
  <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#FF671F]/30 transition-colors">
    <div className="flex items-center gap-2 text-[var(--muni-text-muted)] text-xs font-bold uppercase tracking-wider mb-1">
      {icon} <span>{label}</span>
    </div>
    <div className={`text-white ${mono ? 'font-mono text-sm' : 'text-base font-medium'}`}>
      {value}
    </div>
  </div>
);

function Report() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return setError(true);

    const fetchReport = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'issues', id));
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
          const upvotedList = JSON.parse(localStorage.getItem('upvotedReports')) || [];
          setIsUpvoted(upvotedList.includes(id));
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      }
      setLoading(false);
    };
    fetchReport();
  }, [id]);

  // --- Map Initialization ---
  useEffect(() => {
    if (report && !map && mapRef.current) {
      if (mapRef.current._leaflet_id) mapRef.current._leaflet_id = null;

      const mapInstance = L.map(mapRef.current, {
        zoomControl: false,
        dragging: !L.Browser.mobile,
        tap: !L.Browser.mobile
      }).setView([report.lat, report.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance);

      // Custom Marker Logic (simplified for theme)
      const markerColor = report.severity === 'Critical' ? 'red' : report.severity === 'High' ? 'orange' : report.severity === 'Medium' ? 'yellow' : 'green';
      const icon = L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      });

      L.marker([report.lat, report.lng], { icon }).addTo(mapInstance)
        .bindPopup(`<b style="color:black">${report.type}</b>`).openPopup();

      setMap(mapInstance);
    }
  }, [report, map]);

  // --- Handlers ---
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!'); // Replace with toast in production
  };

  const handleUpvote = async () => {
    if (!user) return setShowLoginModal(true);

    const issueRef = doc(db, 'issues', id);
    const upvotedList = JSON.parse(localStorage.getItem('upvotedReports')) || [];

    try {
      if (isUpvoted) {
        await updateDoc(issueRef, { upvotes: increment(-1) });
        setReport(p => ({ ...p, upvotes: (p.upvotes || 0) - 1 }));
        localStorage.setItem('upvotedReports', JSON.stringify(upvotedList.filter(rid => rid !== id)));
        setIsUpvoted(false);
      } else {
        await updateDoc(issueRef, { upvotes: increment(1) });
        setReport(p => ({ ...p, upvotes: (p.upvotes || 0) + 1 }));
        localStorage.setItem('upvotedReports', JSON.stringify([...upvotedList, id]));
        setIsUpvoted(true);
      }
    } catch (err) { console.error(err); }
  };

  // --- Render Logic ---
  if (loading) return (
    <div className="min-h-screen bg-[var(--muni-bg)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF671F]"></div>
    </div>
  );

  if (error || !report) return (
    <div className="min-h-screen bg-[var(--muni-bg)] flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-[var(--muni-text-muted)] mb-6">Report not found or deleted.</p>
      <Link to="/" className="px-6 py-2 bg-[#046A38] rounded-full hover:bg-[#046A38]/80 transition">Go Home</Link>
    </div>
  );

  const sevTheme = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.Default;
  const statTheme = STATUS_CONFIG[report.status] || STATUS_CONFIG.new;
  const SeverityIcon = sevTheme.icon;

  return (
    <div className="min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans selection:bg-[#FF671F]/30 pb-20">

      {/* --- Background Glow --- */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF671F]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 relative z-10">

        {/* --- Back Nav --- */}
        <Link to="/gallery" className="inline-flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#FF671F] transition-colors mb-6 group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Gallery
        </Link>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">

          {/* --- Left Column: Visuals --- */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Image Card */}
            <div className="bg-[var(--muni-surface)]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] opacity-50"></div>
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt="Evidence"
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center bg-black/40 text-[var(--muni-text-muted)]">No Image Provided</div>
              )}

              {/* Overlay Badge */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <FaHashtag className="text-[#FF671F]" />
                <span className="font-mono text-xs text-white">{report.id.substring(0, 8)}</span>
              </div>
            </div>

            {/* Map Card */}
            <div className="bg-[var(--muni-surface)]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg h-64 relative">
              <div ref={mapRef} className="w-full h-full z-0 filter brightness-[0.85] contrast-[1.1]" />
              <div className="absolute inset-0 pointer-events-none border-[3px] border-[var(--muni-surface)]/50 rounded-2xl z-10"></div>
            </div>
          </motion.div>

          {/* --- Right Column: Data --- */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Header Card */}
            <div className="bg-[var(--muni-surface)]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              {/* Decorative Severity Glow */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 ${sevTheme.bg.replace('/10', '')}`}></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${sevTheme.bg} ${sevTheme.color} ${sevTheme.border} flex items-center gap-1.5`}>
                      <SeverityIcon /> {report.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statTheme.bg} ${statTheme.color} border-transparent`}>
                      {statTheme.label}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white">{report.type}</h1>
                </div>

                {/* Upvote Big Button */}
                <button
                  onClick={handleUpvote}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${isUpvoted ? 'bg-[#FF671F]/10 border-[#FF671F] text-[#FF671F] shadow-[0_0_20px_rgba(255,103,31,0.3)]' : 'bg-white/5 border-white/10 text-[var(--muni-text-muted)] hover:border-[#FF671F]/50 hover:text-[#FF671F]'}`}
                >
                  {isUpvoted ? <FaHeart className="text-xl mb-1" /> : <FaRegHeart className="text-xl mb-1" />}
                  <span className="text-xs font-bold">{report.upvotes || 0}</span>
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 text-sm">
                  {report.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoBlock
                  icon={<FaMapMarkerAlt />} label="Coordinates" mono
                  value={`${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}
                />
                <InfoBlock
                  icon={<FaCalendarAlt />} label="Reported"
                  value={report.ts ? new Date(report.ts.toDate()).toLocaleDateString() : 'Unknown'}
                />
              </div>

              {/* Action Footer */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCopyUrl}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <FaShareAlt /> Copy Link
                </button>

                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Check out this issue on FixIt! @letsfixindia`);
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                  }}
                  className="flex-1 py-3 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white rounded-xl font-bold shadow-lg shadow-[#1DA1F2]/20 transition-all flex items-center justify-center gap-2"
                >
                  <FaTwitter /> Tweet This
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- Login Modal --- */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--muni-surface)] border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]"></div>
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--muni-text-muted)]">
                <FaLock size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Required</h2>
              <p className="text-[var(--muni-text-muted)] mb-6 text-sm">You must be logged in to vote on community issues.</p>

              <div className="space-y-3">
                <Link to="/login" className="block w-full py-3 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,103,31,0.3)] transition-all">
                  Login Now
                </Link>
                <button onClick={() => setShowLoginModal(false)} className="block w-full py-3 text-[var(--muni-text-muted)] hover:text-white transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Report;