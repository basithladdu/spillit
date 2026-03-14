/**
 * ToFEIScorecardFormatView – read-only reference view for STCC/DTCC officers.
 * Shows the exact criteria schools are evaluated on with max points,
 * mandatory flags, and what each checklist item expects. No submission allowed.
 *
 * Source: MoHFW ToFEI Self-Evaluation Scorecard (revised 2019)
 * Max score: 80 pts (10+10+10+9+9+9+9+7+7).
 * Threshold: ≥ 90% (i.e. ≥ 72/80) → ToFEI Certificate eligible.
 */

import { AlertTriangle, FileText, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

const GUIDELINES = [
  {
    num: 1, mandatory: true, max: 10,
    title: 'Tobacco-Free Area Signage (inside premises)',
    desc: 'Display "Tobacco Free Premise" & "No Smoking Area" boards at prominent places on all floors. Min 60×45 cm. Name of Tobacco Monitor must be mentioned.',
    checklist: [
      'Signage placed at all prominent indoor locations',
      'Tobacco Monitor name & contact displayed',
    ]
  },
  {
    num: 2, mandatory: true, max: 10,
    title: 'Tobacco-Free Educational Institution Signage (boundary wall)',
    desc: 'TOFEI signage placed or painted at the outer boundary wall near entrance gate(s). Min 60×45 cm. Name of Reporting Officer / Monitor mentioned.',
    checklist: [
      'Signage placed at boundary wall / entrance gate',
      'Officer name & contact on boundary signage',
    ]
  },
  {
    num: 3, mandatory: true, max: 10,
    title: 'No evidence of tobacco use inside premises',
    desc: 'No cigarette/beedi butts, gutka pouches, pan masala wrappers, or spitting spots found inside the campus.',
    checklist: [
      'No butts / pouches / wrappers found',
      'No spitting spots observed',
    ]
  },
  {
    num: 4, mandatory: false, max: 9,
    title: 'Awareness material on harms of tobacco displayed',
    desc: 'Posters, charts, or clip boards about harms of tobacco use displayed at prominent places accessible to maximum persons.',
    checklist: [
      'Awareness posters displayed at prominent locations',
    ]
  },
  {
    num: 5, mandatory: false, max: 9,
    title: 'At least one tobacco control activity in last 6 months',
    desc: 'Anti-tobacco pledge, poster/essay/quiz competition, street plays, rallies, or expert lectures organised within last 6 months.',
    checklist: [
      'At least one activity conducted in last 6 months',
      'Photographs taken and available as record',
    ]
  },
  {
    num: 6, mandatory: false, max: 9,
    title: 'Tobacco Monitors nominated and mentioned on signages',
    desc: 'Tobacco Monitor nominated among staff/teachers (non-tobacco user). Student monitors from class 9–12. Details visible on all signages.',
    checklist: [
      'Teacher Tobacco Monitor nominated via official order',
      'Student Tobacco Monitors nominated (class 9–12)',
      'Monitor details on all displayed signages',
    ]
  },
  {
    num: 7, mandatory: false, max: 9,
    title: '"No Tobacco Use" policy in school code of conduct',
    desc: 'Code of conduct includes no tobacco use inside campus, vehicles and events. Sponsorship/prizes from tobacco companies prohibited.',
    checklist: [
      'Code of conduct includes no-tobacco policy',
      'Tobacco company sponsorship explicitly excluded',
    ]
  },
  {
    num: 8, mandatory: false, max: 7,
    title: 'Marking of 100-yard zone from boundary wall',
    desc: 'Red/yellow/blue line painted on road OR boards placed marking 100 yards from the outer boundary wall in all directions.',
    checklist: [
      '100-yard area marked with paint line or boards',
    ]
  },
  {
    num: 9, mandatory: true, max: 7,
    title: 'No shops selling tobacco within 100 yards',
    desc: 'No shop within 100-yard radius sells any tobacco product. Violators reported to local police / anti-tobacco squad / Gram Panchayat.',
    checklist: [
      'No tobacco shops within 100-yard radius',
      'Shopkeepers notified of 100-yard prohibition',
    ]
  },
];

const TOTAL_MAX = GUIDELINES.reduce((a, g) => a + g.max, 0); // 80

export default function ToFEIScorecardFormatView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div className="tf-card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(0,0,0,0) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(22,163,74,0.15)', color: '#22c55e', padding: '0.2rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Read-Only</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--tf-text-muted)' }}>For Reference — Schools fill this form</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--tf-text-main)' }}>
              ToFEI School Self-Evaluation Scorecard
            </h2>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--tf-text-muted)' }}>
              COTPA 2003 · Section 6(b) · National Tobacco Control Programme – Andhra Pradesh
            </p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{TOTAL_MAX}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', marginTop: '0.2rem' }}>Total Points</div>
          </div>
        </div>

        {/* Score thresholds */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: '≥ 90% — ToFEI Compliant (Award Eligible)', color: '#22c55e', bg: 'rgba(22,163,74,0.1)' },
            { label: '60–89% — Partially Compliant',               color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: '< 60% — Non-Compliant',                      color: '#f87171', bg: 'rgba(239,68,68,0.1)'  },
          ].map(({ label, color, bg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: bg, border: `1px solid ${color}40`, padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ margin: '1rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)', borderTop: '1px solid var(--tf-border)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <span>All 4 <strong style={{ color: '#f59e0b' }}>Mandatory</strong> criteria must be fully satisfied to be eligible for ToFEI status — regardless of total points.</span>
        </div>
      </div>

      {/* Criteria cards */}
      {GUIDELINES.map((g) => (
        <div key={g.num} className="tf-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${g.mandatory ? '#f59e0b' : 'rgba(22,163,74,0.3)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#22c55e', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  Activity {g.num}
                </span>
                {g.mandatory && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={10} /> MANDATORY
                  </span>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>Max {g.max} pts</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--tf-text-main)', lineHeight: 1.35 }}>
                {g.title}
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--tf-text-muted)', lineHeight: 1.6 }}>
                {g.desc}
              </p>

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <p style={{ margin: '0 0 0.375rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Evaluation Checklist
                </p>
                {g.checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tf-border)', borderRadius: '0.4rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--tf-border)', flexShrink: 0, background: 'var(--tf-bg)' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--tf-text-muted)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Points badge */}
            <div style={{ textAlign: 'center', background: g.mandatory ? 'rgba(245,158,11,0.08)' : 'rgba(22,163,74,0.06)', border: `1px solid ${g.mandatory ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.15)'}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', minWidth: '64px', flexShrink: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: g.mandatory ? '#f59e0b' : '#22c55e', lineHeight: 1 }}>{g.max}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tf-text-muted)', marginTop: '0.2rem' }}>pts</div>
            </div>
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '0.75rem', padding: '1rem 1.25rem', fontSize: '0.78rem', color: 'var(--tf-text-muted)', lineHeight: 1.7, display: 'flex', gap: '0.875rem' }}>
        <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <div>
          <strong style={{ color: 'var(--tf-text-main)' }}>For monitoring officers:</strong> Schools fill this form via their School Portal. Each submission is GPS-tagged, AI-scanned for evidence, and saved to Firebase in real time. You can view all submissions in the <strong style={{ color: '#22c55e' }}>Reports Tracker</strong> and the ranked list in <strong style={{ color: '#22c55e' }}>School Rankings</strong>.
        </div>
      </div>

    </div>
  );
}
