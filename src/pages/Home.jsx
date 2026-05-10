import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Heart, Map as MapIcon, LocateFixed, ArrowRight, Flame, Ghost } from 'lucide-react';
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
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');

  // Map state - Start over Europe/Asia at zoom 3 so actual landmass is visible
  const [viewState, setViewState] = useState({
    latitude: 30,
    longitude: 20,
    zoom: 2.5
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
    // 1. Initial fetch
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        const memoriesMap = {};
        data.forEach(m => memoriesMap[m.id] = m);
        setAllMemories(memoriesMap);
      }
    };

    fetchMemories();

    // 2. Real-time subscription
    const channel = supabase
      .channel('public:memories')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAllMemories(prev => ({ ...prev, [payload.new.id]: payload.new }));
        } else if (payload.eventType === 'UPDATE') {
          setAllMemories(prev => ({ ...prev, [payload.new.id]: payload.new }));
        } else if (payload.eventType === 'DELETE') {
          setAllMemories(prev => {
            const next = { ...prev };
            delete next[payload.old.id];
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReportSuccess = (data) => {
    setSummaryData(data);
    setShowSummary(true);
  };

  const memoriesArray = useMemo(
    () =>
      Object.entries(allMemories)
        .map(([id, memory]) => ({ id, ...memory }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [allMemories]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FFF5F9] text-foreground font-sans">
      
      {/* --- HERO OVERLAY --- */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-5 absolute top-24 left-8 z-[850] max-w-md">
        {/* Main hero card */}
        <div className="bg-white border-2 border-foreground rounded-[32px] px-7 py-7 shadow-pop">
          {/* Brand pill */}
          <div className="inline-flex items-center gap-2 bg-muted border-2 border-foreground rounded-full px-3.5 py-1.5 mb-5 shadow-pop">
            <Flame size={11} className="text-accent" strokeWidth={3} />
            <span className="text-[10px] font-black tracking-[0.2em] text-foreground uppercase">Spill It</span>
          </div>

          <h1 className="heading-font text-4xl leading-[1.1] tracking-tight font-black mb-3 text-foreground">
            Every place<br />
            holds a{' '}
            <span className="text-accent italic">
              secret.
            </span>
          </h1>

          <p className="text-slate-400 text-sm font-bold leading-relaxed">
            Drop a photo. Pin the spot. Stay anonymous.
          </p>

          {memoriesArray.length > 0 && (
            <div className="mt-5 pt-5 border-t-2 border-foreground flex items-center gap-6">
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{memoriesArray.length.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Spills</p>
              </div>
              <div className="w-px h-8 bg-foreground/10" />
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">
                  {new Set(memoriesArray.map(i => i.address?.split(',').pop()?.trim()).filter(Boolean)).size.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Cities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- LIVE FEED PANEL --- */}
      <div className="hidden xl:block pointer-events-none absolute inset-y-24 right-8 z-[860] w-80">
        <div className="bg-white h-full flex flex-col overflow-hidden border-2 border-foreground rounded-[32px] shadow-pop">
          <div className="px-6 py-5 border-b-2 border-foreground flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <p className="heading-font text-[11px] uppercase tracking-[0.2em] font-black text-foreground">Live Spills</p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Real stories, real places.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
            {memoriesArray.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-[24px] bg-muted border-2 border-foreground shadow-pop flex items-center justify-center">
                  <Ghost size={28} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-foreground font-black text-sm mb-1 uppercase tracking-tight">No spills yet</p>
                  <p className="text-slate-400 text-[10px] font-bold">Be the first to leave<br />a memory on the map.</p>
                </div>
              </div>
            )}
            {memoriesArray.slice(0, 15).map((memory, index) => (
              <Link key={memory.id} to={`/memory/${memory.id}`} className="block pointer-events-auto group">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-[24px] overflow-hidden border-2 border-foreground bg-white hover:bg-muted transition-all shadow-pop hover:-translate-x-1"
                >
                  {memory.image_url && (
                    <div className="relative h-32 w-full overflow-hidden border-b-2 border-foreground">
                      <img
                        src={getOptimizedImageUrl(memory.image_url, 400)}
                        alt="memory"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-white border-2 border-foreground text-[8px] font-black text-foreground uppercase tracking-tighter">
                        {memory.type || 'Memory'}
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-[11px] text-foreground font-bold line-clamp-2 leading-relaxed italic">
                      &quot;{memory.caption || memory.desc || 'A silent memory...'}&quot;
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-black uppercase">
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <MapIcon size={10} strokeWidth={3} /> {memory.address?.split(',')[0] || 'A secret spot'}
                      </div>
                      <div className="flex items-center gap-1 text-accent">
                        <Heart size={10} className="fill-current" strokeWidth={3} /> {memory.upvotes || 0}
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
          projection="mercator"
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
              <div className="bg-white border-2 border-foreground overflow-hidden shadow-pop p-0 rounded-[24px]">
                {selectedMemory.image_url && (
                  <img src={getOptimizedImageUrl(selectedMemory.image_url, 300)} className="w-full h-32 object-cover border-b-2 border-foreground" alt="memory" />
                )}
                <div className="p-4">
                  <p className="text-xs text-foreground font-bold mb-3 italic leading-relaxed">&quot;{selectedMemory.caption || selectedMemory.desc}&quot;</p>
                  <Link to={`/memory/${selectedMemory.id}`} className="block w-full text-center py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest border-2 border-foreground shadow-pop">
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
          className="w-12 h-12 rounded-full bg-white border-2 border-foreground flex items-center justify-center text-accent shadow-pop"
        >
          <LocateFixed size={20} strokeWidth={3} />
        </motion.button>

        <motion.button
          ref={reportBtnRef}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-accent text-white rounded-full font-black border-2 border-foreground heading-font uppercase tracking-widest text-sm shadow-pop hover:shadow-pop-hover hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <Flame size={20} strokeWidth={3} />
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