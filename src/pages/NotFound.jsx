import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ghost, Map, ArrowLeft } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">

      {/* Blobs */}
      <div className="pointer-events-none absolute top-16 right-16 w-48 h-48 bg-tertiary rounded-full opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 left-16 w-56 h-56 bg-secondary rounded-full opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="max-w-md w-full text-center relative z-10"
      >
        {/* Big 404 watermark */}
        <div className="heading-font text-[10rem] font-bold text-foreground opacity-5 leading-none select-none pointer-events-none mb-[-3rem]">
          404
        </div>

        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-accent mx-auto mb-6 shadow-pop relative z-10">
          <Ghost size={44} strokeWidth={2} />
        </div>

        <h2 className="heading-font text-4xl md:text-5xl font-bold text-foreground mb-4">
          Lost in the <span className="text-accent italic">Map.</span>
        </h2>

        <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-sm mx-auto">
          This page was never spilled, or it's been erased from the soul of the map.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white border-2 border-foreground rounded-full font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all heading-font uppercase tracking-widest text-sm"
          >
            <Map size={18} strokeWidth={2.5} /> Return to Map
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-foreground text-foreground rounded-full font-bold shadow-pop hover:bg-muted hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest heading-font"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFound;
