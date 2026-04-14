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
import { Heart, Star, Map as MapIcon, LocateFixed, Send, ArrowRight, Flame, Ghost } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import MemoryCard from './MemoryCard';
import SpillMemoryModal from '../components/SpillMemoryModal';

// --- Configuration ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MAP_STYLES = [
  { name: 'Dark', id: 'mapbox://styles/mapbox/dark-v11', color: 'bg-gray-900' },
  { name: 'Satellite', id: 'mapbox://styles/mapbox/satellite-streets-v12', color: 'bg-green-900' },
  { name: 'Street', id: 'mapbox://styles/mapbox/streets-v12', color: 'bg-blue-100' }
];

// --- Onboarding Tour Data ---
const TOUR_STEPS = [
  {
    title: "Welcome to Spill It",
    content: "The world is a map of memories. Share yours anonymously with a photo and a story.",
    action: "Start",
    placement: 'center'
  },
  {
    title: "Spill a Memory",
    content: "Take a photo of where it happened and share what you felt. We'll pin it to the exact spot.",
    action: "Next",
    targetRefKey: 'reportBtn',
    placement: 'top'
  },
  {
    title: "Explore the Feed",
    content: "See real-time memories from around the world. Upvote the stories that touch you.",
    action: "Next",
    targetId: 'navbar-root',
    placement: 'bottom'
  },
  {
    title: "The Memory Map",
    content: "Wander through the map to discover hidden secrets and memories pinned by others.",
    action: "Next",
    targetId: 'map-root',
    placement: 'center'
  },
  {
    title: "Start Spilling",
    content: "Ready to leave your mark? Spill your first memory now.",
    action: "Spill Something",
    placement: 'center'
  }
];

