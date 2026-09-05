import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

import { supabase } from '../utils/supabase';
import { getOptimizedImageSrcSet, getOptimizedImageUrl } from '../utils/imageOptimizer';
import { timeAgo, uniqueCityCount, isValidCoord } from '../utils/format';
import MemoryCard from './MemoryCard';
import SpillMemoryModal from '../components/SpillMemoryModal';

const HomeMap = lazy(() => import('../components/HomeMap'));

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

const DEFAULT_VIEW = { latitude: 25, longitude: 15, zoom: 2 };
const ONBOARDING_KEY = 'spillit_onboarded';
const MEMORY_LIMIT = 100;

const hasSeenOnboarding = () => {
  try { return localStorage.getItem(ONBOARDING_KEY) === '1'; } catch { return false; }
};

const rememberOnboarding = () => {
  try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* Storage unavailable. */ }
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
const recordsToMap = (rows) =>
  Object.fromEntries((rows ?? []).map((row) => [row.id, row]));

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
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    returnFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialog.querySelectorAll('button, a[href]')]
      .filter((element) => !element.disabled);
    focusable()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onComplete();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    };
  }, [onComplete]);

  const advance = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    onComplete();
    onSpill();
  };

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="tour-title">
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
        <div
          className="flex justify-center gap-2 mt-4"
          role="group"
          aria-label={`Tour progress: step ${step + 1} of ${TOUR_STEPS.length}`}
        >
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
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
const FeedEmpty = ({ compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center gap-3 ${compact ? 'py-8' : 'py-12'}`}>
    <Ghost size={compact ? 32 : 36} color={T.faint} strokeWidth={1.5} aria-hidden="true" />
    <div>
      <p style={{ fontSize: compact ? 12 : 14, color: T.ink, fontWeight: 600 }}>No spills yet</p>
      <p style={{ fontSize: compact ? 11 : 12, color: T.muted, marginTop: 4 }}>Be the first to pin a memory.</p>
    </div>
  </div>
);

const FeedUnavailable = ({ compact = false, onRetry }) => (
  <div className={`flex flex-col items-center justify-center text-center gap-3 ${compact ? 'py-8' : 'py-12'}`} role="alert" aria-live="assertive">
    <AlertCircle size={compact ? 30 : 36} color={T.accent} strokeWidth={1.5} aria-hidden />
    <div>
      <p style={{ fontSize: compact ? 12 : 14, color: T.ink, fontWeight: 600 }}>Archive unavailable</p>
      <p style={{ fontSize: compact ? 11 : 12, color: T.muted, marginTop: 4 }}>We couldn’t reach the memory service. Try refreshing.</p>
      <button
        type="button"
        onClick={onRetry}
        className="home-btn-primary mt-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ boxShadow: '2px 2px 0 #1E293B' }}
      >
        Try again
      </button>
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
          srcSet={getOptimizedImageSrcSet(memory.image_url, [120, 240])}
          sizes="64px"
          alt={`Memory photo: ${caption.slice(0, 80)}`}
          loading="lazy"
          decoding="async"
          width="64"
          height="64"
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
            srcSet={getOptimizedImageSrcSet(memory.image_url, [300, 600])}
            sizes="300px"
            alt={`Memory photo: ${caption.slice(0, 80)}`}
            loading="lazy"
            decoding="async"
            width="300"
            height="96"
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
          <p className="heading-font" style={{ fontSize: showClose ? 13 : 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.ink }}>
            Recent Spills
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

/* ── Main page ── */
function Home() {
  const [searchParams] = useSearchParams();
  const feedTriggerRef = useRef(null);
  const feedDialogRef = useRef(null);
  const feedReturnFocusRef = useRef(null);
  const [allMemories, setAllMemories] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [feedRetryCount, setFeedRetryCount] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState('');

  const memories = useMemo(
    () => Object.values(allMemories).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [allMemories],
  );

  const cityCount = useMemo(() => uniqueCityCount(memories), [memories]);
  const feedSlice = useMemo(() => memories.slice(0, 20), [memories]);
  const mobileFeedSlice = useMemo(() => memories.slice(0, 30), [memories]);

  const completeTour = useCallback(() => {
    setShowTour(false);
    rememberOnboarding();
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
    if (!hasSeenOnboarding()) setShowTour(true);
  }, []);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const memoryId = searchParams.get('memory');

    if (isValidCoord(lat, lng)) {
      setViewState((v) => ({
        ...v,
        latitude: Number(lat),
        longitude: Number(lng),
        zoom: Math.max(v.zoom, 14),
        transitionDuration: 1400,
      }));
    }

    if (memoryId && allMemories[memoryId]) {
      setSelectedMemory(allMemories[memoryId]);
    }
  }, [searchParams, allMemories]);

  useEffect(() => {
    const memoryId = searchParams.get('memory');
    if (!memoryId || allMemories[memoryId]) return undefined;

    let active = true;
    supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (data) {
          setAllMemories((prev) => ({ ...prev, [data.id]: data }));
          setSelectedMemory(data);
          return;
        }
        if (error?.code === 'PGRST116' || !error) {
          toast.info('That memory is no longer on the map.');
        }
      });

    return () => { active = false; };
  }, [searchParams, allMemories]);

  useEffect(() => {
    let active = true;
    let channel = null;

    const loadMemories = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MEMORY_LIMIT);

      if (!active) return;

      if (error) {
        setFeedError(true);
        console.error('[Home] Failed to load memories:', error.message);
        toast.error('Couldn\u2019t load memories. Try refreshing.');
      } else if (data) {
        setFeedError(false);
        setAllMemories(recordsToMap(data));
        channel = supabase
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
      }
      setLoading(false);
    };

    loadMemories();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [feedRetryCount]);

  useEffect(() => {
    if (!showFeed) return undefined;
    const dialog = feedDialogRef.current;
    if (!dialog) return undefined;

    feedReturnFocusRef.current = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll('button, a[href], input, select, textarea')]
      .filter((element) => !element.disabled);
    focusable()[0]?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowFeed(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      feedReturnFocusRef.current?.focus?.();
      feedReturnFocusRef.current = null;
    };
  }, [showFeed]);

  return (
    <main id="main-content" tabIndex="-1" className="relative w-full h-[100svh] overflow-hidden outline-none" style={{ background: T.canvas }}>

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
      <div className="hidden xl:flex pointer-events-auto absolute top-20 bottom-6 right-6 z-[850] w-72 flex-col">
        <div style={panel()} className="h-full flex flex-col overflow-hidden">
          <LiveFeedHeader />
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="space-y-3" role="status" aria-busy aria-label="Loading memories">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="home-skeleton" style={{ height: 120, borderRadius: 12 }} />
                ))}
              </div>
            ) : feedError ? (
              <FeedUnavailable compact onRetry={() => { setLoading(true); setFeedRetryCount((count) => count + 1); }} />
            ) : memories.length === 0 ? (
              <FeedEmpty compact />
            ) : (
              feedSlice.map((m) => <FeedCard key={m.id} memory={m} variant="desktop" />)
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div id="map-root" className="absolute inset-0" role="region" aria-label="Memory map">
        <Suspense fallback={(
          <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: T.canvas }}>
            <p className="heading-font text-sm font-bold" style={{ color: T.muted }} role="status">Loading map…</p>
          </div>
        )}>
          <HomeMap
            viewState={viewState}
            onMove={(e) => setViewState(e.viewState)}
            onMapClick={handleMapClick}
            mapError={mapError}
            onMapError={setMapError}
            memories={memories}
            selectedMemory={selectedMemory}
            onSelectMemory={setSelectedMemory}
          />
        </Suspense>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden absolute top-16 left-0 right-0 z-[840] px-4 pt-2 flex items-center justify-between gap-3 pointer-events-none">
        <div style={pill({ display: 'flex', alignItems: 'center', gap: 8, background: T.surface })} className="pointer-events-auto min-h-11 px-3">
          <Flame size={12} color={T.accent} strokeWidth={3} aria-hidden />
          <span className="heading-font" style={{ fontSize: 12, fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {loading ? 'Loading…' : feedError ? 'Feed unavailable' : `${memories.length} recent spills`}
          </span>
        </div>
        <button
          type="button"
          ref={feedTriggerRef}
          onClick={() => setShowFeed(true)}
          style={pill({ display: 'flex', alignItems: 'center', gap: 8, background: T.surface })}
          className="pointer-events-auto min-h-11 px-3"
          aria-expanded={showFeed}
          aria-controls="mobile-live-feed"
        >
          <MapIcon size={12} color={T.ink} strokeWidth={2.5} aria-hidden />
          <span className="heading-font" style={{ fontSize: 12, fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recent Spills
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
            ref={feedDialogRef}
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
                <div className="space-y-3" role="status" aria-busy aria-label="Loading memories">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="home-skeleton" style={{ height: 88, borderRadius: 12 }} />
                  ))}
                </div>
              ) : feedError ? (
                <FeedUnavailable onRetry={() => { setLoading(true); setFeedRetryCount((count) => count + 1); }} />
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
          setAllMemories((previous) => ({ ...previous, [d.id]: d }));
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
    </main>
  );
}

export default Home;
