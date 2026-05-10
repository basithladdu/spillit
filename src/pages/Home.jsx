import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Heart, LocateFixed, Flame, Ghost, Map as MapIcon, ChevronUp } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import MemoryCard from './MemoryCard';
import SpillMemoryModal from '../components/SpillMemoryModal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const TYPE_COLORS = {
  Moment: '#8B5CF6',
  Crush:  '#F472B6',
  Secret: '#374151',
  Laugh:  '#D97706',
};

/* ── Standalone map pin – no Framer Motion, no CSS transforms ── */
const MemoryPin = ({ memory, onClick, isSelected }) => {
  const color = TYPE_COLORS[memory.type] || '#8B5CF6';
  return (
    <button
      onClick={onClick}
      aria-label={`Memory: ${memory.caption || memory.type || 'Spill'}`}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
    >
      <div style={{ position: 'relative', width: 40, height: 52 }}>
        {/* Outer pulse ring (always visible for discoverability) */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: isSelected ? 52 : 42,
          height: isSelected ? 52 : 42,
          borderRadius: '50%',
          background: color,
          opacity: isSelected ? 0.25 : 0.15,
          transition: 'all 0.2s ease',
        }} />
        {/* Pin SVG */}
        <svg
          width="40" height="52"
          viewBox="0 0 40 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        >
          {/* White backing for contrast on any map */}
          <path
            d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z"
            fill="white"
          />
          {/* Colored fill */}
          <path
            d="M20 3C11.16 3 4 10.16 4 19C4 30 20 49 20 49C20 49 36 30 36 19C36 10.16 28.84 3 20 3Z"
            fill={color}
          />
          {/* Dark border */}
          <path
            d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z"
            fill="none"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* White inner dot */}
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.95" />
          {/* Colored inner dot center */}
          <circle cx="20" cy="18" r="4" fill={color} opacity="0.6" />
        </svg>
      </div>
    </button>
  );
};

/* ── Onboarding ── */
const TOUR_STEPS = [
  { title: 'Welcome to Spill It', content: 'The world is a map of memories. Share yours anonymously.', action: 'Start' },
  { title: 'Spill a Memory', content: 'Take a photo of where it happened and share what you felt.', action: 'Next' },
  { title: 'Explore the Map', content: 'Tap any pin to read what happened there.', action: 'Next' },
  { title: 'Start Spilling', content: 'Ready to leave your mark? Spill your first memory now.', action: 'Spill Something' },
];

