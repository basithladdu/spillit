import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  FaSearch, FaFilter, FaTrashAlt, FaLayerGroup,
  FaSort, FaSortUp, FaSortDown, FaTimes, FaInfoCircle,
  FaMapMarkerAlt, FaCalendarAlt, FaHashtag, FaEye, FaFileExport
} from 'react-icons/fa';
import { MdWarning, MdError, MdCheckCircle, MdPendingActions } from 'react-icons/md';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// --- Shared Style Helpers ---

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'Critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: MdError };
    case 'High': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: MdWarning };
    case 'Medium': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: MdWarning };
    case 'Low': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: MdCheckCircle };
    default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: FaInfoCircle };
  }
};

const getStatusConfig = (status) => {
  const s = (status || 'new').toLowerCase();
  if (s === 'resolved') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Resolved' };
  if (s === 'in-progress') return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'In Progress' };
  return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'New Report' };
};

// --- Sub-Components ---

const StatCard = ({ title, value, icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden bg-[#0F172A]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 group hover:border-cyan-500/30 transition-colors"
  >
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className={`text-3xl font-bold ${colorClass} drop-shadow-lg`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-white/5 ${colorClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 ${colorClass.replace('text-', 'bg-')}`}></div>
  </motion.div>
);

const CategoryBar = ({ label, count, total, color }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

function Dashboard() {
  // State
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, byCategory: {}, byStatus: {} });

  // Filters & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'All', severity: 'All' });
  const [sortConfig, setSortConfig] = useState({ key: 'ts', direction: 'desc' });

  // UI State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Data
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      const catCounts = {};
      const statusCounts = {};

      snapshot.forEach((doc) => {
        const issue = { id: doc.id, ...doc.data() };
        data.push(issue);
        catCounts[issue.type] = (catCounts[issue.type] || 0) + 1;
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      });

      setIssues(data);
      setStats({ total: data.length, byCategory: catCounts, byStatus: statusCounts });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Actions
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'issues', deleteId));
      setDeleteId(null);
      setSelectedIssue(null);
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'in-progress' : 'resolved';
    try {
      await updateDoc(doc(db, 'issues', id), { status: newStatus });
      if (selectedIssue?.id === id) setSelectedIssue(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Update error", error);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Filtering & Sorting Logic
  const filteredData = issues.filter(item => {
    const matchesSearch = item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.includes(searchQuery);
    const matchesStatus = filters.status === 'All' || item.status === filters.status;
    const matchesSev = filters.severity === 'All' || item.severity === filters.severity;
    return matchesSearch && matchesStatus && matchesSev;
  }).sort((a, b) => {
    if (sortConfig.key === 'ts') {
      return sortConfig.direction === 'asc'
        ? a.ts?.toDate() - b.ts?.toDate()
        : b.ts?.toDate() - a.ts?.toDate();
    }
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- EXPORT TO EXCEL LOGIC ---
  const handleExport = () => {
    const dataToExport = filteredData.map(item => ({
      ID: item.id,
      Type: item.type,
      Description: item.desc,
      Status: item.status,
      Severity: item.severity,
      Date: item.ts ? new Date(item.ts.toDate()).toLocaleDateString() + ' ' + new Date(item.ts.toDate()).toLocaleTimeString() : 'N/A',
      Latitude: item.lat || 'N/A',
      Longitude: item.lng || 'N/A',
      Image_URL: item.imageUrl || 'No Image'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Issues");

    const wscols = [
      { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Admin_Report_Export.xlsx");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1E] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A1E] text-gray-200 font-sans selection:bg-cyan-500/30 pb-20">

      <div className="max-w-7xl mx-auto px-6 pt-24">

        {/* Header & Stats */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dashboard</span>
          </h1>
          <p className="text-gray-400">Overview of community reports and infrastructure status.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Reports" value={stats.total} icon={<FaLayerGroup />} colorClass="text-cyan-400" delay={0} />
          <StatCard title="Needs Action" value={issues.length - (stats.byStatus.resolved || 0)} icon={<MdPendingActions />} colorClass="text-orange-400" delay={0.1} />
          <StatCard title="Resolved" value={stats.byStatus.resolved || 0} icon={<MdCheckCircle />} colorClass="text-emerald-400" delay={0.2} />

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#0F172A]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5"
          >
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Distribution</p>
            <CategoryBar label="Potholes" count={stats.byCategory['Pothole'] || 0} total={stats.total} color="bg-amber-500" />
            <CategoryBar label="Garbage" count={stats.byCategory['Garbage'] || 0} total={stats.total} color="bg-purple-500" />
          </motion.div>
        </div>

        {/* Controls Toolbar */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search ID, description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
            />
          </div>

          {/* Filters & Export */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${showFilters ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
            >
              <FaFilter /> Filters
            </button>

            <select
              className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded-full px-4 py-2.5 outline-none"
              value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="All">All Status</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all ml-auto md:ml-0"
            >
              <FaFileExport /> Export Excel
            </button>
          </div>
        </div>

        {/* Data Grid (Desktop) & Cards (Mobile) */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-white/5">
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</div>
                  </th>
                  <th className="p-4">Details</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('severity')}>
                    <div className="flex items-center gap-1">Severity {sortConfig.key === 'severity' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('ts')}>
                    <div className="flex items-center gap-1">Date {sortConfig.key === 'ts' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}</div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-300">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 italic">No reports found matching your filters.</td>
                  </tr>
                ) : (
                  filteredData.map((issue) => {
                    const sevConfig = getSeverityConfig(issue.severity);
                    const statConfig = getStatusConfig(issue.status);

                    return (
                      <tr
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 font-mono text-cyan-400">
                          #{issue.id.substring(0, 6)}
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            {issue.imageUrl && (
                              <img src={getOptimizedImageUrl(issue.imageUrl, 100)} alt="Thumb" className="w-10 h-10 rounded object-cover border border-white/10" />
                            )}
                            <div>
                              <div className="font-bold text-white">{issue.type}</div>
                              <div className="text-gray-500 truncate w-48 text-xs">{issue.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase ${sevConfig.bg} ${sevConfig.color} ${sevConfig.border}`}>
                            <sevConfig.icon /> {issue.severity}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${statConfig.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statConfig.bg.replace('/10', '')}`}></span>
                            {statConfig.label}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-xs">
                          {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                              className="p-2 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteId(issue.id); }}
                              className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-white/5">
            {filteredData.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">No reports found.</div>
            ) : (
              filteredData.map((issue) => {
                const sevConfig = getSeverityConfig(issue.severity);
                const statConfig = getStatusConfig(issue.status);

                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="p-4 active:bg-white/5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {issue.imageUrl ? (
                          <img src={getOptimizedImageUrl(issue.imageUrl, 150)} alt="Thumb" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-600"><FaHashtag /></div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm">{issue.type}</div>
                          <div className="text-cyan-400 text-xs font-mono">#{issue.id.substring(0, 6)}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${sevConfig.bg} ${sevConfig.color} ${sevConfig.border}`}>
                        {issue.severity}
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">{issue.desc}</p>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${statConfig.color}`}>
                        <span className={`w-2 h-2 rounded-full ${statConfig.bg.replace('/10', '')}`}></span>
                        {statConfig.label}
                      </div>
                      <div className="text-gray-600 text-[10px] font-mono">
                        {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedIssue(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-white/10 flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">{selectedIssue.type}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityConfig(selectedIssue.severity).bg} ${getSeverityConfig(selectedIssue.severity).color} ${getSeverityConfig(selectedIssue.severity).border}`}>
                      {selectedIssue.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1"><FaHashtag className="text-cyan-500" /> {selectedIssue.id}</span>
                    <span className="flex items-center gap-1"><FaCalendarAlt className="text-cyan-500" /> {selectedIssue.ts?.toDate().toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedIssue(null)} className="text-gray-500 hover:text-white"><FaTimes size={20} /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                {/* Left: Details */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Description</label>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      {selectedIssue.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><FaMapMarkerAlt /> Latitude</div>
                      <div className="font-mono text-white">{selectedIssue.lat?.toFixed(5)}</div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><FaMapMarkerAlt /> Longitude</div>
                      <div className="font-mono text-white">{selectedIssue.lng?.toFixed(5)}</div>
                    </div>
                  </div>

                  {/* Status Toggle Action */}
                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Management Actions</label>
                    <button
                      onClick={() => handleStatusUpdate(selectedIssue.id, selectedIssue.status)}
                      className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${selectedIssue.status === 'resolved'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'}`}
                    >
                      {selectedIssue.status === 'resolved' ? 'Re-open Issue' : 'Mark as Resolved'}
                      {selectedIssue.status === 'resolved' ? <MdWarning /> : <MdCheckCircle />}
                    </button>
                  </div>
                </div>

                {/* Right: Image */}
                <div className="bg-black rounded-xl overflow-hidden border border-white/10 relative group min-h-[200px]">
                  {selectedIssue.imageUrl ? (
                    <img src={getOptimizedImageUrl(selectedIssue.imageUrl, 800)} alt="Evidence" className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm absolute inset-0">No Image Provided</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0F172A] border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_40px_rgba(220,38,38,0.3)]"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-3xl border border-red-500/20">
                <FaTrashAlt />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Report?</h3>
              <p className="text-gray-400 text-sm mb-6">This action cannot be undone. This record will be permanently removed from the database.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Dashboard;