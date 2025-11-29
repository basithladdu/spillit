import React from 'react';
import { motion } from 'framer-motion';
import {
  FaIdCard, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList,
  FaTimes, FaCheckCircle, FaExclamationTriangle, FaLayerGroup, FaTwitter
} from 'react-icons/fa';
import { MdError, MdWarning, MdCheckCircle } from 'react-icons/md';

// --- Helper: Severity Styles (Neon Theme) ---
const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'Critical':
      return {
        color: 'text-red-500',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        icon: <MdError />
      };
    case 'High':
      return {
        color: 'text-orange-500',
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
        icon: <MdWarning />
      };
    case 'Medium':
      return {
        color: 'text-yellow-400',
        border: 'border-yellow-400/50',
        bg: 'bg-yellow-400/10',
        shadow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',
        icon: <FaExclamationTriangle />
      };
    case 'Low':
      return {
        color: 'text-emerald-400',
        border: 'border-emerald-400/50',
        bg: 'bg-emerald-400/10',
        shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
        icon: <MdCheckCircle />
      };
    default:
      return {
        color: 'text-cyan-400',
        border: 'border-cyan-400/50',
        bg: 'bg-cyan-400/10',
        shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        icon: <FaCheckCircle />
      };
  }
};

const ReportCard = ({ summaryData, setShowSummary }) => {
  if (!summaryData) return null;

  const theme = getSeverityConfig(summaryData.severity);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setShowSummary(false)}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,255,204,0.2)] overflow-hidden"
      >
        {/* Top Neon Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

        {/* Close Button */}
        <button
          onClick={() => setShowSummary(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <FaTimes size={20} />
        </button>

        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <FaCheckCircle className="text-4xl text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Your issue has been logged in the system and dispatched to the relevant department.
          </p>

          {/* Data Grid */}
          <div className="bg-black/30 rounded-xl border border-white/5 p-4 space-y-4 text-left">

            {/* Row 1: ID & Type */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FaIdCard /> Tracking ID
                </div>
                <div className="font-mono text-cyan-400 text-sm mt-1">#{summaryData.id ? summaryData.id.substring(0, 8) : 'PENDING'}...</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-end gap-1.5">
                  <FaLayerGroup /> Type
                </div>
                <div className="font-bold text-white text-sm mt-1">{summaryData.type}</div>
              </div>
            </div>

            {/* Row 2: Severity Badge */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Severity Level</div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase ${theme.bg} ${theme.color} ${theme.border} ${theme.shadow}`}>
                {theme.icon} {summaryData.severity}
              </div>
            </div>

            {/* Row 3: Location */}
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <FaMapMarkerAlt /> Coordinates
              </div>
              <div className="font-mono text-gray-300 text-xs">
                {summaryData.lat?.toFixed(5)}, {summaryData.lng?.toFixed(5)}
              </div>
            </div>
          </div>

          {/* Image Preview (Optional) */}
          {summaryData.imageUrl && (
            <div className="mt-6 relative group rounded-xl overflow-hidden border border-white/10 h-32">
              <img src={summaryData.imageUrl} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold">
                EVIDENCE ATTACHED
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => {
                const text = encodeURIComponent(`I just reported a ${summaryData.type} issue on FixIt! @letsfixindia`);
                const url = encodeURIComponent(window.location.origin + '/report/' + summaryData.id);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
              }}
              className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-[#1DA1F2]/20 transition-all flex items-center justify-center gap-2"
            >
              <FaTwitter /> Tweet Report
            </button>

            <button
              onClick={() => setShowSummary(false)}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02]"
            >
              Return to Map
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportCard;