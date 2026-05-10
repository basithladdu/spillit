import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
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
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-foreground font-black text-sm border-2 border-foreground shadow-pop ${styles[rank] || 'bg-white text-slate-400'}`}>
      {rank}
    </div>
  );
};

function Leaderboard() {
  const [topMemories, setTopMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopMemories = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*, profiles(username, avatar_url)')
        .order('upvotes', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setTopMemories(data);
      }
      setLoading(false);
    };

    fetchTopMemories();

    // Optional: Real-time updates for leaderboard
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, () => {
        fetchTopMemories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-gradient-to-b from-secondary/10 via-transparent to-transparent blur-[140px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 pt-32 relative z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex w-16 h-16 rounded-[24px] bg-white border-2 border-foreground items-center justify-center text-accent shadow-pop"
          >
            <Trophy size={32} strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black heading-font tracking-tight text-foreground">
            Hall Of <span className="text-accent italic">Spills</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm font-medium leading-relaxed">
            These are the memories that touched the most hearts. The highest upvoted moments on the global map.
          </p>
        </div>

        {topMemories.length === 0 ? (
          <div className="text-center py-40 bg-white border-2 border-foreground rounded-[40px] border-dashed">
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
                  <div className="bg-white flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-[40px] border-2 border-foreground hover:border-accent hover:bg-muted transition-all shadow-pop hover:-translate-y-1 group">
                    
                    {/* Rank & Media */}
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <RankBadge rank={index + 1} />
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[32px] overflow-hidden border-2 border-foreground bg-muted flex-shrink-0 shadow-pop">
                           {memory.image_url ? (
                             <img 
                              src={memory.image_url} 
                              alt="memory" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                            />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center"><Ghost size={32} className="text-slate-300" /></div>
                           )}
                           <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white border-2 border-foreground text-[8px] font-black uppercase text-foreground">
                              {memory.type || 'Moment'}
                           </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center justify-center md:justify-start gap-3">
                             <div className="flex items-center gap-1.5 text-accent font-black text-lg">
                                <Heart size={20} className="fill-current" strokeWidth={3} />
                                <span>{memory.upvotes || 0}</span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-foreground/10 hidden md:block"></div>
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-muted border border-foreground flex items-center justify-center text-accent">
                                   {memory.profiles?.avatar_url ? (
                                     <img src={memory.profiles.avatar_url} alt="p" className="w-full h-full object-cover rounded-lg" />
                                   ) : (
                                     <User size={12} strokeWidth={3} />
                                   )}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {memory.profiles?.username ? `@${memory.profiles.username}` : 'Anonymous'}
                                </span>
                             </div>
                          </div>
                          
                           <div className="flex items-center justify-center gap-2 text-[10px] font-black text-foreground uppercase tracking-widest bg-muted px-4 py-2 rounded-2xl border-2 border-foreground shadow-pop">
                             <MapPin size={12} className="text-quaternary" strokeWidth={3} /> {memory.address?.split(',')[0] || 'The Unknown'}
                           </div>
                       </div>

                       <p className="text-lg md:text-xl text-foreground italic font-black line-clamp-2 md:pr-10 leading-relaxed">
                          &quot;{memory.caption || 'A silent memory whispers...'}&quot;
                       </p>

                       <div className="flex items-center justify-center md:justify-between px-0">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spilled On</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                 {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                          </div>
                          
                          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent group-hover:translate-x-2 transition-transform">
                             View Spill <ArrowRight size={14} strokeWidth={3} />
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