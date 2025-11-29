import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaFilter, FaShareAlt, FaHeart, FaRegHeart,
  FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaCalendarAlt,
  FaTools, FaInfoCircle, FaCheckCircle, FaExclamationTriangle,
  FaLayerGroup, FaTimes
} from 'react-icons/fa';
import { MdError, MdWarning, MdCheckCircle, MdGpsFixed } from 'react-icons/md';

// --- 1. Shared Style Helpers (Matched to Home.jsx) ---

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'Critical': return <MdError className="text-red-500" />;
    case 'High': return <MdWarning className="text-orange-500" />;
    case 'Medium': return <FaExclamationTriangle className="text-yellow-500" />;
    case 'Low': return <FaCheckCircle className="text-green-500" />;
    default: return <FaInfoCircle className="text-gray-500" />;
  }
};

const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'Critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/20' };
    case 'High': return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
    case 'Medium': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
    case 'Low': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
    default: return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', glow: 'shadow-gray-500/20' };
  }
};

const getStatusStyles = (status) => {
  const s = (status || 'new').toLowerCase();
  if (s === 'resolved') return { bg: 'bg-[#046A38]/20', text: 'text-[#046A38]', label: 'Resolved' };
  if (s === 'in_progress') return { bg: 'bg-[#06038D]/20', text: 'text-[#06038D]', label: 'In Progress' };
  return { bg: 'bg-[#FF671F]/20', text: 'text-[#FF671F]', label: 'Open' };
};

// --- 2. Sub-Components ---

