import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ghost, Map, ArrowLeft, Sparkles } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--spillit-bg)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--spillit-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full text-center relative z-10"
      >
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-[var(--spillit-primary)] mx-auto shadow-2xl">
            <Ghost size={48} />
          </div>
          <div className="absolute -top-2 -right-2 text-[var(--spillit-secondary)]">
            <Sparkles size={24} className="animate-pulse" />
          </div>
        </div>

        <h1 className="text-8xl font-black heading-font text-white mb-2 tracking-tighter opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">404</h1>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 heading-font tracking-tight">
          Lost in the <span className="bg-gradient-to-r from-[var(--spillit-primary)] to-[var(--spillit-secondary)] bg-clip-text text-transparent italic">Map.</span>
        </h2>
        
        <p className="text-[var(--spillit-text-muted)] text-base mb-10 leading-relaxed max-w-sm mx-auto font-medium">
          The page you&apos;re looking for was never spilled, or it&apos;s been erased from the soul of the map.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--spillit-primary)] to-[var(--spillit-secondary)] text-white font-bold rounded-2xl shadow-xl shadow-[var(--spillit-primary)]/20 hover:scale-105 transition-all heading-font uppercase tracking-widest text-xs"
          >
            <Map size={18} /> Return to Map
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFound;