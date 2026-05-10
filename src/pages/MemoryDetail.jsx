import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Heart, MapPin, Share2, Calendar, User,
  ChevronLeft, ArrowRight, Copy, Ghost, Flame, Lock, Laugh
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

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

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('memories')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setMemory(data);
          if (currentUser && data.upvoted_by?.includes(currentUser.id)) setHasUpvoted(true);

          const { data: nearby } = await supabase
            .from('memories')
            .select('*')
            .neq('id', id)
            .limit(4);
          if (nearby) setNearbyMemories(nearby);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, currentUser]);

  const handleUpvote = async () => {
    if (!currentUser) { alert('Please login to upvote!'); return; }
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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Not found ── */
  if (!memory) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-card border-2 border-foreground flex items-center justify-center shadow-pop">
        <Ghost size={40} className="text-muted-foreground" strokeWidth={1.5} />
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
            className="w-full h-full object-cover"
            alt="Memory"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ghost size={64} className="text-muted-foreground" strokeWidth={1} />
          </div>
        )}
        {/* Gradient fade into page bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Back + share controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-md border-2 border-foreground rounded-full text-foreground font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm heading-font uppercase tracking-wide"
          >
            <ChevronLeft size={16} strokeWidth={2.5} /> Back
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-md border-2 border-foreground rounded-full text-foreground font-bold shadow-pop hover:shadow-pop-hover transition-all text-sm heading-font uppercase tracking-wide"
          >
            <Copy size={14} strokeWidth={2.5} />
            {copied ? 'Copied!' : 'Share'}
          </button>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-foreground rounded-2xl p-6 md:p-10 shadow-pop"
        >
          {/* Author + date row */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-foreground flex items-center justify-center text-muted-foreground shadow-pop">
                <User size={18} strokeWidth={2.5} />
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
                <Calendar size={11} strokeWidth={2.5} />
                {memory.created_at ? new Date(memory.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Location</p>
                <p className="text-xs font-bold text-foreground truncate">{memory.address || 'Unknown spot'}</p>
              </div>
            </div>

            <button
              onClick={handleUpvote}
              disabled={isUpvoting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border-2 border-foreground shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all heading-font uppercase tracking-widest disabled:opacity-50 ${
                hasUpvoted ? 'bg-secondary text-white' : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              <Heart size={16} fill={hasUpvoted ? 'currentColor' : 'none'} strokeWidth={2.5} />
              {memory.upvotes || 0}
            </button>
          </div>
        </motion.div>

        {/* Recent spills */}
        {nearbyMemories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-sticker"
          >
            <h3 className="heading-font text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              More Spills
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
                      ? <img src={getOptimizedImageUrl(m.image_url, 100)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><Ghost size={16} className="text-muted-foreground" /></div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground font-medium italic truncate">"{m.caption || 'A silent memory...'}"</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{m.type || 'Moment'}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                </Link>
              ))}
            </div>
            <Link
              to="/gallery"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border text-xs font-bold uppercase tracking-widest text-accent hover:text-secondary transition-colors"
            >
              View All Spills <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default MemoryDetail;
