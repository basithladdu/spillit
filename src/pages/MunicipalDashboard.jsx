import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, limit, orderBy, deleteDoc, doc, updateDoc, onSnapshot, where, getDocs } from 'firebase/firestore';
import {
    LayoutDashboard, MapPin, ClipboardList,
    Trophy, Info, LogOut, Menu, X, Bell, Settings, FileText, Eye, Trash2, Download, AlertCircle, CheckCircle, Clock, Scan, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import app from '../utils/firebase';
import PotholeDetectionView from '../components/PotholeDetectionView';
import GroupedPotholeView from '../components/GroupedPotholeView';
import AboutView from '../components/AboutView';
import '../styles/municipal.css';
import DashboardMap from '../components/DashboardMap';
import { AP_DEPARTMENTS, classifyRoadDepartment } from '../utils/apRoads';

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

const TrackerView = ({ issues, onSelectIssue, onDelete, onExport, onExportPDF, searchQuery, setSearchQuery, filterStatus, setFilterStatus, filterSeverity, setFilterSeverity }) => {
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

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => onExport(filteredIssues)} title="Export to Excel (Data Intensive)" className="muni-btn-ghost flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-2 text-xs">
                            <Download size={14} /> EXCEL
                        </button>
                        <button onClick={() => onExportPDF(filteredIssues)} title="Generate Formal PDF Civic Report" className="muni-btn-primary flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-2 text-xs">
                            <FileText size={14} /> PDF REPORT
                        </button>
                    </div>
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

const LeaderboardView = ({ issues }) => {
    const deiData = useMemo(() => {
        const stats = {};

        // Initialize stats for each department
        Object.keys(AP_DEPARTMENTS).forEach(code => {
            stats[code] = {
                code,
                name: AP_DEPARTMENTS[code].name,
                total: 0,
                resolved: 0,
                pending: 0,
                assigned: 0,
                critical: 0,
                criticalResolved: 0,
                totalResolutionTime: 0, // in ms
                resolutionCount: 0
            };
        });

        issues.forEach(issue => {
            const deptCode = issue.department || classifyRoadDepartment(issue.roadName || issue.address);
            if (stats[deptCode]) {
                const s = stats[deptCode];
                s.total++;

                // Track status
                if (issue.status === 'resolved') {
                    s.resolved++;
                    if (issue.resolvedAt && issue.ts) {
                        const created = issue.ts.toDate?.() || new Date(issue.ts);
                        const resolved = issue.resolvedAt.toDate?.() || new Date(issue.resolvedAt);
                        s.totalResolutionTime += (resolved - created);
                        s.resolutionCount++;
                    }
                } else {
                    s.pending++;
                }

                // Track assignments
                if (issue.assignedOfficer && issue.assignedOfficer !== 'Unassigned') {
                    s.assigned++;
                }

                if (issue.severity?.toLowerCase() === 'critical') {
                    s.critical++;
                    if (issue.status === 'resolved') s.criticalResolved++;
                }
            }
        });

        return Object.values(stats)
            .map(s => {
                const avgTimeMs = s.resolutionCount > 0 ? s.totalResolutionTime / s.resolutionCount : 0;
                const avgTimeHours = Math.round(avgTimeMs / (1000 * 60 * 60));
                const criticalRate = s.critical > 0 ? Math.round((s.criticalResolved / s.critical) * 100) : 100;
                const resolutionRate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;

                // DEI Score calculation (weighted average)
                // 40% resolution rate, 40% critical resolution rate, 20% speed (capped at 48h)
                const speedScore = avgTimeHours > 0 ? Math.max(0, 100 - (avgTimeHours / 48) * 100) : 100;
                const deiScore = (resolutionRate * 0.4) + (criticalRate * 0.4) + (speedScore * 0.2);

                return {
                    ...s,
                    avgTime: avgTimeHours > 0 ? `${avgTimeHours}h` : '—',
                    criticalRate: `${criticalRate}%`,
                    resolutionRate: `${resolutionRate}%`,
                    deiScore: deiScore.toFixed(1)
                };
            })
            .sort((a, b) => b.deiScore - a.deiScore);
    }, [issues]);

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="muni-card overflow-hidden border border-[#046A38]/30">
                <div className="p-6 border-b border-[var(--muni-border)] bg-gradient-to-r from-[#046A38]/10 to-transparent flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={20} />
                            Departmental Efficiency Index (DEI)
                        </h3>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Operational performance and workload breakdown</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-[#22c55e] border border-[#22c55e]/30 px-2 py-1 rounded bg-[#22c55e]/5">LIVE AUDIT</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="muni-table w-full min-w-[900px]">
                        <thead>
                            <tr>
                                <th className="w-16">Rank</th>
                                <th>Department / Jurisdiction</th>
                                <th className="text-center">Workload (Rem/Total)</th>
                                <th className="text-center">Assigned</th>
                                <th className="text-center">Resolution Rate</th>
                                <th className="text-center">Crit. Fixes</th>
                                <th className="text-right">DEI Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deiData.map((dept, i) => (
                                <tr key={dept.code} className={`hover:bg-white/5 transition-colors ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                                i === 1 ? 'bg-gray-300 text-black' :
                                                    i === 2 ? 'bg-orange-400 text-black' :
                                                        'bg-white/5 text-[var(--muni-text-muted)]'
                                            }`}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-white">{dept.name}</div>
                                        <div className="text-[9px] text-[var(--muni-text-muted)] uppercase tracking-widest">{dept.code} Sector</div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-sm font-mono font-bold ${dept.pending > 5 ? 'text-red-400' : 'text-white'}`}>
                                                {dept.pending} / {dept.total}
                                            </span>
                                            <span className="text-[9px] text-[var(--muni-text-muted)] uppercase">Remaining</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-mono font-bold text-blue-400">{dept.assigned}</span>
                                            <span className="text-[9px] text-[var(--muni-text-muted)] uppercase">On-Field</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="font-mono text-sm text-[#22c55e] font-bold">{dept.resolutionRate}</span>
                                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#22c55e]" style={{ width: dept.resolutionRate }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${parseInt(dept.criticalRate) > 80 ? 'text-[#22c55e] border-[#22c55e]/20' : 'text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {dept.criticalRate}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="text-xl font-black text-white px-2">
                                            {dept.deiScore}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="muni-card p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-yellow-500" size={20} />
                        <h4 className="font-bold text-white uppercase text-xs tracking-widest">Efficiency Insight</h4>
                    </div>
                    <p className="text-sm text-[var(--muni-text-muted)] leading-relaxed italic">
                        The top performer, <span className="text-white font-bold">{deiData[0]?.name}</span>, is currently outpacing other jurisdictions in Critical Resolution by {parseInt(deiData[0]?.criticalRate) - Math.min(...deiData.map(d => parseInt(d.criticalRate)))}%.
                        R&B maintains the highest volume of high-speed rural infrastructure.
                    </p>
                </div>
                <div className="muni-card p-6 border-l-4 border-[#06038D]">
                    <div className="flex items-center gap-3 mb-4">
                        <Scan className="text-[#06038D]" size={20} />
                        <h4 className="font-bold text-white uppercase text-xs tracking-widest">Governance Meta</h4>
                    </div>
                    <p className="text-sm text-[var(--muni-text-muted)] leading-relaxed">
                        DEI scores are calculated based on a weighted 40/40/20 algorithm: Resolution Velocity, Critical Patching Integrity, and Citizen Response Speed.
                    </p>
                </div>
            </div>
        </div>
    );
};


const SettingsView = () => (
    <div className="muni-card p-8 text-center border-t-4 border-[#06038D]">
        <Settings size={48} className="mx-auto mb-4 text-[#06038D]" />
        <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
        <p className="text-[var(--muni-text-muted)]">Configuration options coming soon.</p>
    </div>
);

const DetailModal = ({ issue, onClose, onStatusUpdate, onDelete }) => {
    const [aiReport, setAiReport] = useState(null);
    const [aiDetections, setAiDetections] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    useEffect(() => {
        const fetchAIIntelligence = async () => {
            if (!issue || issue.type !== 'Pothole') return;
            setLoadingAI(true);
            try {
                const db = getFirestore(app);

                // 1. Get the parent AI report
                const reportQuery = query(
                    collection(db, 'pothole_reports'),
                    where('sourceIssueId', '==', issue.id),
                    limit(1)
                );
                const reportSnap = await getDocs(reportQuery);

                if (!reportSnap.empty) {
                    const reportData = { id: reportSnap.docs[0].id, ...reportSnap.docs[0].data() };
                    setAiReport(reportData);

                    // 2. Get individual detections for this report
                    const detectionsQuery = query(
                        collection(db, 'pothole_detections'),
                        where('reportId', '==', reportData.id)
                    );
                    const detectionsSnap = await getDocs(detectionsQuery);
                    setAiDetections(detectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            } catch (err) {
                console.error("Error fetching AI data:", err);
            } finally {
                setLoadingAI(false);
            }
        };

        fetchAIIntelligence();
    }, [issue]);

    const generatePDF = async () => {
        setGeneratingPDF(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- Header & Branding ---
            doc.setFillColor(9, 9, 11); // Dark background
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 103, 31); // Orange
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Lets', 20, 25);
            doc.setTextColor(255, 255, 255);
            doc.text('Fix', 38, 25);
            doc.setTextColor(4, 106, 56); // Green
            doc.text('India', 50, 25);

            doc.setTextColor(161, 161, 170);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('MUNICIPAL AUTHORITY - OFFICIAL WORK ORDER', pageWidth - 20, 20, { align: 'right' });
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, 26, { align: 'right' });

            // --- Issue Title & ID ---
            let y = 55;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.text(`${issue.type || 'CIVIC ISSUE'} REPORT`, 20, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('courier', 'bold');
            doc.text(`Reference ID: ${issue.id}`, 20, y);
            y += 15;

            // --- Metadata Table ---
            const metaData = [
                ['Status', (issue.status || 'NEW').toUpperCase(), 'Severity', (issue.severity || 'UNKNOWN').toUpperCase()],
                ['Reported On', new Date(issue.ts?.toDate?.() || issue.ts).toLocaleString(), 'Department', classifyRoadDepartment(issue.roadName || issue.address)],
                ['Latitude', issue.lat?.toFixed(5) || 'N/A', 'Longitude', issue.lng?.toFixed(5) || 'N/A'],
                ['Address', issue.address || 'Not Provided', '', '']
            ];

            autoTable(doc, {
                startY: y,
                body: metaData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    0: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 30 },
                    2: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 30 }
                }
            });

            y = doc.lastAutoTable.finalY + 15;

            // --- AI Insights ---
            if (aiDetections.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(255, 103, 31);
                doc.text('AI DEEP INTELLIGENCE ANALYSIS', 20, y);
                y += 8;

                const detData = aiDetections.map((d, i) => [
                    `#${i + 1}`, d.severity, d.depth, `${Math.round(d.confidence * 100)}%`, d.department || 'N/A'
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [['#', 'Severity', 'Estimated Depth', 'AI Confidence', 'Routing']],
                    body: detData,
                    theme: 'striped',
                    headStyles: { fillColor: [255, 103, 31] },
                    styles: { fontSize: 8 }
                });
                y = doc.lastAutoTable.finalY + 15;
            }

            // --- Description ---
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('CITIZEN DESCRIPTION:', 20, y);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(issue.desc || 'No description provided.', pageWidth - 40);
            doc.text(splitText, 20, y);
            y += splitText.length * 5 + 15;

            // --- Photos Notice (Base64 is required for jsPDF images from external URLs) ---
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Note: Visual evidence is accessible via QR or Dashboard Link below.', 20, y);
            y += 10;

            // --- Footer / Links ---
            doc.setDrawColor(200, 200, 200);
            doc.line(20, doc.internal.pageSize.getHeight() - 30, pageWidth - 20, doc.internal.pageSize.getHeight() - 30);

            doc.setFontSize(8);
            doc.text('POWERED BY DEVIT - Building exceptional software for India.', 20, doc.internal.pageSize.getHeight() - 20);
            doc.setTextColor(0, 0, 255);
            doc.text('Visit: www.wedevit.in', pageWidth - 20, doc.internal.pageSize.getHeight() - 20, { align: 'right' });

            doc.save(`WORK_ORDER_${issue.id.slice(0, 8)}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF. Check console for details.");
        } finally {
            setGeneratingPDF(false);
        }
    };

    if (!issue) return null;
    const sevConfig = getSeverityConfig(issue.severity);
    const statConfig = getStatusConfig(issue.status);
    const suggestedDept = classifyRoadDepartment(issue.roadName || issue.address);

    return (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="muni-card w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#FF671F]/30 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white">{issue.type}</h2>
                            {issue.type === 'Pothole' && (
                                <span className="bg-[#FF671F]/20 text-[#FF671F] text-[10px] font-bold px-2 py-0.5 rounded border border-[#FF671F]/30 uppercase tracking-widest flex items-center gap-1">
                                    <Scan size={10} /> AI Enhanced
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="muni-badge" style={{ color: sevConfig.color, backgroundColor: `${sevConfig.color}15`, borderColor: `${sevConfig.color}30` }}>
                                {sevConfig.label}
                            </span>
                            <span className={`muni-badge ${statConfig.badgeClass}`}>
                                {statConfig.label}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={generatePDF}
                            disabled={generatingPDF}
                            className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
                            title="Generate Formal Work Order PDF"
                        >
                            {generatingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            <span className="hidden sm:inline">PDF ORDER</span>
                        </button>
                        <button onClick={onClose} className="text-[var(--muni-text-muted)] hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Primary Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Tracking Reference</label>
                                <p className="text-white font-mono text-sm mt-1 bg-white/5 p-2 rounded border border-white/5">{issue.id}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Department Routing</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`muni-badge !font-mono !text-[10px]`} style={{
                                        color: AP_DEPARTMENTS[suggestedDept]?.color || '#fff',
                                        backgroundColor: `${AP_DEPARTMENTS[suggestedDept]?.color}15`,
                                        borderColor: `${AP_DEPARTMENTS[suggestedDept]?.color}30`
                                    }}>
                                        {AP_DEPARTMENTS[suggestedDept]?.name || suggestedDept}
                                    </span>
                                    <span className="text-[9px] text-[var(--muni-text-muted)] italic">Auto-suggested</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Report Timestamp</label>
                                <div className="flex items-center gap-2 text-white mt-1">
                                    <Clock size={14} className="text-[#FF671F]" />
                                    <span className="text-sm">
                                        {issue.ts ? new Date(issue.ts.toDate?.() || issue.ts).toLocaleString('en-IN') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Location Integrity</label>
                                <div className="flex items-center gap-2 text-white mt-1">
                                    <MapPin size={14} className="text-[#046A38]" />
                                    <span className="text-xs font-mono">{issue.lat?.toFixed(5)}, {issue.lng?.toFixed(5)}</span>
                                </div>
                                <p className="text-[10px] text-[var(--muni-text-muted)] mt-1">{issue.address || 'GPS Coordinates Stamped'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Analytics / Evidence Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Eye size={14} className="text-[#FF671F]" /> Visual Evidence & AI Analytics
                            </label>
                            {loadingAI && <Loader2 size={14} className="animate-spin text-[#FF671F]" />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Original Capture */}
                            <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden border border-[var(--muni-border)] bg-black/40 group">
                                    <img src={issue.imageUrl} alt="Raw capture" className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-white border border-white/10 uppercase">Raw Feed</div>
                                </div>
                            </div>

                            {/* AI Analysis (Annotated) */}
                            <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden border border-[#FF671F]/30 bg-black/40 group">
                                    {aiReport?.annotatedImageUrl ? (
                                        <img src={aiReport.annotatedImageUrl} alt="AI analysis" className="w-full h-48 object-cover border-2 border-transparent group-hover:border-[#FF671F]/20 transition-all" />
                                    ) : (
                                        <div className="w-full h-48 flex flex-col items-center justify-center bg-white/5 space-y-2">
                                            {loadingAI ? <Loader2 size={24} className="animate-spin text-[#FF671F]" /> : <AlertCircle size={24} className="text-[var(--muni-text-muted)]" />}
                                            <p className="text-[10px] text-[var(--muni-text-muted)] uppercase tracking-widest">{loadingAI ? 'Processing AI Data...' : 'AI Insights Unavailable'}</p>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-[#FF671F] px-2 py-0.5 rounded text-[8px] font-bold text-black uppercase shadow-lg">AI Vision Stamped</div>
                                </div>
                            </div>
                        </div>

                        {/* AI Detection Breakdown */}
                        {aiDetections.length > 0 && (
                            <div className="mt-4 bg-[#FF671F]/5 rounded-xl border border-[#FF671F]/10 p-4">
                                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                                    <Scan size={14} className="text-[#FF671F]" />
                                    Deep Intelligence: {aiDetections.length} Potholes Detected
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {aiDetections.map((det, idx) => (
                                        <div key={det.id} className="bg-black/40 p-2 rounded border border-white/5 flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-[var(--muni-text-muted)]">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold ${det.severity === 'Critical' ? 'text-red-500' : 'text-white'}`}>{det.severity}</span>
                                                    <span className="text-[8px] text-[var(--muni-text-muted)] uppercase tracking-tighter">Conf: {Math.round(det.confidence * 100)}%</span>
                                                </div>
                                                <p className="text-[8px] text-white/60 font-mono mt-0.5">Depth Est: {det.depth}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Department / Assignment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--muni-border)]">
                        <div>
                            <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Official Description</label>
                            <p className="text-sm text-gray-300 mt-2 leading-relaxed italic border-l-2 border-[#FF671F]/30 pl-3">
                                "{issue.desc || 'No additional notes provided by citizen.'}"
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Assigned Responsibility</label>
                                <div className="flex items-center gap-2 text-white mt-1">
                                    <div className="w-2 h-2 rounded-full bg-[#FF671F] animate-pulse"></div>
                                    <span className="text-sm font-medium">{issue.assignedOfficer || 'Awaiting Officer Assignment'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex gap-3 pt-6 border-t border-[var(--muni-border)]">
                        <button
                            onClick={() => onStatusUpdate(issue.id, issue.status)}
                            className={`flex-1 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest ${issue.status === 'resolved'
                                ? 'bg-white/5 text-white hover:bg-white/10'
                                : 'muni-btn-primary'
                                }`}
                        >
                            {issue.status === 'resolved' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                            {issue.status === 'resolved' ? 'Reopen Investigation' : 'Authorize & Resolve'}
                        </button>
                        <button onClick={() => { onDelete(issue.id); onClose(); }} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20">
                            <Trash2 size={20} />
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
        const updateData = { status: newStatus };
        if (newStatus === 'resolved') {
            updateData.resolvedAt = new Date();
        } else {
            updateData.resolvedAt = null;
        }
        try {
            await updateDoc(doc(getFirestore(app), 'issues', id), updateData);
            setSelectedIssue(prev => prev ? { ...prev, ...updateData } : null);
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

    const handleExportPDF = async (dataToExport) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Branding Header
            doc.setFillColor(9, 9, 11);
            doc.rect(0, 0, pageWidth, 45, 'F');
            doc.setTextColor(255, 103, 31);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('LetsFixIndia', 20, 25);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('MUNICIPAL AGGREGATION SYSTEM', 20, 35);

            doc.setTextColor(161, 161, 170);
            doc.text('OFFICIAL CIVIC AUDIT REPORT', pageWidth - 20, 25, { align: 'right' });
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 32, { align: 'right' });
            doc.text(`Total Records: ${dataToExport.length}`, pageWidth - 20, 39, { align: 'right' });

            // Stats Summary
            let y = 60;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.text('Executive Summary', 20, y);

            const stats = {
                critical: dataToExport.filter(i => i.severity?.toLowerCase() === 'critical').length,
                resolved: dataToExport.filter(i => i.status?.toLowerCase() === 'resolved').length,
                pending: dataToExport.filter(i => i.status?.toLowerCase() === 'new' || i.status?.toLowerCase() === 'in-progress').length
            };

            autoTable(doc, {
                startY: y + 8,
                head: [['Critical Alerts', 'Resolved Cases', 'Pending Action', 'Jurisdiction Index']],
                body: [[stats.critical, stats.resolved, stats.pending, 'Active']],
                theme: 'grid',
                headStyles: { fillColor: [4, 106, 56] }
            });

            y = doc.lastAutoTable.finalY + 15;

            // Detailed Table
            doc.setFontSize(14);
            doc.text('Case Breakdown', 20, y);

            const tableData = dataToExport.map(i => [
                i.id.slice(0, 8),
                i.type || 'Other',
                i.severity || 'Medium',
                (i.status || 'New').toUpperCase(),
                new Date(i.ts?.toDate?.() || i.ts).toLocaleDateString(),
                classifyRoadDepartment(i.roadName || i.address)
            ]);

            autoTable(doc, {
                startY: y + 8,
                head: [['Ref ID', 'Typology', 'Severity', 'Current Status', 'Report Date', 'Routing']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [255, 103, 31] },
                styles: { fontSize: 8 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(200, 200, 200);
                doc.line(20, doc.internal.pageSize.getHeight() - 20, pageWidth - 20, doc.internal.pageSize.getHeight() - 20);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('CONFIDENTIAL - FOR OFFICIAL MUNICIPAL USE ONLY', 20, doc.internal.pageSize.getHeight() - 12);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 12, { align: 'right' });
            }

            doc.save(`Civic_Audit_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error("Batch PDF failed:", err);
            alert("Error generating batch report.");
        }
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
                                onExportPDF={handleExportPDF}
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
                        {activeView === 'leaderboard' && <LeaderboardView issues={issues} />}
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