// --- Onboarding Component ---
const OnboardingTour = ({ onComplete, targetRefs, setShowForm }) => {
  const [step, setStep] = useState(0);
  const currentStepData = TOUR_STEPS[step];

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto p-4">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="bg-[#0f0f13] border border-white/10 p-8 rounded-[32px] shadow-2xl flex flex-col gap-6 w-full max-w-sm relative z-[3002] text-center"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-3 heading-font">{currentStepData.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{currentStepData.content}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-white text-sm font-bold py-3.5 rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {currentStepData.action} <ArrowRight size={16} />
            </button>
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-slate-500 hover:text-white transition-colors py-2"
            >
              Skip
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#ff7ec9]' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function Home() {
  const reportBtnRef = useRef(null);
  const [allMemories, setAllMemories] = useState({});
  const [selectedMemory, setSelectedMemory] = useState(null);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');

  // Map state - Default to a wide view
  const [viewState, setViewState] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 2
  });

  // Onboarding State
  const [showTour, setShowTour] = useState(false);

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('spillit_has_seen_onboarding');
    if (!hasSeenOnboarding) {
      setShowTour(true);
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('spillit_has_seen_onboarding', 'true');
  };

  // --- Data & Markers ---
  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('ts', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const memories = {};
      snap.forEach(d => memories[d.id] = { id: d.id, ...d.data() });
      setAllMemories(memories);
    });
    return () => unsubscribe();
  }, []);

  const handleReportSuccess = (data) => {
    setSummaryData(data);
    setShowSummary(true);
  };

  const memoriesArray = useMemo(
    () =>
      Object.entries(allMemories)
        .map(([id, memory]) => ({ id, ...memory }))
        .sort((a, b) => (b.ts?.toMillis?.() || 0) - (a.ts?.toMillis?.() || 0)),
    [allMemories]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--spillit-bg)] text-white font-sans">
      
      {/* --- HERO OVERLAY --- */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-5 absolute top-24 left-8 z-[850] max-w-md">
        {/* Main hero card – solid dark bg so it actually reads */}
        <div className="bg-[#08080c]/90 backdrop-blur-xl rounded-3xl px-8 py-8 shadow-2xl border border-[#ff7ec9]/20 ring-1 ring-white/5">
          {/* Brand pill */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7ec9]/20 to-[#a78bfa]/20 border border-[#ff7ec9]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff7ec9] to-[#a78bfa] flex items-center justify-center">
              <Heart size={11} className="text-white fill-current" />
            </div>
            <span className="text-[11px] font-black tracking-[0.2em] text-[#ff7ec9] uppercase">Spill It</span>
          </div>

          <h1 className="heading-font text-5xl leading-[1.1] tracking-tight font-black mb-4 text-white">
            Every place<br />
            holds a{' '}
            <span className="bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] bg-clip-text text-transparent">
              secret.
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Pin your anonymous memory to the exact spot it happened. No names. No judgement. Just the truth.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#08080c]/90 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest font-black text-[#ff7ec9]">Memories</p>
            <p className="text-4xl font-black text-white tabular-nums">
              {memoriesArray.length > 0 ? memoriesArray.length.toLocaleString() : '—'}
            </p>
          </div>
          <div className="bg-[#08080c]/90 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest font-black text-[#a78bfa]">Locations</p>
            <p className="text-4xl font-black text-white tabular-nums">
              {(() => {
                const count = new Set(memoriesArray.map(i => i.address || '').filter(Boolean).map(a => a.split(',').pop()?.trim())).size;
                return count > 0 ? count.toLocaleString() : '—';
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* --- LIVE FEED PANEL --- */}
      <div className="hidden xl:block pointer-events-none absolute inset-y-24 right-8 z-[860] w-80">
        <div className="bg-[#08080c]/90 backdrop-blur-xl h-full flex flex-col overflow-hidden border border-[#ff7ec9]/20 ring-1 ring-white/5 rounded-3xl shadow-2xl">
          <div className="px-6 py-5 border-b border-white/10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff7ec9] animate-pulse" />
              <p className="heading-font text-[11px] uppercase tracking-[0.2em] font-black text-[#ff7ec9]">Live Spills</p>
            </div>
            <p className="text-[10px] text-slate-500">Real stories, real places, real people.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
            {memoriesArray.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#ff7ec9]/20 to-[#a78bfa]/20 border border-[#ff7ec9]/20 flex items-center justify-center">
                  <Ghost size={28} className="text-[#ff7ec9]/60" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">No spills yet</p>
                  <p className="text-slate-500 text-xs leading-relaxed">Be the first to leave<br />a memory on the map.</p>
                </div>
              </div>
            )}
            {memoriesArray.slice(0, 15).map((memory, index) => (
              <Link key={memory.id} to={`/memory/${memory.id}`} className="block pointer-events-auto group">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] hover:border-[#ff7ec9]/30 hover:bg-white/[0.05] transition-all"
                >
                  {memory.imageUrl && (
                    <div className="relative h-32 w-full overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(memory.imageUrl, 400)}
                        alt="memory"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter">
                        {memory.vibe || 'Memory'}
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic">
                      &quot;{memory.caption || memory.desc || 'A silent memory...'}&quot;
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <MapIcon size={10} /> {memory.address?.split(',')[0] || 'A secret spot'}
                      </div>
                      <div className="flex items-center gap-1 text-[#ff7ec9]">
                        <Heart size={10} className="fill-current" /> {memory.upvotes || 0}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
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

          {memoriesArray.map((memory) => (
            <Marker
              key={memory.id}
              latitude={Number(memory.lat)}
              longitude={Number(memory.lng)}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedMemory(memory);
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.2 }}
                className="cursor-pointer"
              >
                <div role="img" aria-label="marker" className="relative group">
                   <div className="w-3 h-3 rounded-full bg-white shadow-lg border-2 border-[#ff7ec9]" />
                   <div className="absolute inset-0 rounded-full animate-ping bg-[#ff7ec9]/40" />
                </div>
              </motion.div>
            </Marker>
          ))}

          {selectedMemory && (
            <Popup
              latitude={Number(selectedMemory.lat)}
              longitude={Number(selectedMemory.lng)}
              anchor="bottom"
              onClose={() => setSelectedMemory(null)}
              closeButton={false}
              maxWidth="280px"
              className="memory-popup"
              offset={15}
            >
              <div className="glass-card bg-[#08080c] border border-white/10 overflow-hidden shadow-2xl p-0">
                {selectedMemory.imageUrl && (
                  <img src={getOptimizedImageUrl(selectedMemory.imageUrl, 300)} className="w-full h-32 object-cover border-b border-white/10" alt="memory" />
                )}
                <div className="p-4">
                  <p className="text-xs text-slate-300 mb-3 italic leading-relaxed">&quot;{selectedMemory.caption || selectedMemory.desc}&quot;</p>
                  <Link to={`/memory/${selectedMemory.id}`} className="block w-full text-center py-2 rounded-xl bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    See Memory
                  </Link>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* --- HUD CONTROLS --- */}
      <div className="fixed bottom-8 right-8 z-[900] flex flex-col gap-4 items-end pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
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
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-[#ff7ec9] shadow-2xl"
        >
          <LocateFixed size={20} />
        </motion.button>

        <motion.button
          ref={reportBtnRef}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-white rounded-full font-bold shadow-2xl shadow-pink-500/40 border border-white/20 heading-font uppercase tracking-widest text-sm"
        >
          <Flame size={20} />
          <span>Spill Something</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={handleTourComplete} targetRefs={{ reportBtn: reportBtnRef }} setShowForm={setShowForm} />}
      </AnimatePresence>

      <SpillMemoryModal show={showForm} onClose={() => setShowForm(false)} onSuccess={handleReportSuccess} />
      {showSummary && <MemoryCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      <style>{`
        .mapboxgl-popup-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .mapboxgl-popup-tip { border-top-color: rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  );
}

export default Home;