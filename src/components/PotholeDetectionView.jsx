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
    TrendingUp,
    Video,
    Activity,
    X
} from 'lucide-react';
import { classifyRoadDepartment, AP_DEPARTMENTS } from '../utils/apRoads';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

const DEPTH_COLORS = {
    DEEP: '#FF3D00',
    MODERATE: '#FF9800',
    SHALLOW: '#4CAF50'
};

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
    const [selectedIssues, setSelectedIssues] = useState(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);

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
            months[key] = { month: key, incoming: 0, resolved: 0 };
            last6Months.push(key);
        }

        issues.forEach(issue => {
            if (issue.ts) {
                const date = issue.ts.toDate();
                const key = date.toLocaleString('default', { month: 'short' });
                if (months[key]) {
                    months[key].incoming++; // Total items arriving
                    if (issue.status === 'COMPLETED') {
                        months[key].resolved++; // Items finished
                    }
                }
            }
        });

        return last6Months.map(key => months[key]);
    }, [issues]);

    const stats = useMemo(() => {
        const allDetections = Object.values(detectionsMap).flat();
        return {
            totalIssues: issues.length,
            totalDetections: allDetections.length,
            pending: issues.filter(i => !i.status || i.status === 'PENDING').length,
            completed: issues.filter(i => i.status === 'COMPLETED').length,
            critical: allDetections.filter(d => d.severity === 'Critical' || d.depth === 'DEEP').length,
            assetHealth: Math.max(0, 100 - (issues.filter(i => i.status !== 'COMPLETED').length * 2))
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
            toast.success(`Success! Status pushed to ${newStatus}`, {
                position: "bottom-right",
                autoClose: 3000,
                theme: "dark",
                style: { border: '1px solid #10b981', background: '#0a0a0a' }
            });
        } catch (error) {
            console.error('Error updating issue status:', error);
            toast.error("Cloud Sync Failed", { theme: "dark" });
        }
    };

    const handleDepartmentUpdate = async (issueId, newDept) => {
        try {
            await updateDoc(doc(db, 'issues', issueId), {
                department: newDept
            });
            toast.success(`Assigned to Department: ${newDept}`, {
                position: "bottom-right",
                autoClose: 2000,
                theme: "dark",
                style: { border: '1px solid #FF671F', background: '#0a0a0a' }
            });
        } catch (error) {
            console.error('Error updating department:', error);
            toast.error("Assignment Failed", { theme: "dark" });
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

    const handleSelectIssue = (issueId) => {
        const newSelected = new Set(selectedIssues);
        if (newSelected.has(issueId)) {
            newSelected.delete(issueId);
        } else {
            newSelected.add(issueId);
        }
        setSelectedIssues(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIssues.size === processedIssues.length) {
            setSelectedIssues(new Set());
        } else {
            setSelectedIssues(new Set(processedIssues.map(i => i.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIssues.size} issues and all their detections?`)) {
            setIsBulkDeleting(true);
            try {
                for (const issueId of selectedIssues) {
                    // Delete all detections for this issue first
                    const detections = detectionsMap[issueId] || [];
                    for (const d of detections) {
                        await deleteDoc(doc(db, 'pothole_detections', d.id));
                    }
                    // Delete the issue
                    await deleteDoc(doc(db, 'issues', issueId));
                }
                setSelectedIssues(new Set());
                toast.success(`Successfully deleted ${selectedIssues.size} issues`);
            } catch (error) {
                console.error('Error in bulk delete:', error);
                toast.error('Bulk deletion failed');
            } finally {
                setIsBulkDeleting(false);
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
            if (detections.length === 0) {
                // Add the issue even if no sub-detections exist
                exportData.push({
                    'Issue ID': issue.id,
                    'Road': issue.roadName || issue.address || 'N/A',
                    'Depth': 'N/A',
                    'Severity': issue.severity || 'N/A',
                    'Department': issue.department || classifyRoadDepartment(issue.address),
                    'Issue Status': issue.status || 'PENDING',
                    'Confidence': 'N/A',
                    'Reported': issue.ts?.toDate?.().toLocaleString() || 'N/A'
                });
            } else {
                detections.forEach(d => {
                    exportData.push({
                        'Issue ID': issue.id,
                        'Road': d.roadName || issue.roadName || issue.address || 'N/A',
                        'Depth': d.depth || 'N/A',
                        'Severity': d.severity || issue.severity || 'N/A',
                        'Department': d.department || issue.department || classifyRoadDepartment(issue.address),
                        'Issue Status': issue.status || 'PENDING',
                        'Confidence': d.confidence ? `${Math.round(d.confidence * 100)}%` : 'N/A',
                        'Reported': issue.ts?.toDate?.().toLocaleString() || 'N/A'
                    });
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pothole Detections');
        XLSX.writeFile(wb, `pothole_summary_${Date.now()}.xlsx`);
        setShowExportMenu(false);
    };

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Helper to load image
            const loadImage = (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            };

            const logoImg = await loadImage('/roads.png');

            // Branding Header - Matching Municipal Theme
            doc.setFillColor(9, 9, 11); // Dark background
            doc.rect(0, 0, pageWidth, 45, 'F');

            doc.setTextColor(255, 103, 31); // Orange
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('LetsFixIndia', 20, 25);

            // Add R&B Logo on the right with aspect ratio preservation
            if (logoImg) {
                const logoWidth = 50;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', pageWidth - 20 - logoWidth, 10, logoWidth, logoHeight);
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('AI DEEP INTELLIGENCE - POTHOLE AUDIT REPORT', 20, 35);

            doc.setTextColor(161, 161, 170);
            doc.setFontSize(8);
            doc.text('CONFIDENTIAL GOVERNMENT REPORT', pageWidth - 20, 28, { align: 'right' });
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, 34, { align: 'right' });
            doc.text(`Total Records: ${processedIssues.length}`, pageWidth - 20, 40, { align: 'right' });

            // Executive Summary
            let y = 60;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.text('Executive Summary', 20, y);

            const totalDetections = Object.values(detectionsMap).flat().length;
            const criticalCount = Object.values(detectionsMap).flat().filter(d => d.severity === 'Critical').length;

            autoTable(doc, {
                startY: y + 8,
                head: [['Total Hotspots', 'Total Detections', 'Critical Alerts', 'Audit Status']],
                body: [[processedIssues.length, totalDetections, criticalCount, 'VERIFIED BY AI']],
                theme: 'grid',
                headStyles: { fillColor: [4, 106, 56] } // Green
            });

            y = doc.lastAutoTable.finalY + 15;

            // Detailed Table
            doc.setFontSize(14);
            doc.text('Detailed Pothole Breakdown', 20, y);

            const tableData = [];
            processedIssues.forEach(issue => {
                const detections = detectionsMap[issue.id] || [];
                if (detections.length === 0) {
                    tableData.push([
                        issue.id.slice(0, 8),
                        'N/A',
                        issue.severity || 'Medium',
                        'N/A',
                        issue.department || classifyRoadDepartment(issue.address),
                        issue.status || 'PENDING'
                    ]);
                } else {
                    detections.forEach(d => {
                        tableData.push([
                            issue.id.slice(0, 8),
                            d.depth || 'N/A',
                            d.severity || issue.severity || 'Medium',
                            d.confidence ? `${Math.round(d.confidence * 100)}%` : 'N/A',
                            d.department || issue.department || classifyRoadDepartment(issue.address),
                            issue.status || 'PENDING'
                        ]);
                    });
                }
            });

            autoTable(doc, {
                startY: y + 8,
                head: [['ID', 'Depth', 'Severity', 'AI Conf.', 'Routing', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [255, 103, 31] }, // Orange
                styles: { fontSize: 8 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(200, 200, 200);
                doc.line(20, doc.internal.pageSize.getHeight() - 25, pageWidth - 20, doc.internal.pageSize.getHeight() - 25);

                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('POWERED BY DEVIT - Building exceptional software for India.', 20, doc.internal.pageSize.getHeight() - 15);
                doc.setTextColor(0, 0, 255);
                doc.text('www.wedevit.in', pageWidth - 20, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
            }

            doc.save(`POTHOLE_AUDIT_${Date.now()}.pdf`);
            setShowExportMenu(false);
            toast.success("Assigned to Department");
        } catch (err) {
            console.error("PDF Export Error:", err);
            toast.error("Failed to generate PDF Report");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Target className="text-[#FF671F]" />
                            Pothole Deep Intelligence
                        </h1>
                        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF671F]/20 text-[#FF671F] border border-[#FF671F]/30 uppercase tracking-[0.1em] animate-pulse">
                            RNB Specialized Integration
                        </span>
                    </div>
                    <p className="text-[var(--muni-text-muted)] mt-1">
                        AI-powered road condition analysis and reporting system for Andhra Pradesh infrastructure
                    </p>
                </div>
                <div className="flex gap-3 relative">
                    <button
                        onClick={() => {
                            if (processedIssues.length === 0) {
                                toast.info("No data available to generate report.", { theme: "dark" });
                                return;
                            }
                            setShowExportMenu(!showExportMenu);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FF671F]/20 relative z-10 group"
                        style={{
                            background: 'linear-gradient(135deg, #FF671F 0%, #ffffff 50%, #046A38 100%)',
                            color: 'black',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                        GENERATE REPORT
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showExportMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                            <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-[#0a0a0b] border border-[#FF671F]/40 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl ring-1 ring-white/10">
                                <button
                                    onClick={exportToExcel}
                                    className="w-full h-12 flex items-center gap-3 px-4 text-left text-sm text-[var(--muni-text-muted)] hover:text-white hover:bg-white/5 transition-all border-b border-white/5 group/nav"
                                >
                                    <Download size={14} className="text-green-500 group-hover/nav:scale-110 transition-transform" />
                                    <span>Export as EXCEL</span>
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="w-full h-12 flex items-center gap-3 px-4 text-left text-sm text-[var(--muni-text-muted)] hover:text-white hover:bg-white/5 transition-all group/nav"
                                >
                                    <FileText size={14} className="text-red-500 group-hover/nav:scale-110 transition-transform" />
                                    <span>Export as PDF Audit</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Advanced Statistics Section - Expandable */}
            <div className="muni-card overflow-hidden border border-[#FF671F]/30">
                <button
                    onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FF671F]/10 rounded-lg group-hover:bg-[#FF671F]/20 transition-colors">
                            <Activity className="text-[#FF671F]" size={20} />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                Advanced Analytics Dashboard
                                <span className="text-[10px] px-2 py-0.5 rounded bg-[#046A38]/20 text-[#046A38] border border-[#046A38]/30 font-bold uppercase tracking-wider">
                                    Deep Insights
                                </span>
                            </h2>
                            <p className="text-xs text-[var(--muni-text-muted)] mt-0.5">
                                Comprehensive breakdown of pothole detection metrics, department performance, and AI analytics
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muni-text-muted)] font-mono hidden sm:inline">
                            {showAdvancedStats ? 'Hide Details' : 'Show Details'}
                        </span>
                        <ChevronDown
                            size={20}
                            className={`text-[#FF671F] transition-transform duration-300 ${showAdvancedStats ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                {showAdvancedStats && (
                    <div className="p-6 border-t border-[var(--muni-border)] space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Depth Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Depth Analysis */}
                            <div className="muni-card p-5 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="text-red-500" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Depth Distribution</h3>
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const allDetections = Object.values(detectionsMap).flat();
                                        const depthCounts = {
                                            DEEP: allDetections.filter(d => d.depth === 'DEEP').length,
                                            MODERATE: allDetections.filter(d => d.depth === 'MODERATE').length,
                                            SHALLOW: allDetections.filter(d => d.depth === 'SHALLOW').length
                                        };
                                        const total = allDetections.length || 1;

                                        return [
                                            { label: 'Deep', count: depthCounts.DEEP, color: '#FF3D00', icon: '🔴' },
                                            { label: 'Moderate', count: depthCounts.MODERATE, color: '#FF9800', icon: '🟠' },
                                            { label: 'Shallow', count: depthCounts.SHALLOW, color: '#4CAF50', icon: '🟢' }
                                        ].map((depth, idx) => {
                                            const percentage = Math.round((depth.count / total) * 100);
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-white font-medium flex items-center gap-1.5">
                                                            <span>{depth.icon}</span>
                                                            {depth.label}
                                                        </span>
                                                        <span className="font-mono text-[var(--muni-text-muted)]">
                                                            {depth.count} ({percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all duration-500"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: depth.color,
                                                                boxShadow: `0 0 6px ${depth.color}60`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Severity by Department */}
                            <div className="muni-card p-5 border border-[#06038D]/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserCheck className="text-[#06038D]" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Breakdown</h3>
                                </div>
                                <div className="space-y-2">
                                    {(() => {
                                        // Count issues by department (not detections)
                                        const deptCounts = {};
                                        issues.forEach(issue => {
                                            const dept = issue.department || classifyRoadDepartment(issue.address) || 'UNASSIGNED';
                                            const detectionCount = (detectionsMap[issue.id] || []).length;
                                            if (!deptCounts[dept]) {
                                                deptCounts[dept] = { issues: 0, detections: 0 };
                                            }
                                            deptCounts[dept].issues++;
                                            deptCounts[dept].detections += detectionCount;
                                        });

                                        return Object.entries(deptCounts)
                                            .sort((a, b) => b[1].detections - a[1].detections)
                                            .slice(0, 4)
                                            .map(([dept, data], idx) => {
                                                const deptInfo = AP_DEPARTMENTS[dept];
                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-[#06038D]/20 text-[#06038D]">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-medium text-white">{deptInfo?.name || dept}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono text-[var(--muni-text-muted)]">{data.issues} issue{data.issues !== 1 ? 's' : ''}</span>
                                                            <span className="text-xs font-mono text-white">·</span>
                                                            <span className="text-xs font-mono text-[#FF671F]">{data.detections} pothole{data.detections !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                    })()}
                                </div>
                            </div>

                            {/* Time-based Analytics */}
                            <div className="muni-card p-5 border border-[#046A38]/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="text-[#046A38]" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Time Analytics</h3>
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const now = new Date();
                                        const today = issues.filter(i => {
                                            const date = i.ts?.toDate?.() || new Date(i.ts);
                                            return date.toDateString() === now.toDateString();
                                        }).length;

                                        const thisWeek = issues.filter(i => {
                                            const date = i.ts?.toDate?.() || new Date(i.ts);
                                            const weekAgo = new Date(now);
                                            weekAgo.setDate(weekAgo.getDate() - 7);
                                            return date >= weekAgo;
                                        }).length;

                                        const thisMonth = issues.filter(i => {
                                            const date = i.ts?.toDate?.() || new Date(i.ts);
                                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                                        }).length;

                                        return [
                                            { label: 'Today', value: today, icon: '📅', color: '#FF671F' },
                                            { label: 'This Week', value: thisWeek, icon: '📊', color: '#06038D' },
                                            { label: 'This Month', value: thisMonth, icon: '📈', color: '#046A38' }
                                        ].map((stat, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                                <span className="text-xs text-white font-medium flex items-center gap-2">
                                                    <span>{stat.icon}</span>
                                                    {stat.label}
                                                </span>
                                                <span className="text-lg font-bold font-mono" style={{ color: stat.color }}>
                                                    {stat.value}
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Additional Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* AI Confidence Metrics */}
                            <div className="muni-card p-5 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="text-purple-500" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Confidence</h3>
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const allDetections = Object.values(detectionsMap).flat();
                                        const avgConfidence = allDetections.length > 0
                                            ? (allDetections.reduce((sum, d) => sum + (d.confidence || 0), 0) / allDetections.length * 100)
                                            : 0;
                                        const highConfidence = allDetections.filter(d => (d.confidence || 0) >= 0.8).length;
                                        const lowConfidence = allDetections.filter(d => (d.confidence || 0) < 0.6).length;

                                        return (
                                            <>
                                                <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                                                    <p className="text-3xl font-bold text-purple-500 font-mono">{avgConfidence.toFixed(1)}%</p>
                                                    <p className="text-[10px] text-[var(--muni-text-muted)] uppercase tracking-wider mt-1">Average Confidence</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="p-2 bg-white/5 rounded text-center">
                                                        <p className="font-bold text-green-500">{highConfidence}</p>
                                                        <p className="text-[9px] text-[var(--muni-text-muted)] uppercase">High (≥80%)</p>
                                                    </div>
                                                    <div className="p-2 bg-white/5 rounded text-center">
                                                        <p className="font-bold text-yellow-500">{lowConfidence}</p>
                                                        <p className="text-[9px] text-[var(--muni-text-muted)] uppercase">Low (&lt;60%)</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Resolution Efficiency */}
                            <div className="muni-card p-5 border border-[#10b981]/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="text-[#10b981]" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resolution Efficiency</h3>
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const completionRate = stats.totalIssues > 0
                                            ? Math.round((stats.completed / stats.totalIssues) * 100)
                                            : 0;

                                        return (
                                            <>
                                                <div className="relative pt-1">
                                                    <div className="flex mb-2 items-center justify-between">
                                                        <span className="text-xs font-semibold text-[#10b981]">Completion Rate</span>
                                                        <span className="text-xs font-semibold text-[#10b981]">{completionRate}%</span>
                                                    </div>
                                                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-white/5">
                                                        <div
                                                            style={{ width: `${completionRate}%` }}
                                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#10b981] transition-all duration-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="p-2 bg-white/5 rounded text-center">
                                                        <p className="font-bold text-[#10b981]">{stats.completed}</p>
                                                        <p className="text-[9px] text-[var(--muni-text-muted)] uppercase">Completed</p>
                                                    </div>
                                                    <div className="p-2 bg-white/5 rounded text-center">
                                                        <p className="font-bold text-yellow-500">{stats.pending}</p>
                                                        <p className="text-[9px] text-[var(--muni-text-muted)] uppercase">Pending</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Critical Alerts */}
                            <div className="muni-card p-5 border border-red-500/20 bg-red-500/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="text-red-500 animate-pulse" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Critical Alerts</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                        <p className="text-4xl font-bold text-red-500 font-mono">{stats.critical}</p>
                                        <p className="text-[10px] text-[var(--muni-text-muted)] uppercase tracking-wider mt-1">Critical Issues</p>
                                    </div>
                                    {stats.critical > 0 && (
                                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                            <p className="text-[10px] text-red-400 font-medium leading-relaxed">
                                                ⚠️ <span className="font-bold">{stats.critical}</span> critical-severity potholes require immediate attention.
                                                Prioritize deep potholes for rapid response.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary Insight */}
                        <div className="muni-card p-5 border-l-4 border-[#FF671F] bg-[#FF671F]/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-[#FF671F]/20 rounded-lg flex-shrink-0">
                                    <Activity className="text-[#FF671F]" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">System Intelligence Summary</h4>
                                    <p className="text-sm text-[var(--muni-text-muted)] leading-relaxed">
                                        {(() => {
                                            const allDetections = Object.values(detectionsMap).flat();
                                            const avgConfidence = allDetections.length > 0
                                                ? (allDetections.reduce((sum, d) => sum + (d.confidence || 0), 0) / allDetections.length * 100)
                                                : 0;
                                            const completionRate = stats.totalIssues > 0
                                                ? Math.round((stats.completed / stats.totalIssues) * 100)
                                                : 0;

                                            if (completionRate >= 70) {
                                                return (
                                                    <>AI detection system operating at <span className="text-[#10b981] font-bold">{avgConfidence.toFixed(1)}% confidence</span>.
                                                        Resolution efficiency is <span className="text-[#10b981] font-bold">excellent</span> at {completionRate}%.
                                                        {stats.critical > 0 && `However, ${stats.critical} critical issue${stats.critical > 1 ? 's' : ''} require${stats.critical === 1 ? 's' : ''} immediate departmental action.`}</>
                                                );
                                            } else if (completionRate >= 40) {
                                                return (
                                                    <>AI confidence at <span className="text-purple-500 font-bold">{avgConfidence.toFixed(1)}%</span>.
                                                        Resolution rate is <span className="text-yellow-500 font-bold">moderate</span> at {completionRate}%.
                                                        Consider increasing field team allocation for {stats.pending} pending issues.</>
                                                );
                                            } else {
                                                return (
                                                    <>AI detection confidence: <span className="text-purple-500 font-bold">{avgConfidence.toFixed(1)}%</span>.
                                                        Resolution efficiency needs <span className="text-red-500 font-bold">urgent improvement</span> ({completionRate}%).
                                                        {stats.pending} issues pending immediate action.</>
                                                );
                                            }
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats & History Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Stats Grid */}
                <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
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
                    <div className="muni-card p-4 border-l-4 border-[#10b981]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#10b981]/10 rounded-lg">
                                <CheckCircle2 size={20} className="text-[#10b981]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Resolved</p>
                                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-4 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Video size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">VIDEO/IMAGE FRAMES</p>
                                <p className="text-2xl font-bold text-white">{stats.videoNodes}</p>
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-4 border-l-4 border-[#06038D]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#06038D]/10 rounded-lg">
                                <Activity size={20} className="text-[#06038D]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">ROAD Health</p>
                                <p className="text-2xl font-bold text-white">{stats.assetHealth}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="xl:col-span-2 muni-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-[#3b82f6]" size={20} />
                            <h3 className="font-bold text-white">Efficiency Analysis (Resolution Throughput)</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                                <span className="text-[var(--muni-text-muted)] uppercase">Incoming</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                                <span className="text-[var(--muni-text-muted)] uppercase">Resolved</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                    dataKey="incoming"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncoming)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="resolved"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorResolved)"
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-all duration-300" size={18} />
                        <input
                            type="text"
                            placeholder="Find records by ID, Road Name or Local Area..."
                            className="muni-input w-full !bg-white/5 border border-white/10 focus:border-[#FF671F]/50 hover:bg-white/10 transition-all text-sm h-11"
                            style={{ paddingLeft: '3.5rem' }}
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
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FF671F] focus:ring-[#FF671F]/50"
                                            checked={processedIssues.length > 0 && selectedIssues.size === processedIssues.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
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
                                    <th>Department</th>
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
                                                    className={`hover:bg-[var(--muni-surface)] transition-colors cursor-pointer ${isExpanded ? 'bg-[var(--muni-surface)]/50' : ''} ${selectedIssues.has(issue.id) ? 'bg-[#FF671F]/5' : ''}`}
                                                    onClick={() => toggleIssue(issue.id)}
                                                >
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FF671F] focus:ring-[#FF671F]/50"
                                                            checked={selectedIssues.has(issue.id)}
                                                            onChange={() => handleSelectIssue(issue.id)}
                                                        />
                                                    </td>
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
                                                            className={`muni-input text-xs py-1.5 px-3 !bg-white/5 border-none focus:ring-1 focus:ring-[#FF671F] w-full max-w-[160px] font-bold ${(issue.status === 'COMPLETED') ? 'text-[#10b981]' :
                                                                (issue.status === 'IN_PROGRESS') ? 'text-yellow-400' : 'text-blue-400'
                                                                }`}
                                                            value={issue.status || 'PENDING'}
                                                            onChange={(e) => handleIssueStatusChange(issue.id, e.target.value)}
                                                        >
                                                            <option value="PENDING" className="bg-[var(--muni-surface)] text-blue-400">PENDING</option>
                                                            <option value="ASSIGNED" className="bg-[var(--muni-surface)] text-blue-300">ASSIGNED</option>
                                                            <option value="IN_PROGRESS" className="bg-[var(--muni-surface)] text-yellow-400">IN_PROGRESS</option>
                                                            <option value="COMPLETED" className="bg-[var(--muni-surface)] text-[#10b981]">COMPLETED</option>
                                                        </select>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="muni-input text-[10px] py-1 px-2 !bg-white/5 border-none focus:ring-1 focus:ring-[#FF671F] font-bold text-[#FF671F] uppercase min-w-[120px]"
                                                                value={issue.department || classifyRoadDepartment(issue.address)}
                                                                onChange={(e) => handleDepartmentUpdate(issue.id, e.target.value)}
                                                            >
                                                                {Object.values(AP_DEPARTMENTS).map(dept => (
                                                                    <option key={dept.code} value={dept.code} className="bg-[var(--muni-surface)]">
                                                                        {dept.code} ({dept.name})
                                                                    </option>
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
                                                        <td colSpan="9" className="bg-black/20 p-0 border-b border-[#FF671F]/10">
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
                    className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedImages(null)}
                >
                    <div
                        className="muni-card w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#FF671F]/40 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-[#FF671F]/10 rounded-lg">
                                    <Eye className="text-[#FF671F]" size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h2 className="text-lg font-bold text-white truncate">AI Comparison</h2>
                                    <p className="text-[10px] text-[var(--muni-text-muted)] truncate max-w-[300px]">{selectedImages.location}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedImages(null)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--muni-text-muted)] hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Original Image */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Target size={12} className="text-blue-500" />
                                            Original Capture
                                        </label>
                                        <span className="text-[8px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">RAW</span>
                                    </div>
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                                        <img
                                            src={selectedImages.original}
                                            alt="Original"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Annotated Image */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Target size={12} className="text-[#FF671F]" />
                                            AI Analysis
                                        </label>
                                        <span className="text-[8px] text-[#FF671F] font-bold bg-[#FF671F]/10 px-1.5 py-0.5 rounded border border-[#FF671F]/20">DETECTIONS</span>
                                    </div>
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#FF671F]/30 bg-black flex items-center justify-center">
                                        {selectedImages.annotated ? (
                                            <img
                                                src={selectedImages.annotated}
                                                alt="Detected"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 size={32} className="text-[#FF671F] animate-spin" />
                                                <p className="text-[10px] text-[var(--muni-text-muted)] font-medium">Processing Analytics...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-[#FF671F]/5 rounded-xl border border-[#FF671F]/10">
                                <p className="text-[10px] text-[var(--muni-text-muted)] leading-relaxed text-center italic">
                                    Side-by-side comparison for visual verification. Left: Original citizen report. Right: AI-detected anomalies with bounding box localization.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selectedIssues.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-[#0a0a0b] border border-[#FF671F]/50 rounded-2xl shadow-2xl p-4 flex items-center gap-6 backdrop-blur-xl ring-1 ring-white/10">
                        <div className="flex items-center gap-3 px-2 border-r border-white/10">
                            <div className="w-8 h-8 rounded-lg bg-[#FF671F]/10 flex items-center justify-center font-bold text-[#FF671F]">
                                {selectedIssues.size}
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-tight">Records Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                {isBulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                {isBulkDeleting ? 'SYNCING...' : 'DELETE SELECTED'}
                            </button>
                            <button
                                onClick={() => setSelectedIssues(new Set())}
                                className="px-4 py-2.5 text-[var(--muni-text-muted)] hover:text-white font-bold text-xs rounded-xl transition-all"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PotholeDetectionView;
