import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  FaSearch, FaFilter, FaHeart, FaRegHeart,
  FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaCalendarAlt,
  FaTools, FaLayerGroup
} from 'react-icons/fa';
import { MdCheckCircle, MdWarning, MdGpsFixed } from 'react-icons/md';
import { Sun, Moon } from 'lucide-react';

// --- Style Helpers ---
const getSeverityStyles = (severity, isLightMode) => {
  switch (severity) {
    case 'Critical': return {
      bg: isLightMode ? 'bg-red-100' : 'bg-red-500/30',
      border: isLightMode ? 'border-red-300' : 'border-red-400/60',
      text: isLightMode ? 'text-red-700' : 'text-red-400'
    };
    case 'High': return {
      bg: isLightMode ? 'bg-orange-100' : 'bg-orange-500/30',
      border: isLightMode ? 'border-orange-300' : 'border-orange-400/60',
      text: isLightMode ? 'text-orange-700' : 'text-orange-400'
    };
    case 'Medium': return {
      bg: isLightMode ? 'bg-yellow-100' : 'bg-yellow-500/30',
      border: isLightMode ? 'border-yellow-300' : 'border-yellow-400/60',
      text: isLightMode ? 'text-yellow-700' : 'text-yellow-400'
    };
    case 'Low': return {
      bg: isLightMode ? 'bg-emerald-100' : 'bg-emerald-500/30',
      border: isLightMode ? 'border-emerald-300' : 'border-emerald-400/60',
      text: isLightMode ? 'text-emerald-700' : 'text-emerald-400'
    };
    default: return {
      bg: isLightMode ? 'bg-gray-100' : 'bg-gray-500/30',
      border: isLightMode ? 'border-gray-300' : 'border-gray-400/60',
      text: isLightMode ? 'text-gray-700' : 'text-gray-400'
    };
  }
};

const getStatusStyles = (status, isLightMode) => {
  const s = (status || 'new').toLowerCase();
  if (s === 'resolved') return {
    bg: isLightMode ? 'bg-green-100' : 'bg-[#10b981]/30',
    text: isLightMode ? 'text-green-700' : 'text-[#10b981]',
    label: 'Resolved'
  };
  if (s === 'in_progress' || s === 'in-progress') return {
    bg: isLightMode ? 'bg-indigo-100' : 'bg-[#06038D]/30',
    text: isLightMode ? 'text-indigo-700' : 'text-[#06038D]',
    label: 'In Progress'
  };
  return {
    bg: isLightMode ? 'bg-orange-100' : 'bg-[#FF671F]/30',
    text: isLightMode ? 'text-orange-700' : 'text-[#FF671F]',
    label: 'Open'
  };
};

