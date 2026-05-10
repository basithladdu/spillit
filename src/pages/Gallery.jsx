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
  Flame,
  Star,
  Eye,
  Hash,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-slate-500">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full text-xs font-black bg-white text-foreground border-2 border-foreground rounded-2xl px-5 py-4 outline-none focus:border-accent focus:shadow-focus transition-all appearance-none cursor-pointer shadow-pop"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- Main Gallery Component ---
function Gallery() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vibe: 'All', sortBy: 'Newest First'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  // Data Fetching
  useEffect(() => {
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMemories(data);
      }
      setLoading(false);
    };

    fetchMemories();

    const channel = supabase
      .channel('gallery_changes')
      .on('postgres_changes', { event: '*', table: 'memories', schema: 'public' }, () => {
        fetchMemories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
    </div>
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
               <Sparkles size={20} className="text-[#ff7ec9] animate-pulse" />
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
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff7ec9] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 pl-16 pr-8 py-5 rounded-full bg-white border-2 border-foreground focus:border-accent text-sm font-black outline-none transition-all shadow-pop focus:shadow-focus text-foreground placeholder-slate-400"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatBox label="Total Memories" value={memories.length} icon={<Ghost size={20} />} accentColor="#ff7ec9" />
          <StatBox label="Love Poured" value={memories.reduce((acc, m) => acc + (m.upvotes || 0), 0)} icon={<Heart size={20} />} accentColor="#a78bfa" />
          <StatBox label="Sprawl" value={new Set(memories.map(m => m.address?.split(',')[0])).size} icon={<MapPin size={20} />} accentColor="#4ade80" />
        </div>

        {/* Filters */}
        <div className="p-8 bg-white border-2 border-foreground rounded-[40px] shadow-pop mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Filter className="text-secondary" size={18} strokeWidth={2.5} />
              <span className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">Curate View</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2.5 rounded-full bg-muted border-2 border-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all heading-font shadow-pop"
            >
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
              >
                <FilterSelect
                  label="Vibe"
                  value={filters.vibe}
                  onChange={(e) => setFilters({ ...filters, vibe: e.target.value })}
                  options={['All', 'Moment', 'Crush', 'Secret', 'Laugh']}
                />
                <FilterSelect
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
        {currentData.length === 0 ? (
          <div className="text-center py-32 bg-card border-2 border-foreground rounded-2xl shadow-pop">
            <Ghost className="text-muted-foreground mx-auto mb-6" size={64} strokeWidth={1.5} />
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
                      src={memory.image_url}
                      alt="memory"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                       <Ghost size={48} className="text-slate-800" />
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
                       <Heart size={14} className="fill-current" />
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
                      <Calendar size={12} className="text-[#ff7ec9]" />
                      {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : 'Hidden Date'}
                    </div>

                    <Link
                      to={`/memory/${memory.id}`}
                      className="px-6 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-foreground hover:shadow-pop transition-all flex items-center gap-2"
                    >
                      Enter <Eye size={12} strokeWidth={3} />
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-12 h-12 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-foreground disabled:opacity-30 shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="heading-font font-bold text-sm uppercase tracking-widest text-foreground px-4">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-12 h-12 rounded-full bg-card border-2 border-foreground flex items-center justify-center text-foreground disabled:opacity-30 shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Gallery;