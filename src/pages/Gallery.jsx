import React, { useState, useEffect, useRef } from 'react';
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
  Ghost,
  Eye,
  Hash,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageSrcSet, getOptimizedImageUrl } from '../utils/imageOptimizer';
import { timeAgo, isValidCoord } from '../utils/format';
import { PageSpinner, FetchErrorPanel } from '../components/UI/PageStatus';

// --- Sub-Components ---
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
  const skipPageScrollRef = useRef(true);

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
    const matchesSearch = [m.caption, m.type, m.address, m.id].some(value => String(value || '').toLowerCase().includes(searchQuery.trim().toLowerCase()));
    const matchesVibe = filters.vibe === 'All' || m.type === filters.vibe;
    return matchesSearch && matchesVibe;
  }).sort((a, b) => {
    if (filters.sortBy === 'Newest First') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (filters.sortBy === 'Most Loved') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMemories.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const currentData = filteredMemories.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  useEffect(() => { setCurrentPage(safePage); }, [safePage]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (totalPages <= 1) return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (event.key === 'ArrowLeft') setCurrentPage((p) => Math.max(1, p - 1));
      if (event.key === 'ArrowRight') setCurrentPage((p) => Math.min(totalPages, p + 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [totalPages]);

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false;
      return;
    }
    document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

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

      <div className="relative pt-8 md:pt-12 px-4 md:px-6 max-w-7xl mx-auto z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none heading-font text-foreground">
              Memory <span className="text-accent italic">Archive</span>
            </h1>
          </div>

          {/* Search */}
          <div className="w-full md:w-auto relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff7ec9] transition-colors" size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search memories"
              autoComplete="off"
              placeholder="Search stories, places or IDs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-2 border-foreground bg-white py-3 pr-14 pl-16 text-sm font-black text-foreground shadow-pop outline-none transition-all placeholder-slate-400 focus:border-accent focus:shadow-focus md:w-96"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">{memories.length} memories loaded</p>

        {/* Filters */}
        <div className="py-4 border-y-2 border-border mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Filter className="text-secondary" size={18} strokeWidth={2.5} />
              <span className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">Browse memories</span>
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

          {(filters.vibe !== 'All' || searchQuery) && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active:</span>
              {filters.vibe !== 'All' && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, vibe: 'All' }))}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-accent hover:text-white transition-colors"
                >
                  {filters.vibe}
                  <X size={12} strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">Remove vibe filter</span>
                </button>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-accent hover:text-white transition-colors"
                >
                  &ldquo;{searchQuery.length > 24 ? `${searchQuery.slice(0, 24)}…` : searchQuery}&rdquo;
                  <X size={12} strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div id="gallery-grid">
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {filteredMemories.length} {filteredMemories.length === 1 ? 'match' : 'matches'}
          {totalPages > 1 ? `, page ${currentPage} of ${totalPages}` : ''}
        </p>
        {currentData.length === 0 ? (
          <div className="text-center py-32 bg-card border-2 border-foreground rounded-2xl shadow-pop">
          <Ghost className="text-muted-foreground mx-auto mb-6" size={64} strokeWidth={1.5} aria-hidden="true" />
            {memories.length === 0 ? (
              <>
                <h3 className="heading-font text-2xl font-bold mb-2 text-foreground">Nothing Spilled Yet</h3>
                <p className="text-muted-foreground italic mb-6">This archive is currently empty.</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-accent px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-pop hover:-translate-y-0.5 transition-transform"
                >
                  Spill the first memory
                </Link>
              </>
            ) : (
              <>
                <h3 className="heading-font text-2xl font-bold mb-2 text-foreground">No matches</h3>
                <p className="text-muted-foreground italic mb-6">Try a different search or clear your filters.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setFilters({ vibe: 'All', sortBy: 'Newest First' }); }}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentData.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col bg-white border-2 border-foreground rounded-2xl overflow-hidden hover:border-accent transition-all shadow-pop hover:-translate-y-1"
              >
                {/* Photo */}
                <div className={`relative overflow-hidden ${memory.image_url ? 'h-48' : 'h-14'}`}>
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
                  ) : null}
                  <div className="absolute top-4 left-5 flex gap-2">
                    <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                      {memory.type || 'Moment'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col gap-3">
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

                  {memory.address && (
                    <p
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate"
                      title={memory.address}
                    >
                      <MapPin size={11} className="shrink-0 text-[#ff7ec9]" aria-hidden="true" />
                      <span className="truncate">{memory.address.split(',')[0]}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-muted border border-foreground flex items-center justify-center text-accent">
                      <User size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Anonymous
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <Calendar size={12} className="text-[#ff7ec9]" aria-hidden="true" />
                      {memory.created_at ? timeAgo(memory.created_at) : 'Hidden Date'}
                    </div>

                    <div className="flex items-center gap-3">
                      {isValidCoord(memory.lat, memory.lng) && (
                        <Link
                          to={`/?lat=${memory.lat}&lng=${memory.lng}&memory=${memory.id}`}
                          className="inline-flex min-h-11 items-center text-[10px] font-black uppercase tracking-widest text-accent hover:text-secondary transition-colors"
                          aria-label="View memory on map"
                        >
                          Map
                        </Link>
                      )}
                      <Link
                        to={`/memory/${memory.id}`}
                        className="px-6 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-foreground hover:shadow-pop transition-all flex items-center gap-2"
                      >
                        Read <Eye size={12} strokeWidth={3} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Gallery pages" className="flex justify-center mt-20 gap-4 items-center">
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
          </nav>
        )}

      </div>
    </div>
  );
}

export default Gallery;
