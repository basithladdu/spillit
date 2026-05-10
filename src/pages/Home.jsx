import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Heart, LocateFixed, Flame, Ghost, Map as MapIcon, ChevronUp } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import MemoryCard from './MemoryCard';
import SpillMemoryModal from '../components/SpillMemoryModal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const MAP_STYLE    = 'mapbox://styles/mapbox/streets-v12';

const TYPE_COLORS = {
  Moment: '#8B5CF6',
  Crush:  '#F472B6',
  Secret: '#374151',
  Laugh:  '#D97706',
};

/* ── Map pin SVG ── */
const MemoryPin = ({ memory, onClick, isSelected }) => {
  const color = TYPE_COLORS[memory.type] || '#8B5CF6';
  return (
    <button onClick={onClick} aria-label="memory pin"
      style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'block' }}>
      <div style={{ position:'relative', width:40, height:52 }}>
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-60%)',
          width: isSelected ? 52 : 42, height: isSelected ? 52 : 42,
          borderRadius:'50%', background: color,
          opacity: isSelected ? 0.25 : 0.15,
        }} />
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none"
          style={{ display:'block', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
          <path d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z" fill="white" />
          <path d="M20 3C11.16 3 4 10.16 4 19C4 30 20 49 20 49C20 49 36 30 36 19C36 10.16 28.84 3 20 3Z" fill={color} />
          <path d="M20 1C10.06 1 2 9.06 2 19C2 32 20 51 20 51C20 51 38 32 38 19C38 9.06 29.94 1 20 1Z"
            fill="none" stroke="#1E293B" strokeWidth="2" />
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.95" />
          <circle cx="20" cy="18" r="4" fill={color} opacity="0.6" />
        </svg>
      </div>
    </button>
  );
};

/* ── Onboarding ── */
const TOUR_STEPS = [
  { title: 'Welcome to Spill It',  content: 'The world is a map of memories. Share yours anonymously.',    action: 'Start' },
  { title: 'Spill a Memory',       content: 'Take a photo of where it happened and share what you felt.',  action: 'Next' },
  { title: 'Explore the Map',      content: 'Tap any pin to read what happened there.',                    action: 'Next' },
  { title: 'Start Spilling',       content: 'Ready to leave your mark? Spill your first memory now.',      action: 'Spill Something' },
];

const OnboardingTour = ({ onComplete, setShowForm }) => {
  const [step, setStep] = useState(0);
  const cur = TOUR_STEPS[step];
  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) { setStep(s => s + 1); return; }
    onComplete();
    if (cur.action === 'Spill Something') setShowForm(true);
  };
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onComplete} />
      <motion.div key={step}
        initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}
        style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:16 }}
        className="p-8 shadow-[4px_4px_0_#1E293B] w-full max-w-sm relative z-10 text-center"
      >
        <h3 className="heading-font text-2xl font-bold text-[#1E293B] mb-3">{cur.title}</h3>
        <p className="text-[#64748B] text-sm leading-relaxed mb-6">{cur.content}</p>
        <button onClick={handleNext}
          className="w-full bg-[#8B5CF6] text-white border-2 border-[#1E293B] rounded-full py-3.5 font-bold heading-font uppercase tracking-widest text-sm shadow-[4px_4px_0_#1E293B]">
          {cur.action}
        </button>
        <button onClick={onComplete} className="mt-3 text-xs text-[#64748B] py-2 block w-full">Skip</button>
        <div className="flex justify-center gap-2 mt-4">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#8B5CF6]' : 'w-2 bg-[#E2E8F0]'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ── Main ── */
