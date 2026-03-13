import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  BarChart3, ShieldCheck, ClipboardList, MapPin, 
  Menu, Sun, Moon, Bell, LogOut, FileText, ChevronRight, Award, BookOpen, Settings, LayoutDashboard
} from 'lucide-react';
import app from '../utils/firebase';
import apHealthLogo from '../assets/Department-of-Health-Medical-Family-Welfare-AP-Govt-Logo-474x221-1.png';
import '../styles/tofei.css';

import ToFEIDashboardView   from '../components/tofei/ToFEIDashboardView';
import ToFEITrackerView     from '../components/tofei/ToFEITrackerView';
import ToFEIScorecardView   from '../components/tofei/ToFEIScorecardView';
import ToFEILeaderboardView from '../components/tofei/ToFEILeaderboardView';
import ToFEISettingsView    from '../components/tofei/ToFEISettingsView';
import ToFEIAboutView from '../components/tofei/ToFEIAboutView';

const db = getFirestore(app);

// ── Sidebar nav item ──────────────────────────────────────────────
function NavItem({ id, icon: IconComp, label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`tf-nav-item${active ? ' active' : ''}`}
    >
      <IconComp size={17} />
      <span>{label}</span>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ToFEIDashboard({ initialView = 'dashboard' }) {
  const { currentUser, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [activeView,      setActiveView]      = useState(initialView);
  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [isMobile,        setIsMobile]        = useState(false);
  const [isLightMode,     setIsLightMode]     = useState(true);
  const [showNotif,       setShowNotif]       = useState(false);
  const [reports,         setReports]         = useState([]);
  const [stats,           setStats]           = useState({ total:0, compliant:0, nonCompliant:0, pending:0, rate:0 });

  // ── Responsive ──
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Sync view with URL ──
  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/tracker'))     setActiveView('tracker');
    else if (p.includes('/scorecard'))   setActiveView('scorecard');
    else if (p.includes('/leaderboard')) setActiveView('leaderboard');
    else if (p.includes('/settings'))    setActiveView('settings');
    else if (p.includes('/about'))       setActiveView('about');
    else setActiveView('dashboard');
  }, [location.pathname]);

  // ── Firebase real-time ──
  useEffect(() => {
    const q = query(collection(db, 'tofei_reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(data);
      const total       = data.length;
      const compliant   = data.filter(r => r.complianceStatus === 'compliant').length;
      const nonCompliant= data.filter(r => r.complianceStatus === 'non-compliant').length;
      const pending     = total - compliant - nonCompliant;
      const rate        = total > 0 ? Math.round((compliant / total) * 100) : 0;
      setStats({ total, compliant, nonCompliant, pending, rate });
    }, err => console.error('ToFEI snapshot error:', err));
    return () => unsub();
  }, []);

  // ── Handlers ──
  const handleNav = (id) => {
    const routes = {
      dashboard:   '/tofei-dashboard',
      tracker:     '/tofei-dashboard/tracker',
      scorecard:   '/tofei-dashboard/scorecard',
      leaderboard: '/tofei-dashboard/leaderboard',
      about:       '/tofei-dashboard/about',
      settings:    '/tofei-dashboard/settings',
    };
    navigate(routes[id] || '/tofei-dashboard');
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/tofei-login'); }
    catch (e) { console.error(e); }
  };

  const handleDeleteReport = async (id) => {
    try {
      await deleteDoc(doc(db, 'tofei_reports', id));
      toast.success('Report deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleStatusUpdate = async (id, current) => {
    const next = current === 'compliant' ? 'non-compliant'
               : current === 'non-compliant' ? 'pending'
               : 'compliant';
    try { await updateDoc(doc(db, 'tofei_reports', id), { complianceStatus: next }); }
    catch { toast.error('Update failed'); }
  };

  const criticalAlerts = reports.filter(r => r.complianceStatus === 'non-compliant').length;

  // ── Sidebar ──
  const sidebarItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Overview' },
    { id: 'tracker',     icon: ClipboardList,   label: 'Reports Tracker' },
    { id: 'scorecard',   icon: ShieldCheck,     label: 'Guideline Scorecard' },
    { id: 'leaderboard', icon: Award,           label: 'School Rankings' },
    { id: 'about',       icon: BookOpen,        label: 'About & Help' },
    { id: 'settings',    icon: Settings,        label: 'Settings' },
  ];


  return (
    <div className={`tofei-theme ${isLightMode ? 'light-mode' : ''}`} style={{ display:'flex', height:'100dvh', overflow:'hidden', paddingTop:'var(--navbar-height)' }}>

      {/* Top government header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: '#ffffff',
        borderBottom: '3px solid #046A38',
        padding: '0.65rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      }} className="tf-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', maxWidth: '1200px', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src={apHealthLogo} alt="AP Govt" style={{ height: '32px', width: 'auto' }} className="tf-gov-logo" />
            <div style={{ height: '30px', width: '1px', background: '#e0e0e0' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#046A38', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="tf-gov-text-primary">
                Government of Andhra Pradesh
              </span>
              <span style={{ color: '#4b5563', fontSize: '0.65rem', fontWeight: 600 }} className="tf-gov-text-secondary">
                Department of Health, Medical &amp; Family Welfare
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid #e0e0e0', paddingLeft: '1rem', display: 'none', md: 'block' }}>
            <span style={{ color: '#046A38', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>NTCP · AP</span>
            <span style={{ color: 'rgba(107, 114, 128, 1)', fontSize: '0.6rem', display: 'block' }}>National Tobacco Control Programme</span>
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside style={{
        position:'fixed', inset:'0', left:0, zIndex:50,
        width:'240px',
        background:'var(--tf-surface)',
        borderRight:'1px solid var(--tf-border)',
        display:'flex', flexDirection:'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.25s ease',
        top:'var(--navbar-height)',
        paddingBottom:'var(--navbar-height)',
      }}>
        {/* Logo area */}
        <div style={{ padding:'1.25rem 1rem', borderBottom:'1px solid var(--tf-border)' }}>
          <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={apHealthLogo} alt="AP Health" style={{ height:'38px', objectFit:'contain', maxWidth:'100%' }} className="tf-sidebar-logo" />
          </div>
          <div style={{ marginTop:'0.6rem' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:800, color:'#22c55e', letterSpacing:'0.05em' }}>ToFEI Monitor</div>
            <div style={{ fontSize:'0.65rem', color:'var(--tf-text-muted)', marginTop:'0.1rem' }}>COTPA 2003 · Sec 6(b)</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.5rem 0', overflowY:'auto' }}>
          {sidebarItems.map(item => (
            <NavItem key={item.id} {...item} active={activeView === item.id} onClick={handleNav} />
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'1rem', borderTop:'1px solid var(--tf-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.75rem' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'0.5rem', background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'#22c55e', flexShrink:0 }}>
              {currentUser?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--tf-text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {currentUser?.email || 'Admin'}
              </div>
              <div style={{ fontSize:'0.65rem', color:'var(--tf-text-muted)' }}>ToFEI Officer</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.5rem', borderRadius:'0.375rem', background:'transparent', border:'none', color:'#f87171', fontSize:'0.75rem', cursor:'pointer', transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:49, backdropFilter:'blur(2px)' }} />
      )}

      {/* ── Main ── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, marginLeft: (!isMobile && sidebarOpen) ? '240px' : '0', transition:'margin-left 0.25s ease' }}>

        {/* Header */}
        <header style={{ height:'56px', flexShrink:0, background:'var(--tf-surface)', borderBottom:'1px solid var(--tf-border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '0 0.75rem' : '0 1.25rem', gap:'0.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding:'0.375rem', background:'transparent', border:'none', color:'var(--tf-text-muted)', cursor:'pointer', borderRadius:'0.375rem', display:'flex' }}>
              <Menu size={20} />
            </button>
            <div>
              <h2 style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--tf-text-main)', margin:0, textTransform:'capitalize' }}>
                {activeView === 'dashboard' ? 'Overview Dashboard' : activeView.replace('-', ' ')}
              </h2>
              <p style={{ fontSize:'0.65rem', color:'var(--tf-text-muted)', margin:0 }}>Tobacco-Free Educational Institutions</p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {/* Compliance badge */}
            {!isMobile && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'rgba(22,163,74,0.1)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:'9999px', padding:'0.25rem 0.75rem' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', animation:'pulse 1.5s infinite' }} />
                <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#22c55e' }}>{stats.rate}% Compliant</span>
              </div>
            )}


            {/* Alerts */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowNotif(!showNotif)} style={{ padding:'0.375rem', background:'transparent', border:'none', color:'var(--tf-text-muted)', cursor:'pointer', borderRadius:'0.375rem', display:'flex', position:'relative' }}>
                <Bell size={18} />
                {criticalAlerts > 0 && <span style={{ position:'absolute', top:'4px', right:'4px', width:'7px', height:'7px', background:'#ef4444', borderRadius:'50%', animation:'pulse 1.5s infinite' }} />}
              </button>
              {showNotif && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:40 }} onClick={() => setShowNotif(false)} />
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:'280px', background:'var(--tf-surface)', border:'1px solid var(--tf-border)', borderRadius:'0.75rem', zIndex:50, boxShadow:'0 16px 48px rgba(0,0,0,0.4)', overflow:'hidden' }}>
                    <div style={{ padding:'0.875rem 1rem', borderBottom:'1px solid var(--tf-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--tf-text-main)' }}>🔔 Alerts</span>
                      <button onClick={() => setShowNotif(false)} style={{ background:'none', border:'none', color:'var(--tf-text-muted)', cursor:'pointer' }}><X size={14} /></button>
                    </div>
                    <div style={{ padding:'0.875rem 1rem' }}>
                      {criticalAlerts > 0
                        ? <p style={{ color:'#f87171', fontSize:'0.8rem', margin:0 }}>⚠️ {criticalAlerts} school(s) non-compliant</p>
                        : <p style={{ color:'var(--tf-text-muted)', fontSize:'0.8rem', margin:0 }}>✅ All clear — no critical alerts</p>
                      }
                      {stats.pending > 0 && <p style={{ color:'#f59e0b', fontSize:'0.8rem', margin:'0.5rem 0 0' }}>⏳ {stats.pending} report(s) pending review</p>}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme */}
            <button onClick={() => setIsLightMode(!isLightMode)} style={{ padding:'0.375rem', background:'transparent', border:'none', color:'var(--tf-text-muted)', cursor:'pointer', borderRadius:'0.375rem', display:'flex' }}>
              {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 1.25rem 3rem', background:'var(--tf-bg)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', paddingBottom:'2rem' }}>
            {activeView === 'dashboard' && <ToFEIDashboardView reports={reports} stats={stats} isLightMode={isLightMode} />}
          {activeView === 'tracker' && <ToFEITrackerView reports={reports} onDelete={handleDeleteReport} onStatusUpdate={handleStatusUpdate} />}
          {activeView === 'scorecard' && <ToFEIScorecardView />}
          {activeView === 'leaderboard' && <ToFEILeaderboardView reports={reports} />}
          {activeView === 'about' && <ToFEIAboutView />}
          {activeView === 'settings' && <ToFEISettingsView isLightMode={isLightMode} onToggleTheme={() => setIsLightMode(!isLightMode)} />}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
