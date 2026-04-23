import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Search, Filter, Trash2, Layers,
  ArrowUpDown, X, Info, MapPin, 
  Calendar, Hash, Eye, Download,
  Heart, Shield, AlertTriangle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// --- Shared Style Helpers ---

const getVibeConfig = (vibe) => {
  switch (vibe) {
    case 'Shock': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle };
    case 'High': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Shield };
    case 'Moment': return { color: 'text-[var(--spillit-primary)]', bg: 'bg-[var(--spillit-primary)]/10', border: 'border-[var(--spillit-primary)]/30', icon: Heart };
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Info };
  }
};

const getStatusConfig = (status) => {
  const s = (status || 'active').toLowerCase();
  if (s === 'mined' || s === 'archived') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Archived' };
  return { color: 'text-[var(--spillit-secondary)]', bg: 'bg-[var(--spillit-secondary)]/10', border: 'border-[var(--spillit-secondary)]/30', label: 'Live' };
};

// --- Sub-Components ---

const StatCard = ({ title, value, icon, accentColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 group hover:border-white/10 transition-all"
  >
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-4xl font-black text-white heading-font">{value}</h3>
      </div>
      <div className="p-3 rounded-2xl bg-white/5 text-white transition-transform group-hover:scale-110" style={{ color: accentColor }}>
        {icon}
      </div>
    </div>
    <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10" style={{ backgroundColor: accentColor }}></div>
  </motion.div>
);

const DistributionBar = ({ label, count, total, color }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] mb-1.5 uppercase font-bold tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-600">{count} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

function Dashboard() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, byVibe: {}, byStatus: {} });

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'All', vibe: 'All' });
  const [sortConfig, setSortConfig] = useState({ key: 'ts', direction: 'desc' });

  const [selectedMemory, setSelectedMemory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // collection name is 'memories'
    const q = query(collection(db, 'memories'), orderBy('ts', 'desc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      const vibeCounts = {};
      const statusCounts = {};

      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        data.push(item);
        vibeCounts[item.colorChoice || 'default'] = (vibeCounts[item.colorChoice || 'default'] || 0) + 1;
        statusCounts[item.status || 'live'] = (statusCounts[item.status || 'live'] || 0) + 1;
      });

      setMemories(data);
      setStats({ total: data.length, byVibe: vibeCounts, byStatus: statusCounts });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'memories', deleteId));
      setDeleteId(null);
      setSelectedMemory(null);
    } catch (error) {
      // Delete error handled by UI
    }
  };

  const handleArchiveToggle = async (id, currentStatus) => {
    const newStatus = (currentStatus === 'archived') ? 'live' : 'archived';
    try {
      await updateDoc(doc(db, 'memories', id), { status: newStatus });
      if (selectedMemory?.id === id) setSelectedMemory(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      // Update error handled silently
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredData = memories.filter(item => {
    const matchesSearch = item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'All' || (item.status || 'live') === filters.status;
    const matchesVibe = filters.vibe === 'All' || item.colorChoice === filters.vibe;
    return matchesSearch && matchesStatus && matchesVibe;
  }).sort((a, b) => {
    if (sortConfig.key === 'ts') {
      const timeA = a.ts?.toMillis?.() || 0;
      const timeB = b.ts?.toMillis?.() || 0;
      return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
    }
    const valA = a[sortConfig.key] || '';
    const valB = b[sortConfig.key] || '';
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExport = () => {
    const dataToExport = filteredData.map(item => ({
      Memory_ID: item.id,
      Caption: item.caption,
      Upvotes: item.upvotes || 0,
      Address: item.address,
      Date: item.ts ? new Date(item.ts.toMillis()).toLocaleString() : 'N/A',
      Image: item.imageUrl
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Spillit Memories");
    XLSX.writeFile(workbook, "Spillit_Archive_Export.xlsx");
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--spillit-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--spillit-primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--spillit-glow-primary)]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--spillit-bg)] text-white font-sans pb-24 selection:bg-[var(--spillit-primary)]/30">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-[var(--spillit-primary)]/10 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 pt-32 relative z-10">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <Shield size={20} className="text-[var(--spillit-primary)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Control Center</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none heading-font">
              Archive <span className="italic bg-gradient-to-r from-[var(--spillit-primary)] to-[var(--spillit-secondary)] bg-clip-text text-transparent">Moderation</span>
            </h1>
            <p className="text-slate-400 mt-6 text-sm max-w-xl font-medium leading-relaxed border-l-2 border-[var(--spillit-primary)]/30 pl-6">
              Review, manage, and curate the anonymous memories spilling across the global map.
            </p>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all shadow-xl"
          >
            <Download size={18} /> Export Archive
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Spills" value={stats.total} icon={<Layers size={20} />} accentColor="var(--spillit-primary)" delay={0} />
          <StatCard title="Total Love" value={memories.reduce((acc, m) => acc + (m.upvotes || 0), 0)} icon={<Heart size={20} />} accentColor="var(--spillit-secondary)" delay={0.1} />
          <StatCard title="Live Pins" value={stats.byStatus.live || stats.total} icon={<MapPin size={20} />} accentColor="#4ade80" delay={0.2} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6"
          >
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Vibe Palette</p>
            <DistributionBar label="Pink" count={stats.byVibe['#ff7ec9'] || 0} total={stats.total} color="#ff7ec9" />
            <DistributionBar label="Purple" count={stats.byVibe['#a78bfa'] || 0} total={stats.total} color="#a78bfa" />
          </motion.div>
        </div>

        {/* Controls Toolbar */}
        <div className="bg-white/2 backdrop-blur-xl border border-white/5 rounded-[40px] p-4 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-2xl">
          <div className="relative w-full lg:w-1/3 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by ID or caption..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-full py-4 pl-16 pr-8 text-xs text-white focus:outline-none focus:border-[var(--spillit-primary)]/50 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
            >
              <Filter size={14} /> Filter View
            </button>

            <div className="flex gap-2 shrink-0">
               {[
                 { label: 'All', value: 'All' },
                 { label: 'Live', value: 'live' },
                 { label: 'Archived', value: 'archived' }
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => setFilters({ ...filters, status: opt.value })}
                   className={`px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filters.status === opt.value ? 'bg-[var(--spillit-primary)]/20 border-[var(--spillit-primary)]/50 text-[var(--spillit-primary)]' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                 >
                   {opt.label}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white/2 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                  <th className="p-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-2">Spill ID <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-6">Content</th>
                  <th className="p-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('upvotes')}>
                    <div className="flex items-center gap-2">Hearts <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-6">Status</th>
                  <th className="p-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ts')}>
                    <div className="flex items-center gap-2">Created <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-600 italic font-medium">Archive is empty or no spills found.</td>
                  </tr>
                ) : (
                  filteredData.map((memory) => {
                    const statConfig = getStatusConfig(memory.status);
                    return (
                      <tr key={memory.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group">
                        <td className="p-6 font-mono text-[10px] text-slate-500 uppercase">
                          #{memory.id.slice(-8)}
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                                 <img src={getOptimizedImageUrl(memory.imageUrl, 100)} className="w-full h-full object-cover" alt="thumb" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-white font-bold truncate max-w-xs italic mb-1">&quot;{memory.caption}&quot;</p>
                                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    <MapPin size={10} className="text-[var(--spillit-primary)]" /> {memory.address?.split(',')[0]}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2 text-[var(--spillit-primary)] font-black text-lg">
                              <Heart size={18} fill="currentColor" /> {memory.upvotes || 0}
                           </div>
                        </td>
                        <td className="p-6">
                           <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statConfig.bg} ${statConfig.color} ${statConfig.border}`}>
                              {statConfig.label}
                           </div>
                        </td>
                        <td className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           {memory.ts ? new Date(memory.ts.toMillis()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => setSelectedMemory(memory)} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Eye size={18} /></button>
                              <button onClick={() => setDeleteId(memory.id)} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"><Trash2 size={18} /></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Memory Viewer Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            onClick={() => setSelectedMemory(null)}
          >
             <motion.div
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
               onClick={e => e.stopPropagation()}
               className="w-full max-w-5xl bg-[#0a0a0c] border border-white/10 rounded-[48px] overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
             >
                {/* Media Left */}
                <div className="w-full md:w-3/5 relative bg-black">
                   <img src={selectedMemory.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                   <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                           <span className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black uppercase text-white tracking-[0.2em]">{selectedMemory.colorChoice}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white italic leading-relaxed heading-font">&quot;{selectedMemory.caption}&quot;</h2>
                      </div>
                   </div>
                </div>

                {/* Details Right */}
                <div className="w-full md:w-2/5 p-12 flex flex-col bg-[#0a0a0c] overflow-y-auto custom-scrollbar">
                   <div className="flex justify-between items-center mb-10">
                      <div className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-black tracking-widest uppercase text-slate-500 bg-white/5">
                        <Hash size={12} className="inline mr-1" /> {selectedMemory.id}
                      </div>
                      <button onClick={() => setSelectedMemory(null)} className="p-3 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                   </div>

                   <div className="space-y-10 flex-1">
                      <div className="space-y-2">
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">The Story</p>
                         <p className="text-lg text-slate-300 leading-relaxed font-medium italic">&quot;{selectedMemory.caption}&quot;</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Heart size={10} /> Love</p>
                            <p className="text-xl font-black text-[var(--spillit-primary)]">{selectedMemory.upvotes || 0}</p>
                         </div>
                         <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={10} /> Spot</p>
                            <p className="text-sm font-bold truncate text-white">{selectedMemory.address?.split(',')[0]}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Moderation</p>
                         <button
                           onClick={() => handleArchiveToggle(selectedMemory.id, selectedMemory.status)}
                           className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${selectedMemory.status === 'archived'
                             ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                             : 'bg-[var(--spillit-secondary)]/10 text-[var(--spillit-secondary)] border border-[var(--spillit-secondary)]/20 hover:bg-[var(--spillit-secondary)]/20'}`}
                         >
                           {selectedMemory.status === 'archived' ? 'Restore To Feed' : 'Archive Memory'}
                           {selectedMemory.status === 'archived' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                         </button>
                      </div>
                   </div>

                   <div className="pt-10 mt-auto border-t border-white/5">
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest text-center">Spilled On {selectedMemory.ts ? new Date(selectedMemory.ts.toMillis()).toLocaleString() : 'N/A'}</p>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="max-w-md w-full bg-[#0a0a0c] border border-red-500/30 p-12 rounded-[40px] text-center shadow-[0_0_100px_rgba(239,68,68,0.2)]"
             >
                <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center text-red-500 mb-8 mx-auto border border-red-500/20">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 heading-font uppercase tracking-widest">Erase Memory?</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-10">This will permanently remove this spill from the global archive. This action cannot be undone.</p>
                <div className="flex flex-col gap-3">
                   <button onClick={handleDelete} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-red-600/30">Confirm Erase</button>
                   <button onClick={() => setDeleteId(null)} className="w-full py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest">Cancel</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Dashboard;