function Home() {
  const [allMemories, setAllMemories] = useState({});
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showTour,    setShowTour]    = useState(false);
  const [showFeed,    setShowFeed]    = useState(false);
  const [viewState,   setViewState]   = useState({ latitude:25, longitude:15, zoom:2 });

  useEffect(() => {
    if (!localStorage.getItem('spillit_onboarded')) setShowTour(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('memories').select('*')
        .order('created_at', { ascending:false }).limit(100);
      if (data) { const m={}; data.forEach(d => { m[d.id]=d; }); setAllMemories(m); }
    };
    load();
    const ch = supabase.channel('home:memories')
      .on('postgres_changes', { event:'*', table:'memories', schema:'public' }, p => {
        if (p.eventType === 'DELETE') {
          setAllMemories(prev => { const n={...prev}; delete n[p.old.id]; return n; });
        } else {
          setAllMemories(prev => ({ ...prev, [p.new.id]: p.new }));
        }
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const memories = useMemo(() =>
    Object.values(allMemories).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)),
    [allMemories]);

  const flyToUser = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(p => {
      setViewState(v => ({
        ...v,
        latitude:  p.coords.latitude,
        longitude: p.coords.longitude,
        zoom: Math.min(Math.max(v.zoom, 10), 12),
      }));
    }, ()=>{}, { enableHighAccuracy:true, timeout:8000 });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#08080c]">

      {/* ── Desktop hero panel ── */}
      <div className="pointer-events-none hidden lg:flex flex-col gap-4 absolute top-20 left-6 z-[850] max-w-xs">
        <div style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:16, boxShadow:'4px 4px 0 #1E293B' }} className="px-6 py-6">
          <div style={{ background:'#F1F5F9', border:'2px solid #1E293B', borderRadius:999, boxShadow:'2px 2px 0 #1E293B', display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', marginBottom:16 }}>
            <Flame size={11} color="#8B5CF6" strokeWidth={3} />
            <span className="heading-font" style={{ fontSize:10, fontWeight:900, letterSpacing:'0.15em', color:'#1E293B', textTransform:'uppercase' }}>Spill It</span>
          </div>
          <h1 className="heading-font" style={{ fontSize:28, fontWeight:900, lineHeight:1.2, color:'#1E293B', marginBottom:8 }}>
            Every place holds a <span style={{ color:'#8B5CF6', fontStyle:'italic' }}>secret.</span>
          </h1>
          <p style={{ color:'#64748B', fontSize:12, lineHeight:1.6 }}>Drop a photo. Pin the spot. Stay anonymous.</p>
          {memories.length > 0 && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:'2px solid #E2E8F0', display:'flex', gap:24 }}>
              <div>
                <p className="heading-font" style={{ fontSize:24, fontWeight:900, color:'#1E293B' }}>{memories.length}</p>
                <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em' }}>Spills</p>
              </div>
              <div style={{ width:1, background:'#E2E8F0' }} />
              <div>
                <p className="heading-font" style={{ fontSize:24, fontWeight:900, color:'#1E293B' }}>
                  {new Set(memories.map(m => m.address?.split(',').pop()?.trim()).filter(Boolean)).size}
                </p>
                <p style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em' }}>Cities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop live feed ── */}
      <div className="hidden xl:flex pointer-events-none absolute top-20 bottom-6 right-6 z-[850] w-72 flex-col">
        <div style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:16, boxShadow:'4px 4px 0 #1E293B' }} className="h-full flex flex-col overflow-hidden">
          <div style={{ padding:'16px 20px', borderBottom:'2px solid #E2E8F0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#34D399', display:'inline-block' }} />
              <p className="heading-font" style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', color:'#1E293B' }}>Live Spills</p>
            </div>
            <p style={{ fontSize:10, color:'#64748B' }}>Real stories, real places.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
                <Ghost size={32} color="#94A3B8" strokeWidth={1.5} />
                <p style={{ fontSize:12, color:'#64748B' }}>No spills yet. Be first!</p>
              </div>
            ) : memories.slice(0, 20).map(m => (
              <Link key={m.id} to={`/memory/${m.id}`} className="block pointer-events-auto group">
                <div style={{ border:'2px solid #E2E8F0', borderRadius:12, overflow:'hidden', background:'#F8FAFC', transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#1E293B'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#E2E8F0'}>
                  {m.image_url && (
                    <div style={{ height:96, overflow:'hidden', borderBottom:'1px solid #E2E8F0' }}>
                      <img src={getOptimizedImageUrl(m.image_url, 300)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-3">
                    <p style={{ fontSize:11, color:'#1E293B', fontStyle:'italic', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:6 }}>
                      "{m.caption || 'A silent memory...'}"
                    </p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{m.type || 'Moment'}</span>
                      <span style={{ fontSize:9, color:'#F472B6', display:'flex', alignItems:'center', gap:3 }}>
                        <Heart size={9} fill="#F472B6" /> {m.upvotes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── THE MAP ── */}
      <div id="map-root" className="absolute inset-0">
        <Map {...viewState} onMove={e => setViewState(e.viewState)}
          mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width:'100%', height:'100%' }}>
          <NavigationControl position="bottom-left" showCompass={false} />

          {memories.map(m => {
            const lat = Number(m.lat), lng = Number(m.lng);
            if (isNaN(lat) || isNaN(lng) || (lat===0 && lng===0)) return null;
            return (
              <Marker key={m.id} latitude={lat} longitude={lng} anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedMemory(m); }}>
                <MemoryPin memory={m} isSelected={selectedMemory?.id===m.id} onClick={() => setSelectedMemory(m)} />
              </Marker>
            );
          })}

          {selectedMemory && (
            <Popup latitude={Number(selectedMemory.lat)} longitude={Number(selectedMemory.lng)}
              anchor="bottom" offset={48} onClose={() => setSelectedMemory(null)}
              closeButton={false} maxWidth="260px">
              <div style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:12, overflow:'hidden', boxShadow:'4px 4px 0 #1E293B' }}>
                {selectedMemory.image_url && (
                  <img src={getOptimizedImageUrl(selectedMemory.image_url, 300)}
                    style={{ width:'100%', height:112, objectFit:'cover', borderBottom:'2px solid #1E293B', display:'block' }} alt="memory" />
                )}
                <div className="p-3">
                  <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#64748B', display:'block', marginBottom:4 }}>
                    {selectedMemory.type || 'Moment'}
                  </span>
                  <p style={{ fontSize:12, color:'#1E293B', fontStyle:'italic', marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    "{selectedMemory.caption || ''}"
                  </p>
                  <Link to={`/memory/${selectedMemory.id}`}
                    style={{ display:'block', textAlign:'center', padding:'6px 0', borderRadius:999, background:'#8B5CF6', color:'#fff', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', border:'2px solid #1E293B', boxShadow:'2px 2px 0 #1E293B' }}>
                    See Memory
                  </Link>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden absolute top-16 left-0 right-0 z-[840] px-4 pt-2 flex items-center justify-between gap-3 pointer-events-none">
        <div style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:999, boxShadow:'2px 2px 0 #1E293B', display:'flex', alignItems:'center', gap:8, padding:'6px 14px' }}
          className="pointer-events-auto">
          <Flame size={12} color="#8B5CF6" strokeWidth={3} />
          <span className="heading-font" style={{ fontSize:12, fontWeight:900, color:'#1E293B', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {memories.length} Spills
          </span>
        </div>
        <button onClick={() => setShowFeed(true)}
          style={{ background:'#fff', border:'2px solid #1E293B', borderRadius:999, boxShadow:'2px 2px 0 #1E293B', display:'flex', alignItems:'center', gap:8, padding:'6px 14px' }}
          className="pointer-events-auto">
          <MapIcon size={12} color="#1E293B" strokeWidth={2.5} />
          <span className="heading-font" style={{ fontSize:12, fontWeight:900, color:'#1E293B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Live Feed</span>
        </button>
      </div>

      {/* ── Mobile bottom action bar ── */}
      <div className="lg:hidden fixed inset-x-0 z-[900] flex items-center gap-3 px-4 py-3 pointer-events-auto"
        style={{ bottom:0, paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 12px)', background:'#fff', borderTop:'2px solid #1E293B' }}>
        <button onClick={flyToUser} aria-label="Locate me"
          style={{ width:56, height:56, borderRadius:'50%', background:'#F1F5F9', border:'2px solid #1E293B', boxShadow:'2px 2px 0 #1E293B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <LocateFixed size={22} color="#8B5CF6" strokeWidth={2.5} />
        </button>
        <button onClick={() => setShowForm(true)}
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 0', background:'#8B5CF6', color:'#fff', borderRadius:999, border:'2px solid #1E293B', boxShadow:'3px 3px 0 #1E293B', fontFamily:'inherit' }}
          className="heading-font font-bold uppercase tracking-widest text-base">
          <Flame size={22} strokeWidth={2.5} />
          Spill Something
        </button>
      </div>

      {/* ── Desktop floating HUD ── */}
      <div className="hidden lg:flex fixed z-[900] flex-col items-end gap-3 pointer-events-auto"
        style={{ bottom:'calc(env(safe-area-inset-bottom, 0px) + 24px)', right:24 }}>
        <button onClick={flyToUser} aria-label="Locate me"
          style={{ width:48, height:48, borderRadius:'50%', background:'#fff', border:'2px solid #1E293B', boxShadow:'3px 3px 0 #1E293B', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LocateFixed size={20} color="#8B5CF6" strokeWidth={2.5} />
        </button>
        <button onClick={() => setShowForm(true)}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 28px', background:'#8B5CF6', color:'#fff', borderRadius:999, border:'2px solid #1E293B', boxShadow:'4px 4px 0 #1E293B' }}
          className="heading-font font-bold uppercase tracking-widest text-sm">
          <Flame size={18} strokeWidth={2.5} />
          Spill Something
        </button>
      </div>

      {/* ── Mobile live feed sheet ── */}
      <AnimatePresence>
        {showFeed && (
          <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:28, stiffness:320 }}
            style={{ position:'fixed', insetInline:0, bottom:'calc(env(safe-area-inset-bottom, 0px) + 76px)', maxHeight:'60dvh', background:'#fff', borderTop:'2px solid #1E293B', borderRadius:'16px 16px 0 0', boxShadow:'0 -4px 0 #1E293B', zIndex:950 }}
            className="xl:hidden flex flex-col">
            <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px' }}>
              <div style={{ width:40, height:4, borderRadius:2, background:'#E2E8F0' }} />
            </div>
            <div style={{ padding:'8px 16px 10px', borderBottom:'2px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#34D399', display:'inline-block' }} />
                <p className="heading-font" style={{ fontSize:13, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', color:'#1E293B' }}>Live Spills</p>
              </div>
              <button onClick={() => setShowFeed(false)}
                style={{ width:32, height:32, borderRadius:'50%', border:'2px solid #1E293B', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChevronUp size={14} color="#1E293B" strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar flex-1">
              {memories.length === 0 ? (
                <div className="text-center py-12">
                  <Ghost size={32} color="#94A3B8" className="mx-auto mb-3" strokeWidth={1.5} />
                  <p style={{ color:'#64748B', fontSize:14 }}>No spills yet. Be the first!</p>
                </div>
              ) : memories.slice(0, 30).map(m => (
                <Link key={m.id} to={`/memory/${m.id}`} onClick={() => setShowFeed(false)} className="block group">
                  <div style={{ border:'2px solid #E2E8F0', borderRadius:12, display:'flex', gap:12, padding:12, background:'#F8FAFC' }}>
                    {m.image_url && (
                      <img src={getOptimizedImageUrl(m.image_url, 120)} alt=""
                        style={{ width:64, height:64, borderRadius:8, objectFit:'cover', border:'2px solid #E2E8F0', flexShrink:0 }} />
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#64748B' }}>{m.type || 'Moment'}</span>
                      <p style={{ fontSize:12, color:'#1E293B', fontStyle:'italic', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginTop:2 }}>"{m.caption || 'A silent memory...'}"</p>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, fontSize:9, color:'#F472B6' }}>
                        <Heart size={9} fill="#F472B6" /> {m.upvotes || 0}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTour && (
          <OnboardingTour
            onComplete={() => { setShowTour(false); localStorage.setItem('spillit_onboarded','1'); }}
            setShowForm={setShowForm}
          />
        )}
      </AnimatePresence>

      <SpillMemoryModal show={showForm} onClose={() => setShowForm(false)}
        onSuccess={d => { setSummaryData(d); setShowSummary(true); }} />
      {showSummary && <MemoryCard summaryData={summaryData} setShowSummary={setShowSummary} />}

      <style>{`
        .mapboxgl-popup-content { background:transparent !important; box-shadow:none !important; padding:0 !important; border:none !important; }
        .mapboxgl-popup-tip { border-top-color:#1E293B !important; }
      `}</style>
    </div>
  );
}

export default Home;
