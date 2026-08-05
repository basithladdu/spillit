import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion as Motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Heart, MapPin, Calendar, User,
  ChevronLeft, ArrowRight, Copy, Ghost,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { timeAgo, formatDate, distanceKm, isValidCoord } from '../utils/format';
import { PageSpinner } from '../components/UI/PageStatus';

const TYPE_COLORS = {
  Moment: 'bg-accent',
  Crush:  'bg-secondary',
  Secret: 'bg-foreground',
  Laugh:  'bg-tertiary',
};

function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [memory, setMemory]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [hasUpvoted, setHasUpvoted]     = useState(false);
  const [isUpvoting, setIsUpvoting]     = useState(false);
  const [nearbyMemories, setNearbyMemories] = useState([]);
  const [copied, setCopied]             = useState(false);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMemory(null);
    setNearbyMemories([]);
    setHasUpvoted(false);
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('memories')
          .select('*')
          .eq('id', id)
          .single();

        if (data && active) {
          setMemory(data);
          if (currentUser && data.upvoted_by?.includes(currentUser.id)) setHasUpvoted(true);

          let nearbyQuery = supabase.from('memories').select('*').neq('id', id);
          if (isValidCoord(data.lat, data.lng)) {
            nearbyQuery = nearbyQuery.not('lat', 'is', null).not('lng', 'is', null);
          }
          const { data: nearby } = await nearbyQuery.limit(24);
          if (nearby && active) {
            const sorted = isValidCoord(data.lat, data.lng)
              ? [...nearby].sort(
                  (a, b) =>
                    distanceKm(data.lat, data.lng, a.lat, a.lng) -
                    distanceKm(data.lat, data.lng, b.lat, b.lng),
                )
              : nearby;
            setNearbyMemories(sorted.slice(0, 4));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [id, currentUser]);

  useEffect(() => {
    if (!memory) return undefined;
    const prevTitle = document.title;
    const snippet = memory.caption
      ? `${memory.caption.slice(0, 60)}${memory.caption.length > 60 ? '…' : ''}`
      : 'Anonymous memory';
    document.title = `${snippet} — Spill It`;
    const desc = memory.caption
      ? `An anonymous ${memory.type || 'memory'} from ${memory.address?.split(',')[0] || 'the map'}: “${memory.caption.slice(0, 120)}”`
      : 'An anonymous memory on Spill It.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
    return () => { document.title = prevTitle; };
  }, [memory]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
  }, []);

  const handleUpvote = async () => {
    if (!currentUser) {
      toast.info('Sign in to upvote memories.');
      navigate('/login');
      return;
    }
    if (isUpvoting) return;
    setIsUpvoting(true);
    try {
      const upvotedBy  = memory.upvoted_by || [];
      const removing   = hasUpvoted;
      const newList    = removing ? upvotedBy.filter(u => u !== currentUser.id) : [...upvotedBy, currentUser.id];
      const newUpvotes = (memory.upvotes || 0) + (removing ? -1 : 1);
      const { error } = await supabase.from('memories').update({ upvotes: newUpvotes, upvoted_by: newList }).eq('id', id);
      if (!error) { setMemory(p => ({ ...p, upvotes: newUpvotes, upvoted_by: newList })); setHasUpvoted(!removing); }
    } finally { setIsUpvoting(false); }
  };

  const copyLink = async () => {
    const shareData = {
      title: 'A memory on Spill It',
      text: memory?.caption ? `A memory from Spill It: “${memory.caption}”` : 'A memory from Spill It',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 2000);
    } catch {
      toast.error('Could not copy the link. Please copy it from your address bar.');
    }
  };

  /* ── Loading ── */
  if (loading) return <PageSpinner label="Loading memory" />;

  /* ── Not found ── */
  if (!memory) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-card border-2 border-foreground flex items-center justify-center shadow-pop">
        <Ghost size={40} className="text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="heading-font text-4xl font-bold text-foreground">Memory Faded</h1>
      <p className="text-muted-foreground max-w-sm">This memory couldn't be found. It may have been deleted or the link is broken.</p>
      <Link to="/" className="px-8 py-4 bg-accent text-white border-2 border-foreground rounded-full font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all heading-font uppercase tracking-widest">
        Back to Map
      </Link>
    </div>
  );

  const typeBadgeColor = TYPE_COLORS[memory.type] || 'bg-accent';

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">

      {/* ── Hero image ── */}
      <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden bg-muted">
        {memory.image_url ? (
          <img
            src={getOptimizedImageUrl(memory.image_url, 1920)}
            width="1920"
            height="1080"
            fetchPriority="high"
            className="w-full h-full object-cover"
            alt={memory.caption ? `Memory: ${memory.caption.slice(0, 80)}` : 'Memory photo'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ghost size={64} className="text-muted-foreground" strokeWidth={1} aria-hidden="true" />
          </div>
        )}
        {/* Gradient fade into page bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Back + share controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-md border-2 border-foreground rounded-full text-foreground font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm heading-font uppercase tracking-wide"
          >
            <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" /> Back
          </button>
          <button
            type="button"
            onClick={copyLink}
            aria-label={copied ? 'Link copied' : 'Copy share link'}
            className="flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-md border-2 border-foreground rounded-full text-foreground font-bold shadow-pop hover:shadow-pop-hover transition-all text-sm heading-font uppercase tracking-wide"
          >
            <Copy size={14} strokeWidth={2.5} aria-hidden="true" />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {copied ? 'Share link copied to clipboard' : ''}
          </span>
        </div>

        {/* Memory ID pill */}
        <div className="absolute bottom-5 left-5 z-10">
          <span className="px-3 py-1.5 bg-card border-2 border-foreground rounded-full text-[10px] font-bold uppercase tracking-widest shadow-pop text-foreground">
            #{memory.id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-6 relative z-10 space-y-6">

        {/* Main card */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-foreground rounded-2xl p-6 md:p-10 shadow-pop"
        >
          {/* Author + date row */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-foreground flex items-center justify-center text-muted-foreground shadow-pop">
                <User size={18} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Shared by</p>
                <p className="text-sm font-bold text-foreground">Anonymous Spiller</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Type badge */}
              <span className={`${typeBadgeColor} text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-2 border-foreground shadow-pop`}>
                {memory.type || 'Moment'}
              </span>
              {/* Date */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-2 border-foreground rounded-full text-[10px] font-bold uppercase tracking-wide shadow-pop text-foreground">
                <Calendar size={11} strokeWidth={2.5} aria-hidden="true" />
                {memory.created_at ? formatDate(memory.created_at, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                {memory.created_at ? ` · ${timeAgo(memory.created_at)}` : ''}
              </span>
            </div>
          </div>

          {/* Caption */}
          <blockquote className="heading-font text-xl md:text-2xl font-bold italic text-foreground leading-relaxed mb-8 border-l-4 border-accent pl-5">
            "{memory.caption || 'No story provided.'}"
          </blockquote>

          {/* Location + upvote row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted border-2 border-border rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-accent border-2 border-foreground flex items-center justify-center text-white shadow-pop shrink-0">
                <MapPin size={16} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Location</p>
                <p className="text-xs font-bold text-foreground truncate">{memory.address || 'Unknown spot'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpvote}
              disabled={isUpvoting}
              aria-pressed={hasUpvoted}
              aria-label={`Upvote memory (${memory.upvotes || 0} votes)`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border-2 border-foreground shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all heading-font uppercase tracking-widest disabled:opacity-50 ${
                hasUpvoted ? 'bg-secondary text-white' : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              <Heart size={16} fill={hasUpvoted ? 'currentColor' : 'none'} strokeWidth={2.5} aria-hidden="true" />
              {memory.upvotes || 0}
            </button>
          </div>
        </Motion.div>

        {/* Recent spills */}
        {nearbyMemories.length > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-sticker"
          >
            <h3 className="heading-font text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {isValidCoord(memory.lat, memory.lng) ? 'Nearby on the map' : 'More spills'}
            </h3>
            <div className="space-y-2">
              {nearbyMemories.map(m => (
                <Link
                  key={m.id}
                  to={`/memory/${m.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted border-2 border-transparent hover:border-border transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-border bg-muted">
                    {m.image_url
                      ? <img src={getOptimizedImageUrl(m.image_url, 100)} width="100" height="100" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={`Memory photo: ${m.caption || 'nearby spill'}`} />
                      : <div className="w-full h-full flex items-center justify-center"><Ghost size={16} className="text-muted-foreground" /></div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground font-medium italic truncate">"{m.caption || 'A silent memory...'}"</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{m.type || 'Moment'}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <Link
              to="/gallery"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border text-xs font-bold uppercase tracking-widest text-accent hover:text-secondary transition-colors"
            >
              View All Spills <ArrowRight size={12} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </Motion.div>
        )}

      </div>
    </div>
  );
}

export default MemoryDetail;
