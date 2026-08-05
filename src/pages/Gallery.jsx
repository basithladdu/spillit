import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import {
  Heart,
  MapPin,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ghost,
  Eye,
  Hash,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageSrcSet, getOptimizedImageUrl } from '../utils/imageOptimizer';
import { timeAgo, uniqueCityCount } from '../utils/format';
import { PageSpinner, FetchErrorPanel } from '../components/UI/PageStatus';

// --- Sub-Components ---
const StatBox = ({ label, value, icon, accentColor }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 bg-white border-2 border-foreground rounded-[32px] overflow-hidden relative group transition-all shadow-pop"
  >
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#ff7ec9]/10 transition-all"></div>
    <div className="relative z-10 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-4xl font-black heading-font text-foreground">{value}</h3>
        <div className="text-2xl p-3 bg-white/5 rounded-2xl group-hover:text-[#ff7ec9] transition-colors" style={{ color: accentColor }}>
          {icon}
        </div>
      </div>
    </div>
  </motion.div>
);

const FilterSelect = ({ id, label, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-foreground bg-white px-5 py-4 text-xs font-black text-foreground shadow-pop outline-none transition-all focus:border-accent focus:shadow-focus"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- Main Gallery Component ---
function Gallery() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState({
    vibe: 'All', sortBy: 'Newest First'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  // Data Fetching
  useEffect(() => {
    let active = true;
    const fetchMemories = async () => {
      setLoadError(false);
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!active) return;
      
      if (error) {
        console.error('[Gallery] Failed to load memories:', error.message);
        setLoadError(true);
      } else if (data) {
        setMemories(data);
      }
      if (active) setLoading(false);
    };

    fetchMemories();

    const channel = supabase
      .channel('gallery_changes')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, () => {
        fetchMemories();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [retryCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.vibe, filters.sortBy]);

  // Filtering Logic
  const filteredMemories = memories.filter(m => {
    const matchesSearch = (m.caption || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVibe = filters.vibe === 'All' || m.type === filters.vibe;
    return matchesSearch && matchesVibe;
  }).sort((a, b) => {
    if (filters.sortBy === 'Newest First') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (filters.sortBy === 'Most Loved') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMemories.length / itemsPerPage);
  const currentData = filteredMemories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <PageSpinner label="Loading archive" />;

  if (loadError) return (
    <FetchErrorPanel
      eyebrow="Archive paused"
      title="The spills are taking a moment."
      onRetry={() => { setLoading(true); setRetryCount((count) => count + 1); }}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
      
        {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-secondary/5 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

      <div className="relative pt-32 px-6 max-w-7xl mx-auto z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-[#ff7ec9] animate-pulse" aria-hidden="true" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">The Collection</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none heading-font text-foreground">
              Memory <span className="text-accent italic">Archive</span>
            </h1>
            <p className="text-sm md:text-base max-w-xl text-slate-400 font-medium leading-relaxed pl-6 border-l-2 border-[#ff7ec9]/30">
              A curated tapestry of anonymous human moments, pinned forever to the spots where they happened.
            </p>
          </div>

          {/* Search */}
          <div className="w-full md:w-auto relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff7ec9] transition-colors" size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search memories"
              autoComplete="off"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-2 border-foreground bg-white py-5 pr-8 pl-16 text-sm font-black text-foreground shadow-pop outline-none transition-all placeholder-slate-400 focus:border-accent focus:shadow-focus md:w-96"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatBox label="Total Memories" value={memories.length} icon={<Ghost size={20} />} accentColor="#ff7ec9" />
          <StatBox label="Love Poured" value={memories.reduce((acc, m) => acc + (m.upvotes || 0), 0)} icon={<Heart size={20} />} accentColor="#a78bfa" />
          <StatBox label="Sprawl" value={uniqueCityCount(memories)} icon={<MapPin size={20} />} accentColor="#4ade80" />
        </div>

        {/* Filters */}
        <div className="p-8 bg-white border-2 border-foreground rounded-[40px] shadow-pop mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Filter className="text-secondary" size={18} strokeWidth={2.5} />
              <span className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">Curate View</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="gallery-filter-panel"
              className="rounded-full border-2 border-foreground bg-muted px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-pop transition-all heading-font hover:border-accent hover:bg-accent hover:text-white"
            >
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                id="gallery-filter-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
              >
                <FilterSelect
                  id="gallery-vibe-filter"
                  label="Vibe"
                  value={filters.vibe}
                  onChange={(e) => setFilters({ ...filters, vibe: e.target.value })}
                  options={['All', 'Moment', 'Crush', 'Secret', 'Laugh']}
                />
                <FilterSelect
                  id="gallery-sort-filter"
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  options={['Newest First', 'Most Loved']}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Grid */}
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {currentData.length} {currentData.length === 1 ? 'memory' : 'memories'} shown
        </p>
        {currentData.length === 0 ? (
          <div className="text-center py-32 bg-card border-2 border-foreground rounded-2xl shadow-pop">
          <Ghost className="text-muted-foreground mx-auto mb-6" size={64} strokeWidth={1.5} aria-hidden="true" />
            <h3 className="heading-font text-2xl font-bold mb-2 text-foreground">Nothing Spilled Yet</h3>
            <p className="text-muted-foreground italic">This archive is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentData.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col bg-white border-2 border-foreground rounded-[40px] overflow-hidden hover:border-accent transition-all shadow-pop hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-64 overflow-hidden">
                  {memory.image_url ? (
                    <img
                      src={getOptimizedImageUrl(memory.image_url, 640)}
                      srcSet={getOptimizedImageSrcSet(memory.image_url)}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      alt={memory.caption ? `Memory: ${memory.caption.slice(0, 60)}` : 'Memory photo'}
                      loading="lazy"
                      decoding="async"
                      width="640"
                      height="256"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
          <Ghost size={48} className="text-slate-800" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                      {memory.type || 'Moment'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                       <Hash size={11} className="text-[#a78bfa]" />
                       {memory.id.slice(-8)}
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-[#ff7ec9]">
          <Heart size={14} className="fill-current" aria-hidden="true" />
                       {memory.upvotes || 0}
                     </div>
                  </div>

                  <p className="text-base text-foreground font-bold line-clamp-2 leading-relaxed italic">
                    &quot;{memory.caption || 'A silent memory whispered into the map...'}&quot;
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-muted border border-foreground flex items-center justify-center text-accent">
                      <User size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Anonymous
                    </span>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <Calendar size={12} className="text-[#ff7ec9]" aria-hidden="true" />
                      {memory.created_at ? timeAgo(memory.created_at) : 'Hidden Date'}
                    </div>

                    <Link
                      to={`/memory/${memory.id}`}
                      className="px-6 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-foreground hover:shadow-pop transition-all flex items-center gap-2"
                    >
          Enter <Eye size={12} strokeWidth={3} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-20 gap-4 items-center">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="w-12 h-12 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-foreground disabled:opacity-30 shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
          <ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <div className="heading-font font-bold text-sm uppercase tracking-widest text-foreground px-4">
              {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-12 h-12 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-foreground disabled:opacity-30 shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
          <ChevronRight size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Gallery;
