import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, TrendingUp, School, ShieldCheck, MapPin, FileText, X, LayoutList, BarChart3, AlertTriangle, Timer, LineChart } from 'lucide-react';
import { Map, Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';

const Card = ({ children, style }) => (
  <div className="tf-card" style={{ padding: '1.25rem', ...style }}>{children}</div>
);

const KPI = ({ label, value, sub, icon, color, border }) => (
  <div className="tf-card" style={{ padding: '1.1rem 1.25rem', borderLeft: `3px solid ${border}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tf-text-muted)', margin: 0 }}>{label}</p>
      <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>{icon}</span>
    </div>
    <p style={{ fontSize: '2rem', fontWeight: 800, color, margin: '0 0 0.25rem', fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
    <p style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', margin: 0 }}>{sub}</p>
  </div>
);

const ProgressBar = ({ pct, color }) => (
  <div className="tf-progress-track">
    <div className="tf-progress-fill" style={{ width: `${pct}%`, background: color || undefined }} />
  </div>
);

export default function ToFEIDashboardView({ reports = [], stats = { total: 0, compliant: 0, nonCompliant: 0, pending: 0, rate: 0 }, isLightMode }) {
  const [popupInfo, setPopupInfo] = useState(null);
  const now = new Date();

  const thisWeek = reports.filter(r => {
    const d = r.createdAt?.toDate?.() || new Date(r.createdAt);
    return (now - d) < 7 * 24 * 3600 * 1000;
  }).length;

  const today = reports.filter(r => {
    const d = r.createdAt?.toDate?.() || new Date(r.createdAt);
    return (now - d) < 24 * 3600 * 1000;
  }).length;

  const recent = [...reports].sort((a, b) => {
    const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return db - da;
  }).slice(0, 5);

  const districtMap = {};
  reports.forEach(r => {
    const d = r.district || 'Unknown';
    if (!districtMap[d]) districtMap[d] = { total: 0, compliant: 0 };
    districtMap[d].total++;
    if (r.complianceStatus === 'compliant') districtMap[d].compliant++;
  });
  const topDistricts = Object.entries(districtMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  const guideline_counts = {};
  for (let i = 1; i <= 9; i++) guideline_counts[i] = 0;
  reports.forEach(r => {
    (r.guidelineScores || []).forEach((g, idx) => {
      if (g?.scored > 0) guideline_counts[idx + 1] = (guideline_counts[idx + 1] || 0) + 1;
    });
  });

  const timeAgo = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate?.() || new Date(ts);
    const diff = now - d;
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
    if (day > 0) return `${day}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
  };

  const statusColor = (s) => s === 'compliant' ? '#22c55e' : s === 'non-compliant' ? '#f87171' : '#f59e0b';
  const statusLabel = (s) => s === 'compliant' ? 'Compliant' : s === 'non-compliant' ? 'Non-Compliant' : 'Pending';
  const StatusIcon = ({ status, size=14 }) => {
    if (status === 'compliant') return <CheckCircle size={size} color="#22c55e" />;
    if (status === 'non-compliant') return <AlertCircle size={size} color="#f87171" />;
    return <Timer size={size} color="#f59e0b" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* KPIs */}
      <div className="tf-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem' }}>
        <KPI label="Total Reports" value={stats.total} sub={`+${today} today`} icon={<BarChart3 size={20} />} color="#22c55e" border="#16a34a" />
        <KPI label="Compliant" value={stats.compliant} sub={`${stats.rate}% rate`} icon={<ShieldCheck size={20} />} color="#22c55e" border="#16a34a" />
        <KPI label="Non-Compliant" value={stats.nonCompliant} sub="Action required" icon={<AlertTriangle size={20} />} color="#f87171" border="#dc2626" />
        <KPI label="Pending Review" value={stats.pending} sub="Awaiting verification" icon={<Clock size={20} />} color="#f59e0b" border="#d97706" />
        <KPI label="This Week" value={thisWeek} sub="New submissions" icon={<LineChart size={20} />} color="#60a5fa" border="#2563eb" />
      </div>

      {/* Map View */}
      <Card style={{ zIndex: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="#60a5fa" /> Geographic Overview
          </h3>
          <span style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)' }}>GPS tracked submissions</span>
        </div>
        <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--tf-border)', background: 'var(--tf-surface-2)', position: 'relative' }}>
          <Map
            initialViewState={{
              longitude: 80.6,
              latitude: 16.5,
              zoom: 6
            }}
            mapStyle={isLightMode ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/dark-v11"}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            {reports.filter(r => {
              const lat = r.latitude ?? r.location?.lat;
              const lng = r.longitude ?? r.location?.lng;
              return lat != null && lng != null;
            }).map(r => {
              const lat = r.latitude ?? r.location?.lat;
              const lng = r.longitude ?? r.location?.lng;
              return (
              <Marker 
                key={r.id} 
                longitude={Number(lng)} 
                latitude={Number(lat)} 
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo(r);
                }}
              >
                <div 
                  style={{ 
                    cursor: 'pointer',
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    background: r.complianceStatus === 'compliant' ? '#22c55e' : r.complianceStatus === 'non-compliant' ? '#f87171' : '#f59e0b',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s',
                  }} 
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </Marker>
            );
            })}

            {popupInfo && (() => {
              const plng = popupInfo.longitude ?? popupInfo.location?.lng;
              const plat = popupInfo.latitude ?? popupInfo.location?.lat;
              if (plat == null || plng == null) return null;
              return (
              <Popup
                anchor="top"
                longitude={Number(plng)}
                latitude={Number(plat)}
                onClose={() => setPopupInfo(null)}
                closeButton={false}
                maxWidth="240px"
              >
                <div style={{ padding: '0.25rem', color: '#1a1a1a', minWidth: '180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#046A38', flex: 1, paddingRight: '0.5rem' }}>{popupInfo.schoolName}</h4>
                    <button 
                      onClick={() => setPopupInfo(null)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#999' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>
                    UDISE: {popupInfo.udiseCode || 'N/A'} · {popupInfo.district}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Score: {popupInfo.totalScore}/95</span>
                    <span style={{ 
                      fontSize: '0.6rem', 
                      fontWeight: 700, 
                      color: popupInfo.complianceStatus === 'compliant' ? '#16a34a' : '#dc2626',
                      textTransform: 'uppercase'
                    }}>
                      {popupInfo.complianceStatus}
                    </span>
                  </div>
                </div>
              </Popup>
              );
            })()}
          </Map>
        </div>
      </Card>

      {/* Compliance overview + District breakdown */}
      <div className="tf-mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>

        {/* Compliance Donut-style */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#22c55e" /> Compliance Status
            </h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>LIVE</span>
          </div>

          {/* Big score */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: stats.rate >= 70 ? '#22c55e' : stats.rate >= 50 ? '#f59e0b' : '#f87171', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {stats.rate}%
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: '0.5rem 0 0' }}>Overall Compliance Rate</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: 'Compliant', count: stats.compliant, pct: stats.total > 0 ? Math.round(stats.compliant / stats.total * 100) : 0, color: '#22c55e' },
              { label: 'Non-Compliant', count: stats.nonCompliant, pct: stats.total > 0 ? Math.round(stats.nonCompliant / stats.total * 100) : 0, color: '#f87171' },
              { label: 'Pending', count: stats.pending, pct: stats.total > 0 ? Math.round(stats.pending / stats.total * 100) : 0, color: '#f59e0b' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--tf-text-main)', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: 'var(--tf-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{row.count} ({row.pct}%)</span>
                </div>
                <ProgressBar pct={row.pct} color={row.color} />
              </div>
            ))}
          </div>

          {/* Insight */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(22,163,74,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(22,163,74,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0, lineHeight: 1.5 }}>
              {stats.rate >= 70
                ? <><span style={{ color: '#22c55e', fontWeight: 700 }}>Excellent performance!</span> Schools are actively maintaining ToFEI guidelines. {stats.nonCompliant > 0 && `${stats.nonCompliant} still require follow-up.`}</>
                : stats.rate >= 50
                  ? <><span style={{ color: '#f59e0b', fontWeight: 700 }}>Moderate compliance.</span> Targeted action needed for {stats.nonCompliant} non-compliant schools.</>
                  : <><span style={{ color: '#f87171', fontWeight: 700 }}>Urgent intervention needed.</span> {stats.nonCompliant} schools flagged non-compliant under COTPA Sec 6(b).</>
              }
            </p>
          </div>
        </Card>

        {/* District Breakdown */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#60a5fa" /> District Breakdown
            </h3>
          </div>
          {topDistricts.length === 0
            ? <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No data yet</p>
            : topDistricts.map(([district, data], i) => {
              const rate = data.total > 0 ? Math.round(data.compliant / data.total * 100) : 0;
              return (
                <div key={district} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: i < topDistricts.length - 1 ? '1px solid var(--tf-border)' : 'none' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#22c55e', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tf-text-main)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{district}</div>
                    <ProgressBar pct={rate} />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#f87171', flexShrink: 0 }}>{rate}%</div>
                </div>
              );
            })
          }
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#f59e0b" /> Recent Reports
          </h3>
          <span style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)' }}>Last 5 submissions</span>
        </div>

        {recent.length === 0
          ? <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No reports yet. Submit from the Scorecard tab.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recent.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: 'var(--tf-surface-2)', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <School size={18} color="#22c55e" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tf-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.schoolName || 'Unknown School'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)' }}>{r.district || '—'} · Score: <span style={{ color: '#22c55e', fontWeight: 700 }}>{r.totalScore || 0}/95</span></div>
                </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: `${statusColor(r.complianceStatus)}15`, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      <StatusIcon status={r.complianceStatus} size={12} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor(r.complianceStatus), whiteSpace: 'nowrap' }}>
                        {statusLabel(r.complianceStatus)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)' }}>{timeAgo(r.createdAt)}</span>
                  </div>
              </div>
            ))}
          </div>
        }
      </Card>

      {/* COTPA info bar */}
      <div className="tf-card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #2563eb', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <FileText size={20} color="#60a5fa" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: '0 0 0.25rem' }}>COTPA 2003 · Section 6(b) Reference</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0, lineHeight: 1.6 }}>
            Sale of tobacco products within <strong style={{ color: '#f59e0b' }}>100 yards</strong> of any educational institution is a punishable offence.
            Violators are liable for a fine of up to <strong style={{ color: '#f59e0b' }}>₹200</strong>.
            Under JJ Act 2015 Sec 77, selling to minors carries a fine of up to <strong style={{ color: '#f87171' }}>₹1 Lakh + 7 years imprisonment</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
