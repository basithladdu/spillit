import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, Map as MapIcon, Satellite, Navigation } from 'lucide-react';

// Mapbox Access Token - Using the same token as Home.jsx and LocationVerifier.jsx
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';

// Default center (India)
const DEFAULT_CENTER = { lng: 78.9629, lat: 20.5937 };
const DEFAULT_ZOOM = 4; // Zoom out to show India state

// Severity color mapping (matching Home.jsx)
const getSeverityColors = (severity) => {
    switch (severity) {
        case 'Critical': return { markerColor: '#EF4444', heatIntensity: 1.0 };
        case 'High': return { markerColor: '#FF671F', heatIntensity: 0.7 };
        case 'Medium': return { markerColor: '#EAB308', heatIntensity: 0.5 };
        case 'Low': return { markerColor: '#10b981', heatIntensity: 0.3 };
        default: return { markerColor: '#3b82f6', heatIntensity: 0.2 };
    }
};

// Custom Marker Pin Component
const MarkerPin = ({ color, size = 40 }) => (
    <svg
        height={size}
        viewBox="0 0 24 24"
        style={{
            cursor: 'pointer',
            fill: color,
            stroke: 'white',
            strokeWidth: 2,
            transform: `translate(${-size / 2}px,${-size}px)`
        }}
    >
        <path d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3
  c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9
  C20.1,15.8,20.2,15.8,20.2,15.7z"/>
        <circle cx="12" cy="10" r="3" fill="white" />
    </svg>
);

// Popup Content Component
const PopupContent = ({ issue, isLightMode }) => {
    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'Critical':
                return { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: isLightMode ? '#B91C1C' : '#FCA5A5' };
            case 'High':
                return { bg: 'rgba(255, 103, 31, 0.1)', border: '#FF671F', text: isLightMode ? '#C2410C' : '#FF8F50' };
            case 'Medium':
                return { bg: 'rgba(234, 179, 8, 0.1)', border: '#EAB308', text: isLightMode ? '#A16207' : '#FDE047' };
            case 'Low':
                return { bg: 'rgba(4, 106, 56, 0.1)', border: '#046A38', text: isLightMode ? '#15803D' : '#86efac' };
            default:
                return { bg: 'rgba(161, 161, 170, 0.1)', border: '#a1a1aa', text: isLightMode ? '#3f3f46' : '#d4d4d8' };
        }
    };

    const sevStyle = getSeverityStyle(issue.severity);

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            minWidth: '240px',
            background: isLightMode ? '#ffffff' : '#09090b',
            border: isLightMode ? '1px solid #e2e8f0' : '1px solid #27272a',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            color: isLightMode ? '#0f172a' : 'white',
            boxShadow: isLightMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
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
                    background: isLightMode ? 'rgba(0,0,0,0.05)' : '#000',
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
                        border: isLightMode ? '1px solid #e2e8f0' : '1px solid #27272a'
                    }} />
                )}

                <p style={{
                    margin: '0 0 12px',
                    fontSize: '13px',
                    color: isLightMode ? '#475569' : '#a1a1aa',
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
                    color: issue.status === 'resolved' ? '#10b981' : '#eab308',
                    border: issue.status === 'resolved' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)',
                    textTransform: 'capitalize'
                }}>
                    {issue.status || 'new'}
                </div>

                {/* Footer Info */}
                <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: isLightMode ? '1px solid #e2e8f0' : '1px solid #27272a',
                    fontSize: '10px',
                    color: isLightMode ? '#64748b' : '#71717a',
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
    );
};

