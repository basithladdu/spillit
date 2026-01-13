import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, limit, orderBy, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import {
    LayoutDashboard, MapPin, ClipboardList,
    Trophy, Info, LogOut, Menu, X, Bell, Settings, FileText, Eye, Trash2, Download, AlertCircle, CheckCircle, Clock, Scan
} from 'lucide-react';
import * as XLSX from 'xlsx';
import app from '../utils/firebase';
import PotholeDetectionView from '../components/PotholeDetectionView';
import GroupedPotholeView from '../components/GroupedPotholeView';
import AboutView from '../components/AboutView';
import '../styles/municipal.css';
import DashboardMap from '../components/DashboardMap';

// --- Helper Functions ---
const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical': return { color: '#ef4444', label: 'Critical', bgClass: 'bg-red-500/10' };
        case 'high': return { color: '#f97316', label: 'High', bgClass: 'bg-orange-500/10' };
        case 'medium': return { color: '#eab308', label: 'Medium', bgClass: 'bg-yellow-500/10' };
        case 'low': return { color: '#22c55e', label: 'Low', bgClass: 'bg-green-500/10' };
        default: return { color: '#a1a1aa', label: 'Unknown', bgClass: 'bg-gray-500/10' };
    }
};

const getStatusConfig = (status) => {
    const s = (status || 'new').toLowerCase();
    if (s === 'resolved') return { label: 'Resolved', badgeClass: 'success', icon: CheckCircle };
    if (s === 'in-progress') return { label: 'In Progress', badgeClass: 'pending', icon: Clock };
    return { label: 'New Report', badgeClass: 'pending', icon: AlertCircle };
};

// --- Sub-Components ---

