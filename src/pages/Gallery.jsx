import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaFilter, FaHeart, FaRegHeart,
  FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaCalendarAlt,
  FaTools, FaLayerGroup
} from 'react-icons/fa';
import { MdError, MdWarning, MdCheckCircle, MdGpsFixed } from 'react-icons/md';

// --- 1. Shared Style Helpers (Matched to Home.jsx) ---


const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'Critical': return { bg: 'bg-red-500/30', border: 'border-red-400/60', text: 'text-red-400', glow: 'shadow-red-400/40' };
    case 'High': return { bg: 'bg-orange-500/30', border: 'border-orange-400/60', text: 'text-orange-400', glow: 'shadow-orange-400/40' };
    case 'Medium': return { bg: 'bg-yellow-500/30', border: 'border-yellow-400/60', text: 'text-yellow-400', glow: 'shadow-yellow-400/40' };
    case 'Low': return { bg: 'bg-emerald-500/30', border: 'border-emerald-400/60', text: 'text-emerald-400', glow: 'shadow-emerald-400/40' };
    default: return { bg: 'bg-gray-500/30', border: 'border-gray-400/60', text: 'text-gray-400', glow: 'shadow-gray-400/40' };
  }
};

const getStatusStyles = (status) => {
  const s = (status || 'new').toLowerCase();
  if (s === 'resolved') return { bg: 'bg-[#10b981]/30', text: 'text-[#10b981]', label: 'Resolved' };
  if (s === 'in_progress') return { bg: 'bg-[#06038D]/30', text: 'text-[#06038D]', label: 'In Progress' };
  return { bg: 'bg-[#FF671F]/30', text: 'text-[#FF671F]', label: 'Open' };
};

// --- 2. Sub-Components ---

const StatBox = ({ label, value, icon, colorClass, onClick, accentColor }) => (
  <motion.div
    whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.03)' }}
    onClick={onClick}
    className="muni-card p-5 border-l-4 cursor-pointer relative group transition-all"
    style={{ borderLeftColor: accentColor, backgroundColor: 'var(--muni-surface)' }}
  >
    <div className="relative z-10 flex flex-col gap-1">
      <p className="text-[var(--muni-text-muted)] text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className={`text-4xl font-black font-mono tracking-tighter ${colorClass}`}>
          {value}
        </h3>
        <div className={`text-3xl opacity-30 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300 ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
    {/* Subtle scanline effect */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>
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
    if (filters.sortBy === 'Most Supported') return (b.upvotes || 0) - (a.upvotes || 0);
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
      <div className="relative pt-20 pb-8 px-6 max-w-7xl mx-auto">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF671F]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF671F] animate-pulse"></div>
              <span className="text-[9px] font-mono text-[#FF671F] uppercase tracking-[0.2em]">System Live • Community Ops</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-[#ffffff] to-[#10b981] animate-gradient">Gallery</span>
            </h1>
            <p className="text-[var(--muni-text-muted)] text-base max-w-xl font-medium leading-relaxed opacity-50 border-l border-white/10 pl-4">
              Visualizing city-wide infrastructure reports and civic intelligence.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatBox label="Total Reports" value={issues.length} icon={<FaLayerGroup />} colorClass="text-[#FF671F]" accentColor="#FF671F" />
          <StatBox label="Active Fixes" value={issues.filter(i => i.status === 'in-progress').length} icon={<FaTools />} colorClass="text-blue-400" accentColor="#3b82f6" onClick={() => setFilters({ ...filters, status: 'in-progress' })} />
          <StatBox label="Success" value={issues.filter(i => i.status === 'resolved').length} icon={<MdCheckCircle />} colorClass="text-[#10b981]" accentColor="#10b981" onClick={() => setFilters({ ...filters, status: 'resolved' })} />
          <StatBox label="Critical" value={issues.filter(i => i.severity === 'Critical').length} icon={<MdWarning />} colorClass="text-red-500" accentColor="#ef4444" onClick={() => setFilters({ ...filters, severity: 'Critical' })} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-white/5">
                  <FilterSelect
                    label="Status"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    options={['All', 'new', 'in-progress', 'resolved']}
                  />
                  <FilterSelect
                    label="Category"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    options={['All', 'Pothole', 'Street Light', 'Garbage', 'Water Leak', 'Other']}
                  />
                  <FilterSelect
                    label="Severity"
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    options={['All', 'Critical', 'High', 'Medium', 'Low']}
                  />
                  <FilterSelect
                    label="Sort By"
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    options={['Newest First', 'Oldest First', 'Most Supported']}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Gallery Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {currentData.map((issue) => {
              const sevStyles = getSeverityStyles(issue.severity);
              const statusStyles = getStatusStyles(issue.status);
              const isLiked = likedIssues.has(issue.id);

              return (
                <motion.div
                  key={issue.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="group relative bg-[var(--muni-surface)] border border-[var(--muni-border)] rounded-2xl overflow-hidden hover:border-[#FF671F]/40 transition-all duration-300 flex flex-col"
                >
                  {/* Image Section */}
                  <div className="relative h-56 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent z-10"></div>
                    {issue.imageUrl ? (
                      <img src={issue.imageUrl} alt={issue.type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-[var(--muni-text-muted)]">
                        <FaMapMarkerAlt className="text-3xl opacity-20" />
                      </div>
                    )}

                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border backdrop-blur-md tracking-widest ${sevStyles.bg} ${sevStyles.text} ${sevStyles.border}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border backdrop-blur-md tracking-widest ${statusStyles.bg} ${statusStyles.text} border-white/10`}>
                        {statusStyles.label}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-[#FF671F] transition-colors leading-tight mb-1">{issue.type}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--muni-text-muted)] font-mono uppercase tracking-widest">
                          <MdGpsFixed size={10} className="text-[#FF671F]" />
                          {issue.id.slice(0, 8)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleUpvote(e, issue.id)}
                        className={`p-3 rounded-2xl transition-all ${isLiked ? 'text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-500 bg-white/5 hover:text-white hover:bg-white/10'}`}
                      >
                        {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                      </button>
                    </div>

                    <p className="text-[var(--muni-text-muted)] text-sm leading-relaxed line-clamp-2 mb-6 opacity-70 italic">
                      "{issue.desc || 'No detailed description available.'}"
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-tighter">
                        <FaCalendarAlt className="text-[#FF671F]" />
                        <span>{issue.ts?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>

                      <Link
                        to={`/report/${issue.id}`}
                        className="group/btn flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-white/5 hover:bg-[#FF671F] hover:text-black px-5 py-2.5 rounded-full transition-all duration-300"
                      >
                        Details
                        <FaChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-xl bg-[var(--muni-surface)] border border-white/10 text-white disabled:opacity-50 hover:border-[#FF671F] transition-colors"
            >
              <FaChevronLeft />
            </button>
            <div className="flex items-center px-4 font-bold text-[var(--muni-text-muted)]">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-xl bg-[var(--muni-surface)] border border-white/10 text-white disabled:opacity-50 hover:border-[#FF671F] transition-colors"
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