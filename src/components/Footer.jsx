import React from 'react';
import { Heart, Globe, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t-2 border-border bg-muted py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent border-2 border-foreground flex items-center justify-center shadow-pop">
            <Heart size={14} className="text-white fill-current" strokeWidth={2.5} />
          </div>
          <span className="heading-font font-bold text-foreground tracking-wide uppercase">
            Spill It
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-muted-foreground font-medium">
          <Link to="/about" className="hover:text-accent transition-colors">About</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/gallery" className="hover:text-accent transition-colors">Archive</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/leaderboard" className="hover:text-accent transition-colors">Hall of Fame</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <a
            href="https://instagram.com/devit.company"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary transition-colors flex items-center gap-1"
          >
            <Instagram size={14} strokeWidth={2.5} /> Devit
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          Built with <Heart size={11} className="text-secondary fill-current" /> globally &mdash; &copy; {new Date().getFullYear()} Spill It
        </p>
      </div>
    </footer>
  );
}

export default Footer;
