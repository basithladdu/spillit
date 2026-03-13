import { ExternalLink, Twitter, MapPin, Mail, Phone, Linkedin } from 'lucide-react';

const ToFEIAboutView = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--tf-text-main)', margin: 0 }}>About ToFEI Monitoring System</h1>
        <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Tobacco-Free Educational Institutions (ToFEI) - COTPA 2003 Monitoring
        </p>
      </div>

      {/* Mission Section */}
      <div className="tf-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '1rem' }}>Our Mission</h2>
        <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          The ToFEI Monitoring System is an official digital initiative by the Department of Health, Medical & Family Welfare, 
          Government of Andhra Pradesh. It is designed to ensure that all educational institutions strictly adhere to the 
          guidelines of the Cigarettes and Other Tobacco Products Act (COTPA) 2003, specifically Section 6(b), to provide a safe, 
          tobacco-free environment for youth.
        </p>
      </div>

      {/* AI-Powered Detection */}
      <div className="tf-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '1rem' }}>AI-Powered Compliance Check</h2>
        <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          This platform utilizes advanced AI object detection (via Roboflow) to automatically verify photographic evidence 
          submitted by reporting officers. This ensures high accuracy and reduces manual auditing efforts.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--tf-surface-2)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
            <h3 style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Tobacco Detection</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0 }}>AI automatically scans for cigarette butts, packets, and gutka sachets.</p>
          </div>
          <div style={{ background: 'var(--tf-surface-2)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
            <h3 style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Signage Verification</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0 }}>Validates the presence of mandatory ToFEI boundary and indoor signboards.</p>
          </div>
          <div style={{ background: 'var(--tf-surface-2)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
            <h3 style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Real-time Audit</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', margin: 0 }}>Scores are tabulated instantly to generate school and district compliance leaderboards.</p>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="tf-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tf-text-main)', marginBottom: '1rem' }}>
          Powered by <span style={{ color: '#16a34a' }}>devit.</span>
        </h2>
        <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          We design, build, and scale exceptional software for startups and government initiatives.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--tf-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <a href="mailto:workwithdevit@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tf-text-muted)', textDecoration: 'none' }}>
                <Mail size={16} /> workwithdevit@gmail.com
              </a>
              <a href="tel:+919553321211" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tf-text-muted)', textDecoration: 'none' }}>
                <Phone size={16} />Founder, Basith -  +91 95533 21211
              </a>
              <a href="https://wa.me/919553321211" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', textDecoration: 'none' }}>
                <Phone size={16} /> WhatsApp Support
              </a>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--tf-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Connect</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <a href="https://www.linkedin.com/in/basithladoo/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', textDecoration: 'none' }}>
                <Linkedin size={16} /> LinkedIn - Basith
              </a>
              <a href="https://www.wedevit.in/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
                <ExternalLink size={16} /> Visit wedevit.in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--tf-text-muted)', padding: '1rem 0' }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} <span style={{ color: '#22c55e', fontWeight: 700 }}>devit</span>. 
          All rights reserved. | Built with ❤️ for public health & governance.
        </p>
      </div>
    </div>
  );
};

export default ToFEIAboutView;
