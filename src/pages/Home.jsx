import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { toast } from 'react-toastify';
import {
  Heart,
  LocateFixed,
  Flame,
  Ghost,
  Map as MapIcon,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { supabase } from '../utils/supabase';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import MemoryCard from './MemoryCard';
import SpillMemoryModal from '../components/SpillMemoryModal';

/* ─────────────────────────────────────────────────────────────────────────────
   Map overlay theme — explicit hex only. CSS custom properties (bg-card, etc.)
   do not resolve reliably over the Mapbox canvas.
   ───────────────────────────────────────────────────────────────────────────── */
const T = {
  ink: '#1E293B',
  muted: '#64748B',
  faint: '#94A3B8',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  accent: '#8B5CF6',
  love: '#F472B6',
  live: '#34D399',
  canvas: '#08080c',
  amber: '#D97706',
  secret: '#374151',
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? '';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DEFAULT_VIEW = { latitude: 25, longitude: 15, zoom: 2 };
const ONBOARDING_KEY = 'spillit_onboarded';
const MEMORY_LIMIT = 100;

const TYPE_COLORS = {
  Moment: T.accent,
  Crush: T.love,
  Secret: T.secret,
  Laugh: T.amber,
};

const panel = (extra = {}) => ({
  background: T.surface,
  border: `2px solid ${T.ink}`,
  borderRadius: 16,
  boxShadow: '4px 4px 0 #1E293B',
  ...extra,
});

const pill = (extra = {}) => ({
  background: T.surfaceSubtle,
  border: `2px solid ${T.ink}`,
  borderRadius: 999,
  boxShadow: '2px 2px 0 #1E293B',
  ...extra,
});

const btnPrimary = (extra = {}) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: T.accent,
  color: T.surface,
  borderRadius: 999,
  border: `2px solid ${T.ink}`,
  boxShadow: '4px 4px 0 #1E293B',
  fontFamily: 'inherit',
  cursor: 'pointer',
  ...extra,
});

const btnIcon = (size, extra = {}) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: T.surface,
  border: `2px solid ${T.ink}`,
  boxShadow: '3px 3px 0 #1E293B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  ...extra,
});

const clampLines = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

/* ── Utilities ── */
const isValidCoord = (lat, lng) => {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && !(a === 0 && b === 0);
};

const uniqueCityCount = (memories) =>
  new Set(
    memories
      .map((m) => m.address?.split(',').pop()?.trim())
      .filter(Boolean),
  ).size;

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const recordsToMap = (rows) =>
  Object.fromEntries((rows ?? []).map((row) => [row.id, row]));

/* ── Map pin ── */
const MemoryPin = ({ memory, onClick, isSelected }) => {
  const color = TYPE_COLORS[memory.type] ?? T.accent;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${memory.type || 'Memory'} at ${memory.address || 'unknown location'}`}
      aria-pressed={isSelected}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
    >
      <div style={{ position: 'relative', width: 40, height: 52 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: isSelected ? 52 : 42,
            height: isSelected ? 52 : 42,
            borderRadius: '50%',
            background: color,
            opacity: isSelected ? 0.25 : 0.15,
            transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease',
          }}
        />
        <svg
          width="40"
          height="52"
          viewBox="0 0 40 52"
          fill="none"
          aria-hidden
          style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        >
          <path d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z" fill="white" />
          <path d="M20 3C11.16 3 4 10.16 4 19C4 30 20 49 20 49C20 49 36 30 36 19C36 10.16 28.84 3 20 3Z" fill={color} />
          <path
            d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z"
            fill="none"
            stroke={T.ink}
            strokeWidth="2"
          />
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.95" />
          <circle cx="20" cy="18" r="4" fill={color} opacity="0.6" />
        </svg>
      </div>
    </button>
  );
};

/* ── Onboarding ── */
const TOUR_STEPS = [
  {
    title: 'Welcome to Spill It',
    content: 'The world is a map of memories. Drop yours anonymously — no account required.',
    action: 'Start',
  },
  {
    title: 'Spill a Memory',
    content: 'Snap a photo where it happened, pin the spot, and say what you felt.',
    action: 'Next',
  },
  {
    title: 'Explore the Map',
    content: 'Every pin is a real story. Tap one to read what happened there.',
    action: 'Next',
  },
  {
    title: 'Your Turn',
    content: 'Ready to leave your mark? Spill your first memory now.',
    action: 'Spill Something',
  },
];

const OnboardingTour = ({ onComplete, onSpill }) => {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const advance = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    onComplete();
    onSpill();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="tour-title">
      <button
        type="button"
        aria-label="Dismiss tour"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onComplete}
      />
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={panel()}
        className="p-8 w-full max-w-sm relative z-10 text-center"
      >
        <h3 id="tour-title" className="heading-font text-2xl font-bold mb-3" style={{ color: T.ink }}>
          {current.title}
        </h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: T.muted }}>
          {current.content}
        </p>
        <button type="button" onClick={advance} className="home-btn-primary w-full py-3.5 heading-font font-bold uppercase tracking-widest text-sm">
          {current.action}
        </button>
        <button type="button" onClick={onComplete} className="mt-3 text-xs py-2 block w-full" style={{ color: T.muted }}>
          Skip intro
        </button>
        <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Tour progress">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={i === step}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 8,
                background: i === step ? T.accent : T.border,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ── Shared feed pieces ── */
const LiveIndicator = () => (
  <span
    className="home-live-dot"
    style={{ width: 8, height: 8, borderRadius: '50%', background: T.live, display: 'inline-block' }}
  />
);

const FeedEmpty = ({ compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center gap-3 ${compact ? 'py-8' : 'py-12'}`}>
    <Ghost size={compact ? 32 : 36} color={T.faint} strokeWidth={1.5} />
    <div>
      <p style={{ fontSize: compact ? 12 : 14, color: T.ink, fontWeight: 600 }}>No spills yet</p>
      <p style={{ fontSize: compact ? 11 : 12, color: T.muted, marginTop: 4 }}>Be the first to pin a memory.</p>
    </div>
  </div>
);

