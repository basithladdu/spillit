import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaIdCard, FaMapMarkerAlt, FaLayerGroup, FaTwitter, FaCheck, FaCopy
} from 'react-icons/fa';
import { MdError, MdWarning, MdCheckCircle } from 'react-icons/md';
import { CheckCircle2 } from 'lucide-react';

// --- Helper: Severity Styles (Municipal Theme) ---
const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'Critical':
      return {
        color: 'text-red-500',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        icon: <MdError />
      };
    case 'High':
      return {
        color: 'text-[#FF671F]', // Orange
        border: 'border-[#FF671F]/50',
        bg: 'bg-[#FF671F]/10',
        icon: <MdWarning />
      };
    case 'Medium':
      return {
        color: 'text-yellow-400',
        border: 'border-yellow-400/50',
        bg: 'bg-yellow-400/10',
        icon: <MdWarning />
      };
    case 'Low':
      return {
        color: 'text-[#046A38]', // Green
        border: 'border-[#046A38]/50',
        bg: 'bg-[#046A38]/10',
        icon: <MdCheckCircle />
      };
    default:
      return {
        color: 'text-gray-400',
        border: 'border-gray-400/50',
        bg: 'bg-gray-400/10',
        icon: <CheckCircle2 />
      };
  }
};

const ReportCard = ({ summaryData, setShowSummary }) => {
  const [copied, setCopied] = useState(false);

  if (!summaryData) return null;

  const theme = getSeverityConfig(summaryData.severity);

  const handleCopy = () => {
    if (summaryData.id) {
      navigator.clipboard.writeText(summaryData.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]"></div>

        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-[#046A38]/10 rounded-full flex items-center justify-center mb-6 border border-[#046A38]/30 shadow-[0_0_30px_rgba(4,106,56,0.2)]">
            <CheckCircle2 className="text-3xl text-[#046A38]" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted</h2>
          <p className="text-gray-400 text-sm mb-8">
            Your issue has been logged. Thank you for being a responsible citizen.
          </p>

          {/* Data Grid */}
          <div className="bg-black/30 rounded-xl border border-white/5 p-4 space-y-4 text-left">

            {/* Row 1: ID & Type */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FaIdCard /> Tracking ID
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="font-mono text-white text-sm tracking-wider" title={summaryData.id}>
                    #{summaryData.id ? summaryData.id.slice(0, 8).toUpperCase() : 'PENDING'}...
                  </div>
                  {summaryData.id && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-xs font-bold text-gray-400 hover:text-white"
                    >
                      {copied ? <FaCheck size={10} className="text-[#046A38]" /> : <FaCopy size={10} />}
                      <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                  )}
                </div>
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
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase ${theme.bg} ${theme.color} ${theme.border}`}>
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
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold border border-white/10">
                EVIDENCE ATTACHED
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => {
                const text = encodeURIComponent(`I just reported a ${summaryData.type} issue on LetsFixIndia! @letsfixindia`);
                const url = encodeURIComponent(window.location.origin + '/report/' + summaryData.id);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
              }}
              className="w-full bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaTwitter /> Tweet Report
            </button>

            <button
              onClick={() => setShowSummary(false)}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] text-sm"
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