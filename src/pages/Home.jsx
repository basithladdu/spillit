import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  collection, onSnapshot,
  orderBy, query, limit
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Link } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- Icons ---
import {
  FaMap, FaChartBar, FaUsers, FaSignInAlt, FaSignOutAlt, FaTools,
  FaSearch, FaLayerGroup, FaTimes,
  FaStar, FaBars, FaArrowRight
} from 'react-icons/fa';
import { SiGoogledocs } from 'react-icons/si';
import { MdGpsFixed } from 'react-icons/md';

import ReportCard from './ReportCard';
import ReportIssueModal from '../components/ReportIssueModal';
import '../styles/municipal.css';

// --- Configuration ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';

const MAP_STYLES = [
  { name: 'Midnight', id: 'mapbox://styles/mapbox/navigation-night-v1', color: 'bg-blue-900' },
  { name: 'Dark', id: 'mapbox://styles/mapbox/dark-v11', color: 'bg-gray-900' },
  { name: 'Satellite', id: 'mapbox://styles/mapbox/satellite-streets-v12', color: 'bg-green-900' },
  { name: 'Light', id: 'mapbox://styles/mapbox/light-v11', color: 'bg-gray-200' },
  { name: 'Street', id: 'mapbox://styles/mapbox/outdoors-v12', color: 'bg-green-200' }
];

// --- Onboarding Tour Data ---
const TOUR_STEPS = [
  {
    title: "Welcome to Spill It 👋",
    content: "People everywhere can spill what’s broken around them with a photo and a message.",
    action: "Start",
    placement: 'center'
  },
  {
    title: "Post a Spill 📸",
    content: "Tap here to snap a photo and share what you see. We'll capture your location automatically.",
    action: "Next",
    targetRefKey: 'reportBtn',
    placement: 'top'
  },
  {
    title: "Watch the story ⏳",
    content: "Follow how spills move from reported to fixed over time.",
    action: "Next",
    targetId: 'navbar-root',
    placement: 'bottom'
  },
  {
    title: "See the map 🗺️",
    content: "Explore what others are spilling on the map and upvote what matters to you.",
    action: "Next",
    targetId: 'map-root',
    placement: 'center'
  },
  {
    title: "Spill it. Fix it. 🚀",
    content: "Your first spill is just a click away.",
    action: "Spill Something",
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
      if (currentStepData.action === "Spill Something") {
        setShowForm(true);
      }
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div className="fixed inset-0 z-[3000] pointer-events-none">
      {!rect && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500" />
      )}

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

  const reportBtnRef = useRef(null);
  const [allIssues, setAllIssues] = useState({});
  const [selectedIssue, setSelectedIssue] = useState(null);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/outdoors-v12');

  // Map state
  const [viewState, setViewState] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 4
  });

  // Onboarding State
  const [showTour, setShowTour] = useState(false);



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

  const handleReportSuccess = (data) => {
    setSummaryData(data);
    setShowSummary(true);
  };

  const getMarkerIcon = (severity) => {
    let color = 'green';
    if (severity === 'Medium') color = 'yellow';
    if (severity === 'High') color = 'orange';
    if (severity === 'Critical') color = 'red';
    return `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`;
  };

  const copyIssueId = (id) => {
    navigator.clipboard.writeText(id).then(() => alert('ID Copied!'));
  };

  const issuesArray = useMemo(
    () =>
      Object.entries(allIssues)
        .map(([id, issue]) => ({ id, ...issue }))
        .sort((a, b) => (b.ts?.toMillis?.() || 0) - (a.ts?.toMillis?.() || 0)),
    [allIssues]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--fixit-bg)] text-[var(--fixit-text-main)] font-sans">
      {/* --- HERO & FEED OVERLAY (Desktop) --- */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-4 absolute inset-y-24 left-8 z-[850] max-w-xl">
        <div className="glass-card rounded-3xl px-6 py-5 shadow-2xl border border-[var(--fixit-border)]/70">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--fixit-primary)]/15 flex items-center justify-center text-[var(--fixit-primary)]">
              <span className="heading-font text-xs tracking-[0.18em] uppercase">SI</span>
            </div>
            <div className="flex flex-col">
              <span className="heading-font text-xs tracking-[0.22em] text-[var(--fixit-text-muted)] uppercase">
                Spill It
              </span>
              <span className="text-[11px] text-[var(--fixit-text-muted)]">spillit.world</span>
            </div>
          </div>
          <h1 className="heading-font text-3xl leading-snug sm:text-4xl tracking-[0.08em]">
            The world has issues.
            <br />
            <span className="bg-gradient-to-r from-[var(--fixit-primary)] via-[#ffb347] to-[var(--fixit-secondary)] bg-clip-text text-transparent">
              Spill them. Fix them.
            </span>
          </h1>
          <p className="mt-3 text-sm text-[var(--fixit-text-muted)] max-w-md">
            Anyone, anywhere can spill what&apos;s broken with a photo and a short message.
          </p>
        </div>

        {/* Stats / Impact mini row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--fixit-text-muted)] mb-1 heading-font">
              Spills Dropped
            </p>
            <p className="text-2xl font-semibold text-[var(--fixit-primary)]">
              {issuesArray.length.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="glass-card rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--fixit-text-muted)] mb-1 heading-font">
              Cities Active
            </p>
            <p className="text-2xl font-semibold text-[var(--fixit-secondary)]">
              {new Set(issuesArray.map((i) => i.address || '').filter(Boolean).map((a) => a.split(',').pop()?.trim())).size || 0}
            </p>
          </div>
        </div>
      </div>

      {/* --- LIVE FEED PANEL (Right side on desktop) --- */}
      <div className="hidden xl:block pointer-events-none absolute inset-y-20 right-6 z-[860] w-80">
        <div className="glass-card rounded-3xl h-full flex flex-col border border-[var(--fixit-border)]/80 shadow-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-[var(--fixit-border)] flex items-center justify-between">
            <div>
              <p className="heading-font text-[10px] uppercase tracking-[0.22em] text-[var(--fixit-text-muted)]">
                Live Spills
              </p>
              <p className="text-xs text-[var(--fixit-text-muted)]">
                Masonry-style feed of what citizens spot.
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
            {issuesArray.slice(0, 24).map((issue, index) => {
              const status = (issue.status || 'new').toLowerCase();
              const statusConfig =
                status === 'resolved'
                  ? { label: 'Fixed', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' }
                  : status === 'in-progress'
                  ? { label: 'In Progress', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
                  : { label: 'Reported', color: 'bg-[var(--fixit-primary)]/15 text-[var(--fixit-primary)] border-[var(--fixit-primary)]/40' };

              return (
                <Link
                  key={issue.id}
                  to={`/report/${issue.id}`}
                  className="block pointer-events-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-2xl overflow-hidden border bg-white/2 hover:border-[var(--fixit-primary)]/60 hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all group"
                    style={{
                      borderColor: issue.colorChoice || 'var(--fixit-border)'
                    }}
                  >
                    {issue.imageUrl && (
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={getOptimizedImageUrl(issue.imageUrl, 320)}
                          alt={issue.type}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <span
                            className="px-2 py-1 rounded-full text-[10px] font-semibold bg-black/70 text-white border border-white/15"
                            style={{
                              borderColor: issue.colorChoice || 'rgba(255,255,255,0.25)'
                            }}
                          >
                            {issue.type || 'Issue'}
                          </span>
                        </div>
                        <span
                          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold border ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    )}
                    <div className="px-3 py-2.5 space-y-1.5">
                      {issue.audienceName && (
                        <p className="text-[10px] text-[var(--fixit-text-main)]/80 font-medium truncate">
                          To: {issue.audienceName}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--fixit-text-muted)] line-clamp-2">
                        {issue.desc || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[var(--fixit-text-muted)]">
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span className="truncate max-w-[120px]">
                            {issue.address || 'Unknown location'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👍</span>
                          <span>{issue.upvotes || 0}</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}

            {issuesArray.length === 0 && (
              <p className="text-[11px] text-[var(--fixit-text-muted)] text-center mt-8">
                No reports yet. Be the first to{" "}
                <span className="text-[var(--fixit-primary)]">spot it, post it, fix it.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- THE MAP --- */}
      <div id="map-root" className="w-full h-full">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="bottom-left" />
          <GeolocateControl position="bottom-left" />

          {Object.entries(allIssues)
            .filter(([, issue]) =>
              issue.lat !== undefined && issue.lat !== null && !isNaN(Number(issue.lat)) &&
              issue.lng !== undefined && issue.lng !== null && !isNaN(Number(issue.lng))
            )
            .map(([id, issue]) => (
              <Marker
                key={id}
                latitude={Number(issue.lat)}
                longitude={Number(issue.lng)}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedIssue({ id, ...issue });
                }}
              >
                <img
                  src={getMarkerIcon(issue.severity)}
                  alt={issue.severity}
                  style={{ width: 25, height: 41, cursor: 'pointer' }}
                />
              </Marker>
            ))}

          {selectedIssue && !isNaN(Number(selectedIssue.lat)) && !isNaN(Number(selectedIssue.lng)) && (
            <Popup
              latitude={Number(selectedIssue.lat)}
              longitude={Number(selectedIssue.lng)}
              anchor="top"
              onClose={() => setSelectedIssue(null)}
              closeButton={false}
              maxWidth="300px"
              className="custom-map-popup"
            >
              {(() => {
                const sevStyle = getSeverityColors(selectedIssue.severity);
                return (
                  <div className="muni-card" style={{ fontFamily: 'Inter, sans-serif', minWidth: '240px', background: '#09090b', border: '1px solid #27272a', borderRadius: '0.5rem', overflow: 'hidden', color: 'white' }}>
                    <div style={{ background: sevStyle.bg, padding: '12px 16px', borderBottom: `1px solid ${sevStyle.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ textTransform: 'uppercase', color: sevStyle.text, fontSize: '12px', letterSpacing: '0.05em', fontWeight: '700' }}>{selectedIssue.type}</strong>
                      <span style={{ fontSize: '10px', background: '#000', color: sevStyle.text, padding: '4px 8px', borderRadius: '9999px', border: `1px solid ${sevStyle.border}`, fontWeight: '600' }}>{selectedIssue.severity}</span>
                    </div>
                    <div style={{ padding: '16px' }}>
                      {selectedIssue.imageUrl && (
                        <div style={{ width: '100%', height: '120px', backgroundImage: `url('${getOptimizedImageUrl(selectedIssue.imageUrl, 300)}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '0.375rem', marginBottom: '12px', border: '1px solid #27272a' }}></div>
                      )}
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>{selectedIssue.desc || 'No description provided.'}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <a href={`/report/${selectedIssue.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', background: '#22c55e', color: '#000', textDecoration: 'none', padding: '8px', borderRadius: '0.375rem', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none' }}>View Details</a>
                        <button onClick={() => copyIssueId(selectedIssue.id)} style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '0.375rem', cursor: 'pointer' }}>📋</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Popup>
          )}
        </Map>
      </div>

      {/* --- Onboarding Tour --- */}
      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={handleTourComplete} targetRefs={{ reportBtn: reportBtnRef }} setShowForm={setShowForm} />}
      </AnimatePresence>

      {/* --- HUD: Floating Controls --- */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+3rem)] right-4 md:bottom-24 md:right-6 z-[900] flex flex-col gap-4 items-end pointer-events-auto">

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

        {/* Locate Me (Handled by GeolocateControl now, but keeping button for UI) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            navigator.geolocation.getCurrentPosition(pos => {
              setViewState({
                ...viewState,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                zoom: 16,
                transitionDuration: 1000
              });
            });
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/80 text-white border border-[var(--muni-border)] shadow-lg backdrop-blur-xl hover:bg-white/10 hover:text-[var(--muni-accent)] transition-colors"
        >
          <MdGpsFixed size={18} />
          <span className="font-bold text-sm hidden md:inline">Locate Me</span>
        </motion.button>

        {/* BIG SPILL BUTTON */}
        <motion.button
          ref={reportBtnRef}
          id="report-btn"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] text-black rounded-full shadow-[0_0_30px_rgba(4,106,56,0.4)] border border-white/20 backdrop-blur-md group"
        >
          <SiGoogledocs className="text-xl group-hover:rotate-12 transition-transform" />
          <span className="font-bold tracking-wide hidden md:inline">SPILL SOMETHING</span>
          <span className="font-bold tracking-wide md:hidden">SPILL</span>
        </motion.button>
      </div>

      {/* --- HUD: Branding (Top Left - Desktop Only) --- */}
      <div className="fixed top-28 left-8 z-[900] pointer-events-none hidden md:block">
        <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-[var(--muni-border)] px-5 py-3 rounded-2xl shadow-2xl">
          <div className="bg-[var(--fixit-primary)] text-black p-2 rounded-lg heading-font text-xs tracking-[0.18em] uppercase">
            SI
          </div>
          <div>
            <div className="heading-font text-white text-sm tracking-[0.3em] uppercase">
              Spill It
            </div>
            <div className="text-[10px] text-[var(--fixit-text-muted)] font-mono uppercase tracking-widest">
              Photo + message from anywhere
            </div>
          </div>
        </div>
      </div>

      {/* --- Modal: New Report Form --- */}
      <ReportIssueModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleReportSuccess}
      />

      {/* --- Success Modal --- */}
      {showSummary && <ReportCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      {/* --- CSS Overrides for Mapbox --- */}
      <style>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default Home;