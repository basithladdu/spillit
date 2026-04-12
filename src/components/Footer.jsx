import React from 'react';
import { Heart, Globe, Sparkles } from 'lucide-react';

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#08080c]/80 backdrop-blur-2xl py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
        
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-[#ff7ec9]" />
              <span className="heading-font tracking-[0.4em] uppercase text-sm font-black text-white">
                Spill It
              </span>
           </div>
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] italic">
             &copy; {new Date().getFullYear()} — Digital artifacts of the human soul.
           </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-2">
            Built with <Heart size={12} className="text-[#ff7ec9] fill-current" /> globally
          </span>
          <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/5"></span>
          <a
            href="https:instagram.com/devit.company"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff7ec9] transition-colors"
          >
            Powered by Devit
          </a>
          <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/5"></span>
          <a
            href="https://support.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff7ec9] transition-colors flex items-center gap-2"
          >
            <Globe size={12} /> Map Data
          </a>
        </div>

        {/* Tagline */}
        <div className="mt-4 pt-8 border-t border-white/5 w-full text-center">
           <p className="text-[9px] text-slate-700 italic font-medium leading-relaxed max-w-sm mx-auto">
             Spill It is an anonymous platform for sharing location-based memories. Every point on earth has a story. What's yours?
           </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;