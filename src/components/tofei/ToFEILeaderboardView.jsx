import { useMemo } from 'react';
import { Award, TrendingUp, School, CheckCircle, AlertCircle, Timer, Trophy } from 'lucide-react';

const GUIDELINE_LABELS = [
  'Indoor signage','Boundary signage','No tobacco evidence',
  'Awareness materials','Control activities','Monitors nominated',
  'Code of conduct','100-yard marking','No shops within 100y'
];

export default function ToFEILeaderboardView({ reports }) {
  const schoolData = useMemo(() => {
    const map = {};
    reports.forEach(r => {
      const key = r.schoolName || 'Unknown';
      if (!map[key]) {
        map[key] = { name: key, district: r.district || '—', submissions: 0, bestScore: 0, totalScore: 0, compliant: 0, latestStatus: 'pending' };
      }
      const s = map[key];
      s.submissions++;
      s.totalScore += r.totalScore || 0;
      if ((r.totalScore || 0) > s.bestScore) s.bestScore = r.totalScore || 0;
      if (r.complianceStatus === 'compliant') s.compliant++;
      s.latestStatus = r.complianceStatus;
    });
    return Object.values(map)
      .map(s => ({ ...s, avgScore: s.submissions > 0 ? Math.round(s.totalScore / s.submissions) : 0 }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }, [reports]);

  const districtData = useMemo(() => {
    const map = {};
    reports.forEach(r => {
      const d = r.district || 'Unknown';
      if (!map[d]) map[d] = { district: d, total: 0, compliant: 0, totalScore: 0 };
      map[d].total++;
      if (r.complianceStatus === 'compliant') map[d].compliant++;
      map[d].totalScore += r.totalScore || 0;
    });
    return Object.values(map)
      .map(d => ({ ...d, rate: d.total > 0 ? Math.round(d.compliant / d.total * 100) : 0, avgScore: d.total > 0 ? Math.round(d.totalScore / d.total) : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [reports]);

  const rankBadge = (i) => {
    if (i === 0) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: <Trophy size={16} /> };
    if (i === 1) return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', icon: <Award size={16} /> };
    if (i === 2) return { bg: 'rgba(180,83,9,0.15)', color: '#b45309', icon: <Award size={16} /> };
    return { bg: 'rgba(255,255,255,0.06)', color: 'var(--tf-text-muted)', icon: <span style={{fontSize: '0.75rem', fontWeight: 800}}>{i + 1}</span> };
  };

  const statusColor = (s) => s === 'compliant' ? '#22c55e' : s === 'non-compliant' ? '#f87171' : '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* School Rankings */}
      <div className="tf-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--tf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 800, color: 'var(--tf-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#f59e0b" /> School Compliance Rankings
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>Ranked by best ToFEI self-evaluation score</p>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e', border: '1px solid rgba(22,163,74,0.3)', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(22,163,74,0.08)' }}>LIVE AUDIT</span>
        </div>
        {schoolData.length === 0
          ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tf-text-muted)' }}>No data yet — submit scorecards to populate rankings.</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="tf-table" style={{ minWidth: '580px' }}>
              <thead>
                <tr>
                  <th style={{ width: '52px' }}>Rank</th>
                  <th>School</th>
                  <th style={{ textAlign: 'center' }}>Best Score</th>
                  <th style={{ textAlign: 'center' }}>Avg Score</th>
                  <th style={{ textAlign: 'center' }}>Submissions</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {schoolData.map((s, i) => {
                  const badge = rankBadge(i);
                  return (
                    <tr key={s.name} style={{ background: i === 0 ? 'rgba(245,158,11,0.04)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          {badge.icon}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--tf-text-main)', fontSize: '0.875rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--tf-text-muted)' }}>{s.district}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: s.bestScore >= 80 ? '#22c55e' : s.bestScore >= 60 ? '#f59e0b' : '#f87171' }}>
                          {s.bestScore}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)' }}>/95</span>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--tf-text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem' }}>{s.avgScore}</td>
                      <td style={{ textAlign: 'center', color: 'var(--tf-text-muted)' }}>{s.submissions}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', background: `${statusColor(s.latestStatus)}15`, padding: '0.2rem 0.5rem', borderRadius: '4px', border: `1px solid ${statusColor(s.latestStatus)}30` }}>
                          {s.latestStatus === 'compliant' ? <CheckCircle size={12} color="#22c55e" /> : s.latestStatus === 'non-compliant' ? <AlertCircle size={12} color="#f87171" /> : <Timer size={12} color="#f59e0b" />}
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor(s.latestStatus), textTransform: 'uppercase' }}>
                            {s.latestStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* District Rankings */}
      <div className="tf-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--tf-border)' }}>
          <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 800, color: 'var(--tf-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#60a5fa" /> District Compliance Index
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>Ranked by compliance rate across all schools</p>
        </div>
        {districtData.length === 0
          ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tf-text-muted)' }}>No district data yet.</div>
          : districtData.map((d, i) => (
            <div key={d.district} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: i < districtData.length - 1 ? '1px solid var(--tf-border)' : 'none' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: i < 3 ? '#22c55e' : 'var(--tf-text-muted)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)', marginBottom: '0.25rem' }}>{d.district}</div>
                <div className="tf-progress-track">
                  <div className="tf-progress-fill" style={{ width: `${d.rate}%`, background: d.rate >= 70 ? undefined : d.rate >= 50 ? 'linear-gradient(to right, #d97706, #f59e0b)' : 'linear-gradient(to right, #dc2626, #f87171)' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: d.rate >= 70 ? '#22c55e' : d.rate >= 50 ? '#f59e0b' : '#f87171', fontSize: '1rem' }}>{d.rate}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--tf-text-muted)' }}>{d.total} schools · avg {d.avgScore}pts</div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Insights */}
      {schoolData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="tf-card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Award size={16} color="#f59e0b" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Top Performer</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tf-text-main)', lineHeight: 1.6 }}>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{schoolData[0].name}</span> leads with a best score of <span style={{ color: '#f59e0b', fontWeight: 700 }}>{schoolData[0].bestScore}/95</span>.
              {schoolData[0].bestScore >= 90 && ' Eligible for ToFEI Compliance Award on World No Tobacco Day (31 May).'}
            </p>
          </div>
          <div className="tf-card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <School size={16} color="#60a5fa" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Scoring Formula</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--tf-text-muted)', lineHeight: 1.6 }}>
              Score out of 95: 4 mandatory activities (10 pts each) + 5 optional (9+9+9+7+7). Score ≥ 90 → ToFEI Compliant Award.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
