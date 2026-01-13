import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DEPTH_COLORS } from '../utils/apRoads';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';

const GroupedPotholeView = () => {
    const [reports, setReports] = useState([]);
    const [expandedReports, setExpandedReports] = useState(new Set());
    const [selectedDetection, setSelectedDetection] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        // Load all detections and group them client-side
        const detectionsQuery = query(
            collection(db, 'pothole_detections'),
            orderBy('timestamp', 'desc'),
            limit(200)
        );

        const unsubscribe = onSnapshot(detectionsQuery, (snapshot) => {
            const allDetections = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Group detections by reportId
            const grouped = {};
            allDetections.forEach(detection => {
                const reportId = detection.reportId || 'manual_' + detection.id;
                if (!grouped[reportId]) {
                    grouped[reportId] = {
                        id: reportId,
                        roadName: detection.roadName || 'Unknown Road',
                        department: detection.department,
                        originalImageUrl: detection.originalImageUrl,
                        annotatedImageUrl: detection.annotatedImageUrl,
                        timestamp: detection.timestamp,
                        location: detection.location,
                        detections: []
                    };
                }
                grouped[reportId].detections.push(detection);
            });

            // Convert to array (already sorted by query)
            const reportsArray = Object.values(grouped);

            setReports(reportsArray);
        }, (error) => {
            console.error('Error loading detections:', error);
            setReports([]);
        });

        return () => unsubscribe();
    }, []);

    const toggleReport = (reportId) => {
        const newExpanded = new Set(expandedReports);
        if (newExpanded.has(reportId)) {
            newExpanded.delete(reportId);
        } else {
            newExpanded.add(reportId);
        }
        setExpandedReports(newExpanded);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="muni-card p-6 border-l-4 border-[#FF671F]">
                <h3 className="text-xl font-bold text-white mb-2">Pothole Reports & Detections</h3>
                <p className="text-[var(--muni-text-muted)] text-sm">
                    View reports grouped by submission with individual pothole detections
                </p>
            </div>

            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="muni-card p-8 text-center">
                        <p className="text-[var(--muni-text-muted)]">No reports yet</p>
                    </div>
                ) : (
                    reports.map((report) => {
                        const isExpanded = expandedReports.has(report.id);

                        return (
                            <div key={report.id} className="muni-card overflow-hidden border border-[#06038D]/30">
                                {/* Report Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between"
                                    onClick={() => toggleReport(report.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <img
                                            src={report.annotatedImageUrl}
                                            alt="Report"
                                            className="w-32 h-32 rounded object-cover border border-[var(--muni-border)]"
                                        />
                                        <div>
                                            <h4 className="font-bold text-white">{report.roadName}</h4>
                                            <p className="text-sm text-[var(--muni-text-muted)]">
                                                {report.detections?.length || 0} potholes detected
                                            </p>
                                            <p className="text-xs text-[var(--muni-text-muted)] font-mono">
                                                {report.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedReport(report);
                                            }}
                                            className="muni-btn-ghost text-sm px-4 py-2"
                                        >
                                            View Detections
                                        </button>
                                        <span className="text-xs text-[var(--muni-text-muted)] uppercase">
                                            {report.department}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp className="text-[var(--muni-text-muted)]" size={20} />
                                        ) : (
                                            <ChevronDown className="text-[var(--muni-text-muted)]" size={20} />
                                        )}
                                    </div>
                                </div>

                                {/* Detections List */}
                                {isExpanded && (
                                    <div className="border-t border-[var(--muni-border)] bg-black/20">
                                        <div className="p-4">
                                            <h5 className="text-xs font-bold text-[var(--muni-text-muted)] uppercase mb-3">
                                                Individual Detections ({report.detections?.length || 0})
                                            </h5>

                                            {!report.detections || report.detections.length === 0 ? (
                                                <p className="text-sm text-[var(--muni-text-muted)] italic">
                                                    No individual detections saved
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {report.detections.map((detection, idx) => {
                                                        const depthColor = DEPTH_COLORS[detection.depth] || '#888';

                                                        return (
                                                            <div
                                                                key={detection.id}
                                                                className="bg-[var(--muni-surface)] border border-[var(--muni-border)] rounded-lg p-3 hover:border-[#FF671F]/30 transition-colors"
                                                            >
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <span className="text-xs font-mono text-[var(--muni-text-muted)]">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setSelectedDetection(detection)}
                                                                        className="text-[var(--muni-text-muted)] hover:text-white"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-[var(--muni-text-muted)]">Depth</span>
                                                                        <span
                                                                            className="text-xs font-bold px-2 py-0.5 rounded"
                                                                            style={{
                                                                                color: depthColor,
                                                                                backgroundColor: `${depthColor}15`,
                                                                                border: `1px solid ${depthColor}30`
                                                                            }}
                                                                        >
                                                                            {detection.depth}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-[var(--muni-text-muted)]">Confidence</span>
                                                                        <span className="text-xs font-mono text-white">
                                                                            {Math.round(detection.confidence * 100)}%
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-[var(--muni-text-muted)]">Status</span>
                                                                        <span className="text-xs text-amber-400">
                                                                            {detection.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal */}
            {selectedDetection && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedDetection(null)}
                >
                    <div
                        className="muni-card w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-[#FF671F]/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Detection Details</h2>
                                <div className="flex items-center gap-3 mt-3">
                                    <span
                                        className="muni-badge"
                                        style={{
                                            color: DEPTH_COLORS[selectedDetection.depth],
                                            backgroundColor: `${DEPTH_COLORS[selectedDetection.depth]}15`,
                                            borderColor: `${DEPTH_COLORS[selectedDetection.depth]}30`
                                        }}
                                    >
                                        {selectedDetection.depth}
                                    </span>
                                    <span className="text-[var(--muni-text-muted)] text-sm">
                                        {selectedDetection.roadName}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDetection(null)}
                                className="text-[var(--muni-text-muted)] hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Images */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase mb-2 block">
                                        Original Image
                                    </label>
                                    <img
                                        src={selectedDetection.originalImageUrl}
                                        alt="Original"
                                        className="w-full rounded border border-[var(--muni-border)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase mb-2 block">
                                        Detected Image
                                    </label>
                                    <img
                                        src={selectedDetection.annotatedImageUrl}
                                        alt="Annotated"
                                        className="w-full rounded border border-[var(--muni-border)]"
                                    />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Severity</label>
                                    <p className="text-white font-bold mt-1">{selectedDetection.severity}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Department</label>
                                    <p className="text-white font-bold mt-1">{selectedDetection.department}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Confidence</label>
                                    <p className="text-white font-bold mt-1">{Math.round(selectedDetection.confidence * 100)}%</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase">Status</label>
                                    <p className="text-white font-bold mt-1">{selectedDetection.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Detections Modal */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="muni-card w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-[#FF671F]/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[var(--muni-surface)] border-b border-[var(--muni-border)] p-6 flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">All Detections</h2>
                                <p className="text-[var(--muni-text-muted)] mt-1">
                                    {selectedReport.roadName} - {selectedReport.detections?.length || 0} potholes
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-[var(--muni-text-muted)] hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Annotated Image */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-[var(--muni-text-muted)] uppercase mb-2 block">
                                    Annotated Image
                                </label>
                                <img
                                    src={selectedReport.annotatedImageUrl}
                                    alt="Annotated"
                                    className="w-full rounded border border-[var(--muni-border)]"
                                />
                            </div>

                            {/* Detections Table */}
                            <div className="overflow-x-auto">
                                <table className="muni-table w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-[#FF671F]">Depth</th>
                                            <th>Severity</th>
                                            <th>Confidence</th>
                                            <th>Status</th>
                                            <th>Size (W×H)</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReport.detections?.map((detection, idx) => (
                                            <tr key={detection.id} className="hover:bg-[var(--muni-surface)]">
                                                <td>
                                                    <span
                                                        className="muni-badge"
                                                        style={{
                                                            color: DEPTH_COLORS[detection.depth],
                                                            backgroundColor: `${DEPTH_COLORS[detection.depth]}15`,
                                                            borderColor: `${DEPTH_COLORS[detection.depth]}30`
                                                        }}
                                                    >
                                                        {detection.depth}
                                                    </span>
                                                </td>
                                                <td className="text-white">{detection.severity}</td>
                                                <td className="text-white">{Math.round(detection.confidence * 100)}%</td>
                                                <td className="text-[var(--muni-text-muted)]">{detection.status}</td>
                                                <td className="text-[var(--muni-text-muted)] font-mono text-sm">
                                                    {Math.round(detection.width)}×{Math.round(detection.height)}px
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDetection(detection);
                                                                setSelectedReport(null);
                                                            }}
                                                            className="text-[var(--muni-text-muted)] hover:text-white"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupedPotholeView;
