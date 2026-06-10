import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTools,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  resolved: {
    styles: 'bg-emerald-950/30 text-emerald-400 border-emerald-900',
    Icon: FaCheckCircle,
  },
  in_progress: {
    styles: 'bg-blue-950/30 text-blue-400 border-blue-900',
    Icon: FaTools,
  },
  'in-progress': {
    styles: 'bg-blue-950/30 text-blue-400 border-blue-900',
    Icon: FaTools,
  },
  new: {
    styles: 'bg-amber-950/30 text-amber-400 border-amber-900',
    Icon: FaExclamationCircle,
  },
};

const DEFAULT_STATUS = {
  styles: 'bg-slate-800 text-slate-400 border-slate-700',
  Icon: FaExclamationCircle,
};

export const StatusBadge = ({ status }) => {
  const key = status ? status.toLowerCase() : 'new';
  const { styles, Icon } = STATUS_CONFIG[key] ?? DEFAULT_STATUS;
  const label = key.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles}`}
    >
      <Icon size={10} aria-hidden />
      {label}
    </span>
  );
};

const SEVERITY_CONFIG = {
  Critical: { styles: 'bg-red-950/30 text-red-400 border-red-900', Icon: FaExclamationCircle },
  High: { styles: 'bg-orange-950/30 text-orange-400 border-orange-900', Icon: FaExclamationTriangle },
  Medium: { styles: 'bg-yellow-950/30 text-yellow-400 border-yellow-900', Icon: FaExclamationTriangle },
  Low: { styles: 'bg-slate-800 text-slate-300 border-slate-600', Icon: FaCheckCircle },
};

const DEFAULT_SEVERITY = {
  styles: 'bg-slate-800 text-slate-400 border-slate-700',
  Icon: FaInfoCircle,
};

export const SeverityBadge = ({ severity }) => {
  const { styles, Icon } = SEVERITY_CONFIG[severity] ?? DEFAULT_SEVERITY;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles}`}
    >
      <Icon size={10} aria-hidden />
      {severity}
    </span>
  );
};

export const GovButton = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  icon: Icon,
  type = 'button',
  disabled = false,
}) => {
  const base =
    'flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'border border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus:ring-blue-500',
    danger:
      'border border-red-900 bg-red-900/20 text-red-400 hover:bg-red-900/40 focus:ring-red-500',
    secondary:
      'border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 focus:ring-slate-500',
    outline:
      'border border-slate-600 bg-transparent text-slate-400 hover:border-slate-400 hover:text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {Icon && <Icon aria-hidden />}
      {children}
    </button>
  );
};
