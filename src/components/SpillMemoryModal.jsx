import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Camera, CircleCheck, MapPin, Ghost, User,
  Flame, Heart, Laugh, Lock, CircleX, Sparkles
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isValidCoord } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import imageCompression from 'browser-image-compression';
const LocationVerifier = lazy(() => import('./LocationVerifier'));

const MEMORY_TYPES = [
  { label: 'Moment',  icon: Flame,  color: 'bg-accent   text-white', active: 'border-accent'   },
  { label: 'Crush',   icon: Heart,  color: 'bg-secondary text-white', active: 'border-secondary' },
  { label: 'Secret',  icon: Lock,   color: 'bg-foreground text-white', active: 'border-foreground' },
  { label: 'Laugh',   icon: Laugh,  color: 'bg-tertiary  text-foreground', active: 'border-tertiary'  },
];

/* ── small inline toast ── */
const Toast = ({ message, type, onClose }) => (
  <Motion.div
    role="alert"
    aria-live="assertive"
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
        ? <CircleX className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
        : <Sparkles className="w-5 h-5 text-quaternary shrink-0" aria-hidden="true" />
      }
      <span className="flex-1">{message}</span>
<button type="button" onClick={onClose} aria-label="Dismiss notification" className="shrink-0 p-1.5 rounded-full hover:opacity-60 transition-opacity">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </Motion.div>
);