// --- Sub-Components ---
const StatBox = ({ label, value, icon, colorClass, onClick, accentColor, isLightMode }) => (
  <div
    onClick={onClick}
    className={`p-6 border-l-4 cursor-pointer relative group transition-all duration-200 rounded-xl hover:-translate-y-1 ${isLightMode
        ? 'bg-white border border-gray-200 hover:shadow-xl'
        : 'bg-[#18181b] border border-white/10 hover:border-white/20 hover:shadow-2xl'
      }`}
    style={{ borderLeftColor: accentColor }}
  >
    <div className="relative z-10 flex flex-col gap-2">
      <p className={`text-[11px] uppercase tracking-[0.2em] font-bold ${isLightMode ? 'text-gray-600' : 'text-gray-400'
        }`}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className={`text-5xl font-black font-mono tracking-tighter ${colorClass}`}>
          {value}
        </h3>
        <div className={`text-4xl opacity-40 group-hover:opacity-80 transition-opacity duration-300 ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options, isLightMode }) => (
  <div className="flex flex-col gap-2">
    <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${isLightMode ? 'text-orange-600' : 'text-[#FF671F]/80'
      }`}>{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full text-sm rounded-xl border px-4 py-3 outline-none transition-all appearance-none ${isLightMode
            ? 'bg-white text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
            : 'bg-[#0a0a0f] text-gray-300 border-white/10 focus:border-[#FF671F]'
          }`}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <FaLayerGroup className={`absolute right-4 top-4 text-xs pointer-events-none ${isLightMode ? 'text-gray-400' : 'text-gray-600'
        }`} />
    </div>
  </div>
);

// --- Main Gallery Component ---
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
  const [isLightMode, setIsLightMode] = useState(false);
  const itemsPerPage = 9;

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('gallery-theme');
    setIsLightMode(savedTheme === 'light');
  }, []);

  // Data Fetching
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

  // Actions
  const handleUpvote = (e, issueId) => {
    e.preventDefault();
    const newLiked = new Set(likedIssues);
    newLiked.has(issueId) ? newLiked.delete(issueId) : newLiked.add(issueId);
    setLikedIssues(newLiked);
    localStorage.setItem('galleryLikes', JSON.stringify([...newLiked]));
  };

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem('gallery-theme', newMode ? 'light' : 'dark');
  };

  // Filtering Logic
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

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentData = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isLightMode ? 'bg-gray-50' : 'bg-[#0a0a0f]'
      }`}>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FF671F]"></div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-20 transition-colors duration-300 ${isLightMode ? 'bg-gray-50 text-gray-900' : 'bg-[#0a0a0f] text-white'
      }`}>

      {/* Header Section */}
      <div className="relative pt-16 md:pt-20 pb-10 px-6 max-w-7xl mx-auto">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div className="space-y-3">
            <h1 className={`text-5xl md:text-7xl font-black tracking-tighter leading-none ${isLightMode ? 'text-gray-900' : 'text-white'
              }`}>
              Community <span className="text-[#FF671F]">Gallery</span>
            </h1>
            <p className={`text-sm md:text-base max-w-xl font-medium leading-relaxed border-l-4 border-[#FF671F] pl-4 ${isLightMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
              Visualizing city-wide infrastructure reports and civic intelligence.
            </p>
          </div>

          {/* Search & Theme Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className={`transition-colors ${isLightMode ? 'text-gray-400 group-focus-within:text-orange-500' : 'text-gray-500 group-focus-within:text-[#FF671F]'
                  }`} />
              </div>
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full md:w-80 pl-11 pr-4 py-3.5 rounded-full text-sm transition-all ${isLightMode
                    ? 'bg-white border-2 border-gray-300 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                    : 'bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#FF671F]/50'
                  }`}
              />
            </div>
            <button
              onClick={toggleTheme}
              className={`p-3.5 rounded-full transition-all ${isLightMode
                  ? 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatBox
            label="Total Reports"
            value={issues.length}
            icon={<FaLayerGroup />}
            colorClass="text-[#FF671F]"
            accentColor="#FF671F"
            onClick={() => {
              setFilters({ status: 'All', category: 'All', severity: 'All', sortBy: 'Newest First' });
              setSearchQuery('');
              setCurrentPage(1);
            }}
            isLightMode={isLightMode}
          />
          <StatBox
            label="Active Fixes"
            value={issues.filter(i => i.status === 'in-progress' || i.status === 'in_progress').length}
            icon={<FaTools />}
            colorClass="text-blue-500"
            accentColor="#3b82f6"
            onClick={() => {
              setFilters({ status: 'in-progress', category: 'All', severity: 'All', sortBy: 'Newest First' });
              setSearchQuery('');
              setCurrentPage(1);
            }}
            isLightMode={isLightMode}
          />
          <StatBox
            label="Success"
            value={issues.filter(i => i.status === 'resolved').length}
            icon={<MdCheckCircle />}
            colorClass="text-[#10b981]"
            accentColor="#10b981"
            onClick={() => {
              setFilters({ status: 'resolved', category: 'All', severity: 'All', sortBy: 'Newest First' });
              setSearchQuery('');
              setCurrentPage(1);
            }}
            isLightMode={isLightMode}
          />
          <StatBox
            label="Critical"
            value={issues.filter(i => i.severity === 'Critical').length}
            icon={<MdWarning />}
            colorClass="text-red-500"
            accentColor="#ef4444"
            onClick={() => {
              setFilters({ status: 'All', category: 'All', severity: 'Critical', sortBy: 'Newest First' });
              setSearchQuery('');
              setCurrentPage(1);
            }}
            isLightMode={isLightMode}
          />
        </div>

        {/* Controls Bar */}
        <div className={`rounded-2xl p-5 mb-10 shadow-lg transition-colors ${isLightMode ? 'bg-white border-2 border-gray-200' : 'bg-[#18181b]/80 border border-white/5'
          }`}>
          <div className="flex justify-between items-center">
            <div className={`flex items-center gap-2.5 text-sm font-semibold ${isLightMode ? 'text-gray-700' : 'text-gray-300'
              }`}>
              <FaFilter className="text-[#FF671F]" />
              <span>Filters</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${showFilters
                  ? 'bg-[#FF671F]/20 text-[#FF671F] border-[#FF671F]/30'
                  : isLightMode
                    ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
            >
              {showFilters ? 'Hide Controls' : 'Expand Controls'}
            </button>
          </div>

          {showFilters && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 mt-5 border-t ${isLightMode ? 'border-gray-200' : 'border-white/5'
              }`}>
              <FilterSelect
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={['All', 'new', 'in-progress', 'resolved']}
                isLightMode={isLightMode}
              />
              <FilterSelect
                label="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                options={['All', 'Pothole', 'Street Light', 'Garbage', 'Water Leak', 'Other']}
                isLightMode={isLightMode}
              />
              <FilterSelect
                label="Severity"
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                options={['All', 'Critical', 'High', 'Medium', 'Low']}
                isLightMode={isLightMode}
              />
              <FilterSelect
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                options={['Newest First', 'Oldest First', 'Most Supported']}
                isLightMode={isLightMode}
              />
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {currentData.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl ${isLightMode ? 'bg-white border-2 border-gray-200' : 'bg-[#18181b] border border-white/10'
            }`}>
            <FaMapMarkerAlt className={`text-6xl mx-auto mb-4 ${isLightMode ? 'text-gray-300' : 'text-gray-700'
              }`} />
            <h3 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-gray-900' : 'text-white'
              }`}>No Reports Found</h3>
            <p className={isLightMode ? 'text-gray-600' : 'text-gray-400'}>
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((issue) => {
              const sevStyles = getSeverityStyles(issue.severity, isLightMode);
              const statusStyles = getStatusStyles(issue.status, isLightMode);
              const isLiked = likedIssues.has(issue.id);

              return (
                <div
                  key={issue.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 ${isLightMode
                      ? 'bg-white border-2 border-gray-200 hover:border-orange-400 hover:shadow-2xl'
                      : 'bg-[#18181b] border border-white/10 hover:border-[#FF671F]/40 hover:shadow-2xl'
                    }`}
                >
                  {/* Image Section */}
                  <div className="relative h-60 overflow-hidden">
                    {issue.imageUrl ? (
                      <img
                        src={issue.imageUrl}
                        alt={issue.type}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-gray-100' : 'bg-white/5'
                        }`}>
                        <FaMapMarkerAlt className={`text-4xl ${isLightMode ? 'text-gray-300' : 'text-gray-700'
                          }`} />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest ${sevStyles.bg} ${sevStyles.text} ${sevStyles.border}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest ${statusStyles.bg} ${statusStyles.text} ${isLightMode ? 'border-gray-300' : 'border-white/10'
                        }`}>
                        {statusStyles.label}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-2xl font-black leading-tight mb-1.5 transition-colors ${isLightMode
                            ? 'text-gray-900 hover:text-orange-600'
                            : 'text-white hover:text-[#FF671F]'
                          }`}>{issue.type}</h3>
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ${isLightMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                          <MdGpsFixed size={11} className="text-[#FF671F]" />
                          {issue.id.slice(0, 8)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleUpvote(e, issue.id)}
                        className={`p-3 rounded-2xl transition-all ${isLiked
                            ? 'text-red-500 bg-red-500/10'
                            : isLightMode
                              ? 'text-gray-400 bg-gray-100 hover:text-gray-700 hover:bg-gray-200'
                              : 'text-gray-500 bg-white/5 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                      </button>
                    </div>

                    <p className={`text-sm leading-relaxed line-clamp-2 mb-6 italic ${isLightMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      "{issue.desc || 'No detailed description available.'}"
                    </p>

                    <div className={`mt-auto flex items-center justify-between pt-5 border-t ${isLightMode ? 'border-gray-200' : 'border-white/5'
                      }`}>
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight ${isLightMode ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                        <FaCalendarAlt className="text-[#FF671F]" />
                        <span>{issue.ts?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>

                      <Link
                        to={`/report/${issue.id}`}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300 ${isLightMode
                            ? 'text-gray-700 bg-gray-100 hover:bg-[#FF671F] hover:text-white border border-gray-300 hover:border-[#FF671F]'
                            : 'text-white bg-white/5 hover:bg-[#FF671F] hover:text-black'
                          }`}
                      >
                        Details
                        <FaChevronRight className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-3.5 rounded-xl border transition-all ${isLightMode
                  ? 'bg-white border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-100'
                  : 'bg-[#18181b] border-white/10 text-white disabled:opacity-50 hover:border-[#FF671F]'
                }`}
            >
              <FaChevronLeft />
            </button>
            <div className={`flex items-center px-6 font-bold ${isLightMode ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-3.5 rounded-xl border transition-all ${isLightMode
                  ? 'bg-white border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-100'
                  : 'bg-[#18181b] border-white/10 text-white disabled:opacity-50 hover:border-[#FF671F]'
                }`}
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