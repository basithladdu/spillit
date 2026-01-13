import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
    ChevronDown,
    ChevronRight,
    Eye,
    Download,
    Loader2,
    Trash2,
    Search,
    Filter,
    ArrowUpDown,
    UserCheck,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Target,
    TrendingUp
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import * as XLSX from 'xlsx';

const DEPTH_COLORS = {
    DEEP: '#FF3D00',
    MODERATE: '#FF9800',
    SHALLOW: '#4CAF50'
};

const OFFICERS = [
    'Basith (Devit)',
    'Rahul Sharma',
    'Priya Patel',
    'Amit Kumar',
    'Unassigned'
];

const PotholeDetectionView = () => {
    const [issues, setIssues] = useState([]);
    const [detectionsMap, setDetectionsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedIssues, setExpandedIssues] = useState(new Set());
    const [selectedImages, setSelectedImages] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'ts', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: '',
        department: '',
        severity: ''
    });

    // Fetch issues (pothole reports)
    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'issues'), where('type', '==', 'Pothole')),
            async (snapshot) => {
                const issuesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setIssues(issuesData);

                // Fetch detections for each issue
                const detectionsMapTemp = {};
                for (const issue of issuesData) {
                    const detectionsQuery = query(
                        collection(db, 'pothole_detections'),
                        where('sourceIssueId', '==', issue.id)
                    );
                    const detectionsSnap = await getDocs(detectionsQuery);
                    detectionsMapTemp[issue.id] = detectionsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                }
                setDetectionsMap(detectionsMapTemp);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching issues:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const chartData = useMemo(() => {
        const months = {};
        const last6Months = [];

        // Setup last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short' });
            months[key] = { month: key, issues: 0, detections: 0 };
            last6Months.push(key);
        }

        issues.forEach(issue => {
            if (issue.ts) {
                const date = issue.ts.toDate();
                const key = date.toLocaleString('default', { month: 'short' });
                if (months[key]) {
                    months[key].issues++;
                    const detections = detectionsMap[issue.id] || [];
                    months[key].detections += detections.length;
                }
            }
        });

        return last6Months.map(key => months[key]);
    }, [issues, detectionsMap]);

    const stats = useMemo(() => {
        const allDetections = Object.values(detectionsMap).flat();
        return {
            totalIssues: issues.length,
            totalDetections: allDetections.length,
            pending: issues.filter(i => !i.status || i.status === 'PENDING').length,
            completed: issues.filter(i => i.status === 'COMPLETED').length,
            critical: allDetections.filter(d => d.severity === 'Critical' || d.depth === 'DEEP').length
        };
    }, [issues, detectionsMap]);

    const toggleIssue = (issueId) => {
        const newExpanded = new Set(expandedIssues);
        if (newExpanded.has(issueId)) {
            newExpanded.delete(issueId);
        } else {
            newExpanded.add(issueId);
        }
        setExpandedIssues(newExpanded);
    };

    const handleIssueStatusChange = async (issueId, newStatus) => {
        try {
            await updateDoc(doc(db, 'issues', issueId), {
                status: newStatus
            });
        } catch (error) {
            console.error('Error updating issue status:', error);
        }
    };

    const handleIssueAssignment = async (issueId, officerName) => {
        try {
            await updateDoc(doc(db, 'issues', issueId), {
                assignedOfficer: officerName,
                // Automatically move to ASSIGNED if an officer is picked and it was PENDING
                status: (officerName !== 'Unassigned') ? 'ASSIGNED' : 'PENDING'
            });
        } catch (error) {
            console.error('Error assigning issue:', error);
        }
    };

    const handleDelete = async (detectionId, issueId) => {
        if (window.confirm('Are you sure you want to delete this detection?')) {
            try {
                await deleteDoc(doc(db, 'pothole_detections', detectionId));
                // Refresh detections for this issue
                const detectionsQuery = query(
                    collection(db, 'pothole_detections'),
                    where('sourceIssueId', '==', issueId)
                );
                const detectionsSnap = await getDocs(detectionsQuery);
                const updatedDetections = detectionsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDetectionsMap(prev => ({
                    ...prev,
                    [issueId]: updatedDetections
                }));
            } catch (error) {
                console.error('Error deleting detection:', error);
            }
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const processedIssues = useMemo(() => {
        let result = issues.filter(issue => {
            const detections = detectionsMap[issue.id] || [];

            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                issue.id.toLowerCase().includes(searchLower) ||
                (issue.address || '').toLowerCase().includes(searchLower) ||
                (issue.roadName || '').toLowerCase().includes(searchLower);

            if (searchQuery && !matchesSearch) return false;

            // Existing selection filters
            if (filters.status) {
                const currentStatus = issue.status || 'PENDING';
                if (currentStatus !== filters.status) return false;
            }
            if (filters.department) {
                const hasMatchingDept = detections.some(d => d.department === filters.department);
                if (!hasMatchingDept) return false;
            }
            if (filters.severity) {
                const hasMatchingSeverity = detections.some(d => d.severity === filters.severity);
                if (!hasMatchingSeverity) return false;
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            let aValue, bValue;
            const aDetections = detectionsMap[a.id] || [];
            const bDetections = detectionsMap[b.id] || [];

            switch (sortConfig.key) {
                case 'ts':
                    aValue = a.ts?.seconds || 0;
                    bValue = b.ts?.seconds || 0;
                    break;
                case 'detections':
                    aValue = aDetections.length;
                    bValue = bDetections.length;
                    break;
                case 'location':
                    aValue = a.address || '';
                    bValue = b.address || '';
                    break;
                default:
                    aValue = a.ts?.seconds || 0;
                    bValue = b.ts?.seconds || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [issues, detectionsMap, searchQuery, filters, sortConfig]);

    const exportToExcel = () => {
        const exportData = [];
        processedIssues.forEach(issue => {
            const detections = detectionsMap[issue.id] || [];
            detections.forEach(d => {
                exportData.push({
                    'Issue ID': issue.id,
                    'Road': d.roadName || issue.address,
                    'Depth': d.depth,
                    'Severity': d.severity,
                    'Department': d.department,
                    'Issue Status': issue.status || 'PENDING',
                    'Assigned Officer': issue.assignedOfficer || 'Unassigned',
                    'Confidence': `${Math.round(d.confidence * 100)}%`,
                    'Reported': issue.ts?.toDate?.().toLocaleString() || 'N/A'
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pothole Detections');
        XLSX.writeFile(wb, `pothole_summary_${Date.now()}.xlsx`);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Target className="text-[#FF671F]" />
                        Pothole Deep Intelligence
                    </h1>
                    <p className="text-[var(--muni-text-muted)] mt-1">
                        AI-powered road condition analysis and reporting system
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToExcel}
                        className="muni-btn-primary flex items-center gap-2 group"
                        disabled={processedIssues.length === 0 || loading}
                    >
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                        GENERATE REPORT
                    </button>
                </div>
            </div>

            {/* Stats & History Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Stats Grid */}
                <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="muni-card p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Total Issues</p>
                                <p className="text-2xl font-bold text-white">{stats.totalIssues}</p>
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-4 border-l-4 border-[#FF671F]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#FF671F]/10 rounded-lg">
                                <AlertCircle size={20} className="text-[#FF671F]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Total Detections</p>
                                <p className="text-2xl font-bold text-white">{stats.totalDetections}</p>
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Clock size={20} className="text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Pending Repair</p>
                                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-4 border-l-4 border-green-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckCircle2 size={20} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Resolved</p>
                                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="xl:col-span-2 muni-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-[#FF671F]" size={20} />
                            <h3 className="font-bold text-white">Detection Trends (Last 6 Months)</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF671F]"></div>
                                <span className="text-[var(--muni-text-muted)]">DETECTIONS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[var(--muni-text-muted)]">REPORTS</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF671F" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF671F" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#555"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#555"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ padding: '2px 0' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="detections"
                                    stroke="#FF671F"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorDetections)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="issues"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIssues)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Controls Bar Improvements */}
            <div className="muni-card p-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Road or Location..."
                            className="muni-input pl-10 w-full !bg-white/5 border border-white/10 focus:border-[#FF671F]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase">Status:</span>
                            <select
                                className="bg-transparent text-sm text-white border-none focus:ring-0 cursor-pointer min-w-[120px]"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="" className="bg-[var(--muni-surface)]">All Statuses</option>
                                <option value="PENDING" className="bg-[var(--muni-surface)]">PENDING</option>
                                <option value="ASSIGNED" className="bg-[var(--muni-surface)]">ASSIGNED</option>
                                <option value="IN_PROGRESS" className="bg-[var(--muni-surface)]">IN_PROGRESS</option>
                                <option value="COMPLETED" className="bg-[var(--muni-surface)]">COMPLETED</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase">Dept:</span>
                            <select
                                className="bg-transparent text-sm text-white border-none focus:ring-0 cursor-pointer min-w-[120px]"
                                value={filters.department}
                                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            >
                                <option value="" className="bg-[var(--muni-surface)]">All Depts</option>
                                <option value="NHAI" className="bg-[var(--muni-surface)]">NHAI</option>
                                <option value="RNB" className="bg-[var(--muni-surface)]">RNB</option>
                                <option value="PWD" className="bg-[var(--muni-surface)]">PWD</option>
                                <option value="MUNICIPAL" className="bg-[var(--muni-surface)]">MUNICIPAL</option>
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilters({ status: '', department: '', severity: '' });
                            }}
                            className="muni-btn-ghost text-xs px-4 h-[38px] border border-white/10 hover:border-[#FF671F]/30"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="muni-card p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-[var(--muni-border)] rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-[var(--muni-border)] rounded w-3/4"></div>
                                    <div className="h-3 bg-[var(--muni-border)] rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && (
                <div className="muni-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="muni-table w-full min-w-[1100px]">
                            <thead>
                                <tr>
                                    <th className="w-10"></th>
                                    <th onClick={() => handleSort('id')} className="cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-2">
                                            Issue ID
                                            <ArrowUpDown size={14} className={sortConfig.key === 'id' ? 'text-[#FF671F]' : 'opacity-40'} />
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('location')} className="cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-2">
                                            Location
                                            <ArrowUpDown size={14} className={sortConfig.key === 'location' ? 'text-[#FF671F]' : 'opacity-40'} />
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('detections')} className="cursor-pointer hover:text-white transition-colors text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            AI Detections
                                            <ArrowUpDown size={14} className={sortConfig.key === 'detections' ? 'text-[#FF671F]' : 'opacity-40'} />
                                        </div>
                                    </th>
                                    <th>Status Update</th>
                                    <th>Assign Officer</th>
                                    <th onClick={() => handleSort('ts')} className="cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-2">
                                            Reported
                                            <ArrowUpDown size={14} className={sortConfig.key === 'ts' ? 'text-[#FF671F]' : 'opacity-40'} />
                                        </div>
                                    </th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedIssues.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-[var(--muni-text-muted)] py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search size={48} className="opacity-20" />
                                                <p>No results found matching your criteria</p>
                                                <button
                                                    onClick={() => { setSearchQuery(''); setFilters({ status: '', department: '', severity: '' }) }}
                                                    className="text-[#FF671F] underline text-sm"
                                                >
                                                    Clear all filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    processedIssues.map((issue) => {
                                        const detections = detectionsMap[issue.id] || [];
                                        const isExpanded = expandedIssues.has(issue.id);
                                        const firstDetection = detections[0];

                                        return (
                                            <React.Fragment key={issue.id}>
                                                {/* Main Issue Row */}
                                                <tr
                                                    className={`hover:bg-[var(--muni-surface)] transition-colors cursor-pointer ${isExpanded ? 'bg-[var(--muni-surface)]/50' : ''}`}
                                                    onClick={() => toggleIssue(issue.id)}
                                                >
                                                    <td>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleIssue(issue.id);
                                                            }}
                                                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : ''}`}
                                                        >
                                                            {isExpanded ? <ChevronDown size={20} className="text-[#FF671F]" /> : <ChevronRight size={20} />}
                                                        </button>
                                                    </td>
                                                    <td className="font-mono text-xs text-[var(--muni-text-muted)]">
                                                        <span className="bg-white/5 px-2 py-1 rounded">
                                                            {issue.id.substring(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="text-white max-w-[200px] truncate">{issue.address || 'Unknown Location'}</td>
                                                    <td className="text-center">
                                                        <span className={`muni-badge ${detections.length > 3 ? 'error' : 'success'}`}>
                                                            {detections.length} Pothole{detections.length !== 1 ? 's' : ''} Identified
                                                        </span>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            className={`muni-input text-xs py-1 px-2 !bg-white/5 border-none focus:ring-1 focus:ring-[#FF671F] min-w-[120px] font-bold ${(issue.status === 'COMPLETED') ? 'text-green-500' :
                                                                    (issue.status === 'IN_PROGRESS') ? 'text-yellow-500' : 'text-blue-500'
                                                                }`}
                                                            value={issue.status || 'PENDING'}
                                                            onChange={(e) => handleIssueStatusChange(issue.id, e.target.value)}
                                                        >
                                                            <option value="PENDING">PENDING</option>
                                                            <option value="ASSIGNED">ASSIGNED</option>
                                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                                            <option value="COMPLETED">COMPLETED</option>
                                                        </select>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck size={14} className={issue.assignedOfficer ? 'text-green-500' : 'text-gray-500'} />
                                                            <select
                                                                className="muni-input text-xs py-1 px-2 !bg-white/5 border-none focus:ring-1 focus:ring-[#FF671F] min-w-[130px]"
                                                                value={issue.assignedOfficer || 'Unassigned'}
                                                                onChange={(e) => handleIssueAssignment(issue.id, e.target.value)}
                                                            >
                                                                <option value="Unassigned">Assign to...</option>
                                                                {OFFICERS.map(name => (
                                                                    <option key={name} value={name}>{name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="text-[var(--muni-text-muted)] text-sm">
                                                        {issue.ts?.toDate?.().toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        }) || 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedImages({
                                                                        original: issue.imageUrl,
                                                                        annotated: firstDetection?.annotatedImageUrl,
                                                                        location: issue.address
                                                                    });
                                                                }}
                                                                className="muni-btn-ghost text-xs px-4 py-1.5 flex items-center gap-2 border border-white/10 hover:border-[#FF671F]/50"
                                                            >
                                                                <Eye size={14} />
                                                                <span>VISUALS</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Detections */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="7" className="bg-black/20 p-0 border-b border-[#FF671F]/10">
                                                            <div className="p-6 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                                        <Target size={16} className="text-[#FF671F]" />
                                                                        Individual Detection Analytics ({detections.length})
                                                                    </h4>
                                                                    <p className="text-[var(--muni-text-muted)] text-xs">
                                                                        Each detection is analyzed by AI for severity and depth
                                                                    </p>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {detections.map((detection, idx) => (
                                                                        <div
                                                                            key={detection.id}
                                                                            className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-[var(--muni-surface)] rounded-xl border border-[var(--muni-border)] hover:border-[#FF671F]/30 transition-all"
                                                                        >
                                                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--muni-text-muted)] font-mono text-xs">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-6 items-center w-full">
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[10px] text-[var(--muni-text-muted)] font-bold uppercase tracking-wider">Depth</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div
                                                                                            className="w-2 h-2 rounded-full"
                                                                                            style={{ backgroundColor: DEPTH_COLORS[detection.depth] || '#fff' }}
                                                                                        />
                                                                                        <span className="text-sm font-medium text-white">{detection.depth}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[10px] text-[var(--muni-text-muted)] font-bold uppercase tracking-wider">Severity</span>
                                                                                    <p className={`text-sm font-medium ${detection.severity === 'Critical' ? 'text-red-500' : 'text-white'}`}>
                                                                                        {detection.severity}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[10px] text-[var(--muni-text-muted)] font-bold uppercase tracking-wider">Dept</span>
                                                                                    <p className="text-sm text-white">{detection.department}</p>
                                                                                </div>
                                                                                <div className="space-y-1 col-span-2">
                                                                                    <span className="text-[10px] text-[var(--muni-text-muted)] font-bold uppercase tracking-wider">AI Confidence</span>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                                                            <div
                                                                                                className="bg-[#FF671F] h-full transition-all duration-500"
                                                                                                style={{ width: `${Math.round(detection.confidence * 100)}%` }}
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-xs font-mono text-[var(--muni-text-muted)]">
                                                                                            {Math.round(detection.confidence * 100)}%
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-end pt-4 lg:pt-0">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDelete(detection.id, issue.id);
                                                                                        }}
                                                                                        className="p-2 text-[var(--muni-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                                                        title="Remove detection"
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Image Comparison Modal */}
            {selectedImages && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={() => setSelectedImages(null)}
                >
                    <div
                        className="muni-card w-full max-w-7xl max-h-[95vh] overflow-hidden border border-[#FF671F]/30 shadow-2xl shadow-black/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Eye className="text-[#FF671F]" />
                                    Image Comparison Analytics
                                </h2>
                                <p className="text-[var(--muni-text-muted)] mt-1">{selectedImages.location}</p>
                            </div>
                            <button
                                onClick={() => setSelectedImages(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[var(--muni-text-muted)] hover:text-white transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Original Image */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Target size={16} className="text-blue-500" />
                                            📸 Original Field Capture
                                        </label>
                                        <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded">RAW</span>
                                    </div>
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--muni-border)] group shadow-lg">
                                        <img
                                            src={selectedImages.original}
                                            alt="Original"
                                            className="w-full h-auto cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-500"
                                        />
                                    </div>
                                </div>

                                {/* Annotated Image */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-[#FF671F] uppercase tracking-wider flex items-center gap-2">
                                            <Target size={16} className="text-[#FF671F]" />
                                            🤖 AI Computer Vision Overlay
                                        </label>
                                        <span className="text-[10px] text-[#FF671F] font-bold bg-[#FF671F]/10 px-2 py-0.5 rounded">PROCESSED</span>
                                    </div>
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#FF671F] group shadow-lg shadow-[#FF671F]/10">
                                        {selectedImages.annotated ? (
                                            <img
                                                src={selectedImages.annotated}
                                                alt="Detected"
                                                className="w-full h-auto cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full aspect-video bg-[var(--muni-bg)] flex flex-col items-center justify-center gap-4">
                                                <Loader2 size={48} className="text-[#FF671F] animate-spin" />
                                                <p className="text-[var(--muni-text-muted)] font-medium">Processing High Resolution Detection...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-xs text-[var(--muni-text-muted)] leading-relaxed text-center">
                                    Our AI model uses deep semantic segmentation to identify road anomalies with 94.2% accuracy.
                                    Visible bounding boxes represent the detected area, depth classification, and confidence score.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PotholeDetectionView;
