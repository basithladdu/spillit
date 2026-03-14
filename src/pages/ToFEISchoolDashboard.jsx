import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Menu, Sun, Moon, LogOut, ClipboardList, ShieldCheck, BarChart3, X } from 'lucide-react';
import app from '../utils/firebase';
import apHealthLogo from '../assets/Department-of-Health-Medical-Family-Welfare-AP-Govt-Logo-474x221-1.png';
import '../styles/tofei.css';

import ToFEIScorecardView from '../components/tofei/ToFEIScorecardView';
import ToFEISchoolReportDetail from '../components/tofei/ToFEISchoolReportDetail';
import { Map, Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Eye, MapPin, Globe } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXdhaXpzaGFpazI1IiwiYSI6ImNtY3J5MHQzMTEwZjcyanMzYWJuMnMxcTUifQ.bLPhS0-UAAouYlHOK396XQ';

function getReportCoords(r) {
  const lat = r?.latitude ?? r?.location?.lat;
  const lng = r?.longitude ?? r?.location?.lng;
  return { lat, lng };
}

const db = getFirestore(app);

export default function ToFEISchoolDashboard({ initialView = 'submit' }) {
  const { currentUser, tofeiProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView]   = useState(initialView);
  const [isLightMode, setIsLightMode] = useState(true);
  const [reports, setReports]         = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile]       = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Sync activeView with initialView prop when route changes
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const schoolUdise = tofeiProfile?.schoolUdise || tofeiProfile?.udiseCode || currentUser?.uid;
  const legacySchoolUid = currentUser?.uid;
  const schoolName  = tofeiProfile?.schoolName  || 'My School';
  const district    = tofeiProfile?.district    || '';

  // Responsive
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch only this school's reports
  useEffect(() => {
    if (!schoolUdise) return;
    const ids = Array.from(new Set([schoolUdise, legacySchoolUid].filter(Boolean)));

    const makeQuery = (field, val) => query(
      collection(db, 'tofei_reports'),
      where(field, '==', val)
    );

    let buckets = {};
    const merge = () => {
      const dedup = {};
      Object.values(buckets).flat().forEach(r => {
        dedup[r.id] = r;
      });
      const merged = Object.values(dedup).sort((r1, r2) => {
        const t1 = r1.createdAt?.toDate?.()?.getTime?.() ?? new Date(r1.createdAt || 0).getTime();
        const t2 = r2.createdAt?.toDate?.()?.getTime?.() ?? new Date(r2.createdAt || 0).getTime();
        return t2 - t1;
      });
      setReports(merged);
    };

    const unsubs = [];
    for (const id of ids) {
      const key1 = `schoolUdise:${id}`;
      const key2 = `udiseCode:${id}`;
      buckets[key1] = [];
      buckets[key2] = [];
      unsubs.push(onSnapshot(makeQuery('schoolUdise', id), snap => {
        buckets[key1] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        merge();
      }, err => console.error('School reports error (schoolUdise):', err)));
      unsubs.push(onSnapshot(makeQuery('udiseCode', id), snap => {
        buckets[key2] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        merge();
      }, err => console.error('School reports error (udiseCode):', err)));
    }

    return () => { unsubs.forEach(u => u && u()); };
  }, [schoolUdise, legacySchoolUid]);

  const handleLogout = async () => {
    try { await logout(); navigate('/tofei-login'); }
    catch (e) { console.error(e); }
  };

  const compliant    = reports.filter(r => r.complianceStatus === 'compliant').length;
  const nonCompliant = reports.filter(r => r.complianceStatus === 'non-compliant').length;
  const pending      = reports.filter(r => r.complianceStatus === 'pending').length;
  const rate         = reports.length > 0 ? Math.round((compliant / reports.length) * 100) : 0;

  return (
    <div className={`tofei-theme ${isLightMode ? 'light-mode' : ''}`}
      style={{ display: 'flex', height: '100dvh', overflow: 'hidden', paddingTop: 'var(--navbar-height)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>

      {/* Gov header - stacked on mobile: logo/title on top, School Portal button below */}
      <div className="tf-gov-header tf-gov-header-mobile" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ffffff', borderBottom: '3px solid #046A38', padding: '0.65rem 1rem', paddingTop: 'calc(0.65rem + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div className="tf-gov-header-inner" style={{ display: 'flex', alignItems: 'center', gap: '2rem', maxWidth: '1200px', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
            {isMobile && (
              <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="tf-gov-menu-btn" style={{ flexShrink: 0, padding: '0.5rem', background: 'transparent', border: 'none', color: '#046A38', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex' }}>
                <Menu size={24} />
              </button>
            )}
            <img src={apHealthLogo} alt="AP Govt" style={{ height: '32px', width: 'auto' }} className="tf-gov-logo" />
            <div className="tf-gov-divider" style={{ height: '30px', width: '1px', background: '#e0e0e0' }} />
            <div className="tf-gov-title-wrap" style={{ minWidth: 0 }}>
              <span style={{ color: '#046A38', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Government of Andhra Pradesh</span>
              <span style={{ color: '#4b5563', fontSize: '0.65rem', fontWeight: 600 }}>Department of Health, Medical &amp; Family Welfare</span>
            </div>
          </div>
          <span className="tf-gov-portal-badge" style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(22,163,74,0.3)', textTransform: 'uppercase' }}>🏫 School Portal</span>
        </div>
      </div>

      {/* Sidebar - z-index above main so it's clickable when open on mobile */}
      <aside style={{ position: 'fixed', inset: '0', left: 0, zIndex: 150, width: '220px', maxWidth: '85vw', background: 'var(--tf-surface)', borderRight: '1px solid var(--tf-border)', display: 'flex', flexDirection: 'column', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', top: 'var(--navbar-height)', boxShadow: sidebarOpen && isMobile ? '4px 0 20px rgba(0,0,0,0.15)' : 'none' }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--tf-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
            <img src={apHealthLogo} alt="logo" style={{ height: '34px', objectFit: 'contain' }} />
          </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#22c55e' }}>School Dashboard</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{schoolName}</div>
            {district && <div style={{ fontSize: '0.6rem', color: 'var(--tf-text-muted)' }}>📍 {district}</div>}
          </div>
          {isMobile && (
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ flexShrink: 0, padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex' }}><X size={22} /></button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0' }}>
          {[
            { id: 'submit',  icon: ShieldCheck, label: 'Submit Scorecard', path: '/tofei-school' },
            { id: 'history', icon: ClipboardList, label: 'My Reports', path: '/tofei-school/history' },
            { id: 'stats',   icon: BarChart3, label: 'My Stats', path: '/tofei-school/stats' },
          ].map((item) => {
            const NavIcon = item.icon;
            return (
              <button key={item.id} onClick={() => navigate(item.path)}
                className={`tf-nav-item${activeView === item.id ? ' active' : ''}`}>
                <NavIcon size={16} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--tf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
              {currentUser?.email?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--tf-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email || 'School'}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tf-text-muted)' }}>School Officer</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.4rem', borderRadius: '0.375rem', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div role="button" tabIndex={0} onClick={() => setSidebarOpen(false)} onKeyDown={e => e.key === 'Escape' && setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140, cursor: 'pointer' }} aria-label="Close menu" />
      )}

      {/* Main - z-index below sidebar so sidebar can receive clicks when open */}
      <main className="tofei-school-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: (!isMobile && sidebarOpen) ? '220px' : '0', transition: 'margin-left 0.25s ease', position: 'relative', zIndex: 1, paddingBottom: isMobile ? '70px' : 0 }}>
        {/* Page header hidden on mobile: bottom tabs show section, gov header has menu */}
        {!isMobile && (
          <header className="tf-page-header" style={{ height: '56px', flexShrink: 0, background: 'var(--tf-surface)', borderBottom: '1px solid var(--tf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
              <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex', flexShrink: 0 }} aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}><Menu size={20} /></button>
              <div style={{ minWidth: 0 }}>
                <h2 className="tf-page-title" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, textTransform: 'capitalize' }}>
                  {activeView === 'submit' ? 'Submit Scorecard' : activeView === 'history' ? 'My Reports' : 'My Stats'}
                </h2>
                <p className="tf-page-breadcrumb" style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', margin: 0 }}>School Compliance Portal · {schoolName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span className="tf-reports-badge" style={{ fontSize: '0.65rem', fontWeight: 700, color: rate >= 70 ? '#22c55e' : '#f59e0b', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '9999px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
                {reports.length} Report{reports.length !== 1 ? 's' : ''}
              </span>
              <button type="button" onClick={() => setIsLightMode(!isLightMode)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex' }} aria-label="Toggle theme">{isLightMode ? <Moon size={18} /> : <Sun size={18} />}</button>
            </div>
          </header>
        )}

        <div className="tofei-main-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem 3rem', background: 'var(--tf-bg)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>

            {activeView === 'submit' && <ToFEIScorecardView userProfile={tofeiProfile} />}

            {activeView === 'history' && (
              <div className="tf-history-view">
                <h3 className="tf-section-title" style={{ color: 'var(--tf-text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Submitted Reports</h3>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--tf-text-muted)', padding: '3rem', background: 'var(--tf-surface)', borderRadius: '1rem', border: '1px solid var(--tf-border)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                    <p>No reports submitted yet. Use the <strong>Submit Scorecard</strong> tab to get started.</p>
                  </div>
                ) : (
                  <>
                    {/* Map of report locations */}
                    {reports.some(r => getReportCoords(r).lat != null) && (
                      <div className="tf-card" style={{ marginBottom: '1.25rem', padding: '1rem', overflow: 'hidden' }}>
                        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={16} color="#60a5fa" /> Report Locations
                        </h4>
                        <div style={{ height: 'min(280px, 50vw)', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--tf-border)', background: 'var(--tf-surface-2)' }}>
                          <Map
                            initialViewState={{ longitude: 80.6, latitude: 16.5, zoom: 6 }}
                            mapStyle={isLightMode ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'}
                            mapboxAccessToken={MAPBOX_TOKEN}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <NavigationControl position="top-right" />
                            {reports.filter(r => getReportCoords(r).lat != null).map(r => {
                              const { lat, lng } = getReportCoords(r);
                              return (
                                <Marker key={r.id} longitude={Number(lng)} latitude={Number(lat)} anchor="bottom">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReport(r)}
                                    style={{
                                      width: 14, height: 14, borderRadius: '50%',
                                      background: r.complianceStatus === 'compliant' ? '#22c55e' : r.complianceStatus === 'non-compliant' ? '#f87171' : '#f59e0b',
                                      border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', cursor: 'pointer', padding: 0,
                                    }}
                                  />
                                </Marker>
                              );
                            })}
                          </Map>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reports.map(r => {
                        const { lat, lng } = getReportCoords(r);
                        const hasCoords = lat != null && lng != null;
                        return (
                          <div key={r.id} style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-border)', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--tf-text-main)', fontSize: '0.875rem' }}>{r.schoolName || 'Report'}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.2rem' }}>
                                {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                              </div>
                              {hasCoords && (
                                <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontFamily: "'JetBrains Mono', monospace", marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Globe size={10} /> {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '9999px',
                                background: r.complianceStatus === 'compliant' ? 'rgba(22,163,74,0.15)' : r.complianceStatus === 'non-compliant' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)',
                                color: r.complianceStatus === 'compliant' ? '#22c55e' : r.complianceStatus === 'non-compliant' ? '#f87171' : '#f59e0b',
                              }}>
                                {r.complianceStatus === 'compliant' ? '✅ Compliant' : r.complianceStatus === 'non-compliant' ? '❌ Non-Compliant' : '⏳ Pending'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedReport(r)}
                                className="tf-btn-ghost"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Eye size={14} /> View report
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {selectedReport && (
                  <ToFEISchoolReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} isLightMode={isLightMode} />
                )}
              </div>
            )}

            {activeView === 'stats' && (
              <div className="tf-stats-view">
                <h3 className="tf-section-title" style={{ color: 'var(--tf-text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Compliance Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Total Reports', value: reports.length, color: '#22c55e' },
                    { label: 'Compliant', value: compliant, color: '#22c55e' },
                    { label: 'Non-Compliant', value: nonCompliant, color: '#f87171' },
                    { label: 'Pending Review', value: pending, color: '#f59e0b' },
                    { label: 'Compliance Rate', value: `${rate}%`, color: rate >= 70 ? '#22c55e' : '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-border)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.3rem' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* devit Footer - stacked and centered on mobile */}
          <footer className="tf-footer" style={{ borderTop: '1px solid var(--tf-border)', background: 'var(--tf-surface)', marginTop: '3rem' }}>
            <div className="tf-footer-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
              <div className="tf-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                <div className="tf-footer-col">
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '0.75rem' }}>
                    Powered by <span style={{ color: '#22c55e' }}>devit.</span>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--tf-text-muted)', marginBottom: '0.75rem' }}>
                    We design, build, and scale exceptional software for startups and businesses.
                  </p>
                  <a href="https://www.wedevit.in/" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                    Visit wedevit.in →
                  </a>
                </div>
                <div className="tf-footer-col">
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Contact</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <a href="mailto:workwithdevit@gmail.com" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>workwithdevit@gmail.com</a>
                    <a href="tel:+919553321211" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>+91 95533 21211</a>
                    <a href="https://wa.me/919553321211" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>WhatsApp</a>
                  </div>
                </div>
                <div className="tf-footer-col">
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Connect</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <a href="https://www.linkedin.com/in/basithladoo/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>LinkedIn - Basith</a>
                    <a href="mailto:basithladoo@gmail.com" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>basithladoo@gmail.com</a>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--tf-border)', paddingTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0 }}>
                  © {new Date().getFullYear()} <span style={{ color: '#22c55e', fontWeight: 600 }}>devit</span>. All rights reserved. | Built with ❤️ for better governance
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile bottom tab bar - primary nav so full sidebar isn't needed */}
      {isMobile && (
        <nav className="tf-bottom-tabs" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '56px', paddingBottom: 'env(safe-area-inset-bottom)', background: 'var(--tf-surface)', borderTop: '1px solid var(--tf-border)', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', zIndex: 90 }}>
          {[
            { id: 'submit', icon: ShieldCheck, label: 'Submit', path: '/tofei-school' },
            { id: 'history', icon: ClipboardList, label: 'Reports', path: '/tofei-school/history' },
            { id: 'stats', icon: BarChart3, label: 'Stats', path: '/tofei-school/stats' },
          ].map((item) => {
            const NavIcon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className="tf-bottom-tab"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', background: 'none', border: 'none', color: active ? '#22c55e' : 'var(--tf-text-muted)', cursor: 'pointer', padding: '0.5rem', fontSize: '0.65rem', fontWeight: 600 }}
              >
                <NavIcon size={20} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
