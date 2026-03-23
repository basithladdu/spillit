import React from 'react';

function Footer() {
  return (
    <footer className="mt-8 border-t border-[var(--fixit-border)] bg-black/40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-[var(--fixit-text-muted)]">
        <div className="flex items-center gap-2">
          <span className="heading-font tracking-[0.18em] uppercase text-[var(--fixit-text-main)]">
            Spill It
          </span>
          <span className="hidden sm:inline text-[var(--fixit-text-muted)]">
            Spill it. Fix it.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[var(--fixit-text-muted)]">
            Built with <span className="text-[var(--fixit-primary)]">❤️</span> for India
          </span>
          <span className="hidden sm:inline text-gray-700">|</span>
          <a
            href="https://wedevit.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--fixit-primary)] transition-colors"
          >
            Powered by Devit
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://support.google.com/maps/answer/2839911"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--fixit-primary)] transition-colors"
          >
            Enable GPS / Geotagging
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;