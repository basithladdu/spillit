import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { X, MapPin, Share2, ExternalLink, CheckCircle2, Ghost } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { timeAgo } from '../utils/format';

const MemoryCard = ({ summaryData, setShowSummary }) => {
    const dialogRef = useRef(null);
    const returnFocusRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return undefined;

        returnFocusRef.current = document.activeElement;
        const focusable = () => [...dialog.querySelectorAll('button, a[href]')]
            .filter((element) => !element.disabled);
        focusable()[0]?.focus();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowSummary(false);
                return;
            }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            if (elements.length === 0) return;
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

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            returnFocusRef.current?.focus?.();
            returnFocusRef.current = null;
        };
    }, [setShowSummary]);

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
                return;
            } catch (error) {
                if (error?.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        } catch {
            toast.error('Could not copy the link. Please copy it from your address bar.');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-label="Close summary"
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    onClick={() => setShowSummary(false)}
                />

                <motion.div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="memory-summary-title"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white border-2 border-foreground rounded-[40px] shadow-pop overflow-hidden"
                >
                    {/* Header with Success Badge */}
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white border-2 border-foreground px-4 py-2 rounded-full shadow-pop">
                        <CheckCircle2 size={16} className="text-accent" strokeWidth={3} aria-hidden="true" />
                        <span id="memory-pinned-title" className="text-[10px] font-black text-foreground uppercase tracking-widest heading-font">Memory Pinned</span>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setShowSummary(false)}
                        aria-label="Close memory pinned summary"
                        className="absolute top-6 right-6 z-10 p-2 bg-white border-2 border-foreground rounded-full text-foreground hover:bg-muted transition-all shadow-pop"
                    >
                        <X size={20} strokeWidth={3} aria-hidden="true" />
                    </button>

                    {/* Content Image */}
                    <div className="relative h-72 w-full border-b-2 border-foreground bg-muted">
                        {summaryData.imageUrl ? (
                          <img
                            src={getOptimizedImageUrl(summaryData.imageUrl, 640)}
                            width="640"
                            height="288"
                            className="w-full h-full object-cover"
                            alt={`Memory photo: ${(summaryData.caption || 'Spilled memory').trim().slice(0, 80)}`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Ghost size={64} className="text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                          </div>
                        )}
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <p id="memory-summary-title" className="text-xl md:text-2xl text-foreground italic leading-relaxed heading-font font-black">
                                &quot;{summaryData.caption}&quot;
                            </p>
                            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter text-[10px]">
                                <MapPin size={16} className="text-accent" strokeWidth={3} aria-hidden="true" />
                                <span>{summaryData.address || "A secret location"}</span>
                                {(summaryData.created_at || summaryData.ts) && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{timeAgo(summaryData.created_at || summaryData.ts)}</span>
                                  </>
                                )}
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
                                type="button"
                                onClick={handleShare}
                                className="w-full py-4 rounded-full bg-accent text-white font-black flex items-center justify-center gap-3 border-2 border-foreground shadow-pop hover:shadow-pop-hover hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
                            >
                                <Share2 size={18} strokeWidth={3} aria-hidden="true" /> Share Memory
                            </button>
                            <Link 
                                to={`/memory/${summaryData.id}`}
                                className="w-full py-4 rounded-full bg-white border-2 border-foreground text-foreground font-black flex items-center justify-center gap-3 hover:bg-muted transition-all shadow-pop uppercase tracking-widest text-sm"
                            >
                                <ExternalLink size={18} strokeWidth={3} aria-hidden="true" /> View Full Spill
                            </Link>
                        </div>
                        
                        <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
                            Spilled {summaryData.created_at ? timeAgo(summaryData.created_at) : 'just now'}
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MemoryCard;
