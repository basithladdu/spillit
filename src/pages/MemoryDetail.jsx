import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  Share2, 
  Calendar, 
  User, 
  ChevronLeft, 
  ArrowRight,
  MessageCircle,
  Eye,
  Flag,
  Copy
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [nearbyMemories, setNearbyMemories] = useState([]);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          setMemory(data);
          
          if (currentUser && data.upvoted_by?.includes(currentUser.id)) {
            setHasUpvoted(true);
          }

          // Fetch nearby spills (simplified)
          const { data: nearby } = await supabase
            .from('memories')
            .select('*')
            .neq('id', id)
            .limit(4);
            
          if (nearby) setNearbyMemories(nearby);
        }
      } catch (error) {
        // Error fetching memory handled by UI state
      } finally {
        setLoading(false);
      }
    };

    fetchMemory();
  }, [id, currentUser]);

  const handleUpvote = async () => {
    if (!currentUser) {
      alert("Please login to upvote memories!");
      return;
    }
    if (isUpvoting) return;

    setIsUpvoting(true);

    try {
      const upvotedBy = memory.upvoted_by || [];
      let newUpvotedBy;
      let newUpvotes;

      if (hasUpvoted) {
        newUpvotedBy = upvotedBy.filter(uid => uid !== currentUser.id);
        newUpvotes = (memory.upvotes || 0) - 1;
      } else {
        newUpvotedBy = [...upvotedBy, currentUser.id];
        newUpvotes = (memory.upvotes || 0) + 1;
      }

      const { error } = await supabase
        .from('memories')
        .update({ 
          upvotes: newUpvotes,
          upvoted_by: newUpvotedBy
        })
        .eq('id', id);

      if (error) throw error;

      setMemory(prev => ({ ...prev, upvotes: newUpvotes, upvoted_by: newUpvotedBy }));
      setHasUpvoted(!hasUpvoted);
    } catch (error) {
      // Upvote failed silently
    } finally {
      setIsUpvoting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Memory link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--spillit-bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--spillit-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen bg-[var(--spillit-bg)] text-white flex flex-col items-center justify-center p-6 text-center">
        <Heart size={64} className="text-gray-700 mb-6" />
        <h1 className="text-3xl font-bold heading-font mb-4 uppercase tracking-[0.2em]">Memory Faded</h1>
        <p className="text-slate-400 mb-8 max-w-md">This memory couldn&apos;t be found. It may have been deleted or the link is broken.</p>
        <Link to="/" className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-[var(--spillit-primary)] hover:text-white transition-all">
          Back to Map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F9] text-foreground pb-20">
      {/* Top Banner / Image */}
      <div className="relative h-[35vh] md:h-[60vh] w-full overflow-hidden">
        <img 
          src={getOptimizedImageUrl(memory.image_url, 1920)} 
          className="w-full h-full object-cover" 
          alt="Memory" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFF5F9] via-transparent to-black/20" />
        
        {/* Top Controls */}
        <div className="absolute top-8 left-4 right-4 md:left-8 md:right-8 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest hidden md:inline">Back</span>
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={copyLink}
              className="p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all"
            >
              <Copy size={20} />
            </button>
            <button 
              className="p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Floating Memory ID */}
        <div className="absolute bottom-6 left-4 md:left-8 z-10">
          <div 
            className="px-4 py-1.5 rounded-full border-2 border-foreground bg-white text-[9px] font-black uppercase tracking-[0.2em] shadow-pop text-foreground"
          >
            Memory #{memory.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 md:-mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-foreground rounded-[32px] p-6 md:p-10 shadow-pop"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--spillit-primary)] border border-white/10">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Shared By</p>
                  <p className="text-base font-black text-foreground">Anonymous Spiller</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border-2 border-foreground shadow-pop hidden sm:flex">
                  <Calendar size={12} className="text-accent" />
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                    {memory.created_at ? new Date(memory.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                  </span>
                </div>
              </div>

              <h1 className="text-xl md:text-2xl font-bold leading-relaxed italic heading-font text-foreground mb-8">
                &quot;{memory.caption || 'No description provided.'}&quot;
              </h1>

              <div className="p-5 bg-muted rounded-2xl border-2 border-foreground flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white border-2 border-foreground shadow-pop">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Location</p>
                    <p className="text-xs font-bold truncate pr-4 text-foreground">{memory.address || "Unknown Spot"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleUpvote}
                    disabled={isUpvoting}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest border-2 border-foreground shadow-pop transition-all ${
                      hasUpvoted 
                        ? 'bg-accent text-white' 
                        : 'bg-white text-foreground hover:bg-muted'
                    }`}
                  >
                    <Heart size={16} fill={hasUpvoted ? "currentColor" : "none"} strokeWidth={3} />
                    <span>{memory.upvotes || 0}</span>
                  </button>
                  <button className="p-2.5 bg-white border-2 border-foreground rounded-full text-foreground hover:bg-muted shadow-pop transition-all">
                    <Flag size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Comments Placeholder */}
            {/* <div className="glass-card p-8 border-white/5">
                <div className="flex items-center gap-3 mb-6">
                    <MessageCircle size={20} className="text-[var(--spillit-primary)]" />
                    <h3 className="heading-font text-lg uppercase tracking-widest">Spills (0)</h3>
                </div>
                <p className="text-sm text-slate-500 italic text-center py-10 opacity-50">No one has spilled their thoughts on this memory yet.</p>
            </div> */}
          </div>

          {/* Sidebar / Stats (Right) */}
          <div className="space-y-6">
            <div className="glass-card p-8 border-white/5">
                <h3 className="heading-font text-xs uppercase tracking-[0.3em] text-slate-500 mb-6">Memory Stats</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <Eye size={14} /> Views
                        </span>
                        <span className="text-lg font-bold">--</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <Heart size={14} /> Hearts
                        </span>
                        <span className="text-lg font-bold text-[var(--spillit-primary)]">{memory.upvotes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <Share2 size={14} /> Shares
                        </span>
                        <span className="text-lg font-bold">--</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border-2 border-foreground rounded-[32px] p-6 shadow-pop overflow-hidden">
                <h3 className="heading-font text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-4 px-2">Recent Spills</h3>
                <div className="space-y-2">
                    {nearbyMemories.map((m, i) => (
                        <Link 
                            key={m.id} 
                            to={`/memory/${m.id}`}
                            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 border-foreground shadow-pop">
                                <img src={getOptimizedImageUrl(m.image_url, 100)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="spill" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-foreground font-bold italic truncate pr-4"> &quot;{m.caption}&quot;</p>
                            </div>
                        </Link>
                    ))}
                    <Link to="/gallery" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent pt-4 hover:opacity-80 transition-opacity">
                        View All Spills <ArrowRight size={12} strokeWidth={3} />
                    </Link>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MemoryDetail;