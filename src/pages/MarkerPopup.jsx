import React from 'react';
import {
  MapPin, Calendar, Hash, ExternalLink, ArrowUpCircle,
  AlertOctagon, AlertTriangle, CheckCircle2, Info, Copy, Check, ChevronDown, ChevronUp
} from 'lucide-react';

/**
 * Presentational popup used only for server-side rendering via renderToString().
 * Accepts `issue` which should already include `placeName` (resolved in Home.jsx).
 *
 * NOTE: This component does not use hooks or client-side interactivity because
 * renderToString produces static HTML used inside Leaflet popups.
 */
const SEVERITY_THEME = {
  Critical: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    icon: AlertOctagon
  },
  High: {
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/50',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    icon: AlertTriangle
  },
  Medium: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/50',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.3)]',
    icon: AlertTriangle
  },
  Low: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/50',
    shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]',
    icon: CheckCircle2
  },
  Default: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/50',
    shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    icon: Info
  }
};

const MarkerPopup = ({ issue = {} }) => {
  const theme = SEVERITY_THEME[issue.severity] || SEVERITY_THEME.Default;
  const Icon = theme.icon;
  const timestamp = issue.ts && issue.ts.toDate ? new Date(issue.ts.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (issue.ts ? new Date(issue.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A');

  return (
    <div className="relative w-72 overflow-hidden rounded-xl font-sans text-gray-200 bg-[#0F172A]/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl p-0">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.color} ${theme.border} border`}>
            <Icon size={14} strokeWidth={3} />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Type</div>
            <div className="text-sm font-bold text-white leading-none">{issue.type}</div>
          </div>
        </div>

        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${theme.bg} ${theme.color} ${theme.border} ${theme.shadow}`}>
          {issue.severity}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
            {issue.desc || 'No description.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/40 rounded-lg p-2 border border-white/5">
            <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Status</div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${issue.status === 'resolved' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-amber-500 shadow-[0_0_5px_#f59e0b]'}`}></div>
              <span className="text-xs font-medium text-white capitalize">{issue.status || 'New'}</span>
            </div>
          </div>

          <div className="bg-black/40 rounded-lg p-2 border border-white/5">
            <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Date</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Calendar size={12} className="text-cyan-500" /> {timestamp}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-medium">
                <MapPin size={12} /> <span className="truncate" style={{ maxWidth: 170 }}>{issue.placeName || 'Unknown Location'}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1">({issue.lat?.toFixed(4) ?? 'N/A'}, {issue.lng?.toFixed(4) ?? 'N/A'})</div>
            </div>

            <div className="flex items-center gap-2">
              <a href={`/report/${issue.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-100">View</a>
              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(issue.id); }} className="text-gray-400 hover:text-white text-xs font-mono">
                <Hash size={14} /> <span className="sr-only">Copy ID</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-[1px] bg-white/5 border-t border-white/5">
        <a href={`/report/${issue.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-slate-900 text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors">
          View Record <ExternalLink size={12} />
        </a>

        <button className="px-4 flex items-center justify-center gap-1.5 bg-[#0F172A] hover:bg-slate-900 transition-colors border-l border-white/5 text-gray-500">
          <ArrowUpCircle size={16} /> <span className="text-xs font-bold">{(issue.upvotes || 0)}</span>
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;
