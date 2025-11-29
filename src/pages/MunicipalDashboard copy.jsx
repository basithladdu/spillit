import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { LayoutDashboard, ClipboardList, LogOut, Menu, Bell, Search, Download, Eye, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/municipal.css';

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

// --- Detail Modal Component ---
const DetailModal = ({ issue, onClose, onStatusUpdate, onDelete }) => {
    if (!issue) return null;

    const sevConfig = getSeverityConfig(issue.severity);
    const statConfig = getStatusConfig(issue.status);

    return (
        <div
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="muni-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{issue.type}</h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className={`muni-badge ${sevConfig.bgClass}`} style={{ color: sevConfig.color }}>
                                {sevConfig.label}
                            </span>
                            <span className={`muni-badge ${statConfig.badgeClass}`}>
                                {statConfig.label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--muni-text-muted)] hover:text-white text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* ID and Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">ID</label>
                            <p className="text-white font-mono mt-2">{issue.id}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Date</label>
                            <p className="text-white mt-2">
                                {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Description</label>
                        <p className="text-[var(--muni-text-muted)] mt-2 bg-[var(--muni-surface)] border border-[var(--muni-border)] p-4 rounded leading-relaxed">
                            {issue.desc}
                        </p>
                    </div>

                    {/* Location */}
                    {(issue.lat || issue.lng) && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Latitude</label>
                                <p className="text-white font-mono mt-2">{issue.lat?.toFixed(5)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Longitude</label>
                                <p className="text-white font-mono mt-2">{issue.lng?.toFixed(5)}</p>
                            </div>
                        </div>
                    )}

                    {/* Image */}
                    {issue.imageUrl && (
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Evidence Photo</label>
                            <img src={issue.imageUrl} alt="Evidence" className="mt-3 rounded-lg max-h-64 w-full object-cover border border-[var(--muni-border)]" />
                        </div>
                    )}

                    {/* Category */}
                    {issue.category && (
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Category</label>
                            <p className="text-white mt-2">{issue.category}</p>
                        </div>
                    )}

                    {/* Assigned Officer */}
                    {issue.assignedOfficer && (
                        <div>
                            <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">Assigned To</label>
                            <p className="text-white mt-2">{issue.assignedOfficer}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-6 border-t border-[var(--muni-border)]">
                        <button
                            onClick={() => onStatusUpdate(issue.id, issue.status)}
                            className="flex-1 muni-btn-primary uppercase"
                        >
                            {issue.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                        </button>
                        <button
                            onClick={() => {
                                onDelete(issue.id);
                                onClose();
                            }}
                            className="muni-btn-ghost text-[var(--muni-error)]"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="muni-card p-5 hover:border-[var(--muni-accent)] transition-colors">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold text-white mt-2">{value}</p>
            </div>
            <Icon className="w-8 h-8" style={{ color }} opacity={0.5} />
        </div>
    </div>
);

// --- Main Admin Dashboard ---
export default function MunicipalDashboard() {
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Data State
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, byStatus: {}, byCategory: {} });

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Responsive Check
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

    // Fetch Issues from Firestore
    useEffect(() => {
        const q = query(collection(db, 'issues'), orderBy('ts', 'desc'), limit(100));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = [];
                const statusCounts = {};
                const categoryCounts = {};

                snapshot.forEach((doc) => {
                    const issue = { id: doc.id, ...doc.data() };
                    data.push(issue);
                    statusCounts[issue.status || 'new'] = (statusCounts[issue.status || 'new'] || 0) + 1;
                    categoryCounts[issue.category || issue.type] = (categoryCounts[issue.category || issue.type] || 0) + 1;
                });

                setIssues(data);
                setStats({ total: data.length, byStatus: statusCounts, byCategory: categoryCounts });
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching issues:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Actions
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, 'issues', deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleStatusUpdate = async (id, currentStatus) => {
        const newStatus = currentStatus === 'resolved' ? 'in-progress' : 'resolved';
        try {
            await updateDoc(doc(db, 'issues', id), { status: newStatus });
            setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleExport = () => {
        const dataToExport = filteredData.map(item => ({
            ID: item.id,
            Type: item.type,
            Description: item.desc,
            Category: item.category,
            Status: item.status,
            Severity: item.severity,
            Date: item.ts ? new Date(item.ts.toDate()).toLocaleDateString() : 'N/A',
            Location: item.lat && item.lng ? `${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}` : 'N/A',
            AssignedTo: item.assignedOfficer || 'Unassigned',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
        XLSX.writeFile(workbook, 'Issues_Report.xlsx');
    };

    // Filter Data
    const filteredData = issues.filter(item => {
        const matchesSearch = item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.includes(searchQuery) ||
            item.type?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        const matchesSeverity = filterSeverity === 'All' || item.severity === filterSeverity;
        return matchesSearch && matchesStatus && matchesSeverity;
    });

    if (loading) {
        return (
            <div className="municipal-theme flex h-screen items-center justify-center pt-[var(--navbar-height)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--muni-accent)' }}></div>
            </div>
        );
    }

    const DashboardView = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Reports"
                    value={stats.total}
                    icon={AlertCircle}
                    color="var(--muni-accent)"
                />
                <StatCard
                    title="Needs Action"
                    value={(stats.byStatus['new'] || 0) + (stats.byStatus['in-progress'] || 0)}
                    icon={Clock}
                    color="#f97316"
                />
                <StatCard
                    title="Resolved"
                    value={stats.byStatus.resolved || 0}
                    icon={CheckCircle}
                    color="#22c55e"
                />
                <StatCard
                    title="Pending"
                    value={stats.byStatus['in-progress'] || 0}
                    icon={AlertCircle}
                    color="#3b82f6"
                />
            </div>

            {/* Category Distribution */}
            <div className="muni-card p-6">
                <h3 className="text-lg font-bold text-white mb-6">Category Distribution</h3>
                <div className="space-y-4">
                    {Object.entries(stats.byCategory).length === 0 ? (
                        <p className="text-[var(--muni-text-muted)]">No data available</p>
                    ) : (
                        Object.entries(stats.byCategory).map(([category, count]) => {
                            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white font-medium">{category}</span>
                                        <span className="text-[var(--muni-text-muted)]">{count} ({percent.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-2 bg-[var(--muni-border)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${percent}%`, backgroundColor: 'var(--muni-accent)' }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    const TrackerView = () => (
        <div className="space-y-6">
            {/* Controls */}
            <div className="muni-card p-4 space-y-3 md:space-y-0 md:flex md:gap-3 md:items-center md:justify-between">
                <div className="relative flex-1 md:flex-none md:w-96">
                    <Search className="absolute left-4 top-3 w-4 h-4 text-[var(--muni-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search ID, description, type..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="muni-input pl-10"
                    />
                </div>

                <div className="flex gap-3 md:gap-2 flex-wrap md:flex-nowrap">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="muni-input text-sm flex-1 md:flex-none"
                    >
                        <option>All Status</option>
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        className="muni-input text-sm flex-1 md:flex-none"
                    >
                        <option>All Severity</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <button
                        onClick={handleExport}
                        className="muni-btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="muni-card overflow-hidden">
                {filteredData.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muni-text-muted)]">No reports found matching your filters.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="muni-table">
                            <thead>
                                <tr className="bg-[var(--muni-surface)]">
                                    <th>ID</th>
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
                                {filteredData.map(issue => {
                                    const sevConfig = getSeverityConfig(issue.severity);
                                    const statConfig = getStatusConfig(issue.status);
                                    return (
                                        <tr key={issue.id} className="hover:bg-[var(--muni-surface)]">
                                            <td className="font-mono" style={{ color: 'var(--muni-accent)' }}>#{issue.id.substring(0, 8)}</td>
                                            <td className="font-bold text-white">{issue.type}</td>
                                            <td className="text-[var(--muni-text-muted)] max-w-xs truncate">{issue.desc}</td>
                                            <td>
                                                <span className="muni-badge" style={{ backgroundColor: `${sevConfig.color}15`, color: sevConfig.color, border: `1px solid ${sevConfig.color}30` }}>
                                                    {sevConfig.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`muni-badge ${statConfig.badgeClass}`}>
                                                    {statConfig.label}
                                                </span>
                                            </td>
                                            <td className="text-[var(--muni-text-muted)]">{issue.assignedOfficer || '—'}</td>
                                            <td className="text-[var(--muni-text-muted)] text-sm">
                                                {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => setSelectedIssue(issue)}
                                                    className="muni-btn-ghost p-2 h-auto w-auto"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const NavItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => {
                setActiveView(id);
                if (isMobile) setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wide text-[var(--muni-text-muted)] hover:text-white hover:bg-[var(--muni-surface)] rounded transition-colors"
            style={activeView === id ? { color: 'var(--muni-accent)', backgroundColor: 'var(--muni-surface)', borderLeft: '3px solid var(--muni-accent)' } : {}}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="municipal-theme flex h-screen pt-[var(--navbar-height)]">
            {/* Sidebar */}
            <aside
                className={`fixed md:relative w-64 h-full muni-card border-r transition-transform duration-300 flex flex-col z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="p-6 border-b border-[var(--muni-border)]">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--muni-accent)' }}>Admin Panel</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="tracker" icon={ClipboardList} label="Issue Tracker" />
                </nav>

                <div className="p-4 border-t border-[var(--muni-border)]">
                    <button className="muni-btn-ghost w-full flex items-center justify-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="muni-card border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="muni-btn-ghost p-2 md:hidden h-auto w-auto"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-white capitalize">
                            {activeView === 'dashboard' ? 'Dashboard' : 'Issue Tracker'}
                        </h2>
                    </div>
                    <Bell className="w-5 h-5 text-[var(--muni-text-muted)] cursor-pointer hover:text-white" />
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {activeView === 'dashboard' && <DashboardView />}
                    {activeView === 'tracker' && <TrackerView />}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40"
                />
            )}

            {/* Detail Modal */}
            <DetailModal
                issue={selectedIssue}
                onClose={() => setSelectedIssue(null)}
                onStatusUpdate={handleStatusUpdate}
                onDelete={(id) => setDeleteId(id)}
            />

            {/* Delete Confirmation */}
            {deleteId && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeleteId(null)}
                >
                    <div
                        className="muni-card p-8 max-w-sm w-full text-center border-[var(--muni-error)]"
                        style={{ borderColor: 'var(--muni-error)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muni-error)' }} />
                        <h3 className="text-lg font-bold text-white mb-2">Delete Report?</h3>
                        <p className="text-[var(--muni-text-muted)] text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="muni-btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 muni-btn-primary"
                                style={{ backgroundColor: 'var(--muni-error)', color: 'white' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}