/* ── main modal ── */
const SpillMemoryModal = ({ show, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const modalRef = useRef(null);
  const returnFocusRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    caption: '',
    image: null,
    lat: null,
    lng: null,
    address: '',
    anonymous: true,
    type: 'Moment',
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!formData.image) {
      setPreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(formData.image);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [formData.image]);

  useEffect(() => {
    if (!show) return undefined;

    returnFocusRef.current = document.activeElement;
    const modal = modalRef.current;
    const getFocusable = () => modal
      ? [...modal.querySelectorAll('button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.disabled)
      : [];
    getFocusable()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmittingRef.current) onClose();
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [show, onClose]);

  const showToast = (message, type = 'error') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      showToast('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      event.target.value = '';
      showToast('That image is too large. Please choose one under 10 MB.');
      return;
    }
    setFormData(p => ({ ...p, image: file }));
  };

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const handleLocationVerified = useCallback(({ lat, lng, address, addressOnly = false }) =>
    setFormData(p => addressOnly && (!isValidCoord(p.lat, p.lng) || Number(p.lat) !== lat || Number(p.lng) !== lng)
      ? p : ({ ...p, lat, lng, address })), []);


  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmittingRef.current) return;
    if (!isValidCoord(formData.lat, formData.lng)) return showToast('We need to know the spot!');
    if (!formData.caption.trim()) return showToast('Write something — even one word!');

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let uploadedFilePath = null;
    try {
      const { lat, lng, address, anonymous, caption, type } = formData;
      let publicUrl = null;

      // 1. Upload image to Supabase Storage only if one was provided
      if (formData.image) {
        let imageFile = formData.image;
        try {
          imageFile = await imageCompression(formData.image, {
            maxSizeMB: 0.15, maxWidthOrHeight: 1280, useWebWorker: true,
          });
        } catch {
          /* compression optional */
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `spills/${fileName}`;
        uploadedFilePath = filePath;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, {
            cacheControl: '31536000',
            contentType: imageFile.type || formData.image.type || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        publicUrl = url;
      }

      // 2. Insert into Supabase Table: memories
      const { data: newDoc, error: insertError } = await supabase
        .from('memories')
        .insert([{
          caption: caption.trim(),
          type,
          lat: Number(lat),
          lng: Number(lng),
          address,
          image_url: publicUrl,
          user_id: anonymous || !currentUser ? null : currentUser.id,
          upvotes: 0,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newDoc?.id) throw new Error('The service did not confirm this memory. Please check the archive before retrying.');
      uploadedFilePath = null;

      showToast('Memory pinned!', 'success');
      onSuccess({ ...newDoc, imageUrl: publicUrl });
      onClose();
      setFormData({ caption: '', image: null, lat: null, lng: null, address: '', anonymous: true, type: 'Moment' });

    } catch (err) {
      if (uploadedFilePath) {
        await supabase.storage.from('images').remove([uploadedFilePath]).catch(() => {});
      }
      console.error('Supabase Error:', err);
      showToast(err.message || 'Something went wrong. Try again?');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center md:p-6">
            <Motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close spill form"
              className="absolute inset-0 bg-black/80"
              onClick={() => { if (!isSubmitting) onClose(); }}
              disabled={isSubmitting}
            />

            <Motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="spill-modal-title"
              aria-describedby="spill-modal-description"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full md:max-w-4xl bg-background border-t-2 md:border-2 border-foreground rounded-t-3xl md:rounded-2xl shadow-pop overflow-hidden flex flex-col md:flex-row"
              style={{ maxHeight: '95dvh' }}
            >

              {/* ── LEFT: MAP HALF ── */}
              <div className="w-full h-44 md:h-auto md:w-1/2 shrink-0 relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-muted">
                <Suspense fallback={(
                  <div className="flex h-full min-h-52 items-center justify-center bg-muted px-6 text-center" role="status">
                    <div>
                      <MapPin className="mx-auto mb-3 h-8 w-8 text-accent" aria-hidden="true" />
                      <p className="text-sm font-black uppercase tracking-wider text-foreground">Preparing the map</p>
                      <p className="mt-1 text-xs font-medium text-foreground/60">Your location picker will appear in a moment.</p>
                    </div>
                  </div>
                )}>
                  <LocationVerifier
                    file={formData.image}
                    onLocationVerified={handleLocationVerified}
                    initialLat={formData.lat}
                    initialLng={formData.lng}
                  />
                </Suspense>
                {/* label */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background border-2 border-foreground rounded-full px-3 py-1 shadow-pop pointer-events-none">
                      <MapPin className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} aria-hidden="true" />
                  <span className="heading-font text-[10px] uppercase tracking-widest text-foreground">
                    {formData.address ? formData.address.split(',')[0] : 'The Spot'}
                  </span>
                </div>
              </div>

              {/* ── RIGHT: FORM HALF ── */}
              <div className="w-full md:w-1/2 min-h-0 flex flex-col overflow-hidden">

                {/* header */}
                <div className="px-6 py-5 border-b-2 border-foreground flex items-start justify-between shrink-0 bg-background">
                  <div>
                    <h2 id="spill-modal-title" className="heading-font text-2xl font-black text-foreground leading-tight">
                      Spill a Memory
                    </h2>
                    <p id="spill-modal-description" className="text-slate-500 text-sm mt-0.5 font-bold">
                      Where did it happen?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (!isSubmitting) onClose(); }}
                    disabled={isSubmitting}
                    aria-label="Close spill memory form"
                    className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-foreground text-foreground hover:bg-secondary hover:text-white hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>

                {/* scrollable form body */}
                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
                >

                  <fieldset className="space-y-2">
                    <legend className="heading-font text-xs font-bold uppercase tracking-widest">Location coordinates</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {[['lat', 'Latitude', 90], ['lng', 'Longitude', 180]].map(([key, label, limit]) => (
                        <label key={key} className="text-xs font-bold text-foreground">
                          {label}
                          <input type="number" step="any" min={-limit} max={limit} aria-label={label}
                            value={formData[key] ?? ''}
                            onChange={event => setFormData(previous => ({ ...previous, [key]: event.target.value, address: '' }))}
                            className="mt-1 w-full min-h-11 rounded-lg border-2 border-border bg-white px-3 text-sm" />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Pick a point on the map or enter coordinates. This spot will be public.</p>
                  </fieldset>

                  {/* ── Photo upload (optional) ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                        Photo <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, image: null }))}
                          aria-label="Remove selected photo"
                          className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-wide"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <label
                      htmlFor="spill-photo-input"
                      className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all group
                        ${formData.image
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent hover:bg-muted'
                        }`}
                    >
                      {formData.image ? (
                        <>
                          <img
                            src={previewUrl}
                            width="640"
                            height="480"
                            alt="Selected image preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                          />
                          <div className="relative z-10 flex items-center gap-2 bg-background border-2 border-accent rounded-full px-4 py-1.5 shadow-pop">
                            <CircleCheck className="w-4 h-4 text-accent" strokeWidth={2.5} aria-hidden="true" />
                            <span className="heading-font text-xs font-bold text-foreground uppercase tracking-wide">
                              Photo added
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-accent transition-colors">
                            <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={2.5} aria-hidden="true" />
                          <span className="heading-font text-xs font-bold uppercase tracking-widest">
                            Add a photo
                          </span>
                          <span className="text-[10px] text-muted-foreground">tap to upload or skip</span>
                        </div>
                      )}
                      <input
                        id="spill-photo-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {/* ── Memory type pills ── */}
                  <div>
                    <label className="heading-font text-xs font-bold uppercase tracking-widest text-foreground block mb-2">
                      What kind?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {MEMORY_TYPES.map(({ label, icon, color, active }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, type: label }))}
                          aria-pressed={formData.type === label}
                          aria-label={`${label} memory type`}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                            ${formData.type === label
                              ? `${active} shadow-pop -translate-x-0.5 -translate-y-0.5`
                              : 'border-border hover:border-muted-foreground'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.type === label ? color : 'bg-muted text-slate-400'}`}>
                            {React.createElement(icon, { className: 'w-4 h-4', strokeWidth: 2.5 })}
                          </div>
                          <span className="heading-font text-[10px] font-black uppercase tracking-wide text-foreground">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Story textarea ── */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="spill-story" className="heading-font text-xs font-bold uppercase tracking-widest text-foreground">
                        Your story
                      </label>
                      <span className={`text-[10px] font-bold tabular-nums ${formData.caption.length > 480 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {formData.caption.length}/500
                      </span>
                    </div>
                    <textarea
                      id="spill-story"
                      value={formData.caption}
                      onChange={e => setFormData(p => ({ ...p, caption: e.target.value.slice(0, 500) }))}
                      placeholder="What happened here? Be as honest as you want..."
                      rows={4}
                      maxLength={500}
                      aria-describedby="spill-story-hint"
                      className="w-full bg-white border-2 border-foreground rounded-xl px-4 py-3 text-foreground text-sm placeholder-slate-400 resize-none outline-none focus:border-accent focus:shadow-focus transition-all font-medium"
                    />
                    <p id="spill-story-hint" className="mt-1.5 text-[10px] text-muted-foreground">One word is enough — keep it under 500 characters.</p>
                  </div>

                  {/* Account linking is optional; names are not displayed on memories. */}
                  {currentUser && (
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, anonymous: !p.anonymous }))}
                    aria-pressed={!formData.anonymous}
                    aria-label="Save this memory to my account"
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
                        ? <Ghost className="w-5 h-5 text-white" strokeWidth={2.5} aria-hidden="true" />
                        : <User className="w-5 h-5 text-foreground" strokeWidth={2.5} aria-hidden="true" />
                      }
                    </div>
                    <div className="text-left flex-1">
                      <p className="heading-font text-sm font-black text-foreground">
                        {formData.anonymous ? 'Not linked to my account' : 'Save to my account'}
                      </p>
                      <p className="text-xs text-slate-500 font-bold">
                        {formData.anonymous
                          ? 'This memory will not appear in your profile stats.'
                          : 'Linked to your account; your name is not displayed.'
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

                  )}
                  <p className="text-xs text-muted-foreground">Your story, photo and chosen location will be public. Avoid private addresses or identifying details.</p>

                  {/* spacer so submit button doesn't cover last field on mobile */}
                  <div className="h-20 md:h-2" />
                </form>

                {/* ── sticky submit ── */}
                <div className="shrink-0 px-6 pb-6 pt-4 border-t-2 border-border bg-[#FFF5F9]">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    aria-label={isSubmitting ? 'Publishing memory' : undefined}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-accent text-white border-2 border-foreground heading-font font-bold text-sm uppercase tracking-widest shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-active transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Send className="w-5 h-5" strokeWidth={2.5} /><span>Spill It</span></>
                    }
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpillMemoryModal;
