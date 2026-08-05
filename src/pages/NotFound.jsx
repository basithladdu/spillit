import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Ghost, Map, ArrowLeft, Camera } from 'lucide-react';

function NotFound() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Page not found — Spill It';

    const robotsTag = document.querySelector('meta[name="robots"]');
    const descriptionTag = document.querySelector('meta[name="description"]');
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    const prev = {
      robots: robotsTag?.getAttribute('content'),
      description: descriptionTag?.getAttribute('content'),
      ogTitle: ogTitleTag?.getAttribute('content'),
    };

    robotsTag?.setAttribute('content', 'noindex, nofollow');
    descriptionTag?.setAttribute('content', 'This page could not be found on Spill It.');
    ogTitleTag?.setAttribute('content', 'Page not found — Spill It');

    return () => {
      document.title = prevTitle;
      if (prev.robots != null) robotsTag?.setAttribute('content', prev.robots);
      if (prev.description != null) descriptionTag?.setAttribute('content', prev.description);
      if (prev.ogTitle != null) ogTitleTag?.setAttribute('content', prev.ogTitle);
    };
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">

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
          <Ghost size={44} strokeWidth={2} aria-hidden="true" />
        </div>

        <h1 className="heading-font mb-4 text-4xl font-bold text-foreground md:text-5xl">
          Lost in the <span className="text-accent italic">Map.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-sm text-base leading-relaxed text-muted-foreground">
          This page was never spilled, or it has been erased from the soul of the map.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white border-2 border-foreground rounded-full font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all heading-font uppercase tracking-widest text-sm"
          >
            <Map size={18} strokeWidth={2.5} aria-hidden="true" /> Return to Map
          </Link>
          <Link
            to="/gallery"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-foreground text-foreground rounded-full font-bold shadow-pop hover:bg-muted hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest heading-font"
          >
            <Camera size={18} strokeWidth={2.5} aria-hidden="true" /> Browse Archive
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-foreground text-foreground rounded-full font-bold shadow-pop hover:bg-muted hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest heading-font"
          >
            <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" /> Go Back
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default NotFound;
