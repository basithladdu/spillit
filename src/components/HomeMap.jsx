import { Link } from 'react-router-dom';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { AlertCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { getOptimizedImageSrcSet, getOptimizedImageUrl } from '../utils/imageOptimizer';
import { isValidCoord } from '../utils/format';

const T = {
  ink: '#1E293B',
  muted: '#64748B',
  surface: '#FFFFFF',
  accent: '#8B5CF6',
  love: '#F472B6',
  amber: '#D97706',
  secret: '#374151',
  canvas: '#08080c',
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? '';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const TYPE_COLORS = {
  Moment: T.accent,
  Crush: T.love,
  Secret: T.secret,
  Laugh: T.amber,
};

const panel = (extra = {}) => ({
  background: T.surface,
  border: `2px solid ${T.ink}`,
  borderRadius: 16,
  boxShadow: '4px 4px 0 #1E293B',
  ...extra,
});

const clampLines = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const MemoryPin = ({ memory, onClick, isSelected }) => {
  const color = TYPE_COLORS[memory.type] ?? T.accent;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${memory.type || 'Memory'} at ${memory.address || 'unknown location'}`}
      aria-pressed={isSelected}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
    >
      <div style={{ position: 'relative', width: 40, height: 52 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: isSelected ? 52 : 42,
            height: isSelected ? 52 : 42,
            borderRadius: '50%',
            background: color,
            opacity: isSelected ? 0.25 : 0.15,
            transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease',
          }}
        />
        <svg
          width="40"
          height="52"
          viewBox="0 0 40 52"
          fill="none"
          aria-hidden
          style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        >
          <path d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z" fill="white" />
          <path d="M20 3C11.16 3 4 10.16 4 19C4 30 20 49 20 49C20 49 36 30 36 19C36 10.16 28.84 3 20 3Z" fill={color} />
          <path
            d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z"
            fill="none"
            stroke={T.ink}
            strokeWidth="2"
          />
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.95" />
          <circle cx="20" cy="18" r="4" fill={color} opacity="0.6" />
        </svg>
      </div>
    </button>
  );
};

function MapUnavailable({ message = 'The map is temporarily unavailable. You can still explore memories from the archive.' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: T.canvas }}>
      <div style={panel({ maxWidth: 360, padding: '32px 28px', textAlign: 'center' })}>
        <AlertCircle size={32} color={T.accent} className="mx-auto mb-4" strokeWidth={2} aria-hidden="true" />
        <h2 className="heading-font text-xl font-bold mb-2" style={{ color: T.ink }}>Map unavailable</h2>
        <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{message}</p>
        <Link to="/gallery" className="inline-flex min-h-11 items-center justify-center mt-5 px-5 rounded-full border-2 border-foreground text-sm font-bold text-accent">Browse memories</Link>
      </div>
    </div>
  );
}

function HomeMap({
  viewState,
  onMove,
  onMapClick,
  mapError,
  onMapError,
  memories,
  selectedMemory,
  onSelectMemory,
}) {
  if (!MAPBOX_TOKEN || mapError) {
    return <MapUnavailable message={mapError || undefined} />;
  }

  return (
    <Map
      {...viewState}
      onMove={onMove}
      onClick={onMapClick}
      mapStyle={MAP_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      onError={(event) => {
        if (event?.error?.status === 401) {
          onMapError('The map is temporarily unavailable. Please try again later.');
        } else {
          onMapError('The map could not load right now. Check the connection and try again.');
        }
      }}
      style={{ width: '100%', height: '100%' }}
      reuseMaps
      attributionControl
    >
      <NavigationControl position="bottom-left" showCompass={false} />

      {memories.map((m) => {
        if (!isValidCoord(m.lat, m.lng)) return null;
        const lat = Number(m.lat);
        const lng = Number(m.lng);
        const selected = selectedMemory?.id === m.id;

        return (
          <Marker
            key={m.id}
            latitude={lat}
            longitude={lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectMemory(m);
            }}
          >
            <MemoryPin
              memory={m}
              isSelected={selected}
              onClick={() => onSelectMemory(m)}
            />
          </Marker>
        );
      })}

      {selectedMemory && isValidCoord(selectedMemory.lat, selectedMemory.lng) && (
        <Popup
          latitude={Number(selectedMemory.lat)}
          longitude={Number(selectedMemory.lng)}
          anchor="bottom"
          offset={48}
          onClose={() => onSelectMemory(null)}
          closeButton={false}
          maxWidth="260px"
        >
          <div style={{ ...panel({ borderRadius: 12 }), overflow: 'hidden' }}>
            {selectedMemory.image_url && (
              <img
                src={getOptimizedImageUrl(selectedMemory.image_url, 300)}
                srcSet={getOptimizedImageSrcSet(selectedMemory.image_url, [300, 600])}
                sizes="300px"
                style={{ width: '100%', height: 112, objectFit: 'cover', borderBottom: `2px solid ${T.ink}`, display: 'block' }}
                alt={selectedMemory.caption ? `Memory photo: ${selectedMemory.caption.slice(0, 80)}` : 'Memory photo'}
                loading="lazy"
                decoding="async"
                width="300"
                height="112"
              />
            )}
            <div className="p-3">
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, display: 'block', marginBottom: 4 }}>
                {selectedMemory.type || 'Moment'}
              </span>
              <p style={{ fontSize: 12, color: T.ink, fontStyle: 'italic', marginBottom: 10, ...clampLines }}>
                &ldquo;{selectedMemory.caption?.trim() || '…'}&rdquo;
              </p>
              <Link
                to={`/memory/${selectedMemory.id}`}
                className="home-btn-primary"
                style={{ display: 'block', textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '2px 2px 0 #1E293B' }}
              >
                See Memory
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}

export default HomeMap;
