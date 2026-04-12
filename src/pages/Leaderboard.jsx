import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Hash, MapPin, Sparkles, Trophy, Crown, Star, Ghost, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const RankBadge = ({ rank }) => {
  const styles = {
    1: 'bg-yellow-500 shadow-yellow-500/50',
    2: 'bg-slate-300 shadow-slate-300/50',
    3: 'bg-amber-600 shadow-amber-600/50',
  };
  return (
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-black font-black text-sm shadow-lg ${styles[rank] || 'bg-white/5 border border-white/10 text-slate-400'}`}>
      {rank}
    </div>
  );
};

function Leaderboard() {
  const [topMemories, setTopMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('upvotes', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopMemories(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080c]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff7ec9] border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans pb-24 overflow-x-hidden">
      
      {/* --- Background --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-gradient-to-b from-[#ff7ec9]/10 via-transparent to-transparent blur-[140px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 pt-32 relative z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex w-16 h-16 rounded-3xl bg-white/5 border border-white/10 items-center justify-center text-[#ff7ec9] shadow-2xl"
          >
            <Trophy size={32} />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold heading-font tracking-tight">
            Hall Of <span className="bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] bg-clip-text text-transparent italic">Spills</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm font-medium leading-relaxed">
            These are the memories that touched the most hearts. The highest upvoted moments on the global map.
          </p>
        </div>

        {topMemories.length === 0 ? (
          <div className="text-center py-40 glass-card rounded-[40px] border-dashed">
             <Ghost size={64} className="text-slate-800 mx-auto mb-6" />
             <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No one has spilled enough love yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {topMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                {/* Crown for #1 */}
                {index === 0 && (
                   <div className="absolute -left-3 -top-3 z-20 -rotate-12">
                      <Crown size={32} className="text-yellow-400 drop-shadow-lg" />
                   </div>
                )}

                <Link to={`/memory/${memory.id}`}>
                  <div className="glass-card flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-[40px] border border-white/5 hover:border-[#ff7ec9]/30 hover:bg-white/[0.04] transition-all shadow-xl group">
                    
                    {/* Rank & Media */}
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <RankBadge rank={index + 1} />
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[32px] overflow-hidden border border-white/10 bg-black/40 flex-shrink-0">
                           {memory.imageUrl ? (
                             <img 
                              src={memory.imageUrl} 
                              alt="memory" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                            />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center"><Ghost size={32} className="text-slate-800" /></div>
                           )}
                           <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[8px] font-black uppercase text-white border border-white/10">
                              {memory.vibe || 'Moment'}
                           </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center justify-center md:justify-start gap-3">
                             <div className="flex items-center gap-1.5 text-[var(--spillit-primary)] font-bold text-lg">
                                <Heart size={20} className="fill-current" />
                                <span>{memory.upvotes || 0}</span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-slate-700 hidden md:block"></div>
                             <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 uppercase tracking-widest">
                                <Hash size={12} className="text-[#a78bfa]" /> {memory.id.slice(-8)}
                             </div>
                          </div>
                          
                          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                             <MapPin size={12} className="text-[#4ade80]" /> {memory.address?.split(',')[0] || 'The Unknown'}
                          </div>
                       </div>

                       <p className="text-lg md:text-xl text-slate-100 italic font-medium line-clamp-2 md:pr-10">
                          &quot;{memory.caption || 'A silent memory whispers...'}&quot;
                       </p>

                       <div className="flex items-center justify-center md:justify-between px-0">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7ec9]/60">Spilled On</span>
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {memory.ts ? new Date(memory.ts.seconds * 1000).toLocaleDateString() : 'N/A'}
                             </span>
                          </div>
                          
                          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7ec9] group-hover:translate-x-2 transition-transform">
                             View Spill <ArrowRight size={14} />
                          </div>
                       </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Leaderboard;