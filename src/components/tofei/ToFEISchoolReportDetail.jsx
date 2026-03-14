import { XCircle, Globe, Zap, MapPin } from 'lucide-react';
import { Map, Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';

const statusColor = (s) => s === 'compliant' ? '#22c55e' : s === 'non-compliant' ? '#f87171' : '#f59e0b';
const statusLabel = (s) => s === 'compliant' ? 'Compliant' : s === 'non-compliant' ? 'Non-Compliant' : 'Pending';

const GUIDELINE_LABELS = [
  'Tobacco-Free Signage (inside)', 'Boundary Signage (outside)', 'No tobacco evidence on premises',
  'Harms awareness posters', 'Tobacco control activities', 'Tobacco Monitors nominated',
  'Code of conduct updated', '100-yard marking', 'No shops within 100 yards'
];

/** Normalize lat/lng from report (location or latitude/longitude) */
export function getReportCoords(report) {
  const lat = report?.latitude ?? report?.location?.lat;
  const lng = report?.longitude ?? report?.location?.lng;
  return { lat, lng };
}

/** Read-only detailed report for School portal: all fields, map, lat/long, photos, guidelines. No edit. */
export default function ToFEISchoolReportDetail({ report, onClose, isLightMode = true }) {
  if (!report) return null;
  const { lat, lng } = getReportCoords(report);
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const score = report.totalScore ?? 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--tf-surface)',
          border: '1px solid var(--tf-border)',
          borderRadius: '0.875rem',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--tf-surface)', borderBottom: '1px solid var(--tf-border)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--tf-text-main)' }}>{report.schoolName || 'Report'}</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>{report.district || '—'}{report.block ? ` · ${report.block}` : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', padding: '0.25rem' }}><XCircle size={22} /></button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Score & Status */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '0.625rem', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.25rem' }}>/ 95   Total Score</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', background: `${statusColor(report.complianceStatus)}10`, border: `1px solid ${statusColor(report.complianceStatus)}30`, borderRadius: '0.625rem', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: statusColor(report.complianceStatus), lineHeight: 1.2 }}>{statusLabel(report.complianceStatus)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.25rem' }}>Compliance Status</div>
            </div>
          </div>

          {/* Details */}
          {[['Reporting Officer', report.reportingOfficer], ['Contact', report.contactNo], ['School UDISE', report.udiseCode || report.schoolUdise], ['Submitted', report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString('en-IN') : 'N/A']].map(([k, v]) => v != null && v !== '' && (
            <div key={k} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', background: 'var(--tf-surface-2)', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--tf-text-muted)', fontWeight: 700, minWidth: '120px', flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--tf-text-main)' }}>{String(v)}</span>
            </div>
          ))}

          {/* GPS Location (always show on all portals) */}
          <div style={{ padding: '0.625rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '0.5rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Globe size={14} /> GPS LOCATION
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--tf-text-main)', fontFamily: "'JetBrains Mono', monospace" }}>
              {hasCoords ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : '— Not recorded'}
            </div>
          </div>

          {/* Map */}
          {hasCoords && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> Location on Map
              </p>
              <div style={{ height: '220px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--tf-border)', background: 'var(--tf-surface-2)' }}>
                <Map
                  initialViewState={{ longitude: Number(lng), latitude: Number(lat), zoom: 15 }}
                  mapStyle={isLightMode ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker longitude={Number(lng)} latitude={Number(lat)} anchor="bottom">
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
                  </Marker>
                  <NavigationControl position="top-right" />
                </Map>
              </div>
            </div>
          )}

          {/* Guideline scores */}
          {(report.guidelineScores?.length > 0) && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.625rem' }}>Guideline Scores</p>
              {report.guidelineScores.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--tf-border)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--tf-text-main)', flex: 1 }}>Activity {i + 1}: {GUIDELINE_LABELS[i] ?? `Item ${i + 1}`}</span>
                  <span style={{ fontWeight: 700, color: (g?.scored || 0) >= (g?.max || 1) * 0.7 ? '#22c55e' : '#f59e0b', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, marginLeft: '0.5rem' }}>{g?.scored ?? 0}/{g?.max ?? 0}</span>
                </div>
              ))}
            </div>
          )}

          {/* Photos */}
          {(report.photos?.length > 0) && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Evidence Photos ({report.photos.length})</p>
                {report.annotatedPhotos?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>
                    <Zap size={10} fill="#22c55e" /> AI Vision Enabled
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                {report.photos.map((url, i) => {
                  const annotated = report.annotatedPhotos?.[i];
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--tf-border)', background: 'var(--tf-surface-2)' }}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                        </a>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 6px', background: 'rgba(0,0,0,0.7)', fontSize: '0.55rem', color: '#fff', textAlign: 'center' }}>Original</div>
                      </div>
                      {annotated && (
                        <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #22c55e', background: 'var(--tf-surface-2)' }}>
                          <a href={annotated} target="_blank" rel="noopener noreferrer">
                            <img src={annotated} alt={`AI ${i + 1}`} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                          </a>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 6px', background: 'rgba(22,163,74,0.85)', fontSize: '0.55rem', color: '#fff', textAlign: 'center', fontWeight: 700 }}>AI Annotated</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', margin: 0 }}>This report is read-only. Submitted data cannot be edited.</p>
        </div>
      </div>
    </div>
  );
}
