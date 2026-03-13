import { useState } from 'react';
import { Search, Download, Eye, Trash2, FileText, CheckCircle, XCircle, Clock, Filter, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColor = (s) => s === 'compliant' ? '#22c55e' : s === 'non-compliant' ? '#f87171' : '#f59e0b';
const statusLabel = (s) => s === 'compliant' ? 'Compliant' : s === 'non-compliant' ? 'Non-Compliant' : 'Pending';

function DetailModal({ report, onClose, onStatusUpdate, onDelete }) {
  if (!report) return null;
  const score = report.totalScore || 0;
  const guidelineLabels = [
    'Tobacco-Free Signage (inside)', 'Boundary Signage (outside)', 'No tobacco evidence on premises',
    'Harms awareness posters', 'Tobacco control activities', 'Tobacco Monitors nominaed',
    'Code of conduct updated', '100-yard marking', 'No shops within 100 yards'
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-border)', borderRadius: '0.875rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--tf-surface)', borderBottom: '1px solid var(--tf-border)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--tf-text-main)' }}>{report.schoolName || 'Unknown School'}</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--tf-text-muted)' }}>{report.district} · {report.block || '—'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tf-text-muted)', cursor: 'pointer' }}><XCircle size={22} /></button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Score */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '0.625rem', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.25rem' }}>/ 95   Total Score</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', background: `${statusColor(report.complianceStatus)}10`, border: `1px solid ${statusColor(report.complianceStatus)}30`, borderRadius: '0.625rem', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: statusColor(report.complianceStatus), lineHeight: 1.2 }}>{statusLabel(report.complianceStatus)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.25rem' }}>Compliance Status</div>
            </div>
          </div>

          {/* Details grid */}
          {[['Reporting Officer', report.reportingOfficer], ['Contact', report.contactNo], ['School UDISE', report.udiseCode], ['Submitted', report.createdAt?.toDate?.().toLocaleString('en-IN') || 'N/A']].map(([k, v]) => v && (
            <div key={k} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', background: 'var(--tf-surface-2)', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--tf-text-muted)', fontWeight: 700, minWidth: '120px', flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--tf-text-main)' }}>{v}</span>
            </div>
          ))}

          {/* Guideline scores */}
          {report.guidelineScores?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.625rem' }}>Guideline Scores</p>
              {report.guidelineScores.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--tf-border)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--tf-text-main)', flex: 1 }}>Activity {i + 1}: {guidelineLabels[i]}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {report.photos.map((url, i) => {
                  const annotated = report.annotatedPhotos?.[i];
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--tf-border)', background: 'var(--tf-surface-2)' }}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                        </a>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 6px', background: 'rgba(0,0,0,0.7)', fontSize: '0.55rem', color: '#fff', textAlign: 'center' }}>Original</div>
                      </div>
                      
                      {annotated && (
                        <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #22c55e', background: 'var(--tf-surface-2)' }}>
                          <a href={annotated} target="_blank" rel="noopener noreferrer">
                            <img src={annotated} alt={`AI Detection ${i + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--tf-border)' }}>
            <button onClick={() => onStatusUpdate(report.id, report.complianceStatus)} className="tf-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <CheckCircle size={15} /> Update Status
            </button>
            <button onClick={() => { onDelete(report.id); onClose(); }} className="tf-btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToFEITrackerView({ reports, onDelete, onStatusUpdate }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [selected, setSelected] = useState(null);

  const districts = ['All', ...new Set(reports.map(r => r.district).filter(Boolean))];

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.schoolName || '').toLowerCase().includes(q) || (r.district || '').toLowerCase().includes(q) || (r.reportingOfficer || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || r.complianceStatus === filterStatus;
    const matchDistrict = filterDistrict === 'All' || r.district === filterDistrict;
    return matchSearch && matchStatus && matchDistrict;
  });

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'School Name': r.schoolName, 
      'UDISE Code': r.udiseCode || '—',
      'District': r.district, 
      'Block/Mandal': r.block || '—',
      'Reporting Officer': r.reportingOfficer, 
      'Contact No': r.contactNo || '—',
      'Final Score': r.totalScore, 
      'Compliance Status': statusLabel(r.complianceStatus),
      'Submission Date': r.createdAt?.toDate?.().toLocaleDateString('en-IN') || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ToFEI Data');
    XLSX.writeFile(wb, `ToFEI_Detailed_Report_${new Date().toLocaleDateString('en-IN')}.xlsx`);
  };

  const exportPDF = () => {
    const doc2 = new jsPDF('landscape');
    const pw = doc2.internal.pageSize.getWidth();
    
    // Header
    doc2.setFillColor(6, 13, 10);
    doc2.rect(0, 0, pw, 35, 'F');
    doc2.setTextColor(34, 197, 94);
    doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.text('ToFEI Compliance Audit Report', 20, 22);
    
    doc2.setTextColor(180, 200, 190); doc2.setFontSize(9);
    doc2.text(`NTCP ANDHRA PRADESH | Generated: ${new Date().toLocaleString('en-IN')}`, pw - 20, 22, { align: 'right' });

    autoTable(doc2, {
      startY: 42,
      head: [['School', 'UDISE', 'District', 'Mandal', 'Score', 'Status', 'Officer', 'Contact', 'Date']],
      body: filtered.map(r => [
        r.schoolName || '—', 
        r.udiseCode || '—',
        r.district || '—', 
        r.block || '—',
        `${r.totalScore}/95`, 
        statusLabel(r.complianceStatus), 
        r.reportingOfficer || '—', 
        r.contactNo || '—',
        r.createdAt?.toDate?.().toLocaleDateString('en-IN') || 'N/A'
      ]),
      headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      theme: 'striped',
    });
    
    doc2.save(`ToFEI_Compliance_Report_${Date.now()}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls */}
      <div className="tf-card" style={{ padding: '0.875rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 180px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tf-text-muted)' }} />
          <input className="tf-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school, district, officer…" style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select className="tf-input" style={{ flex: '0 0 auto', width: 'auto', minWidth: '130px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="compliant">Compliant</option>
          <option value="non-compliant">Non-Compliant</option>
          <option value="pending">Pending</option>
        </select>
        <select className="tf-input" style={{ flex: '0 0 auto', width: 'auto', minWidth: '130px' }} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button onClick={exportExcel} className="tf-btn-ghost"><Download size={14} /> Excel</button>
          <button onClick={exportPDF} className="tf-btn-primary"><FileText size={14} /> PDF</button>
        </div>
      </div>

      {/* Table */}
      <div className="tf-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--tf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--tf-text-main)' }}>School Reports ({filtered.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tf-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>School Name</th>
                <th>District / Block</th>
                <th>Score</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--tf-text-muted)' }}>No reports found. Submit a scorecard to get started.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.schoolName || '—'}</td>
                  <td style={{ color: 'var(--tf-text-muted)', fontSize: '0.8rem' }}>{r.district || '—'}{r.block ? ` / ${r.block}` : ''}</td>
                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: (r.totalScore || 0) >= 70 ? '#22c55e' : (r.totalScore || 0) >= 50 ? '#f59e0b' : '#f87171' }}>
                      {r.totalScore || 0}/95
                    </span>
                  </td>
                  <td>
                    <span className="tf-badge" style={{ background: `${statusColor(r.complianceStatus)}15`, color: statusColor(r.complianceStatus), border: `1px solid ${statusColor(r.complianceStatus)}30` }}>
                      {statusLabel(r.complianceStatus)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--tf-text-muted)' }}>{r.reportingOfficer || '—'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{r.createdAt?.toDate?.().toLocaleDateString('en-IN') || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button onClick={() => setSelected(r)} className="tf-btn-ghost" style={{ padding: '0.375rem', border: 'none' }}><Eye size={15} /></button>
                      <button onClick={() => onDelete(r.id)} className="tf-btn-danger" style={{ padding: '0.375rem' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal report={selected} onClose={() => setSelected(null)} onStatusUpdate={onStatusUpdate} onDelete={onDelete} />
    </div>
  );
}
