import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import {
    LayoutDashboard, Map as MapIcon, ClipboardList,
    Trophy, Info, LogOut, Menu, X, Bell, Settings, FileText
} from 'lucide-react';
import app from '../utils/firebase';
import '../styles/municipal.css';

// --- Sub-Components for Views ---

const DashboardView = ({ issues, stats }) => (
    <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="muni-card h-[400px] flex items-center justify-center bg-[#050505] relative overflow-hidden group border border-[#046A38]/30">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#FF671F_0%,_transparent_70%)] group-hover:opacity-30 transition-opacity" />
            <div className="text-center z-10">
                <MapIcon size={48} className="mx-auto mb-4 text-[var(--muni-text-muted)]" />
                <h3 className="text-lg font-semibold text-white">Interactive Jurisdiction Map</h3>
                <p className="text-[var(--muni-text-muted)] text-sm mt-2">
                    {issues.length > 0 ? `${issues.length} active hotspots loaded` : "No active hotspots"}
                </p>
            </div>
        </div>
    </div>
);

const TrackerView = ({ issues }) => {
    return (
        <div className="muni-card overflow-hidden border border-[#06038D]/30">
            <div className="p-4 border-b border-[var(--muni-border)] flex justify-between items-center bg-gradient-to-r from-[#06038D]/10 to-transparent">
                <h3 className="font-semibold text-white">Recent Issue Reports</h3>
                <button className="muni-btn-ghost text-xs border-[#06038D]/50 text-[#06038D] hover:bg-[#06038D]/10">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
                <table className="muni-table">
                    <thead>
                        <tr>
                            <th className="text-[#FF671F]">ID</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-[var(--muni-text-muted)]">No issues found.</td></tr>
                        ) : (
                            issues.map((issue) => (
                                <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                                    <td className="font-mono text-[#FF671F] text-xs">{issue.id.slice(0, 8)}</td>
                                    <td>{issue.category || "General"}</td>
                                    <td className="truncate max-w-[200px]">{issue.desc || issue.description || "No description"}</td>
                                    <td>
                                        <span className={`muni-badge ${issue.status === 'resolved' ? 'success' : 'pending'}`}
                                            style={{
                                                borderColor: issue.status === 'resolved' ? '#046A38' : '#FF671F',
                                                color: issue.status === 'resolved' ? '#046A38' : '#FF671F',
                                                backgroundColor: issue.status === 'resolved' ? 'rgba(4, 106, 56, 0.1)' : 'rgba(255, 103, 31, 0.1)'
                                            }}
                                        >
                                            {issue.status || 'Open'}
                                        </span>
                                    </td>
                                    <td className="font-mono text-xs">
                                        {issue.createdAt?.seconds ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LeaderboardView = () => (
    <div className="muni-card overflow-hidden border border-[#FF671F]/30">
        <div className="p-4 border-b border-[var(--muni-border)] bg-gradient-to-r from-[#FF671F]/10 to-transparent">
            <h3 className="font-semibold text-white">Ward Performance Leaderboard</h3>
        </div>
        <table className="muni-table">
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
);

const AboutView = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div>
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <span className="text-[#FF671F]">Lets</span><span className="text-white">Fix</span><span className="text-[#046A38]">India</span>
            </h2>
            <p className="text-[var(--muni-text-muted)] leading-relaxed">
                We are a team of passionate engineers building the digital infrastructure for a better <span className="text-[#FF671F] font-bold">India</span>.
                Our mission is to bridge the gap between citizens and administration through transparency and technology.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="muni-card p-6 border-t-4 border-[#FF671F]">
                <h3 className="text-[#FF671F] font-mono mb-2">The Team</h3>
                <ul className="space-y-2 text-sm">
                    <li>Shaik Abdul Basith</li>
                    <li>Shaik Abdul Muqeeth</li>
                    <li>Shaik Awaiz</li>
                </ul>
            </div>
            <div className="muni-card p-6 border-t-4 border-[#046A38]">
                <h3 className="text-[#046A38] font-mono mb-2">Contact</h3>
                <p className="text-sm text-[var(--muni-text-muted)]">
                    For technical support or feature requests:
                    <br />
                    <a href="mailto:workwithdevit@gmail.com" className="text-white hover:underline">workwithdevit@gmail.com</a>
                </p>
            </div>
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

// --- Main Dashboard Component ---

export default function MunicipalDashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [issues, setIssues] = useState([]);
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, resolutionRate: 0 });

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

    // Fetch Real Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = getFirestore(app);
                const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(50));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIssues(data);

                // Calculate Stats
                const total = data.length;
                const resolved = data.filter(i => i.status === 'resolved').length;
                const pending = total - resolved;
                const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
                setStats({ total, resolved, pending, resolutionRate: rate });

            } catch (error) {
                console.error("Error fetching issues:", error);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
        }
    };

    const NavItem = ({ id, icon: IconComponent, label, external }) => (
        <button
            onClick={() => {
                if (external) {
                    navigate(external);
                } else {
                    setActiveView(id);
                }
                if (isMobile) setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeView === id
                ? 'bg-[var(--muni-surface)] text-[#FF671F] border-r-2 border-[#FF671F]'
                : 'text-[var(--muni-text-muted)] hover:text-white hover:bg-white/5'
                }`}
        >
            <IconComponent size={18} className={activeView === id ? "text-[#FF671F]" : ""} />
            {label}
        </button>
    );

    return (
        <div className="municipal-theme flex overflow-hidden">

            {/* Sidebar */}
            <aside
                className={`fixed md:relative z-50 h-screen w-64 bg-black border-r border-[var(--muni-border)] flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none md:overflow-hidden'
                    } ${!isMobile && isSidebarOpen ? 'md:w-64' : ''}`}
                aria-label="Sidebar Navigation"
                aria-hidden={!isSidebarOpen && isMobile}
            >
                <div className="p-6 border-b border-[var(--muni-border)] flex items-center justify-between">
                    <div className="font-bold tracking-wider text-xl flex items-center gap-1">
                        <span className="text-[#FF671F]">Lets</span>
                        <span className="text-white">Fix</span>
                        <span className="text-[#046A38]">India</span>
                    </div>
                    {isMobile && <button onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar"><X size={20} /></button>}
                </div>

                <nav className="flex-1 py-6 space-y-1">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="tracker" icon={ClipboardList} label="Issue Tracker" />
                    <NavItem id="leaderboard" icon={Trophy} label="Leaderboard" />
                    <NavItem id="register" icon={FileText} label="Municipal Register" external="/municipal-register" />
                    <NavItem id="about" icon={Info} label="About devit." />
                    <NavItem id="settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-[var(--muni-border)]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded bg-[var(--muni-surface)] flex items-center justify-center text-[#FF671F] font-bold border border-[#FF671F]/30">
                            {currentUser?.email?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{currentUser?.email}</p>
                            <p className="text-xs text-[var(--muni-text-muted)]">Municipal Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-2 text-xs text-red-400 hover:bg-red-500/10 rounded"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 border-b border-[var(--muni-border)] bg-[var(--muni-bg)] flex items-center justify-between px-6">
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

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        {activeView === 'dashboard' && <DashboardView issues={issues} stats={stats} />}
                        {activeView === 'tracker' && <TrackerView issues={issues} />}
                        {activeView === 'leaderboard' && <LeaderboardView />}
                        {activeView === 'about' && <AboutView />}
                        {activeView === 'settings' && <SettingsView />}
                    </div>
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
