import React from 'react';
import { 
  FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, 
  FaClock, FaTools
} from 'react-icons/fa';

// --- STATUS BADGE ---
export const StatusBadge = ({ status }) => {
  const s = status ? status.toLowerCase() : 'new';
  let styles = "bg-slate-800 text-slate-400 border-slate-700";
  let Icon = FaExclamationCircle;
  let label = s.replace('_', ' ');

  if (s === 'resolved') {
    styles = "bg-emerald-950/30 text-emerald-400 border-emerald-900";
    Icon = FaCheckCircle;
  } else if (s === 'in_progress' || s === 'in-progress') {
    styles = "bg-blue-950/30 text-blue-400 border-blue-900";
    Icon = FaTools;
  } else if (s === 'new') {
    styles = "bg-amber-950/30 text-amber-400 border-amber-900";
    Icon = FaExclamationCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-bold uppercase tracking-wider ${styles}`}>
      <Icon size={10} />
      {label}
    </span>
  );
};

// --- SEVERITY BADGE ---
export const SeverityBadge = ({ severity }) => {
  let styles = "bg-slate-800 text-slate-400 border-slate-700";
  let Icon = FaInfoCircle;

  switch (severity) {
    case 'Critical':
      styles = "bg-red-950/30 text-red-400 border-red-900";
      Icon = FaExclamationCircle;
      break;
    case 'High':
      styles = "bg-orange-950/30 text-orange-400 border-orange-900";
      Icon = FaExclamationTriangle;
      break;
    case 'Medium':
      styles = "bg-yellow-950/30 text-yellow-400 border-yellow-900";
      Icon = FaExclamationTriangle;
      break;
    case 'Low':
      styles = "bg-slate-800 text-slate-300 border-slate-600";
      Icon = FaCheckCircle;
      break;
    default: break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-bold uppercase tracking-wider ${styles}`}>
      <Icon size={10} />
      {severity}
    </span>
  );
};

// --- PROFESSIONAL BUTTON ---
export const GovButton = ({ children, onClick, variant = 'primary', className = '', icon: Icon, type="button" }) => {
  const base = "flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 focus:ring-blue-500 shadow-sm",
    danger: "bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900 focus:ring-red-500",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 focus:ring-slate-500",
    outline: "bg-transparent border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400"
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon />}
      {children}
    </button>
  );
};