const OnboardingTour = ({ onComplete, setShowForm }) => {
  const [step, setStep] = useState(0);
  const cur = TOUR_STEPS[step];
  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) { setStep(step + 1); return; }
    onComplete();
    if (cur.action === 'Spill Something') setShowForm(true);
  };
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-sm" onClick={onComplete} />
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card border-2 border-foreground rounded-2xl p-8 shadow-pop w-full max-w-sm relative z-10 text-center"
      >
        <h3 className="heading-font text-2xl font-bold text-foreground mb-3">{cur.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{cur.content}</p>
        <button
          onClick={handleNext}
          className="w-full bg-accent text-white border-2 border-foreground rounded-full py-3.5 font-bold heading-font uppercase tracking-widest text-sm shadow-pop hover:shadow-pop-hover"
        >
          {cur.action}
        </button>
        <button onClick={onComplete} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 block w-full">
          Skip
        </button>
        <div className="flex justify-center gap-2 mt-4">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-accent' : 'w-2 bg-border'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ── Main ── */
function Home() {
  const [allMemories, setAllMemories] = useState({});
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [showFeed, setShowFeed] = useState(false); // mobile feed sheet
  const [viewState, setViewState] = useState({ latitude: 25, longitude: 15, zoom: 2 });

  useEffect(() => {
    if (!localStorage.getItem('spillit_onboarded')) setShowTour(true);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        const map = {};
        data.forEach(m => { map[m.id] = m; });
        setAllMemories(map);
      }
    };
    fetch();
    const ch = supabase
      .channel('home:memories')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, p => {
        if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
          setAllMemories(prev => ({ ...prev, [p.new.id]: p.new }));
        } else if (p.eventType === 'DELETE') {
          setAllMemories(prev => { const n = { ...prev }; delete n[p.old.id]; return n; });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const memories = useMemo(() =>
    Object.values(allMemories).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [allMemories]
  );

  const flyToUser = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(p => {
      // Stay at current zoom if already close-in, otherwise zoom to 10
      // Never jump past zoom 12 — keeps surrounding markers visible
      setViewState(v => ({
        ...v,
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        zoom: Math.min(Math.max(v.zoom, 10), 12),
      }));
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#08080c]">

      {/* ── Desktop hero panel (top-left) ── */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-4 absolute top-20 left-6 z-[850] max-w-xs">
        <div className="bg-card border-2 border-foreground rounded-2xl px-6 py-6 shadow-pop">
          <div className="inline-flex items-center gap-2 bg-muted border-2 border-foreground rounded-full px-3 py-1 mb-4 shadow-pop">
            <Flame size={11} className="text-accent" strokeWidth={3} />
            <span className="heading-font text-[10px] font-bold tracking-widest text-foreground uppercase">Spill It</span>
          </div>
          <h1 className="heading-font text-3xl font-bold leading-tight text-foreground mb-2">
            Every place holds a <span className="text-accent italic">secret.</span>
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed">Drop a photo. Pin the spot. Stay anonymous.</p>
          {memories.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-border flex gap-6">
              <div>
                <p className="heading-font text-2xl font-bold text-foreground">{memories.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Spills</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="heading-font text-2xl font-bold text-foreground">
                  {new Set(memories.map(m => m.address?.split(',').pop()?.trim()).filter(Boolean)).size}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Cities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop live feed (right) ── */}
      <div className="hidden xl:flex pointer-events-none absolute top-20 bottom-6 right-6 z-[850] w-72 flex-col">
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-pop h-full flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-border shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-quaternary animate-pulse" />
              <p className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">Live Spills</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Real stories, real places.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
                <Ghost size={32} className="text-muted-foreground" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground">No spills yet. Be first!</p>
              </div>
            ) : memories.slice(0, 20).map((m, i) => (
              <Link key={m.id} to={`/memory/${m.id}`} className="block pointer-events-auto group">
                <div className="rounded-xl border-2 border-border hover:border-foreground bg-muted hover:bg-card transition-all overflow-hidden">
                  {m.image_url && (
                    <div className="h-24 overflow-hidden border-b border-border">
                      <img src={getOptimizedImageUrl(m.image_url, 300)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-foreground font-medium line-clamp-2 italic mb-1.5">
                      "{m.caption || 'A silent memory...'}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{m.type || 'Moment'}</span>
                      <span className="text-[9px] text-secondary flex items-center gap-1">
                        <Heart size={9} className="fill-current" /> {m.upvotes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── THE MAP ── */}
      <div id="map-root" className="absolute inset-0">
        <Map
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="bottom-left" showCompass={false} />

          {memories.map(m => {
            const lat = Number(m.lat);
            const lng = Number(m.lng);
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
            return (
              <Marker
                key={m.id}
                latitude={lat}
                longitude={lng}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedMemory(m); }}
              >
                <MemoryPin
                  memory={m}
                  isSelected={selectedMemory?.id === m.id}
                  onClick={() => setSelectedMemory(m)}
                />
              </Marker>
            );
          })}

          {selectedMemory && (
            <Popup
              latitude={Number(selectedMemory.lat)}
              longitude={Number(selectedMemory.lng)}
              anchor="bottom"
              offset={48}
              onClose={() => setSelectedMemory(null)}
              closeButton={false}
              maxWidth="260px"
            >
              <div className="bg-card border-2 border-foreground rounded-xl overflow-hidden shadow-pop">
                {selectedMemory.image_url && (
                  <img
                    src={getOptimizedImageUrl(selectedMemory.image_url, 300)}
                    className="w-full h-28 object-cover border-b-2 border-foreground"
                    alt="memory"
                  />
                )}
                <div className="p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    {selectedMemory.type || 'Moment'}
                  </span>
                  <p className="text-xs text-foreground font-medium italic line-clamp-2 mb-3">
                    "{selectedMemory.caption || selectedMemory.desc || ''}"
                  </p>
                  <Link
                    to={`/memory/${selectedMemory.id}`}
                    className="block w-full text-center py-2 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest border-2 border-foreground shadow-pop"
                  >
                    See Memory
                  </Link>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ── Mobile top bar (spill count + feed) ── */}
      <div className="lg:hidden absolute top-16 left-0 right-0 z-[840] px-4 pt-2 flex items-center justify-between gap-3 pointer-events-none">
        <div className="bg-card border-2 border-foreground rounded-full px-4 py-2 shadow-pop flex items-center gap-2 pointer-events-auto">
          <Flame size={12} className="text-accent" strokeWidth={3} />
          <span className="heading-font text-xs font-bold text-foreground uppercase tracking-wide">
            {memories.length} Spills
          </span>
        </div>
        <button
          onClick={() => setShowFeed(true)}
          className="bg-card border-2 border-foreground rounded-full px-4 py-2 shadow-pop flex items-center gap-2 text-foreground pointer-events-auto"
        >
          <MapIcon size={12} strokeWidth={2.5} />
          <span className="heading-font text-xs font-bold uppercase tracking-wide">Live Feed</span>
        </button>
      </div>

      {/* ── MOBILE bottom action bar ── always visible, full-width, above safe area ── */}
      <div
        className="lg:hidden fixed inset-x-0 z-[900] flex items-center gap-3 px-4 py-3 bg-card border-t-2 border-foreground pointer-events-auto"
        style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Locate Me */}
        <button
          onClick={flyToUser}
          className="w-14 h-14 rounded-full bg-muted border-2 border-foreground flex items-center justify-center text-accent shadow-pop active:shadow-pop-active active:translate-x-0.5 active:translate-y-0.5 shrink-0"
          aria-label="Locate me"
        >
          <LocateFixed size={22} strokeWidth={2.5} />
        </button>

        {/* Spill CTA — takes remaining width */}
        <button
          onClick={() => setShowForm(true)}
          className="flex-1 flex items-center justify-center gap-3 py-4 bg-accent text-white rounded-full border-2 border-foreground heading-font font-bold uppercase tracking-widest text-base shadow-pop active:shadow-pop-active active:translate-x-0.5 active:translate-y-0.5"
        >
          <Flame size={22} strokeWidth={2.5} />
          Spill Something
        </button>
      </div>

      {/* ── DESKTOP HUD (bottom-right floating) ── */}
      <div
        className="hidden lg:flex fixed z-[900] flex-col items-end gap-3 pointer-events-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', right: 24 }}
      >
        <button
          onClick={flyToUser}
          className="w-12 h-12 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-accent shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-pop-active transition-all"
          aria-label="Locate me"
        >
          <LocateFixed size={20} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2.5 px-7 py-4 bg-accent text-white rounded-full border-2 border-foreground heading-font font-bold uppercase tracking-widest text-sm shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-pop-active transition-all"
        >
          <Flame size={18} strokeWidth={2.5} />
          Spill Something
        </button>
      </div>

      {/* ── Mobile feed bottom sheet ── */}
      <AnimatePresence>
        {showFeed && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 z-[950] bg-card border-t-2 border-foreground rounded-t-2xl shadow-pop xl:hidden"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
              maxHeight: '60dvh',
            }}
          >
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-quaternary animate-pulse" />
                <p className="heading-font text-sm font-bold uppercase tracking-widest text-foreground">Live Spills</p>
              </div>
              <button
                onClick={() => setShowFeed(false)}
                className="w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center text-foreground shadow-pop"
              >
                <ChevronUp size={14} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar" style={{ maxHeight: 'calc(70dvh - 80px)' }}>
              {memories.length === 0 ? (
                <div className="text-center py-12">
                  <Ghost size={32} className="text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">No spills yet. Be the first!</p>
                </div>
              ) : memories.slice(0, 30).map(m => (
                <Link key={m.id} to={`/memory/${m.id}`} onClick={() => setShowFeed(false)} className="block group">
                  <div className="rounded-xl border-2 border-border hover:border-foreground bg-muted hover:bg-background transition-all flex gap-3 p-3">
                    {m.image_url && (
                      <img src={getOptimizedImageUrl(m.image_url, 120)} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-border shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{m.type || 'Moment'}</span>
                      <p className="text-xs text-foreground font-medium italic line-clamp-2 mt-0.5">"{m.caption || 'A silent memory...'}"</p>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-secondary">
                        <Heart size={9} className="fill-current" /> {m.upvotes || 0}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showTour && (
          <OnboardingTour
            onComplete={() => { setShowTour(false); localStorage.setItem('spillit_onboarded', '1'); }}
            setShowForm={setShowForm}
          />
        )}
      </AnimatePresence>

      <SpillMemoryModal show={showForm} onClose={() => setShowForm(false)} onSuccess={d => { setSummaryData(d); setShowSummary(true); }} />
      {showSummary && <MemoryCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      <style>{`
        .mapboxgl-popup-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; border: none !important; }
        .mapboxgl-popup-tip { border-top-color: #1E293B !important; }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
      `}</style>
    </div>
  );
}

export default Home;