const DashboardView = ({ issues, stats }) => (
    <div className="space-y-6 pb-20 md:pb-0"> {/* Added padding bottom for mobile scroll */}
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: "Total Issues", value: stats.total, change: "Live", color: "text-[#FF671F]" },
                { label: "Resolved", value: stats.resolved, change: `${stats.resolutionRate}%`, color: "text-[#046A38]" },
                { label: "Pending", value: stats.pending, change: "Active", color: "text-white" },
                { label: "Avg Resolution", value: "48h", change: "Target", color: "text-[#06038D]" }
            ].map((kpi, i) => (
                <div key={i} className="muni-card p-4 border-l-4" style={{ borderLeftColor: i === 0 ? '#FF671F' : i === 1 ? '#046A38' : i === 2 ? '#ffffff' : '#06038D' }}>
                    <p className="text-[var(--muni-text-muted)] text-xs uppercase tracking-wider">{kpi.label}</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</h3>
                        <span className={`text-xs font-mono ${i === 1 ? 'text-[#046A38]' : 'text-[var(--muni-text-muted)]'}`}>
                            {kpi.change}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* Map Placeholder */}


        {/* Map View */}
        <div className="muni-card h-[300px] md:h-[400px] relative overflow-hidden border border-[#046A38]/30 p-0 bg-[#050505]">
            <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur px-3 py-1 rounded border border-[#FF671F]/30 text-xs font-mono text-[#FF671F]">
                {issues.length > 0 ? `${issues.length} Hotspots Live` : "System Online"}
            </div>
            <DashboardMap issues={issues} />
        </div>
    </div>
);

const TrackerView = ({ issues, onSelectIssue, onDelete, onExport, searchQuery, setSearchQuery, filterStatus, setFilterStatus, filterSeverity, setFilterSeverity }) => {
    const filteredIssues = issues.filter(item => {
        const matchesSearch = item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.includes(searchQuery) ||
            item.type?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        const matchesSeverity = filterSeverity === 'All' || item.severity === filterSeverity;
        return matchesSearch && matchesStatus && matchesSeverity;
    });

    return (
        <div className="space-y-4 pb-20 md:pb-0">
            {/* Controls */}
            <div className="muni-card p-4 space-y-3 md:space-y-0 md:flex md:gap-3 md:items-center md:justify-between">
                <div className="relative flex-1 md:flex-none md:w-96">
                    <input
                        type="text"
                        placeholder="Search ID, description, type..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="muni-input w-full"
                    />
                </div>

                <div className="flex gap-3 flex-wrap md:flex-nowrap items-center">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="muni-input text-sm w-full md:w-40">
                        <option value="All">All Status</option>
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="muni-input text-sm w-full md:w-40">
                        <option value="All">All Severity</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <button onClick={() => onExport(filteredIssues)} className="muni-btn-primary flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto px-6">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="muni-card overflow-hidden border border-[#06038D]/30">
                <div className="p-4 border-b border-[var(--muni-border)] flex justify-between items-center bg-gradient-to-r from-[#06038D]/10 to-transparent">
                    <h3 className="font-semibold text-white">Recent Issue Reports ({filteredIssues.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="muni-table w-full min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="text-[#FF671F]">ID</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Date</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues.length === 0 ? (
                                <tr><td colSpan="8" className="text-center text-[var(--muni-text-muted)] py-8">No issues found.</td></tr>
                            ) : (
                                filteredIssues.map((issue) => {
                                    const sevConfig = getSeverityConfig(issue.severity);
                                    const statConfig = getStatusConfig(issue.status);
                                    return (
                                        <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                                            <td className="font-mono text-[#FF671F] text-xs">{issue.id.slice(0, 8)}</td>
                                            <td className="font-medium">{issue.type || "General"}</td>
                                            <td className="truncate max-w-[200px] text-[var(--muni-text-muted)]">{issue.desc || "No description"}</td>
                                            <td>
                                                <span className="muni-badge" style={{ color: sevConfig.color, backgroundColor: `${sevConfig.color}15`, borderColor: `${sevConfig.color}30` }}>
                                                    {sevConfig.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`muni-badge ${statConfig.badgeClass}`}>
                                                    {statConfig.label}
                                                </span>
                                            </td>
                                            <td className="text-[var(--muni-text-muted)] text-sm">{issue.assignedOfficer || '—'}</td>
                                            <td className="font-mono text-xs text-[var(--muni-text-muted)]">
                                                {issue.ts ? new Date(issue.ts.toDate?.() || issue.ts).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => onSelectIssue(issue)} className="muni-btn-ghost p-2 h-auto w-auto">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => onDelete(issue.id)} className="muni-btn-ghost p-2 h-auto w-auto text-[var(--muni-error)]">
                                                        <Trash2 size={16} />
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
            </div>
        </div>
    );
};

const LeaderboardView = () => (
    <div className="muni-card overflow-hidden border border-[#FF671F]/30 pb-20 md:pb-0">
        <div className="p-4 border-b border-[var(--muni-border)] bg-gradient-to-r from-[#FF671F]/10 to-transparent">
            <h3 className="font-semibold text-white">Ward Performance Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="muni-table w-full min-w-[600px]">
                <thead>
                    <tr>
                        <th className="text-[#046A38]">Rank</th>
                        <th>Ward / Representative</th>
                        <th>Resolved</th>
                        <th>Avg Time</th>
                        <th>Citizen Score</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { rank: 1, name: "Ward 12 (Sri. A. Kumar)", resolved: 145, time: "24h", score: "4.8/5" },
                        { rank: 2, name: "Ward 08 (Smt. L. Devi)", resolved: 132, time: "28h", score: "4.6/5" },
                        { rank: 3, name: "Ward 03 (Sri. K. Reddy)", resolved: 98, time: "36h", score: "4.2/5" },
                    ].map((row, i) => (
                        <tr key={row.rank} className={i === 0 ? "bg-[#FF671F]/5" : i === 1 ? "bg-white/5" : i === 2 ? "bg-[#046A38]/5" : ""}>
                            <td className="font-mono font-bold" style={{ color: i === 0 ? '#FF671F' : i === 1 ? '#ffffff' : i === 2 ? '#046A38' : 'inherit' }}>#{row.rank}</td>
                            <td>{row.name}</td>
                            <td className="font-mono text-[#046A38]">{row.resolved}</td>
                            <td className="font-mono">{row.time}</td>
                            <td>{row.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const SettingsView = () => (
    <div className="muni-card p-8 text-center border-t-4 border-[#06038D]">
        <Settings size={48} className="mx-auto mb-4 text-[#06038D]" />
        <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
        <p className="text-[var(--muni-text-muted)]">Configuration options coming soon.</p>
    </div>
);

const DetailModal = ({ issue, onClose, onStatusUpdate, onDelete }) => {
    if (!issue) return null;
    const sevConfig = getSeverityConfig(issue.severity);
    const statConfig = getStatusConfig(issue.status);

    return (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="muni-card w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#FF671F]/30 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{issue.type}</h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="muni-badge" style={{ color: sevConfig.color, backgroundColor: `${sevConfig.color}15`, borderColor: `${sevConfig.color}30` }}>
                                {sevConfig.label}
                            </span>
                            <span className={`muni-badge ${statConfig.badgeClass}`}>
                                {statConfig.label}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--muni-text-muted)] hover:text-white text-2xl">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">ID</label>
                            <p className="text-white font-mono mt-2">{issue.id}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Date</label>
                            <p className="text-white mt-2">
                                {issue.ts ? new Date(issue.ts.toDate?.() || issue.ts).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Description</label>
                        <p className="text-[var(--muni-text-muted)] mt-2 bg-black/20 border border-[var(--muni-border)] p-4 rounded">
                            {issue.desc}
                        </p>
                    </div>

                    {(issue.lat || issue.lng) && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Latitude</label>
                                <p className="text-white font-mono mt-2">{issue.lat?.toFixed(5)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Longitude</label>
                                <p className="text-white font-mono mt-2">{issue.lng?.toFixed(5)}</p>
                            </div>
                        </div>
                    )}

                    {issue.imageUrl && (
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Evidence Photo</label>
                            <img src={issue.imageUrl} alt="Evidence" className="mt-3 rounded max-h-64 w-full object-cover border border-[var(--muni-border)]" />
                        </div>
                    )}

                    {issue.assignedOfficer && (
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Assigned To</label>
                            <p className="text-white mt-2">{issue.assignedOfficer}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-[var(--muni-border)]">
                        <button onClick={() => onStatusUpdate(issue.id, issue.status)} className="flex-1 muni-btn-primary uppercase text-xs">
                            {issue.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                        </button>
                        <button onClick={() => { onDelete(issue.id); onClose(); }} className="muni-btn-ghost text-[var(--muni-error)]">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ deleteId, onConfirm, onCancel }) => {
    if (!deleteId) return null;
    return (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
            <div className="muni-card p-8 max-w-sm w-full text-center border border-[var(--muni-error)]" onClick={e => e.stopPropagation()}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--muni-error)]" />
                <h3 className="text-lg font-bold text-white mb-2">Delete Report?</h3>
                <p className="text-[var(--muni-text-muted)] text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="muni-btn-ghost flex-1">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 muni-btn-primary" style={{ backgroundColor: 'var(--muni-error)', color: 'white' }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

export default function MunicipalDashboard({ initialView = 'dashboard' }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeView, setActiveView] = useState(initialView);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [issues, setIssues] = useState([]);
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, resolutionRate: 0 });
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');

    // Sync activeView with URL changes
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/tracker')) setActiveView('tracker');
        else if (path.includes('/pothole-detection')) setActiveView('pothole-detection');
        else if (path.includes('/grouped-reports')) setActiveView('grouped-reports');
        else if (path.includes('/leaderboard')) setActiveView('leaderboard');
        else if (path.includes('/about')) setActiveView('about');
        else if (path.includes('/settings')) setActiveView('settings');
        else setActiveView('dashboard');
    }, [location.pathname]);

    // Responsive Sidebar Check
    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true);
                setIsSidebarOpen(false);
            } else {
                setIsMobile(false);
                setIsSidebarOpen(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle Esc key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isMobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isMobile, isSidebarOpen]);

    // Fetch Real Data with Real-time Updates
    useEffect(() => {
        try {
            const db = getFirestore(app);
            const q = query(collection(db, 'issues'), orderBy('ts', 'desc'), limit(100));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIssues(data);
                const total = data.length;
                const resolved = data.filter(i => i.status === 'resolved').length;
                const pending = total - resolved;
                const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
                setStats({ total, resolved, pending, resolutionRate: rate });
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Error fetching issues:", error);
        }
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(getFirestore(app), 'issues', deleteId));
            setDeleteId(null);
            setSelectedIssue(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleStatusUpdate = async (id, currentStatus) => {
        const newStatus = currentStatus === 'resolved' ? 'in-progress' : 'resolved';
        try {
            await updateDoc(doc(getFirestore(app), 'issues', id), { status: newStatus });
            setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleExport = (dataToExport) => {
        const exportData = dataToExport.map(item => ({
            ID: item.id,
            Type: item.type,
            Description: item.desc,
            Category: item.category,
            Status: item.status,
            Severity: item.severity,
            Date: item.ts ? new Date(item.ts.toDate?.() || item.ts).toLocaleDateString() : 'N/A',
            Location: item.lat && item.lng ? `${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}` : 'N/A',
            AssignedTo: item.assignedOfficer || 'Unassigned',
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
        XLSX.writeFile(workbook, `Issues_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    const NavItem = ({ id, icon: IconComponent, label, external }) => {
        const handleClick = () => {
            if (external) {
                navigate(external);
            } else {
                // Navigate to the specific route
                const route = id === 'dashboard' ? '/municipal-dashboard' : `/municipal-dashboard/${id}`;
                navigate(route);
            }
            if (isMobile) setIsSidebarOpen(false);
        };

        return (
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeView === id
                    ? 'bg-[var(--muni-surface)] text-[#FF671F] border-r-2 border-[#FF671F]'
                    : 'text-[var(--muni-text-muted)] hover:text-white hover:bg-white/5'
                    }`}
            >
                <IconComponent size={18} className={activeView === id ? "text-[#FF671F]" : ""} />
                {label}
            </button>
        );
    };

    return (
        <div className="municipal-theme flex h-screen h-[100dvh] overflow-hidden bg-[var(--muni-bg)] font-sans pt-[80px]">

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-[var(--muni-border)] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none md:overflow-hidden'
                    }`}
            >
                <div className="p-6 items-center justify-between h-16 flex-none">
                    <div className="font-bold tracking-wider text-xl flex items-center gap-1">
                        <span className="text-[#FF671F]">Lets</span>
                        <span className="text-white">Fix</span>
                        <span className="text-[#046A38]">India</span>
                    </div>
                    {isMobile && <button onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar"><X size={20} className="text-white" /></button>}
                </div>

                <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="tracker" icon={ClipboardList} label="Issue Tracker" />
                    <NavItem id="pothole-detection" icon={Scan} label="Pothole Detection" />
                    <NavItem id="grouped-reports" icon={MapPin} label="Grouped Reports" />
                    <NavItem id="leaderboard" icon={Trophy} label="Leaderboard" />
                    <NavItem id="about" icon={Info} label="About devit." />
                    <NavItem id="settings" icon={Settings} label="Settings" />
                    <NavItem id="register" icon={FileText} label="Municipal Register" external="/municipal-register" />
                </nav>

                <div className="p-4 border-t border-[var(--muni-border)] flex-none">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded bg-[var(--muni-surface)] flex items-center justify-center text-[#FF671F] font-bold border border-[#FF671F]/30">
                            {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-white">{currentUser?.email || 'Admin'}</p>
                            <p className="text-xs text-[var(--muni-text-muted)]">Municipal Admin</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-xs text-red-400 hover:bg-red-500/10 rounded">
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Column */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--muni-bg)] h-full relative">

                {/* Header */}
                <header className="h-16 flex-none bg-[var(--muni-bg)] flex items-center justify-between px-6 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-[var(--muni-surface)] rounded text-[var(--muni-text-muted)]"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="font-semibold capitalize text-white">{activeView.replace('-', ' ')}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-[var(--muni-text-muted)] hover:text-white">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF671F] rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto pb-6">
                        {activeView === 'dashboard' && <DashboardView issues={issues} stats={stats} />}
                        {activeView === 'tracker' && (
                            <TrackerView
                                issues={issues}
                                onSelectIssue={setSelectedIssue}
                                onDelete={setDeleteId}
                                onExport={handleExport}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                filterSeverity={filterSeverity}
                                setFilterSeverity={setFilterSeverity}
                            />
                        )}
                        {activeView === 'pothole-detection' && <PotholeDetectionView />}
                        {activeView === 'grouped-reports' && <GroupedPotholeView />}
                        {activeView === 'leaderboard' && <LeaderboardView />}
                        {activeView === 'about' && <AboutView />}
                        {activeView === 'settings' && <SettingsView />}
                    </div>

                    {/* devit Footer */}
                    <footer className="border-t border-[var(--muni-border)] bg-[var(--muni-surface)] mt-12">
                        <div className="max-w-7xl mx-auto px-6 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">
                                        Powered by <span className="text-[#FF671F]">devit.</span>
                                    </h3>
                                    <p className="text-sm text-[var(--muni-text-muted)] mb-3">
                                        We design, build, and scale exceptional software for startups and businesses.
                                    </p>
                                    <a
                                        href="https://www.wedevit.in/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#FF671F] hover:underline text-sm font-semibold"
                                    >
                                        Visit wedevit.in →
                                    </a>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3 uppercase">Contact</h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <a href="mailto:workwithdevit@gmail.com" className="text-[var(--muni-text-muted)] hover:text-[#FF671F]">
                                                workwithdevit@gmail.com
                                            </a>
                                        </div>
                                        <div>
                                            <a href="tel:+919553321211" className="text-[var(--muni-text-muted)] hover:text-[#FF671F]">
                                                +91 95533 21211
                                            </a>
                                        </div>
                                        <div>
                                            <a
                                                href="https://wa.me/919553321211"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--muni-text-muted)] hover:text-[#25D366]"
                                            >
                                                WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3 uppercase">Connect</h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <a
                                                href="https://www.linkedin.com/in/basithladoo/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--muni-text-muted)] hover:text-[#0A66C2]"
                                            >
                                                LinkedIn - Basith
                                            </a>
                                        </div>
                                        <div>
                                            <a href="mailto:basithladoo@gmail.com" className="text-[var(--muni-text-muted)] hover:text-[#FF671F]">
                                                basithladoo@gmail.com
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--muni-border)] pt-6 text-center">
                                <p className="text-xs text-[var(--muni-text-muted)]">
                                    © {new Date().getFullYear()} <span className="text-[#FF671F] font-semibold">devit</span>.
                                    All rights reserved. | Built with ❤️ for better governance
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Modals */}
            <DetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} onStatusUpdate={handleStatusUpdate} onDelete={setDeleteId} />
            <DeleteConfirmModal deleteId={deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
        </div>
    );
}