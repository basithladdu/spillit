import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
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
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-Components ---
const StatBox = ({ label, value, icon, accentColor }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 bg-[#0f0f13] border border-white/5 rounded-[32px] overflow-hidden relative group transition-all"
  >
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#ff7ec9]/10 transition-all"></div>
    <div className="relative z-10 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-4xl font-black heading-font text-white">{value}</h3>
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
      className="w-full text-xs font-bold bg-[#0f0f13] text-white border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-[#ff7ec9]/50 transition-all appearance-none cursor-pointer"
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
    // collection name is 'memories'
    const q = query(collection(db, 'memories'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemories(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtering Logic
  const filteredMemories = memories.filter(m => {
    const matchesSearch = (m.caption || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVibe = filters.vibe === 'All' || m.type === filters.vibe;
    return matchesSearch && matchesVibe;
  }).sort((a, b) => {
    if (filters.sortBy === 'Newest First') return (b.ts?.toMillis?.() || 0) - (a.ts?.toMillis?.() || 0);
    if (filters.sortBy === 'Most Loved') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMemories.length / itemsPerPage);
  const currentData = filteredMemories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080c]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff7ec9] border-t-transparent shadow-[0_0_20px_rgba(255,126,201,0.2)]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans pb-24 overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-[#ff7ec9]/5 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

      <div className="relative pt-32 px-6 max-w-7xl mx-auto z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Sparkles size={20} className="text-[#ff7ec9] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">The Collection</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none heading-font">
              The Memory <span className="bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] bg-clip-text text-transparent italic">Archive</span>
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
              className="w-full md:w-96 pl-16 pr-8 py-5 rounded-[40px] bg-[#0f0f13] border border-white/5 focus:border-[#ff7ec9]/30 text-sm font-medium outline-none transition-all shadow-2xl"
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
        <div className="p-8 bg-[#0f0f13] border border-white/5 rounded-[40px] shadow-2xl mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Filter className="text-[#ff7ec9]" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-white">Curate View</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              {showFilters ? 'Hide' : 'Options'}
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
          <div className="text-center py-32 bg-[#0f0f13] border border-white/5 rounded-[40px] shadow-2xl">
            <Ghost className="text-slate-800 mx-auto mb-6" size={64} />
            <h3 className="text-2xl font-bold mb-2 heading-font text-white">Nothing Spilled Yet</h3>
            <p className="text-slate-500 font-medium italic">This archive is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentData.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col bg-[#0f0f13] border border-white/5 rounded-[40px] overflow-hidden hover:border-[#ff7ec9]/30 transition-all shadow-xl"
              >
                {/* Photo */}
                <div className="relative h-64 overflow-hidden">
                  {memory.imageUrl ? (
                    <img
                      src={memory.imageUrl}
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

                  <p className="text-base text-slate-200 line-clamp-3 leading-relaxed italic">
                    &quot;{memory.caption || 'A silent memory whispered into the map...'}&quot;
                  </p>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <Calendar size={12} className="text-[#ff7ec9]" />
                      {memory.ts ? new Date(memory.ts.seconds * 1000).toLocaleDateString() : 'Hidden Date'}
                    </div>

                    <Link
                      to={`/memory/${memory.id}`}
                      className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#ff7ec9] hover:text-white transition-all flex items-center gap-2 shadow-lg"
                    >
                      Enter <Eye size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-20 gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-14 h-14 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center justify-center text-white disabled:opacity-30 hover:border-[#ff7ec9] transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center px-8 font-black text-sm uppercase tracking-widest heading-font">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-14 h-14 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center justify-center text-white disabled:opacity-30 hover:border-[#ff7ec9] transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Gallery;