const FeedCard = ({ memory, variant = 'desktop', onNavigate }) => {
  const caption = memory.caption?.trim() || 'A silent memory…';
  const type = memory.type || 'Moment';
  const upvotes = memory.upvotes ?? 0;
  const when = timeAgo(memory.created_at);

  const inner = variant === 'mobile' ? (
    <div className="home-feed-card" style={{ display: 'flex', gap: 12, padding: 12, background: T.surfaceMuted }}>
      {memory.image_url && (
        <img
          src={getOptimizedImageUrl(memory.image_url, 120)}
          alt=""
          loading="lazy"
          style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: `2px solid ${T.border}`, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>
            {type}
          </span>
          {when && <span style={{ fontSize: 9, color: T.faint }}>{when}</span>}
        </div>
        <p style={{ fontSize: 12, color: T.ink, fontStyle: 'italic', marginTop: 2, ...clampLines }}>
          &ldquo;{caption}&rdquo;
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9, color: T.love }}>
          <Heart size={9} fill={T.love} aria-hidden /> {upvotes}
        </div>
      </div>
    </div>
  ) : (
    <>
      {memory.image_url && (
        <div style={{ height: 96, overflow: 'hidden', borderBottom: `1px solid ${T.border}` }}>
          <img
            src={getOptimizedImageUrl(memory.image_url, 300)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-3">
        <p style={{ fontSize: 11, color: T.ink, fontStyle: 'italic', marginBottom: 6, ...clampLines }}>
          &ldquo;{caption}&rdquo;
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{type}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {when && <span style={{ fontSize: 9, color: T.faint }}>{when}</span>}
            <span style={{ fontSize: 9, color: T.love, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Heart size={9} fill={T.love} aria-hidden /> {upvotes}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Link
      to={`/memory/${memory.id}`}
      onClick={onNavigate}
      className="block pointer-events-auto group"
      aria-label={`Read ${type} memory: ${caption.slice(0, 40)}`}
    >
      <div className="home-feed-card" style={{ borderRadius: 12, overflow: 'hidden', background: variant === 'desktop' ? T.surfaceMuted : undefined }}>
        {inner}
      </div>
    </Link>
  );
};

const LiveFeedHeader = ({ onClose, showClose = false }) => (
  <div style={{ padding: showClose ? '8px 16px 10px' : '16px 20px', borderBottom: `2px solid ${T.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <LiveIndicator />
          <p className="heading-font" style={{ fontSize: showClose ? 13 : 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.ink }}>
            Live Spills
          </p>
        </div>
        <p style={{ fontSize: 10, color: T.muted }}>Real stories, real places.</p>
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close live feed"
          style={btnIcon(32, { background: T.surfaceSubtle, boxShadow: '2px 2px 0 #1E293B' })}
        >
          <ChevronUp size={14} color={T.ink} strokeWidth={2.5} />
        </button>
      )}
    </div>
  </div>
);

const BrandBadge = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div
      style={pill({
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 6 : 8,
        padding: isSm ? '4px 12px' : '6px 14px',
        background: isSm ? T.surface : T.surfaceSubtle,
      })}
    >
      <Flame size={isSm ? 11 : 12} color={T.accent} strokeWidth={3} aria-hidden />
      <span
        className="heading-font"
        style={{
          fontSize: isSm ? 10 : 12,
          fontWeight: 900,
          letterSpacing: isSm ? '0.15em' : '0.08em',
          color: T.ink,
          textTransform: 'uppercase',
        }}
      >
        Spill It
      </span>
    </div>
  );
};

const MapUnavailable = () => (
  <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: T.canvas }}>
    <div style={panel({ maxWidth: 360, padding: '32px 28px', textAlign: 'center' })}>
      <AlertCircle size={32} color={T.accent} className="mx-auto mb-4" strokeWidth={2} />
      <h2 className="heading-font text-xl font-bold mb-2" style={{ color: T.ink }}>Map unavailable</h2>
      <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
        Add a Mapbox token to <code className="text-xs px-1 py-0.5 rounded" style={{ background: T.surfaceSubtle }}>VITE_MAPBOX_TOKEN</code> to enable the map.
      </p>
    </div>
  </div>
);

/* ── Main page ── */
function Home() {
  const [allMemories, setAllMemories] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const [locating, setLocating] = useState(false);

  const memories = useMemo(
    () => Object.values(allMemories).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [allMemories],
  );

  const cityCount = useMemo(() => uniqueCityCount(memories), [memories]);
  const feedSlice = useMemo(() => memories.slice(0, 20), [memories]);
  const mobileFeedSlice = useMemo(() => memories.slice(0, 30), [memories]);

  const completeTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  }, []);

  const openSpillForm = useCallback(() => setShowForm(true), []);

  const handleMapClick = useCallback(() => setSelectedMemory(null), []);

  const flyToUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.info('Location isn\u2019t supported on this device.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setViewState((v) => ({
          ...v,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          zoom: Math.min(Math.max(v.zoom, 10), 12),
          transitionDuration: 1200,
        }));
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Enable it in your browser settings.'
            : 'Couldn\u2019t find your location. Try again in a moment.';
        toast.warn(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) setShowTour(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadMemories = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MEMORY_LIMIT);

      if (!active) return;

      if (error) {
        console.error('[Home] Failed to load memories:', error.message);
        toast.error('Couldn\u2019t load memories. Try refreshing.');
      } else if (data) {
        setAllMemories(recordsToMap(data));
      }
      setLoading(false);
    };

    loadMemories();

    const channel = supabase
      .channel('home:memories')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setAllMemories((prev) => {
            const next = { ...prev };
            delete next[payload.old.id];
            return next;
          });
          setSelectedMemory((cur) => (cur?.id === payload.old.id ? null : cur));
        } else {
          setAllMemories((prev) => ({ ...prev, [payload.new.id]: payload.new }));
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!showFeed) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowFeed(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFeed]);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: T.canvas }}>

      {/* Desktop hero */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-4 absolute top-20 left-6 z-[850] max-w-xs">
        <div style={panel({ padding: '24px 24px' })}>
          <div style={{ marginBottom: 16 }}>
            <BrandBadge />
          </div>
          <h1 className="heading-font" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, color: T.ink, marginBottom: 8 }}>
            Every place holds a <span style={{ color: T.accent, fontStyle: 'italic' }}>secret.</span>
          </h1>
          <p style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>
            Drop a photo. Pin the spot. Stay anonymous.
          </p>
          {(loading || memories.length > 0) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${T.border}`, display: 'flex', gap: 24 }}>
              <div>
                <p className="heading-font" style={{ fontSize: 24, fontWeight: 900, color: T.ink }}>
                  {loading ? '—' : memories.length}
                </p>
                <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spills</p>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div>
                <p className="heading-font" style={{ fontSize: 24, fontWeight: 900, color: T.ink }}>
                  {loading ? '—' : cityCount}
                </p>
                <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop live feed */}
      <div className="hidden xl:flex pointer-events-none absolute top-20 bottom-6 right-6 z-[850] w-72 flex-col">
        <div style={panel()} className="h-full flex flex-col overflow-hidden">
          <LiveFeedHeader />
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="space-y-3" aria-busy aria-label="Loading memories">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="home-skeleton" style={{ height: 120, borderRadius: 12 }} />
                ))}
              </div>
            ) : memories.length === 0 ? (
              <FeedEmpty compact />
            ) : (
              feedSlice.map((m) => <FeedCard key={m.id} memory={m} variant="desktop" />)
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div id="map-root" className="absolute inset-0">
        {!MAPBOX_TOKEN ? (
          <MapUnavailable />
        ) : (
          <Map
            {...viewState}
            onMove={(e) => setViewState(e.viewState)}
            onClick={handleMapClick}
            mapStyle={MAP_STYLE}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            reuseMaps
            attributionControl
          >
            <NavigationControl position="bottom-left" showCompass={false} />

            {memories.map((m) => {
              if (!isValidCoord(m.lat, m.lng)) return null;
              const lat = Number(m.lat);
              const lng = Number(m.lng);
              const selected = selectedMemory?.id === m.id;

              return (
                <Marker
                  key={m.id}
                  latitude={lat}
                  longitude={lng}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedMemory(m);
                  }}
                >
                  <MemoryPin
                    memory={m}
                    isSelected={selected}
                    onClick={() => setSelectedMemory(m)}
                  />
                </Marker>
              );
            })}

            {selectedMemory && isValidCoord(selectedMemory.lat, selectedMemory.lng) && (
              <Popup
                latitude={Number(selectedMemory.lat)}
                longitude={Number(selectedMemory.lng)}
                anchor="bottom"
                offset={48}
                onClose={() => setSelectedMemory(null)}
                closeButton={false}
                maxWidth="260px"
              >
                <div style={{ ...panel({ borderRadius: 12 }), overflow: 'hidden' }}>
                  {selectedMemory.image_url && (
                    <img
                      src={getOptimizedImageUrl(selectedMemory.image_url, 300)}
                      style={{ width: '100%', height: 112, objectFit: 'cover', borderBottom: `2px solid ${T.ink}`, display: 'block' }}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="p-3">
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, display: 'block', marginBottom: 4 }}>
                      {selectedMemory.type || 'Moment'}
                    </span>
                    <p style={{ fontSize: 12, color: T.ink, fontStyle: 'italic', marginBottom: 10, ...clampLines }}>
                      &ldquo;{selectedMemory.caption?.trim() || '…'}&rdquo;
                    </p>
                    <Link
                      to={`/memory/${selectedMemory.id}`}
                      className="home-btn-primary"
                      style={{ display: 'block', textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '2px 2px 0 #1E293B' }}
                    >
                      See Memory
                    </Link>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden absolute top-16 left-0 right-0 z-[840] px-4 pt-2 flex items-center justify-between gap-3 pointer-events-none">
        <div style={pill({ display: 'flex', alignItems: 'center', gap: 8, background: T.surface })} className="pointer-events-auto">
          <Flame size={12} color={T.accent} strokeWidth={3} aria-hidden />
          <span className="heading-font" style={{ fontSize: 12, fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {loading ? '…' : `${memories.length} Spills`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowFeed(true)}
          style={pill({ display: 'flex', alignItems: 'center', gap: 8, background: T.surface })}
          className="pointer-events-auto"
          aria-expanded={showFeed}
          aria-controls="mobile-live-feed"
        >
          <MapIcon size={12} color={T.ink} strokeWidth={2.5} aria-hidden />
          <span className="heading-font" style={{ fontSize: 12, fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Live Feed
          </span>
        </button>
      </div>

      {/* Mobile bottom bar */}
      <div
        className="lg:hidden fixed inset-x-0 z-[900] flex items-center gap-3 px-4 py-3 pointer-events-auto"
        style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', background: T.surface, borderTop: `2px solid ${T.ink}` }}
      >
        <button
          type="button"
          onClick={flyToUser}
          disabled={locating}
          aria-label={locating ? 'Finding your location' : 'Locate me on map'}
          style={btnIcon(56, { background: T.surfaceSubtle, opacity: locating ? 0.6 : 1 })}
        >
          <LocateFixed size={22} color={T.accent} strokeWidth={2.5} className={locating ? 'animate-pulse' : ''} />
        </button>
        <button
          type="button"
          onClick={openSpillForm}
          className="home-btn-primary heading-font font-bold uppercase tracking-widest text-base"
          style={btnPrimary({ flex: 1, padding: '14px 0', boxShadow: '3px 3px 0 #1E293B' })}
        >
          <Flame size={22} strokeWidth={2.5} aria-hidden />
          Spill Something
        </button>
      </div>

      {/* Desktop HUD */}
      <div
        className="hidden lg:flex fixed z-[900] flex-col items-end gap-3 pointer-events-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', right: 24 }}
      >
        <button
          type="button"
          onClick={flyToUser}
          disabled={locating}
          aria-label={locating ? 'Finding your location' : 'Locate me on map'}
          style={btnIcon(48, { opacity: locating ? 0.6 : 1 })}
        >
          <LocateFixed size={20} color={T.accent} strokeWidth={2.5} className={locating ? 'animate-pulse' : ''} />
        </button>
        <button
          type="button"
          onClick={openSpillForm}
          className="home-btn-primary heading-font font-bold uppercase tracking-widest text-sm"
          style={btnPrimary({ padding: '14px 28px' })}
        >
          <Flame size={18} strokeWidth={2.5} aria-hidden />
          Spill Something
        </button>
      </div>

      {/* Mobile feed sheet */}
      <AnimatePresence>
        {showFeed && (
          <>
          <motion.button
            type="button"
            aria-label="Close live feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="xl:hidden fixed inset-0 z-[940] bg-black/40"
            onClick={() => setShowFeed(false)}
          />
          <motion.div
            id="mobile-live-feed"
            role="dialog"
            aria-modal
            aria-label="Live spills feed"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
              maxHeight: '60dvh',
              background: T.surface,
              borderTop: `2px solid ${T.ink}`,
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 -4px 0 #1E293B',
              zIndex: 950,
            }}
            className="xl:hidden flex flex-col"
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border }} aria-hidden />
            </div>
            <LiveFeedHeader showClose onClose={() => setShowFeed(false)} />
            <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar flex-1">
              {loading ? (
                <div className="space-y-3" aria-busy>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="home-skeleton" style={{ height: 88, borderRadius: 12 }} />
                  ))}
                </div>
              ) : memories.length === 0 ? (
                <FeedEmpty />
              ) : (
                mobileFeedSlice.map((m) => (
                  <FeedCard key={m.id} memory={m} variant="mobile" onNavigate={() => setShowFeed(false)} />
                ))
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={completeTour} onSpill={openSpillForm} />}
      </AnimatePresence>

      <SpillMemoryModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={(d) => {
          setSummaryData(d);
          setShowSummary(true);
          if (isValidCoord(d.lat, d.lng)) {
            setViewState((v) => ({
              ...v,
              latitude: Number(d.lat),
              longitude: Number(d.lng),
              zoom: Math.max(v.zoom, 13),
              transitionDuration: 1400,
            }));
          }
        }}
      />
      {showSummary && <MemoryCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      <style>{`
        .mapboxgl-popup-content { background:transparent !important; box-shadow:none !important; padding:0 !important; border:none !important; }
        .mapboxgl-popup-tip { border-top-color:${T.ink} !important; }
        .home-feed-card {
          border: 2px solid ${T.border};
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .home-feed-card:hover { border-color: ${T.ink}; }
        .home-btn-primary {
          background: ${T.accent};
          color: ${T.surface};
          border: 2px solid ${T.ink};
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .home-btn-primary:hover { transform: translate(-1px, -1px); }
        .home-btn-primary:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #1E293B !important; }
        .home-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .home-skeleton {
          background: linear-gradient(90deg, ${T.surfaceSubtle} 25%, ${T.border} 50%, ${T.surfaceSubtle} 75%);
          background-size: 200% 100%;
          animation: home-shimmer 1.4s ease-in-out infinite;
        }
        .home-live-dot { animation: home-pulse 2s ease-in-out infinite; }
        @keyframes home-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes home-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-skeleton { animation: none; background: ${T.surfaceSubtle}; }
          .home-live-dot { animation: none; }
          .home-btn-primary:hover, .home-btn-primary:active { transform: none; }
        }
      `}</style>
    </div>
  );
}

export default Home;