const StatBox = ({ label, value, icon, colorClass, onClick }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: "0 0 20px rgba(255,103,31,0.15)" }}
    onClick={onClick}
    className={`
      cursor-pointer relative overflow-hidden rounded-2xl p-5 border border-white/5 
      bg-[var(--muni-surface)]/60 backdrop-blur-md flex items-center justify-between group
    `}
  >
    <div className="z-10">
      <p className="text-[var(--muni-text-muted)] text-xs uppercase tracking-wider font-bold mb-1">{label}</p>
      <h3 className={`text-3xl font-bold ${colorClass} drop-shadow-lg`}>{value}</h3>
    </div>
    <div className={`text-3xl opacity-20 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500 ${colorClass}`}>
      {icon}
    </div>
    {/* Decorative glow */}
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-10 ${colorClass.replace('text-', 'bg-')}`}></div>
  </motion.div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-[#FF671F]/80 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[var(--muni-bg)] text-gray-300 text-sm rounded-lg border border-white/10 px-3 py-2.5 outline-none focus:border-[#FF671F] focus:shadow-[0_0_10px_rgba(255,103,31,0.3)] appearance-none transition-all"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <FaLayerGroup className="absolute right-3 top-3 text-gray-600 pointer-events-none text-xs" />
    </div>
  </div>
);

// --- 3. Main Gallery Component ---

function Gallery() {


  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'All', category: 'All', severity: 'All', sortBy: 'Newest First'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [likedIssues, setLikedIssues] = useState(new Set());
  const itemsPerPage = 9;

  // --- Data Fetching ---
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(data);
      setLoading(false);
    });

    const savedLikes = localStorage.getItem('galleryLikes');
    if (savedLikes) setLikedIssues(new Set(JSON.parse(savedLikes)));

    return () => unsubscribe();
  }, []);

  // --- Actions ---
  const handleUpvote = (e, issueId) => {
    e.preventDefault();
    const newLiked = new Set(likedIssues);
    newLiked.has(issueId) ? newLiked.delete(issueId) : newLiked.add(issueId);
    setLikedIssues(newLiked);
    localStorage.setItem('galleryLikes', JSON.stringify([...newLiked]));
  };

  const handleShare = async (e, issue) => {
    e.preventDefault();
    const url = `${window.location.origin}/report/${issue.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'FixIt Report', text: issue.desc, url }); } catch (err) { console.log(err); }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  // --- Filtering Logic ---
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.desc?.toLowerCase().includes(searchQuery.toLowerCase()) || issue.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'All' || issue.status === filters.status;
    const matchesCat = filters.category === 'All' || issue.type === filters.category;
    const matchesSev = filters.severity === 'All' || issue.severity === filters.severity;
    return matchesSearch && matchesStatus && matchesCat && matchesSev;
  }).sort((a, b) => {
    if (filters.sortBy === 'Newest First') return b.ts?.toDate() - a.ts?.toDate();
    if (filters.sortBy === 'Oldest First') return a.ts?.toDate() - b.ts?.toDate();
    if (filters.sortBy === 'Most Liked') return (likedIssues.has(b.id) ? 1 : 0) - (likedIssues.has(a.id) ? 1 : 0);
    return 0;
  });

  // --- Pagination ---
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentData = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="min-h-screen bg-[var(--muni-bg)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF671F]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans selection:bg-[#FF671F]/30 selection:text-white pb-20">

      {/* --- Header Section --- */}
      <div className="relative pt-24 pb-10 px-6 max-w-7xl mx-auto">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF671F]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]">Gallery</span>
            </h1>
            <p className="text-[var(--muni-text-muted)] text-lg max-w-xl">
              Track real-time infrastructure reports. visualize data, and support your local community improvements.
            </p>
          </div>

          {/* Quick Search Pill */}
          <div className="relative group w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="text-gray-500 group-focus-within:text-[#FF671F] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 pl-11 pr-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-[#FF671F]/50 focus:shadow-[0_0_20px_rgba(255,103,31,0.2)] transition-all"
            />
          </div>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBox label="Total Reports" value={issues.length} icon={<FaLayerGroup />} colorClass="text-[#FF671F]" />
          <StatBox label="In Progress" value={issues.filter(i => i.status === 'in-progress').length} icon={<FaTools />} colorClass="text-[#06038D]" onClick={() => setFilters({ ...filters, status: 'in-progress' })} />
          <StatBox label="Resolved" value={issues.filter(i => i.status === 'resolved').length} icon={<MdCheckCircle />} colorClass="text-[#046A38]" onClick={() => setFilters({ ...filters, status: 'resolved' })} />
          <StatBox label="Critical Issues" value={issues.filter(i => i.severity === 'Critical').length} icon={<MdWarning />} colorClass="text-red-400" onClick={() => setFilters({ ...filters, severity: 'Critical' })} />
        </div>

        {/* --- Controls Bar --- */}
        <div className="bg-[var(--muni-surface)]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-[var(--muni-text-muted)]">
              <FaFilter className="text-[#FF671F]" />
              <span>Filters</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${showFilters ? 'bg-[#FF671F]/20 text-[#FF671F] border-[#FF671F]/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
            >
              {showFilters ? 'Hide Controls' : 'Expand Controls'}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-white/5">
                  <FilterSelect label="Status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} options={['All', 'new', 'in-progress', 'resolved']} />
                  <FilterSelect label="Category" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} options={['All', 'Pothole', 'Garbage', 'Water Leak', 'Other']} />
                  <FilterSelect label="Severity" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })} options={['All', 'Low', 'Medium', 'High', 'Critical']} />
                  <FilterSelect label="Sort By" value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value })} options={['Newest First', 'Oldest First', 'Most Liked']} />
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setFilters({ status: 'All', category: 'All', severity: 'All', sortBy: 'Newest First' })} className="text-xs text-red-400 hover:text-red-300 underline">Reset All Filters</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Gallery Grid --- */}
        {currentData.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl">
            <FaSearch className="mx-auto text-6xl text-gray-800 mb-4" />
            <p className="text-[var(--muni-text-muted)] text-xl">No reports found matching your criteria.</p>
            <button onClick={() => setFilters({ status: 'All', category: 'All', severity: 'All', sortBy: 'Newest First' })} className="mt-4 text-[#FF671F] font-bold hover:underline">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((issue, index) => {
              const sevStyle = getSeverityStyles(issue.severity);
              const statusStyle = getStatusStyles(issue.status);
              const isLiked = likedIssues.has(issue.id);
              const dateStr = issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'N/A';

              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/report/${issue.id}`} className="block h-full">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className={`
                        h-full bg-[var(--muni-surface)]/80 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 
                        hover:border-[#FF671F]/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all group
                      `}
                    >
                      {/* Card Header */}
                      <div className={`px-4 py-3 flex justify-between items-center border-b border-white/5 ${sevStyle.bg}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${sevStyle.text}`}>{getSeverityIcon(issue.severity)}</span>
                          <span className={`text-xs font-bold uppercase tracking-wider text-gray-200`}>{issue.type}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} border-white/5`}>
                          {statusStyle.label}
                        </div>
                      </div>

                      {/* Image Area */}
                      <div className="relative h-48 overflow-hidden bg-black">
                        {issue.imageUrl ? (
                          <img src={issue.imageUrl} alt="Issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700"><FaTools size={30} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-60"></div>

                        {/* Floating ID */}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-[10px] text-[#FF671F] font-mono px-2 py-1 rounded border border-[#FF671F]/20">
                          #{issue.id.substring(0, 6)}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2 h-10 leading-relaxed">
                          {issue.desc || "No description provided."}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-[var(--muni-text-muted)] mb-4">
                          <div className="flex items-center gap-1.5">
                            <FaMapMarkerAlt className="text-[#FF671F]/50" />
                            <span>{issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-[#FF671F]/50" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <button
                            onClick={(e) => handleUpvote(e, issue.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'}`}
                          >
                            {isLiked ? <FaHeart /> : <FaRegHeart />}
                            <span>Support</span>
                          </button>

                          <button
                            onClick={(e) => handleShare(e, issue)}
                            className="text-gray-500 hover:text-[#FF671F] transition-colors"
                          >
                            <FaShareAlt size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-full bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-[#FF671F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm font-mono text-[#FF671F] font-bold">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-full bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-[#FF671F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;