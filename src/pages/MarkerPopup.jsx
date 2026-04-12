import React from 'react';
import {
  MapPin, Calendar, Hash, ExternalLink, Heart,
  Sparkles, HeartHandshake, Ghost, Laugh, Eye, Map
} from 'lucide-react';

const VIBE_THEME = {
  Moment: {
    color: 'text-[#ff7ec9]',
    bg: 'bg-[#ff7ec9]/10',
    border: 'border-[#ff7ec9]/50',
    shadow: 'shadow-[0_0_15px_rgba(255,126,201,0.2)]',
    icon: Sparkles
  },
  Crush: {
    color: 'text-[#a78bfa]',
    bg: 'bg-[#a78bfa]/10',
    border: 'border-[#a78bfa]/50',
    shadow: 'shadow-[0_0_15px_rgba(167,139,250,0.2)]',
    icon: Heart
  },
  Secret: {
    color: 'text-[#4ade80]',
    bg: 'bg-[#4ade80]/10',
    border: 'border-[#4ade80]/50',
    shadow: 'shadow-[0_0_15px_rgba(74,222,128,0.2)]',
    icon: Ghost
  },
  Laugh: {
    color: 'text-[#fbbf24]',
    bg: 'bg-[#fbbf24]/10',
    border: 'border-[#fbbf24]/50',
    shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]',
    icon: Laugh
  },
  Default: {
    color: 'text-slate-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    shadow: 'shadow-none',
    icon: Eye
  }
};

const MarkerPopup = ({ issue = {} }) => {
  const type = issue.type || 'Moment';
  const theme = VIBE_THEME[type] || VIBE_THEME.Default;
  const Icon = theme.icon;
  
  const timestamp = issue.ts && issue.ts.toDate 
    ? new Date(issue.ts.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : (issue.ts ? new Date(issue.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A');

  return (
    <div className="relative w-72 overflow-hidden rounded-[32px] font-sans text-white bg-[#0f0f13]/95 backdrop-blur-3xl border border-white/10 shadow-2xl p-0">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff7ec9] via-[#a78bfa] to-[#4ade80] opacity-50" />

      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.bg} ${theme.color} ${theme.border} border`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vibe</div>
            <div className="text-sm font-bold text-white heading-font">{type}</div>
          </div>
        </div>

        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-slate-500`}>
           <Map size={14} />
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <p className="text-xs text-slate-300 leading-relaxed italic font-medium line-clamp-3">
            &quot;{issue.caption || issue.desc || 'A silent memory whispers...'}&quot;
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5">
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Spot</div>
            <div className="flex items-center gap-1.5">
               <MapPin size={10} className="text-[#a78bfa]" />
               <span className="text-[10px] font-bold text-slate-200 truncate">{issue.placeName?.split(',')[0] || 'Somewhere'}</span>
            </div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5">
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Spilled</div>
            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="text-[#ff7ec9]" />
              <span className="text-[10px] font-bold text-slate-200">{timestamp}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
             <Hash size={10} /> {issue.id?.slice(-6).toUpperCase()}
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#ff7ec9]">
                 <Heart size={14} className="fill-current" />
                 <span className="text-xs font-black">{(issue.upvotes || 0)}</span>
              </div>
           </div>
        </div>
      </div>

      <a 
        href={`/memory/${issue.id}`} 
        className="block w-full py-4 bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-center text-[10px] font-black text-white uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
      >
        Step Into Memory <ExternalLink size={10} className="inline ml-2" />
      </a>
    </div>
  );
};

export default MarkerPopup;
