import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import {
  Menu, Sun, Moon, LogOut, LayoutDashboard, ClipboardList, Award, Settings
} from 'lucide-react';
import app from '../utils/firebase';
import apHealthLogo from '../assets/Department-of-Health-Medical-Family-Welfare-AP-Govt-Logo-474x221-1.png';
import '../styles/tofei.css';

import ToFEIDashboardView   from '../components/tofei/ToFEIDashboardView';
import ToFEITrackerView     from '../components/tofei/ToFEITrackerView';
import ToFEILeaderboardView from '../components/tofei/ToFEILeaderboardView';
import ToFEISettingsView    from '../components/tofei/ToFEISettingsView';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const db = getFirestore(app);



export default function ToFEIDTCCDashboard({ initialView = 'dashboard' }) {
  const { currentUser, tofeiProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView,  setActiveView]  = useState(initialView);
  const [isLightMode, setIsLightMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);
  const [reports,     setReports]     = useState([]);
  const [stats,       setStats]       = useState({ total: 0, compliant: 0, nonCompliant: 0, pending: 0, rate: 0 });

  // Sync with route
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const district = (tofeiProfile?.district || (localStorage.getItem('tofei_profile') && JSON.parse(localStorage.getItem('tofei_profile'))?.district) || '').trim();

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

  // Fetch reports scoped to this district
  useEffect(() => {
    if (!district) return;
    const q = query(
      collection(db, 'tofei_reports'),
      where('district', '==', district),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(data);
      const total        = data.length;
      const compliant    = data.filter(r => r.complianceStatus === 'compliant').length;
      const nonCompliant = data.filter(r => r.complianceStatus === 'non-compliant').length;
      const pending      = total - compliant - nonCompliant;
      const rate         = total > 0 ? Math.round((compliant / total) * 100) : 0;
      setStats({ total, compliant, nonCompliant, pending, rate });
    }, err => console.error('DTCC snapshot error:', err));
    return () => unsub();
  }, [district]);

  const handleLogout = async () => {
    try { await logout(); navigate('/tofei-login'); }
    catch (e) { console.error(e); }
  };

  const handleDeleteReport = async (id) => {
    try { await deleteDoc(doc(db, 'tofei_reports', id)); toast.success('Report deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatusUpdate = async (id, current) => {
    const next = current === 'compliant' ? 'non-compliant' : current === 'non-compliant' ? 'pending' : 'compliant';
    try { await updateDoc(doc(db, 'tofei_reports', id), { complianceStatus: next }); toast.success(`Status updated → ${next}`); }
    catch (e) { console.error(e); toast.error(`Update failed${e?.message ? `: ${e.message}` : ''}`); }
  };

  const navItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Overview', path: '/tofei-dtcc' },
    { id: 'tracker',     icon: ClipboardList,   label: 'School Reports', path: '/tofei-dtcc/tracker' },
    { id: 'leaderboard', icon: Award,           label: 'School Rankings', path: '/tofei-dtcc/leaderboard' },
    { id: 'settings',    icon: Settings,        label: 'Settings', path: '/tofei-dtcc/settings' },
  ];

  return (
    <div className={`tofei-theme ${isLightMode ? 'light-mode' : ''}`}
      style={{ display: 'flex', height: '100dvh', overflow: 'hidden', paddingTop: 'var(--navbar-height)' }}>

      {/* Gov header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ffffff', borderBottom: '3px solid #046A38', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} className="tf-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', maxWidth: '1200px', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src={apHealthLogo} alt="AP Govt" style={{ height: '32px', width: 'auto' }} className="tf-gov-logo" />
            <div style={{ height: '30px', width: '1px', background: '#e0e0e0' }} />
            <div>
              <span style={{ color: '#046A38', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Government of Andhra Pradesh</span>
              <span style={{ color: '#4b5563', fontSize: '0.65rem', fontWeight: 600 }}>Department of Health, Medical &amp; Family Welfare</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {district && <span style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600 }}>📍 {district}</span>}
            <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(59,130,246,0.25)', textTransform: 'uppercase' }}>🏛 DTCC Portal</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside style={{ position: 'fixed', inset: '0', left: 0, zIndex: 50, width: '230px', background: 'var(--tf-surface)', borderRight: '1px solid var(--tf-border)', display: 'flex', flexDirection: 'column', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', top: 'var(--navbar-height)' }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--tf-border)' }}>
          <div style={{ background: '#fff', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
            <img src={apHealthLogo} alt="logo" style={{ height: '34px', objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>DTCC Dashboard</div>
          {district && <div style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', marginTop: '0.1rem' }}>📍 {district} District</div>}
          <div style={{ fontSize: '0.6rem', color: 'var(--tf-text-muted)', marginTop: '0.1rem' }}>COTPA 2003 · Sec 6(b)</div>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const IconComp = item.icon;
            return (
              <button key={item.id} onClick={() => navigate(item.path)} className={`tf-nav-item${activeView === item.id ? ' active' : ''}`}>
                <IconComp size={17} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--tf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
              {currentUser?.email?.[0]?.toUpperCase() || 'D'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--tf-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tf-text-muted)' }}>DTCC Officer</div>
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
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }} />
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: (!isMobile && sidebarOpen) ? '230px' : '0', transition: 'margin-left 0.25s ease' }}>
        <header style={{ height: '56px', flexShrink: 0, background: 'var(--tf-surface)', borderBottom: '1px solid var(--tf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 0.75rem' : '0 1.25rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex' }}><Menu size={20} /></button>
            <div>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', margin: 0, textTransform: 'capitalize' }}>
                {activeView === 'dashboard' ? 'District Overview' : activeView === 'tracker' ? 'School Reports' : activeView === 'leaderboard' ? 'School Rankings' : 'Settings'}
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', margin: 0 }}>DTCC · {district || 'District'} · ToFEI Monitoring</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '9999px', padding: '0.25rem 0.75rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6' }}>{stats.rate}% Compliant</span>
              </div>
            )}
            <button onClick={() => setIsLightMode(!isLightMode)} style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex' }}>
              {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem 3rem', background: 'var(--tf-bg)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {activeView === 'dashboard'   && <ToFEIDashboardView reports={reports} stats={stats} isLightMode={isLightMode} />}
            {activeView === 'tracker'     && <ToFEITrackerView reports={reports} onDelete={handleDeleteReport} onStatusUpdate={handleStatusUpdate} />}
            {activeView === 'leaderboard' && <ToFEILeaderboardView reports={reports} />}
            {activeView === 'settings'    && <ToFEISettingsView isLightMode={isLightMode} onToggleTheme={() => setIsLightMode(!isLightMode)} />}
          </div>
          
          {/* devit Footer */}
          <footer style={{ borderTop: '1px solid var(--tf-border)', background: 'var(--tf-surface)', marginTop: '3rem' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                <div>
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
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Contact</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <a href="mailto:workwithdevit@gmail.com" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>workwithdevit@gmail.com</a>
                    <a href="tel:+919553321211" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>+91 95533 21211</a>
                    <a href="https://wa.me/919553321211" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tf-text-muted)', textDecoration: 'none' }}>WhatsApp</a>
                  </div>
                </div>
                <div>
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
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