const DashboardMap = ({ issues, isLightMode = false }) => {
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [mapStyle, setMapStyle] = useState('streets-v12'); // Default map style
    const [viewState, setViewState] = useState({
        ...DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
    });

    // Map style options
    const mapStyles = [
        { id: 'streets-v12', name: 'Streets', icon: MapIcon, style: 'mapbox://styles/mapbox/streets-v12' },
        { id: 'satellite-v9', name: 'Satellite', icon: Satellite, style: 'mapbox://styles/mapbox/satellite-v9' },
        { id: 'satellite-streets-v12', name: 'Satellite Streets', icon: Navigation, style: 'mapbox://styles/mapbox/satellite-streets-v12' },
        { id: 'dark-v11', name: 'Dark', icon: MapIcon, style: 'mapbox://styles/mapbox/dark-v11' },
        { id: 'light-v11', name: 'Light', icon: MapIcon, style: 'mapbox://styles/mapbox/light-v11' },
        { id: 'outdoors-v12', name: 'Outdoors', icon: MapIcon, style: 'mapbox://styles/mapbox/outdoors-v12' }
    ];

    const currentMapStyle = mapStyles.find(s => s.id === mapStyle) || mapStyles[0];

    const validIssues = useMemo(() => issues?.filter(i => i.lat && i.lng) || [], [issues]);

    // Auto-center map on issues when they load
    useEffect(() => {
        if (validIssues.length > 0) {
            // Calculate bounds of all issues
            const lats = validIssues.map(i => i.lat);
            const lngs = validIssues.map(i => i.lng);

            const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
            const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

            // Calculate appropriate zoom level based on spread
            const latSpread = Math.max(...lats) - Math.min(...lats);
            const lngSpread = Math.max(...lngs) - Math.min(...lngs);
            const maxSpread = Math.max(latSpread, lngSpread);

            let zoom = DEFAULT_ZOOM;
            if (maxSpread < 0.01) zoom = 14;
            else if (maxSpread < 0.05) zoom = 12;
            else if (maxSpread < 0.1) zoom = 11;
            else if (maxSpread < 0.5) zoom = 9;
            else if (maxSpread < 1) zoom = 8;

            setViewState({
                latitude: centerLat,
                longitude: centerLng,
                zoom: zoom
            });
        }
    }, [validIssues]); // Only re-run when issues change

    // Create heatmap data for Mapbox
    const heatmapData = {
        type: 'FeatureCollection',
        features: validIssues.map(issue => {
            const { heatIntensity } = getSeverityColors(issue.severity);
            return {
                type: 'Feature',
                properties: {
                    intensity: heatIntensity
                },
                geometry: {
                    type: 'Point',
                    coordinates: [issue.lng, issue.lat]
                }
            };
        })
    };

    // Heatmap layer style
    const heatmapLayer = {
        id: 'heatmap',
        type: 'heatmap',
        source: 'issues',
        maxzoom: 17,
        paint: {
            // Increase weight as diameter increases
            'heatmap-weight': ['get', 'intensity'],
            // Increase intensity as zoom level increases
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 17, 3],
            // Color ramp for heatmap
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 255, 255, 0)',
                0.2, 'rgba(0, 255, 255, 0.5)',
                0.4, 'rgba(0, 255, 0, 0.6)',
                0.6, 'rgba(255, 255, 0, 0.7)',
                0.8, 'rgba(255, 103, 31, 0.8)',
                1, 'rgba(255, 0, 0, 0.9)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 17, 35],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 17, 0.5]
        }
    };

    return (
        <div className={`h-full w-full relative z-0 ${isLightMode ? 'light-map' : ''}`}>
            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
                {/* Heatmap Toggle Button */}
                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-xl border-2 shadow-lg font-bold text-xs uppercase tracking-wider transition-all ${showHeatmap
                        ? 'bg-[#10b981] text-white border-[#10b981] shadow-[#10b981]/50 hover:bg-[#059669]'
                        : isLightMode
                            ? 'bg-white/80 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-[#10b981]/50 hover:bg-[#10b981]/10'
                            : 'bg-black/80 text-[var(--muni-text-muted)] border-[var(--muni-border)] hover:text-white hover:border-[#10b981]/50 hover:bg-[#10b981]/10'
                        }`}
                >
                    <Layers size={16} className={showHeatmap ? 'animate-pulse' : ''} />
                    {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
                </button>

                {/* Map Style Selector */}
                <div className="relative group">
                    <button
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-xl border-2 shadow-lg font-bold text-xs uppercase tracking-wider transition-all ${isLightMode
                            ? 'bg-white/80 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-[#FF671F]/50 hover:bg-[#FF671F]/10'
                            : 'bg-black/80 text-[var(--muni-text-muted)] border-[var(--muni-border)] hover:text-white hover:border-[#FF671F]/50 hover:bg-[#FF671F]/10'
                            }`}
                    >
                        {React.createElement(currentMapStyle.icon, { size: 16 })}
                        {currentMapStyle.name}
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-lg backdrop-blur-xl border-2 shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {mapStyles.map((style) => {
                            const StyleIcon = style.icon;
                            return (
                                <button
                                    key={style.id}
                                    onClick={() => setMapStyle(style.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-all ${mapStyle === style.id
                                        ? 'bg-[#FF671F] text-white'
                                        : isLightMode
                                            ? 'bg-white/90 text-slate-700 hover:bg-slate-50'
                                            : 'bg-black/90 text-gray-300 hover:bg-[#FF671F]/20 hover:text-white'
                                        }`}
                                >
                                    <StyleIcon size={16} />
                                    {style.name}
                                    {mapStyle === style.id && (
                                        <span className="ml-auto text-[10px]">✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle={currentMapStyle.style}
                attributionControl={true}
            >
                {/* Heatmap Layer */}
                {showHeatmap && (
                    <Source type="geojson" data={heatmapData}>
                        <Layer {...heatmapLayer} />
                    </Source>
                )}

                {/* Markers */}
                {!showHeatmap && validIssues.map((issue) => {
                    const { markerColor } = getSeverityColors(issue.severity);
                    return (
                        <Marker
                            key={issue.id}
                            longitude={issue.lng}
                            latitude={issue.lat}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                setSelectedIssue(issue);
                            }}
                        >
                            <MarkerPin color={markerColor} />
                        </Marker>
                    );
                })}

                {/* Popup */}
                {selectedIssue && (
                    <Popup
                        longitude={selectedIssue.lng}
                        latitude={selectedIssue.lat}
                        anchor="bottom"
                        onClose={() => setSelectedIssue(null)}
                        closeButton={true}
                        closeOnClick={false}
                        maxWidth="280px"
                        className={isLightMode ? "custom-popup-light" : "custom-popup-dark"}
                    >
                        <PopupContent issue={selectedIssue} isLightMode={isLightMode} />
                    </Popup>
                )}
            </Map>

            {/* Custom Mapbox Popup Styles */}
            <style>{`
                .mapboxgl-popup-content {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .mapboxgl-popup-close-button {
                    font-size: 20px;
                    padding: 4px 8px;
                    color: ${isLightMode ? '#64748b' : '#a1a1aa'};
                    background: ${isLightMode ? '#ffffff' : '#09090b'};
                    border-radius: 0 0.5rem 0 0;
                }
                .mapboxgl-popup-close-button:hover {
                    background: ${isLightMode ? '#f1f5f9' : '#18181b'};
                    color: ${isLightMode ? '#0f172a' : '#ffffff'};
                }
                .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
                    border-top-color: ${isLightMode ? '#ffffff' : '#09090b'};
                }
                .mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
                    border-bottom-color: ${isLightMode ? '#ffffff' : '#09090b'};
                }
                .mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
                    border-right-color: ${isLightMode ? '#ffffff' : '#09090b'};
                }
                .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
                    border-left-color: ${isLightMode ? '#ffffff' : '#09090b'};
                }
                .mapboxgl-ctrl-attrib {
                    background-color: ${isLightMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'} !important;
                }
            `}</style>
        </div>
    );
};

export default DashboardMap;
