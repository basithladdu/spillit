import { Sun, Moon, Globe } from 'lucide-react';
import apHealthLogo from '../../assets/Department-of-Health-Medical-Family-Welfare-AP-Govt-Logo-474x221-1.png';

export default function ToFEISettingsView({ isLightMode, onToggleTheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* Branding */}
      <div className="tf-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={apHealthLogo} alt="AP Health" style={{ height: '52px', objectFit: 'contain' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--tf-text-main)' }}>ToFEI Monitoring System</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--tf-text-muted)', lineHeight: 1.6 }}>
            Tobacco-Free Educational Institutions · COTPA 2003 · Section 6(b)<br />
            Department of Health, Medical &amp; Family Welfare, Government of Andhra Pradesh
          </p>
        </div>
      </div>

      {/* Appearance & Language */}
      <div className="tf-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Appearance & Language</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Theme Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--tf-text-main)', fontSize: '0.875rem' }}>Interface Theme</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>Currently: {isLightMode ? 'Light Mode' : 'Dark Mode'}</p>
            </div>
            <button onClick={onToggleTheme} className="tf-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem' }}>
              {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
              {isLightMode ? 'Switch to Dark' : 'Switch to Light'}
            </button>
          </div>

          {/* Language Toggle Placeholder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--tf-text-main)', fontSize: '0.875rem' }}>Display Language</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>Currently: English</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="tf-btn-primary" style={{ padding: '0.5rem 0.875rem', cursor: 'default' }}>English</button>
              <button 
                onClick={() => alert("Telugu language support will be implemented in the future update.")} 
                className="tf-btn-ghost" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem' }}
              >
                <Globe size={16} /> తెలుగు
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About COTPA */}
      <div className="tf-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal Reference</h4>
        {[
          { sec: 'COTPA Sec 4',  penalty: 'Fine up to ₹200',                   desc: 'Smoking in public places (including educational institutions)' },
          { sec: 'COTPA Sec 5',  penalty: '₹1,000–₹5,000 / 2–5 yrs',           desc: 'Advertisement of tobacco products' },
          { sec: 'COTPA Sec 6a', penalty: 'Fine up to ₹200',                   desc: 'Sale of tobacco to / by minors under 18 years' },
          { sec: 'COTPA Sec 6b', penalty: 'Fine up to ₹200',                   desc: 'Sale of tobacco within 100 yards of educational institution' },
          { sec: 'JJ Act Sec 77',penalty: 'Up to ₹1 Lakh + 7 yrs imprisonment', desc: 'Offering or selling tobacco to any person below 18 years' },
        ].map(row => (
          <div key={row.sec} style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem 0', borderBottom: '1px solid var(--tf-border)' }}>
            <div style={{ flexShrink: 0, width: '110px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#22c55e' }}>{row.sec}</div>
              <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.1rem' }}>{row.penalty}</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--tf-text-muted)', lineHeight: 1.5 }}>{row.desc}</p>
          </div>
        ))}
      </div>

      {/* Contacts */}
      <div className="tf-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Helpline &amp; Contacts</h4>
        {[
          { label: 'National Tobacco Helpline', value: '1800-11-2356 (Toll Free)' },
          { label: 'NTCP Email',                value: 'ntcp.mohfw@gmail.com' },
          { label: 'SEEDS Organisation',        value: 'seedsdelhi@gmail.com' },
          { label: 'NTCP Address',              value: 'Nirman Bhawan, New Delhi – 110011' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', borderBottom: '1px solid var(--tf-border)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tf-text-muted)', minWidth: '160px', flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--tf-text-main)' }}>{r.value}</span>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--tf-text-muted)', margin: 0 }}>
        ToFEI Monitoring System · Technical support by devit · © {new Date().getFullYear()} AP Dept. of Health
      </p>
    </div>
  );
}
