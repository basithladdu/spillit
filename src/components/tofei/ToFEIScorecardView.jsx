import { useState, useRef, useEffect } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, X, Zap, ChevronDown, ChevronRight, MapPin, School, Timer, AlertTriangle } from 'lucide-react';
import app from '../../utils/firebase';
import { AP_DISTRICTS, AP_DISTRICTS_MANDALS } from '../../utils/apDistricts';
import { drawDetectionsOnCanvas, fileToBase64 } from '../../utils/roboflow';

const db = getFirestore(app);

// ── CLOUDINARY CONFIG ────────────────────────────────────────────────────────
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/fixit/upload';
const CLOUDINARY_PRESET = 'fixit_unsigned';

// ── ROBOFLOW CONFIG ──────────────────────
// Stored securely in .env
const ROBOFLOW_API_KEY  = import.meta.env.VITE_ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL    = import.meta.env.VITE_ROBOFLOW_CIGARETTE_MODEL || 'cigarette-butt-detector-0jv4z';
const ROBOFLOW_VERSION  = import.meta.env.VITE_ROBOFLOW_CIGARETTE_VERSION || '5';
const ROBOFLOW_ENDPOINT = `https://detect.roboflow.com/${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}?api_key=${ROBOFLOW_API_KEY}&confidence=40&overlap=30`;

// ── Nine ToFEI Guidelines ────────────────────────────────────────────────────
const GUIDELINES = [
  {
    num: 1, mandatory: true, max: 10,
    title: 'Tobacco-Free Area Signage (inside premises)',
    desc: 'Display "Tobacco Free Premise" & "No Smoking Area" boards at prominent places on all floors. Min 60×45 cm. Name of Tobacco Monitor must be mentioned.',
    points: 'Mandatory (10 pts each criterion)',
    checklist: [
      { label: 'Signage placed at all prominent indoor locations', key: 'sig_indoor' },
      { label: 'Tobacco Monitor name & contact displayed', key: 'sig_monitor' },
    ]
  },
  {
    num: 2, mandatory: true, max: 10,
    title: 'Tobacco-Free Educational Institution Signage (boundary wall)',
    desc: 'TOFEI signage placed or painted at the outer boundary wall near entrance gate(s). Min 60×45 cm. Name of Reporting Officer / Monitor mentioned.',
    points: 'Mandatory (10 pts)',
    checklist: [
      { label: 'Signage placed at boundary wall / entrance gate', key: 'sig_boundary' },
      { label: 'Officer name & contact on boundary signage', key: 'sig_boundary_officer' },
    ]
  },
  {
    num: 3, mandatory: true, max: 10,
    title: 'No evidence of tobacco use inside premises',
    desc: 'No cigarette/beedi butts, gutka pouches, pan masala wrappers, or spitting spots found inside the campus.',
    points: 'Mandatory (10 pts)',
    checklist: [
      { label: 'No butts/pouches/wrappers found', key: 'clean_waste' },
      { label: 'No spitting spots observed', key: 'clean_spit' },
    ]
  },
  {
    num: 4, mandatory: false, max: 9,
    title: 'Awareness material on harms of tobacco displayed',
    desc: 'Posters, charts, or clip boards about harms of tobacco use displayed at prominent places accessible to maximum persons.',
    points: '9 pts',
    checklist: [
      { label: 'Awareness posters displayed at prominent locations', key: 'aware_posters' },
    ]
  },
  {
    num: 5, mandatory: false, max: 9,
    title: 'At least one tobacco control activity in last 6 months',
    desc: 'Anti-tobacco pledge, poster/essay/quiz competition, street plays, rallies, or expert lectures organised within last 6 months.',
    points: '9 pts',
    checklist: [
      { label: 'At least one activity conducted in last 6 months', key: 'activity_conducted' },
      { label: 'Photographs taken and available as record', key: 'activity_photos' },
    ]
  },
  {
    num: 6, mandatory: false, max: 9,
    title: 'Tobacco Monitors nominated and mentioned on signages',
    desc: 'Tobacco Monitor nominated among staff/teachers (non-tobacco user). Student monitors from class 9–12. Details visible on all signages.',
    points: '9 pts',
    checklist: [
      { label: 'Teacher Tobacco Monitor nominated via official order', key: 'monitor_teacher' },
      { label: 'Student Tobacco Monitors nominated (class 9–12)', key: 'monitor_student' },
      { label: 'Monitor details on all displayed signages', key: 'monitor_onboard' },
    ]
  },
  {
    num: 7, mandatory: false, max: 9,
    title: '"No Tobacco Use" policy in school code of conduct',
    desc: 'Code of conduct includes no tobacco use inside campus, vehicles and events. Sponsorship/prizes from tobacco companies prohibited.',
    points: '9 pts',
    checklist: [
      { label: 'Code of conduct includes no-tobacco policy', key: 'conduct_policy' },
      { label: 'Tobacco company sponsorship explicitly excluded', key: 'conduct_sponsor' },
    ]
  },
  {
    num: 8, mandatory: false, max: 7,
    title: 'Marking of 100-yard zone from boundary wall',
    desc: 'Red/yellow/blue line painted on road OR boards placed marking 100 yards from the outer boundary wall in all directions.',
    points: '7 pts',
    checklist: [
      { label: '100-yard area marked with paint line or boards', key: 'yard_marked' },
    ]
  },
  {
    num: 9, mandatory: false, max: 7,
    title: 'No shops selling tobacco within 100 yards',
    desc: 'No shop within 100-yard radius sells any tobacco product. Violators reported to local police / anti-tobacco squad / Gram Panchayat.',
    points: '7 pts',
    checklist: [
      { label: 'No tobacco shops within 100-yard radius', key: 'yards_clean' },
      { label: 'Shopkeepers notified of 100-yard prohibition', key: 'yards_notified' },
    ]
  },
];

