import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
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
        const docRef = doc(db, 'memories', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setMemory(data);
          
          if (currentUser && data.upvotedBy?.includes(currentUser.uid)) {
            setHasUpvoted(true);
          }

          // Fetch nearby or related spills (simplified: just latest for now)
          const q = query(collection(db, 'memories'), limit(4));
          const snap = await getDocs(q);
          setNearbyMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.id !== id));
        } else {
          // Try old 'issues' collection just in case
          const oldRef = doc(db, 'issues', id);
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists()) {
            setMemory({ id: oldSnap.id, ...oldSnap.data() });
          }
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
    const docRef = doc(db, 'memories', id);

    try {
      if (hasUpvoted) {
        await updateDoc(docRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(currentUser.uid)
        });
        setMemory(prev => ({ ...prev, upvotes: prev.upvotes - 1 }));
        setHasUpvoted(false);
      } else {
        await updateDoc(docRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(currentUser.uid)
        });
        setMemory(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
        setHasUpvoted(true);
      }
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
    <div className="min-h-screen bg-[var(--spillit-bg)] text-white pb-20">
      {/* Top Banner / Image */}
      <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          src={getOptimizedImageUrl(memory.imageUrl, 1920)} 
          className="w-full h-full object-cover" 
          alt="Memory" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--spillit-bg)] via-transparent to-black/30" />
        
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
        <div className="absolute bottom-8 left-4 md:left-8 z-10">
          <div 
            className="px-6 py-2 rounded-full border border-white/20 backdrop-blur-xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl"
            style={{ backgroundColor: `${memory.colorChoice || 'var(--spillit-primary)'}44` }}
          >
            Memory #{memory.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 md:-mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed Info (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-white/5"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--spillit-primary)] border border-white/10">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Shared By</p>
                  <p className="text-lg font-bold">Anonymous Spiller</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-300">
                    {memory.ts?.toMillis ? new Date(memory.ts.toMillis()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-relaxed italic heading-font text-white mb-8">
                &quot;{memory.caption || 'No description provided.'}&quot;
              </h1>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--spillit-primary)]/10 flex items-center justify-center text-[var(--spillit-primary)]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Location</p>
                    <p className="text-sm font-medium">{memory.address || "Unknown Spot"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleUpvote}
                    disabled={isUpvoting}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${
                      hasUpvoted 
                        ? 'bg-[var(--spillit-primary)] text-white shadow-lg shadow-[var(--spillit-primary)]/20' 
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Heart size={20} fill={hasUpvoted ? "currentColor" : "none"} />
                    <span>{memory.upvotes || 0}</span>
                  </button>
                  <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:bg-white/10 transition-all">
                    <Flag size={18} />
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

            <div className="glass-card p-6 border-white/5 overflow-hidden">
                <h3 className="heading-font text-xs uppercase tracking-[0.3em] text-slate-500 mb-4 px-2">Recent Spills</h3>
                <div className="space-y-3">
                    {nearbyMemories.map((m, i) => (
                        <Link 
                            key={m.id} 
                            to={`/memory/${m.id}`}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                <img src={getOptimizedImageUrl(m.imageUrl, 100)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="spill" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-white italic truncate pr-4"> &quot;{m.caption}&quot;</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.address?.split(',')[0]}</p>
                            </div>
                        </Link>
                    ))}
                    <Link to="/gallery" className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--spillit-primary)] pt-2 hover:opacity-80 transition-opacity">
                        View All <ArrowRight size={12} />
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