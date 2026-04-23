import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MapPin, Share2, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MemoryCard = ({ summaryData, setShowSummary }) => {
    if (!summaryData) return null;

    const handleShare = async () => {
        const url = `${window.location.origin}/memory/${summaryData.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Memory on Spill It',
                    text: summaryData.caption,
                    url: url,
                });
            } catch (err) {
                // Share failed silently
            }
        } else {
            navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={() => setShowSummary(false)}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[#111115] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
                >
                    {/* Header with Success Badge */}
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <CheckCircle2 size={16} className="text-[var(--spillit-primary)]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest heading-font">Memory Pinned</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowSummary(false)}
                        className="absolute top-6 right-6 z-10 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>

                    {/* Content Image */}
                    <div className="relative h-72 w-full">
                        <img 
                            src={summaryData.imageUrl} 
                            className="w-full h-full object-cover" 
                            alt="Spilled Memory" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-transparent to-transparent" />
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <p className="text-xl md:text-2xl text-white italic leading-relaxed heading-font">
                                &quot;{summaryData.caption}&quot;
                            </p>
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin size={16} className="text-[var(--spillit-primary)]" />
                                <span className="text-xs font-medium">{summaryData.address || "A secret location"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 p-4 rounded-3xl text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Visibility</p>
                                <p className="text-sm text-white font-bold">{summaryData.anonymous ? 'Anonymous' : 'Public'}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-3xl text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Memory ID</p>
                                <p className="text-[10px] text-[var(--spillit-secondary)] font-mono font-bold truncate">#{summaryData.id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleShare}
                                className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-[var(--spillit-primary)] hover:text-white transition-all shadow-lg"
                            >
                                <Share2 size={18} /> Share This Memory
                            </button>
                            <Link 
                                to={`/memory/${summaryData.id}`}
                                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                            >
                                <ExternalLink size={18} /> View On Map
                            </Link>
                        </div>
                        
                        <p className="text-[10px] text-center text-slate-500 heading-font uppercase tracking-[0.2em]">
                            Spilled on {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MemoryCard;