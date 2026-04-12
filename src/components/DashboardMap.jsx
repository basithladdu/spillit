import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, Map as MapIcon, Satellite, Navigation, Sparkles, Heart, Ghost, Laugh, Eye, MapPin } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Global view
const DEFAULT_CENTER = { lng: 0, lat: 20 };
const DEFAULT_ZOOM = 1.5;

const VIBE_CONFIG = {
  Moment: { color: '#ff7ec9', heatIntensity: 0.8 },
  Crush: { color: '#a78bfa', heatIntensity: 0.7 },
  Secret: { color: '#4ade80', heatIntensity: 0.5 },
  Laugh: { color: '#fbbf24', heatIntensity: 0.4 },
  Default: { color: '#3b82f6', heatIntensity: 0.2 }
};

const MarkerPin = ({ color, size = 32 }) => (
    <div style={{ transform: `translate(${-size / 2}px,${-size}px)`, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
        <svg height={size} viewBox="0 0 24 24" style={{ fill: color, stroke: 'white', strokeWidth: 2 }}>
            <path d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3
  c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9
  C20.1,15.8,20.2,15.8,20.2,15.7z"/>
            <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
    </div>
);

const PopupContent = ({ issue, isLightMode }) => {
    const type = issue.type || 'Moment';
    const vibe = VIBE_CONFIG[type] || VIBE_CONFIG.Default;

    return (
        <div className="w-64 rounded-3xl overflow-hidden bg-[#0f0f13]/95 backdrop-blur-3xl border border-white/10 text-white shadow-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa]"></div>
            
            {issue.imageUrl && (
                <div className="w-full h-32 relative overflow-hidden">
                    <img src={issue.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] to-transparent"></div>
                </div>
            )}

            <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                        {type}
                    </span>
                    <div className="flex items-center gap-1 text-[#ff7ec9]">
                        <Heart size={12} className="fill-current" />
                        <span className="text-xs font-black">{issue.upvotes || 0}</span>
                    </div>
                </div>

                <p className="text-xs text-slate-200 italic font-medium line-clamp-2 leading-relaxed">
                    &quot;{issue.caption || 'A silent memory whispers...'}&quot;
                </p>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-[#a78bfa]" />
                        <span className="truncate w-24">{issue.address?.split(',')[0]}</span>
                    </div>
                    <a href={`/memory/${issue.id}`} className="text-[#ff7ec9] hover:underline">View</a>
                </div>
            </div>
        </div>
    );
};

const DashboardMap = ({ issues, isLightMode = false }) => {
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [mapStyle, setMapStyle] = useState('dark-v11');
    const [viewState, setViewState] = useState({
        latitude: DEFAULT_CENTER.lat,
        longitude: DEFAULT_CENTER.lng,
        zoom: DEFAULT_ZOOM
    });

    const mapStyles = [
        { id: 'dark-v11', name: 'Dark', icon: MapIcon, style: 'mapbox://styles/mapbox/dark-v11' },
        { id: 'satellite-streets-v12', name: 'Hybrid', icon: Navigation, style: 'mapbox://styles/mapbox/satellite-streets-v12' },
        { id: 'streets-v12', name: 'Explore', icon: MapIcon, style: 'mapbox://styles/mapbox/streets-v12' }
    ];

    const currentMapStyle = mapStyles.find(s => s.id === mapStyle) || mapStyles[0];

    const validIssues = useMemo(() =>
        issues?.filter(i =>
            i.lat !== undefined && i.lat !== null && !isNaN(Number(i.lat)) &&
            i.lng !== undefined && i.lng !== null && !isNaN(Number(i.lng))
        ).map(i => ({ ...i, lat: Number(i.lat), lng: Number(i.lng) })) || [],
        [issues]);

    useEffect(() => {
        if (validIssues.length > 0) {
            const lats = validIssues.map(i => i.lat);
            const lngs = validIssues.map(i => i.lng);
            const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
            const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

            setViewState(prev => ({
                ...prev,
                latitude: centerLat,
                longitude: centerLng,
                zoom: validIssues.length === 1 ? 12 : 3
            }));
        }
    }, [validIssues]);

    const heatmapData = {
        type: 'FeatureCollection',
        features: validIssues.map(issue => {
            const { heatIntensity } = VIBE_CONFIG[issue.type || 'Moment'] || VIBE_CONFIG.Default;
            return {
                type: 'Feature',
                properties: { intensity: heatIntensity },
                geometry: { type: 'Point', coordinates: [issue.lng, issue.lat] }
            };
        })
    };

    const heatmapLayer = {
        id: 'heatmap',
        type: 'heatmap',
        source: 'issues',
        maxzoom: 15,
        paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(255, 126, 201, 0)',
                0.2, 'rgba(167, 139, 250, 0.4)',
                0.4, 'rgba(255, 126, 201, 0.6)',
                0.6, 'rgba(167, 139, 250, 0.8)',
                1, 'rgba(255, 126, 201, 1)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 5, 15, 40],
            'heatmap-opacity': 0.8
        }
    };

    return (
        <div className="h-full w-full relative z-0">
            <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3">
                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${showHeatmap ? 'bg-[#ff7ec9] text-white' : 'bg-black/60 text-slate-400'}`}
                >
                    <Layers size={16} /> Heartbeat {showHeatmap ? 'ON' : 'OFF'}
                </button>

                <div className="flex gap-2">
                    {mapStyles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setMapStyle(style.id)}
                            className={`p-3.5 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl transition-all ${mapStyle === style.id ? 'bg-white/10 text-white' : 'bg-black/40 text-slate-600 hover:text-slate-400'}`}
                            title={style.name}
                        >
                            {React.createElement(style.icon, { size: 16 })}
                        </button>
                    ))}
                </div>
            </div>

            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle={currentMapStyle.style}
            >
                {showHeatmap && (
                    <Source type="geojson" data={heatmapData}>
                        <Layer {...heatmapLayer} />
                    </Source>
                )}

                {!showHeatmap && validIssues.map((issue) => (
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
                        <MarkerPin color={(VIBE_CONFIG[issue.type] || VIBE_CONFIG.Default).color} />
                    </Marker>
                ))}

                {selectedIssue && (
                    <Popup
                        longitude={selectedIssue.lng}
                        latitude={selectedIssue.lat}
                        anchor="bottom"
                        onClose={() => setSelectedIssue(null)}
                        closeButton={false}
                        closeOnClick={false}
                        maxWidth="280px"
                    >
                        <PopupContent issue={selectedIssue} isLightMode={isLightMode} />
                    </Popup>
                )}
            </Map>

            <style>{`
                .mapboxgl-popup-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
                .mapboxgl-popup-tip { border-top-color: #0f0f13 !important; }
            `}</style>
        </div>
    );
};

export default DashboardMap;