// ── Photo Analysis via Roboflow ──────────────────────────────────────────────
async function analyzePhotoWithRoboflow(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(ROBOFLOW_ENDPOINT, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Roboflow error: ${res.status}`);
    const data = await res.json();
    return data; // { predictions: [{class, confidence, x, y, width, height},...] }
  } catch (err) {
    console.warn('Roboflow detection failed (will proceed without AI):', err.message);
    return null;
  }
}

// ── PhotoUploader Component ──────────────────────────────────────────────────
function PhotoUploader({ activityNum, onPhotosChange, onAnalyzingChange }) {
  const [previews, setPreviews]   = useState([]);   // { url, file, ai }
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef();
  const dropRef  = useRef();

  const processFiles = async (files) => {
    const arr = Array.from(files).slice(0, 5); // max 5 per activity
    setAnalyzing(true);
    if (onAnalyzingChange) onAnalyzingChange(true);
    
    // Capture GPS Metadata
    const gpsData = await new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude,
          acc: pos.coords.accuracy,
          head: pos.coords.heading,
          spd: pos.coords.speed,
          ts: pos.timestamp
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

    try {
      const results = await Promise.all(arr.map(async (file) => {
        const url = URL.createObjectURL(file);
        const ai  = await analyzePhotoWithRoboflow(file);
        return { url, file, ai, gps: gpsData };
      }));
      const next = [...previews, ...results].slice(0, 5);
      setPreviews(next);
      onPhotosChange(next);
    } finally {
      setAnalyzing(false);
      if (onAnalyzingChange) onAnalyzingChange(false);
    }
  };

  const removePhoto = (idx) => {
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    onPhotosChange(next);
  };

  const aiLabel = (ai) => {
    if (!ai) return null;
    const preds = ai.predictions || [];
    if (preds.length === 0) return { ok: true, text: 'AI: No tobacco detected', icon: <CheckCircle size={10} color="#22c55e" /> };
    const classes = [...new Set(preds.map(p => p.class))].join(', ');
    return { ok: false, text: `AI Detected: ${classes} (${preds.length} item${preds.length > 1 ? 's' : ''})`, icon: <AlertTriangle size={10} color="#f87171" /> };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Drop zone */}
      <div
        ref={dropRef}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); dropRef.current.style.borderColor = '#22c55e'; }}
        onDragLeave={() => { dropRef.current.style.borderColor = 'var(--tf-border)'; }}
        onDrop={e => { e.preventDefault(); dropRef.current.style.borderColor = 'var(--tf-border)'; processFiles(e.dataTransfer.files); }}
        className="tf-photo-dropzone"
        style={{ padding: '1rem', position: 'relative' }}
      >
        {analyzing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,13,10,0.8)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', zIndex: 1 }}>
            <Loader2 size={24} color="#22c55e" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>AI Analysing…</span>
          </div>
        )}
        <Camera size={22} color="var(--tf-text-muted)" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
        <p style={{ margin: 0, color: 'var(--tf-text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
          <strong style={{ color: '#22c55e' }}>Tap or drag photos</strong> for Activity {activityNum}<br />
          <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
            <Zap size={10} color="#f59e0b" /> Roboflow AI detects tobacco items automatically
          </span>
        </p>
        <input 
          ref={inputRef} 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={e => processFiles(e.target.files)} 
          style={{ display: 'none' }} 
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="tf-image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
          {previews.map((p, i) => {
            const label = aiLabel(p.ai);
            return (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p.url} alt={`Evidence ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.375rem', border: `1px solid ${label ? (label.ok ? 'rgba(22,163,74,0.5)' : 'rgba(239,68,68,0.5)') : 'var(--tf-border)'}` }} />
                <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><X size={10} color="#fff" /></button>
                {label && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', borderRadius: '0 0 0.375rem 0.375rem', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {label.icon}
                    <p style={{ margin: 0, fontSize: '0.55rem', color: label.ok ? '#22c55e' : '#f87171', lineHeight: 1.3 }}>{label.text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Upload photos to Cloudinary ─────────────────────────────────────────────
async function uploadToCloudinary(file, folder = 'tofei/others') {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_PRESET);
  form.append('folder', folder); // Organizes in Cloudinary folders
  
  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}

// Helper to convert dataURL to Blob for Cloudinary
const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
};

// ── Main Scorecard Form ──────────────────────────────────────────────────────
export default function ToFEIScorecardView({ userProfile }) {
  const emptyForm = () => ({
    schoolName: '', udiseCode: '', district: '', block: '',
    reportingOfficer: '', contactNo: '', evaluatorName: '', evalDate: new Date().toISOString().slice(0, 10),
  });

  const [form,         setForm]         = useState(emptyForm());
  const [scores,       setScores]       = useState(() => GUIDELINES.map(g => ({ max: g.max, scored: 0, checks: {} })));
  const [photoData,    setPhotoData]    = useState({});   // activityNum → array of {file, ai, gps}
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [aiPending,    setAiPending]    = useState(0);     // how many PhotoUploaders are currently analysing

  // Pre-populate if logged in as school
  useEffect(() => {
    if (userProfile && userProfile.role === 'school') {
      setForm(f => ({
        ...f,
        schoolName: userProfile.schoolName || '',
        udiseCode: userProfile.schoolUdise || '',
        district: userProfile.district || '',
      }));
    }
  }, [userProfile]);

  const [expandedGIdx, setExpandedGIdx] = useState(0); // Accordion state

  const totalScore     = scores.reduce((a, s) => a + (s.scored || 0), 0);
  const maxScore       = scores.reduce((a, s) => a + (s.max || 0), 0);   // 95
  const pct            = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const complianceStatus = pct >= 90 ? 'compliant' : pct >= 60 ? 'pending' : 'non-compliant';
  const isAnalyzing    = aiPending > 0;

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCheck = (gIdx, key) => {
    setScores(prev => {
      const next = [...prev];
      const g    = { ...next[gIdx] };
      const checks = { ...g.checks, [key]: !g.checks[key] };
      // Score = proportional: (checked / total_checks) * max
      const guideline   = GUIDELINES[gIdx];
      const totalChecks = guideline.checklist.length;
      const checked     = Object.values(checks).filter(Boolean).length;
      g.checks = checks;
      g.scored  = Math.round((checked / totalChecks) * guideline.max);
      next[gIdx] = g;
      return next;
    });
  };

  const handlePhotos = (gIdx, dataList) => {
    setPhotoData(p => ({ ...p, [gIdx]: dataList }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAnalyzing) {
      toast.error('AI is still analysing your photos. Please wait a few seconds and try again.');
      return;
    }
    if (!form.schoolName.trim()) { toast.error('School name is required'); return; }
    if (!form.district.trim())   { toast.error('District is required'); return; }
    setSubmitting(true);
    try {
      const canonicalUdise =
        (userProfile?.schoolUdise || userProfile?.udiseCode || '').trim() ||
        (form.udiseCode || '').trim();
      if (!canonicalUdise) { toast.error('UDISE Code is required'); return; }
      const canonicalDistrict = (form.district || '').trim();
      const canonicalBlock = (form.block || '').trim();
      const canonicalSchoolName = (form.schoolName || '').trim();

      // Upload all photos to Cloudinary with folder organization
      const allPhotoUrls     = []; // Original URLs
      const allAnnotatedUrls = []; // AI detected URLs
      const allAiPreds       = [];
      const allGps           = [];
      
      for (const [, dataList] of Object.entries(photoData)) {
        if (!dataList?.length) continue;
        
        for (const dataItem of dataList) {
          // 1. Upload Original
          const originalUrl = await uploadToCloudinary(dataItem.file, 'tofei/originals');
          allPhotoUrls.push(originalUrl);
          
          // 2. Generate and Upload Annotated (if AI detected something)
          let annotatedUrl = null;
          if (dataItem.ai?.predictions?.length > 0) {
            try {
              const base64 = await fileToBase64(dataItem.file);
              const annotatedBase64 = await drawDetectionsOnCanvas(base64, dataItem.ai.predictions);
              const annotatedBlob = dataURLToBlob(annotatedBase64);
              annotatedUrl = await uploadToCloudinary(annotatedBlob, 'tofei/detections');
              allAnnotatedUrls.push(annotatedUrl);
            } catch (err) {
              console.warn('Annotation upload failed:', err);
            }
          }
          
          // 3. Collect Stats
          if (dataItem.ai?.predictions?.length) allAiPreds.push(...dataItem.ai.predictions);
          if (dataItem.gps) allGps.push({ 
            url: originalUrl, 
            annotatedUrl: annotatedUrl, 
            ...dataItem.gps 
          });
        }
      }

      // Build report document
      const doc = {
        ...form,
        schoolName: canonicalSchoolName,
        district: canonicalDistrict,
        block: canonicalBlock,
        udiseCode: canonicalUdise,
        schoolUdise: canonicalUdise, // canonical filter key used by dashboards
        totalScore,
        maxScore,
        compliancePercentage: pct,
        complianceStatus,
        guidelineScores: scores.map((s, i) => ({ activity: i + 1, max: s.max, scored: s.scored })),
        photos: allPhotoUrls,
        annotatedPhotos: allAnnotatedUrls, // AI detected images
        aiDetections: allAiPreds,
        gpsMetadata: allGps, // <--- Add combined GPS Data 
        location: allGps.length > 0 ? { lat: allGps[0].lat, lng: allGps[0].lng } : null,
        latitude: allGps.length > 0 ? allGps[0].lat : null,
        longitude: allGps.length > 0 ? allGps[0].lng : null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'tofei_reports'), doc);
      const firstGps = allGps[0];
      const gpsText = firstGps ? ` · GPS: ${firstGps.lat.toFixed(4)}, ${firstGps.lng.toFixed(4)}` : '';
      toast.success(`✅ Scorecard submitted! Score: ${totalScore}/${maxScore} (${pct}%)${gpsText}`);
      setSubmitted(true);
      setForm(emptyForm());
      setScores(GUIDELINES.map(g => ({ max: g.max, scored: 0, checks: {} })));
      setPhotoData({});
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Submission failed. Check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    background: 'var(--tf-surface-2)', border: '1px solid var(--tf-border)',
    borderRadius: '0.5rem', padding: '0.65rem 0.875rem',
    color: 'var(--tf-text-main)', fontSize: '0.875rem',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Success Banner */}
      {submitted && (
        <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={22} color="#22c55e" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#22c55e', fontSize: '0.9rem' }}>Scorecard submitted successfully!</p>
            <p style={{ margin: 0, color: 'var(--tf-text-muted)', fontSize: '0.75rem' }}>Viewable in the Reports Tracker tab.</p>
          </div>
        </div>
      )}

      {/* Live Score bar */}
      <div className="tf-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Live Self-Evaluation Score</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pct >= 90 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#f87171', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {totalScore}<span style={{ fontSize: '1rem', color: 'var(--tf-text-muted)' }}>/{maxScore}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: pct >= 90 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: complianceStatus === 'compliant' ? '#22c55e' : complianceStatus === 'pending' ? '#f59e0b' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
              {complianceStatus === 'compliant' ? <><CheckCircle size={12} /> ToFEI Compliant</> : complianceStatus === 'pending' ? <><Timer size={12} /> Partially Compliant</> : <><AlertTriangle size={12} /> Non-Compliant</>}
            </div>
          </div>
        </div>
        <div className="tf-progress-track" style={{ height: '8px' }}>
          <div className="tf-progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'linear-gradient(to right, #16a34a, #22c55e)' : pct >= 60 ? 'linear-gradient(to right, #d97706, #f59e0b)' : 'linear-gradient(to right, #dc2626, #f87171)' }} />
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--tf-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={12} color="#f59e0b" />
          <span>Score ≥ 90 pts → ToFEI Award Eligible · Need all 4 mandatory criteria (marked MANDATORY)</span>
        </p>
      </div>

      {/* School details */}
      <div className="tf-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 800, color: 'var(--tf-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <School size={18} color="#22c55e" /> School Information
        </h3>
        <div className="tf-school-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
          {[
            { label: 'School Name *', key: 'schoolName', placeholder: 'e.g. Govt High School, Vijayawada', required: true },
            { label: 'UDISE Code',    key: 'udiseCode',  placeholder: 'e.g. 28XXXXXXXXX' },
            { label: 'Evaluation Date', key: 'evalDate', type: 'date' },
          ].map(({ label, key, placeholder, type, required }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{label}</label>
              <input type={type || 'text'} value={form[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder} required={required} style={{ ...fieldStyle, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = 'var(--tf-border)'}
              />
            </div>
          ))}

          {/* District Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>District *</label>
            <select
              required
              value={form.district}
              onChange={e => { setField('district', e.target.value); setField('block', ''); }}
              style={{ ...fieldStyle, outline: 'none', appearance: 'none', background: 'var(--tf-surface-2) url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(107, 114, 128, 1)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 0.75rem center' }}
            >
              <option value="">Select District</option>
              {AP_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Mandal Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Block/Mandal</label>
            <select
              value={form.block}
              onChange={e => setField('block', e.target.value)}
              disabled={!form.district}
              style={{ ...fieldStyle, outline: 'none', opacity: form.district ? 1 : 0.6, appearance: 'none', background: 'var(--tf-surface-2) url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(107, 114, 128, 1)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 0.75rem center' }}
            >
              <option value="">Select Mandal</option>
              {(AP_DISTRICTS_MANDALS[form.district] || []).sort().map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── 9 Guidelines - Accordion Style ── */}
      {GUIDELINES.map((g, gIdx) => {
        const isExpanded = expandedGIdx === gIdx;
        const isCompleted = scores[gIdx].scored === g.max && g.max > 0;
        return (
          <div key={g.num} className={`tf-guideline-card${isCompleted ? ' completed' : ''}${g.mandatory ? ' mandatory' : ''}`} style={{ padding: '0', overflow: 'hidden' }}>
            {/* Header / Accordion Toggle */}
            <div 
              onClick={() => setExpandedGIdx(isExpanded ? null : gIdx)}
              style={{ cursor: 'pointer', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s', userSelect: 'none' }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                  {isExpanded ? <ChevronDown size={14} color="var(--tf-text-muted)" /> : <ChevronRight size={14} color="var(--tf-text-muted)" />}
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(22,163,74,0.15)', color: '#22c55e', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Activity {g.num}</span>
                  {g.mandatory && <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(217,119,6,0.15)', color: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={10} /> MANDATORY</span>}
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--tf-text-muted)' }}>{g.points}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--tf-text-main)', lineHeight: 1.4 }}>{g.title}</h4>
              </div>
              {/* Score pill */}
              <div style={{ textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: isCompleted ? '#22c55e' : scores[gIdx].scored > 0 ? '#f59e0b' : 'var(--tf-text-muted)' }}>
                    {scores[gIdx].scored}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--tf-text-muted)' }}>/ {g.max}</div>
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ margin: '0.375rem 0 1rem', fontSize: '0.75rem', color: 'var(--tf-text-muted)', lineHeight: 1.6 }}>{g.desc}</p>

                {/* Progress */}
                <div className="tf-progress-track" style={{ marginBottom: '0.875rem' }}>
                  <div className="tf-progress-fill" style={{ width: `${g.max > 0 ? Math.round(scores[gIdx].scored / g.max * 100) : 0}%` }} />
                </div>

                {/* Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  {g.checklist.map(item => {
                    const checked = !!scores[gIdx].checks[item.key];
                    return (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: checked ? 'rgba(22,163,74,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked ? 'rgba(22,163,74,0.25)' : 'var(--tf-border)'}`, transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCheck(gIdx, item.key)} style={{ marginTop: '1px', accentColor: '#22c55e', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.8rem', color: checked ? 'var(--tf-text-main)' : 'var(--tf-text-muted)', lineHeight: 1.5 }}>{item.label}</span>
                        {checked && <CheckCircle size={14} color="#22c55e" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                      </label>
                    );
                  })}
                </div>

                {/* Photo upload */}
                <PhotoUploader
                  activityNum={g.num}
                  onPhotosChange={(dataList) => handlePhotos(gIdx, dataList)}
                  onAnalyzingChange={(flag) =>
                    setAiPending((curr) => Math.max(0, curr + (flag ? 1 : -1)))
                  }
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--tf-text-muted)'}}>
                  <MapPin size={12} color="#f59e0b" /> <span style={{fontSize: '0.6rem'}}>Photos are strictly GPS tagged & verified with real-time browser location.</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || isAnalyzing}
        className="tf-btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem', opacity: submitting || isAnalyzing ? 0.8 : 1 }}
      >
        {submitting ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading photos & saving…
          </>
        ) : isAnalyzing ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> AI is analysing photos… please wait
          </>
        ) : (
          <>
            <CheckCircle size={18} /> Submit ToFEI Scorecard — {totalScore}/{maxScore} pts ({pct}%)
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
