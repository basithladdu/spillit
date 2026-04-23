import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Camera, CircleCheck, MapPin, Ghost, User,
  Flame, Heart, Star, Laugh, Lock, CircleX, Sparkles
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../hooks/useAuth';
import imageCompression from 'browser-image-compression';
import LocationVerifier from './LocationVerifier';

const CLOUDINARY_CREDENTIALS = [{
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'fixit',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fixit_unsigned'
}];

const MEMORY_TYPES = [
  { label: 'Moment',  icon: Flame,  color: 'bg-accent   text-white', active: 'border-accent'   },
  { label: 'Crush',   icon: Heart,  color: 'bg-secondary text-white', active: 'border-secondary' },
  { label: 'Secret',  icon: Lock,   color: 'bg-foreground text-white', active: 'border-foreground' },
  { label: 'Laugh',   icon: Laugh,  color: 'bg-tertiary  text-foreground', active: 'border-tertiary'  },
];

/* ── small inline toast ── */
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -24, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -24, scale: 0.9 }}
    className="fixed top-6 left-1/2 -translate-x-1/2 z-[3500] w-full max-w-sm px-4"
  >
    <div className={`flex items-center gap-3 px-5 py-4 rounded-full border-2 shadow-pop font-bold text-sm
      ${type === 'error'
        ? 'bg-red-50 border-red-400 text-red-700'
        : 'bg-quaternary/20 border-quaternary text-foreground'
      }`}
    >
      {type === 'error'
        ? <CircleX className="w-5 h-5 text-red-500 shrink-0" />
        : <Sparkles className="w-5 h-5 text-quaternary shrink-0" />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 hover:opacity-60 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

/* ── main modal ── */
const SpillMemoryModal = ({ show, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    caption: '',
    image: null,
    lat: null,
    lng: null,
    address: '',
    anonymous: true,
    type: 'Moment',
  });

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLocationVerified = ({ lat, lng, address }) =>
    setFormData(p => ({ ...p, lat, lng, address }));

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CREDENTIALS[0].cloudName}/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_CREDENTIALS[0].uploadPreset);
    const res = await fetch(url, { method: 'POST', body: form });
    return (await res.json()).secure_url;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.image) return showToast('Snap a photo first!');
    if (!formData.lat || !formData.lng) return showToast('We need to know the spot!');

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        let imageFile = formData.image;
        try {
          imageFile = await imageCompression(formData.image, {
            maxSizeMB: 0.15, maxWidthOrHeight: 1280, useWebWorker: true,
          });
        } catch (_) { /* compression optional */ }

        const imgUrl = await uploadToCloudinary(imageFile);
        const { lat, lng, address, anonymous, caption, type } = formData;

        const newDoc = await addDoc(collection(db, 'memories'), {
          caption, type, lat, lng, address,
          imageUrl: imgUrl,
          ts: serverTimestamp(),
          userId: anonymous || !currentUser ? 'anonymous' : currentUser.uid,
          upvotes: 0,
        });

        showToast('Memory pinned! 📍', 'success');
        onSuccess({ id: newDoc.id, ...formData, imageUrl: imgUrl });
        setFormData({ caption: '', image: null, lat: null, lng: null, address: '', anonymous: true, type: 'Moment' });
        setTimeout(() => onClose(), 1500);
      } catch (err) {
        showToast('Something went wrong. Try again?');
      } finally {
        setIsSubmitting(false);
      }
    }, 100);
  };

  const selectedType = MEMORY_TYPES.find(t => t.label === formData.type);

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center md:p-6">
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full md:max-w-4xl bg-background border-t-2 md:border-2 border-foreground rounded-t-3xl md:rounded-2xl shadow-pop overflow-hidden flex flex-col md:flex-row"
              style={{ maxHeight: '95dvh' }}
            >

              {/* ── LEFT: MAP HALF ── */}
              <div className="w-full h-52 md:h-auto md:w-1/2 shrink-0 relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-muted">
                <LocationVerifier
                  file={formData.image}
                  onLocationVerified={handleLocationVerified}
                />
                {/* label */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background border-2 border-foreground rounded-full px-3 py-1 shadow-pop pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                  <span className="heading-font text-[10px] uppercase tracking-widest text-foreground">
                    {formData.address ? formData.address.split(',')[0] : 'The Spot'}
                  </span>
                </div>
              </div>

              {/* ── RIGHT: FORM HALF ── */}
              <div className="w-full md:w-1/2 flex flex-col overflow-hidden">

                {/* header */}
                <div className="px-6 py-5 border-b-2 border-foreground flex items-start justify-between shrink-0 bg-background">
                  <div>
                    <h2 className="heading-font text-2xl font-bold text-foreground leading-tight">
                      Spill a Memory
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Where did it happen?
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-foreground text-foreground hover:bg-secondary hover:text-white hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>

                {/* scrollable form body */}
                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
                >

                  {/* ── Photo upload ── */}
                  <div>
                    <label className="heading-font text-xs font-bold uppercase tracking-widest text-foreground block mb-2">
                      Photo <span className="text-secondary">*</span>
                    </label>
                    <label
                      className={`relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all group
                        ${formData.image
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent hover:bg-muted'
                        }`}
                    >
                      {formData.image ? (
                        <>
                          <img
                            src={URL.createObjectURL(formData.image)}
                            alt="preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                          />
                          <div className="relative z-10 flex items-center gap-2 bg-background border-2 border-accent rounded-full px-4 py-1.5 shadow-pop">
                            <CircleCheck className="w-4 h-4 text-accent" strokeWidth={2.5} />
                            <span className="heading-font text-xs font-bold text-foreground uppercase tracking-wide">
                              Photo ready
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-accent transition-colors">
                          <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                          <span className="heading-font text-xs font-bold uppercase tracking-widest">
                            Add a photo
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => setFormData(p => ({ ...p, image: e.target.files[0] }))}
                      />
                    </label>
                  </div>

                  {/* ── Memory type pills ── */}
                  <div>
                    <label className="heading-font text-xs font-bold uppercase tracking-widest text-foreground block mb-2">
                      What kind?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {MEMORY_TYPES.map(({ label, icon: Icon, color, active }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, type: label }))}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                            ${formData.type === label
                              ? `${active} shadow-pop -translate-x-0.5 -translate-y-0.5`
                              : 'border-border hover:border-muted-foreground'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.type === label ? color : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                          <span className="heading-font text-[10px] font-bold uppercase tracking-wide text-foreground">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Story textarea ── */}
                  <div>
                    <label className="heading-font text-xs font-bold uppercase tracking-widest text-foreground block mb-2">
                      Your story
                    </label>
                    <textarea
                      value={formData.caption}
                      onChange={e => setFormData(p => ({ ...p, caption: e.target.value }))}
                      placeholder="What happened here? Be as honest as you want..."
                      rows={4}
                      className="w-full bg-input border-2 border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder-muted-foreground resize-none outline-none focus:border-accent focus:shadow-focus transition-all"
                    />
                  </div>

                  {/* ── Anonymous toggle ── */}
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, anonymous: !p.anonymous }))}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all
                      ${formData.anonymous
                        ? 'border-accent bg-accent/5 shadow-pop -translate-x-0.5 -translate-y-0.5'
                        : 'border-border hover:border-foreground'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-foreground shadow-pop
                      ${formData.anonymous ? 'bg-accent' : 'bg-muted'}`}
                    >
                      {formData.anonymous
                        ? <Ghost className="w-5 h-5 text-white" strokeWidth={2.5} />
                        : <User className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                      }
                    </div>
                    <div className="text-left flex-1">
                      <p className="heading-font text-sm font-bold text-foreground">
                        {formData.anonymous ? 'Anonymous' : 'Public'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.anonymous
                          ? 'Your identity stays hidden'
                          : 'Your username will be shown'
                        }
                      </p>
                    </div>
                    {/* pill toggle */}
                    <div className={`w-12 h-6 rounded-full border-2 border-foreground flex items-center px-0.5 transition-all
                      ${formData.anonymous ? 'bg-accent justify-end' : 'bg-muted justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white border border-foreground/20 shadow" />
                    </div>
                  </button>

                  {/* spacer so submit button doesn't cover last field on mobile */}
                  <div className="h-20 md:h-2" />
                </form>

                {/* ── sticky submit ── */}
                <div className="shrink-0 px-6 pb-6 pt-4 border-t-2 border-border bg-background">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-accent text-white border-2 border-foreground heading-font font-bold text-sm uppercase tracking-widest shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Send className="w-5 h-5" strokeWidth={2.5} /><span>Spill It</span></>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpillMemoryModal;
