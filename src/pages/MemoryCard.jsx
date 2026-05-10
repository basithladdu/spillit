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
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    onClick={() => setShowSummary(false)}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white border-2 border-foreground rounded-[40px] shadow-pop overflow-hidden"
                >
                    {/* Header with Success Badge */}
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white border-2 border-foreground px-4 py-2 rounded-full shadow-pop">
                        <CheckCircle2 size={16} className="text-accent" strokeWidth={3} />
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest heading-font">Memory Pinned</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowSummary(false)}
                        className="absolute top-6 right-6 z-10 p-2 bg-white border-2 border-foreground rounded-full text-foreground hover:bg-muted transition-all shadow-pop"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>

                    {/* Content Image */}
                    <div className="relative h-72 w-full border-b-2 border-foreground">
                        <img 
                            src={summaryData.imageUrl} 
                            className="w-full h-full object-cover" 
                            alt="Spilled Memory" 
                        />
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <p className="text-xl md:text-2xl text-foreground italic leading-relaxed heading-font font-black">
                                &quot;{summaryData.caption}&quot;
                            </p>
                            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter text-[10px]">
                                <MapPin size={16} className="text-accent" strokeWidth={3} />
                                <span>{summaryData.address || "A secret location"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted border-2 border-foreground p-4 rounded-3xl text-center shadow-pop">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Visibility</p>
                                <p className="text-sm text-foreground font-black">{summaryData.anonymous ? 'Anonymous' : 'Public'}</p>
                            </div>
                            <div className="bg-muted border-2 border-foreground p-4 rounded-3xl text-center shadow-pop">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Memory ID</p>
                                <p className="text-[10px] text-accent font-black truncate">#{summaryData.id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleShare}
                                className="w-full py-4 rounded-full bg-accent text-white font-black flex items-center justify-center gap-3 border-2 border-foreground shadow-pop hover:shadow-pop-hover hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
                            >
                                <Share2 size={18} strokeWidth={3} /> Share Memory
                            </button>
                            <Link 
                                to={`/memory/${summaryData.id}`}
                                className="w-full py-4 rounded-full bg-white border-2 border-foreground text-foreground font-black flex items-center justify-center gap-3 hover:bg-muted transition-all shadow-pop uppercase tracking-widest text-sm"
                            >
                                <ExternalLink size={18} strokeWidth={3} /> View Full Spill
                            </Link>
                        </div>
                        
                        <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
                            Spilled on {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MemoryCard;