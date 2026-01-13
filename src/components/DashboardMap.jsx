import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Layers, MapPin } from 'lucide-react';

// Default center (Hyderabad)
const DEFAULT_CENTER = [17.3850, 78.4867];
const DEFAULT_ZOOM = 12;

// Severity color mapping (matching Home.jsx)
const getSeverityColors = (severity) => {
    switch (severity) {
        case 'Critical': return { markerColor: 'red', heatIntensity: 1.0 };
        case 'High': return { markerColor: 'orange', heatIntensity: 0.7 };
        case 'Medium': return { markerColor: 'yellow', heatIntensity: 0.5 };
        case 'Low': return { markerColor: 'green', heatIntensity: 0.3 };
        default: return { markerColor: 'blue', heatIntensity: 0.2 };
    }
};

const getIconUrl = (color) =>
    `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`;

// Heatmap Layer Component
const HeatmapLayer = ({ issues }) => {
    const map = useMap();

    useEffect(() => {
        if (!issues || issues.length === 0) return;

        // Remove existing heatmap layers
        map.eachLayer((layer) => {
            if (layer._heat) {
                map.removeLayer(layer);
            }
        });

        // Create heatmap data points
        const heatData = issues
            .filter(i => i.lat && i.lng)
            .map(issue => {
                const { heatIntensity } = getSeverityColors(issue.severity);
                return [issue.lat, issue.lng, heatIntensity];
            });

        if (heatData.length > 0) {
            const heatLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                max: 1.0,
                gradient: {
                    0.0: '#22c55e',
                    0.3: '#eab308',
                    0.5: '#f97316',
                    0.7: '#FF671F',
                    1.0: '#ef4444'
                }
            });
            heatLayer.addTo(map);
        }

        return () => {
            map.eachLayer((layer) => {
                if (layer._heat) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map, issues]);

    return null;
};

// Custom Marker Component
const CustomMarker = ({ issue }) => {
    const { markerColor } = getSeverityColors(issue.severity);

    const customIcon = L.icon({
        iconUrl: getIconUrl(markerColor),
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    // Severity styling (matching ReportCard.jsx)
    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'Critical':
                return { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#FCA5A5' };
            case 'High':
                return { bg: 'rgba(255, 103, 31, 0.1)', border: '#FF671F', text: '#FF8F50' };
            case 'Medium':
                return { bg: 'rgba(234, 179, 8, 0.1)', border: '#EAB308', text: '#FDE047' };
            case 'Low':
                return { bg: 'rgba(4, 106, 56, 0.1)', border: '#046A38', text: '#86efac' };
            default:
                return { bg: 'rgba(161, 161, 170, 0.1)', border: '#a1a1aa', text: '#d4d4d8' };
        }
    };

    const sevStyle = getSeverityStyle(issue.severity);

    return (
        <Marker position={[issue.lat, issue.lng]} icon={customIcon}>
            <Popup className="custom-popup-dark" maxWidth={280}>
                <div style={{
                    fontFamily: "'Inter', sans-serif",
                    minWidth: '240px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    color: 'white'
                }}>
                    {/* Header */}
                    <div style={{
                        background: sevStyle.bg,
                        padding: '12px 16px',
                        borderBottom: `1px solid ${sevStyle.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <strong style={{
                            textTransform: 'uppercase',
                            color: sevStyle.text,
                            fontSize: '12px',
                            letterSpacing: '0.05em',
                            fontWeight: '700'
                        }}>
                            {issue.type || 'Issue'}
                        </strong>
                        <span style={{
                            fontSize: '10px',
                            background: '#000',
                            color: sevStyle.text,
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            border: `1px solid ${sevStyle.border}`,
                            fontWeight: '600'
                        }}>
                            {issue.severity || 'Normal'}
                        </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px' }}>
                        {issue.imageUrl && (
                            <div style={{
                                width: '100%',
                                height: '120px',
                                backgroundImage: `url('${issue.imageUrl}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '0.375rem',
                                marginBottom: '12px',
                                border: '1px solid #27272a'
                            }} />
                        )}

                        <p style={{
                            margin: '0 0 12px',
                            fontSize: '13px',
                            color: '#a1a1aa',
                            lineHeight: '1.5'
                        }}>
                            {issue.desc || 'No description provided.'}
                        </p>

                        {/* Status Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: issue.status === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                            color: issue.status === 'resolved' ? '#22c55e' : '#eab308',
                            border: issue.status === 'resolved' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)',
                            textTransform: 'capitalize'
                        }}>
                            {issue.status || 'new'}
                        </div>

                        {/* Footer Info */}
                        <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #27272a',
                            fontSize: '10px',
                            color: '#71717a',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            ID: {issue.id.slice(0, 8)}...
                            {issue.ts && (
                                <span style={{ marginLeft: '8px' }}>
                                    • {new Date(issue.ts.toDate?.() || issue.ts).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

const DashboardMap = ({ issues }) => {
    const [showHeatmap, setShowHeatmap] = useState(false);
    const validIssues = issues?.filter(i => i.lat && i.lng) || [];

    return (
        <div className="h-full w-full relative z-0">
            {/* Heatmap Toggle Button */}
            <div className="absolute top-4 left-4 z-[400] flex gap-2">
                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl border shadow-lg font-bold text-xs uppercase tracking-wider transition-all ${showHeatmap
                            ? 'bg-[#FF671F] text-black border-[#FF671F]'
                            : 'bg-black/80 text-[var(--muni-text-muted)] border-[var(--muni-border)] hover:text-white hover:border-[#FF671F]/50'
                        }`}
                >
                    <Layers size={14} />
                    {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
                </button>
            </div>

            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                className="h-full w-full z-0"
                style={{ background: '#050505', height: '100%', width: '100%' }}
                zoomControl={false}
            >
                {/* Dark Matter Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Conditional Rendering: Heatmap OR Markers */}
                {showHeatmap ? (
                    <HeatmapLayer issues={validIssues} />
                ) : (
                    validIssues.map((issue) => (
                        <CustomMarker key={issue.id} issue={issue} />
                    ))
                )}
            </MapContainer>

            {/* Custom Leaflet Styles */}
            <style jsx global>{`
                .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    border: none !important;
                }
                .leaflet-popup-tip {
                    display: none !important;
                }
                .leaflet-popup {
                    margin-bottom: 20px !important;
                }
                .custom-popup-dark .leaflet-popup-content {
                    margin: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default DashboardMap;
