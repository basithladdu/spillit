import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Building2, School, Globe, ShieldCheck } from 'lucide-react';
import app from '../utils/firebase';
import apHealthLogo from '../assets/Department-of-Health-Medical-Family-Welfare-AP-Govt-Logo-474x221-1.png';

const db = getFirestore(app);

const ROLE_ROUTES = {
  school: '/tofei-school',
  dtcc:   '/tofei-dtcc',
  stcc:   '/tofei-dashboard',
};

const ROLE_ICONS = {
  school: <School size={16} />,
  dtcc:   <Building2 size={16} />,
  stcc:   <Globe size={16} />,
};

export default function ToFEILogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPortal, setSelectedPortal] = useState('school'); // 'school' | 'dtcc' | 'stcc'
  const { login, currentUser, tofeiRole, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && tofeiRole) {
      navigate(ROLE_ROUTES[tofeiRole] || '/tofei-dashboard');
    } else if (currentUser && tofeiRole === null) {
      // Firebase user exists but no tofei doc yet — wait a beat then redirect
      const t = setTimeout(() => navigate('/tofei-dashboard'), 1500);
      return () => clearTimeout(t);
    }
  }, [currentUser, tofeiRole, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      
      // Log successful login
      try {
        await addDoc(collection(db, 'tofei_logins'), {
          email: email.toLowerCase(),
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          platform: 'ToFEI Dashboard'
        });
      } catch (logErr) {
        console.error('Failed to log login:', logErr);
      }

      // Redirect happens via useEffect watching `tofeiRole` (profile from Firestore).
      // If user has no ToFEI profile, block access.
      setTimeout(async () => {
        const role = localStorage.getItem('tofei_role');
        if (!role) {
          setError('No ToFEI portal access for this account. Contact STCC to enable access.');
          try { await logout(); } catch {}
        }
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: 'linear-gradient(135deg, #030d06 0%, #060d0a 40%, #081a10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '300px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top government header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: '#ffffff',
        borderBottom: '3px solid #046A38',
        padding: '0.65rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', maxWidth: '1200px', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src={apHealthLogo} alt="AP Govt" style={{ height: '32px', width: 'auto' }} />
            <div style={{ height: '30px', width: '1px', background: '#e0e0e0' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#046A38', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Government of Andhra Pradesh
              </span>
              <span style={{ color: '#4b5563', fontSize: '0.65rem', fontWeight: 600 }}>
                Department of Health, Medical &amp; Family Welfare
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid #e0e0e0', paddingLeft: '1rem', display: 'none', md: 'block' }}>
            <span style={{ color: '#046A38', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>NTCP · AP</span>
            <span style={{ color: '#6b7280', fontSize: '0.6rem', display: 'block' }}>National Tobacco Control Programme</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        marginTop: '2.5rem',
        background: 'rgba(13,31,23,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(22,163,74,0.2)',
        borderRadius: '1rem',
        boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 30px rgba(22,163,74,0.08)',
        overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        {/* Top accent bar — India tricolour + green */}
        <div style={{ height: '3px', background: 'linear-gradient(to right, #FF671F 0%, #FFFFFF 33%, #046A38 66%, #16a34a 100%)' }} />

        <div style={{ padding: '2rem' }}>
          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <img
                src={apHealthLogo}
                alt="AP Dept of Health"
                style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <h1 style={{
              fontSize: '1.25rem', fontWeight: 800, color: '#e8f5ee',
              lineHeight: 1.3, marginBottom: '0.4rem',
            }}>
              <span style={{ color: '#22c55e' }}>ToFEI</span>{' '}
              {selectedPortal === 'school' ? 'School Portal' : selectedPortal === 'dtcc' ? 'DTCC Portal' : 'STCC State Portal'}
            </h1>
            <p style={{ color: '#8bbfa0', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {selectedPortal === 'school'
                ? <>Submit scorecards &amp; track your school's compliance<br /><span style={{ color: 'rgba(139,191,160,0.5)', fontSize: '0.68rem' }}>For School Heads / Nodal Officers</span></>
                : selectedPortal === 'dtcc'
                ? <>Monitor all schools in your district<br /><span style={{ color: 'rgba(139,191,160,0.5)', fontSize: '0.68rem' }}>For District Tobacco Control Cell Officers</span></>
                : <>State-wide compliance overview across all DTCCs<br /><span style={{ color: 'rgba(139,191,160,0.5)', fontSize: '0.68rem' }}>For STCC / NHM-AP Officers</span></>}
            </p>

            {/* Portal tab switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '0.625rem', padding: '3px', gap: '2px', border: '1px solid rgba(22,163,74,0.15)' }}>
              {[
                { id: 'school', label: 'School', icon: <School size={14} />, color: '#22c55e' },
                { id: 'dtcc',   label: 'DTCC',   icon: <Building2 size={14} />, color: '#3b82f6' },
                { id: 'stcc',   label: 'STCC',   icon: <Globe size={14} />, color: '#a855f7' },
              ].map(({ id, label, icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPortal(id)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.25rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    transition: 'all 0.18s ease',
                    background: selectedPortal === id ? color : 'transparent',
                    color: selectedPortal === id ? '#fff' : '#8bbfa0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: selectedPortal === id ? `0 2px 10px ${color}40` : 'none',
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: '0.5rem', padding: '0.75rem 1rem',
                color: '#f87171', fontSize: '0.8rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8bbfa0', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                Official Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#8bbfa0', display: 'flex' }}><Mail size={16} /></span>
                <input
                  id="tofei-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={
                    selectedPortal === 'school'
                      ? 'school@gmail.com'
                      : selectedPortal === 'dtcc'
                      ? 'dtcc@gmail.com'
                      : 'stcc@gmail.com'
                  }
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(22,163,74,0.2)',
                    borderRadius: '0.5rem', padding: '0.7rem 1rem 0.7rem 2.5rem',
                    color: '#e8f5ee', fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(22,163,74,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(22,163,74,0.2)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8bbfa0', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#8bbfa0', display: 'flex' }}><Lock size={16} /></span>
                <input
                  id="tofei-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(22,163,74,0.2)',
                    borderRadius: '0.5rem', padding: '0.7rem 2.75rem 0.7rem 2.5rem',
                    color: '#e8f5ee', fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(22,163,74,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(22,163,74,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8bbfa0', fontSize: '0.875rem', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                background: loading ? 'rgba(22,163,74,0.3)' : 'linear-gradient(135deg, #16a34a, #059669)',
                border: 'none', borderRadius: '0.5rem', padding: '0.875rem',
                color: '#fff', fontWeight: 700, fontSize: '0.925rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                width: '100%', letterSpacing: '0.04em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(22,163,74,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Authenticating...
                </>
              ) : <><ShieldCheck size={20} /> Sign In to Dashboard</>}
            </button>
          </form>

          {/* Info footer */}
          <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'rgba(22,163,74,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={24} color="#8bbfa0" style={{ opacity: 0.5 }} />
            <p style={{ color: '#8bbfa0', fontSize: '0.72rem', textAlign: 'left', lineHeight: 1.6, margin: 0 }}>
              This portal is for authorized officers only. For access, contact your District Tobacco Control Cell (DTCC) · NHM
            </p>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'rgba(139,191,160,0.5)', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
          ToFEI Monitoring System · Powered by Department of Health &amp; Family Welfare, AP
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(13,31,23,0.9) inset !important;
          -webkit-text-fill-color: #e8f5ee !important;
        }
      `}</style>
    </div>
  );
}
