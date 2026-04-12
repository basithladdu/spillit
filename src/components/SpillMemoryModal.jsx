import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, Camera, CircleCheck, FileText, MapPin, CircleX, Ghost, Sparkles } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../hooks/useAuth';
import imageCompression from 'browser-image-compression';
import LocationVerifier from './LocationVerifier';

// --- Configuration ---
const CLOUDINARY_CREDENTIALS = [{ cloudName: 'fixit', uploadPreset: 'fixit_unsigned' }];

// --- Toast Notification Component ---
const Toast = ({ message, type = 'error', onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] max-w-sm w-full mx-4"
    >
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${type === 'error'
            ? 'bg-red-500/10 border-red-500/50 text-red-200'
            : 'bg-[#ff7ec9]/10 border-[#ff7ec9]/50 text-pink-200'
            }`}>
            <div className="flex-shrink-0">
                {type === 'error' ? (
                    <CircleX className="text-red-400" size={24} />
                ) : (
                    <Sparkles className="text-[#ff7ec9]" size={24} />
                )}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    </motion.div>
);

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
        colorChoice: '#ff7ec9'
    });

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLocationVerified = ({ lat, lng, address }) => {
        setFormData(prev => ({ ...prev, lat, lng, address }));
    };

    const uploadToCloudinary = async (file) => {
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CREDENTIALS[0].cloudName}/upload`;
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', CLOUDINARY_CREDENTIALS[0].uploadPreset);
        const res = await fetch(url, { method: 'POST', body: form });
        const data = await res.json();
        return data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.image) {
            showToast("Snap a photo to spill a memory.");
            return;
        }
        if (!formData.lat || !formData.lng) {
            showToast("We need the spot on the map!");
            return;
        }

        setIsSubmitting(true);

        setTimeout(async () => {
            try {
                let imageFile = formData.image;
                try {
                    const options = { maxSizeMB: 0.15, maxWidthOrHeight: 1280, useWebWorker: true };
                    imageFile = await imageCompression(formData.image, options);
                } catch (error) { console.error(error); }

                const imgUrl = await uploadToCloudinary(imageFile);

                const { lat, lng, address, anonymous, colorChoice, caption, type } = formData;

                const newDoc = await addDoc(collection(db, "memories"), {
                    caption,
                    type,
                    lat,
                    lng,
                    address,
                    imageUrl: imgUrl,
                    ts: serverTimestamp(),
                    userId: anonymous || !currentUser ? "anonymous" : currentUser.uid,
                    upvotes: 0,
                    colorChoice: colorChoice || '#ff7ec9',
                });

                showToast("Memory pinned!", "success");
                onSuccess({ id: newDoc.id, ...formData, imageUrl: imgUrl });

                setFormData({
                    caption: '',
                    image: null,
                    lat: null,
                    lng: null,
                    address: '',
                    anonymous: true,
                    type: 'Moment',
                    colorChoice: '#ff7ec9'
                });

                setTimeout(() => onClose(), 1500);

            } catch (err) {
                console.error(err);
                showToast("Spill failed. Try again?");
            } finally {
                setIsSubmitting(false);
            }
        }, 100);
    };

    return (
        <>
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {show && (
                    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center md:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#08080c]/80 backdrop-blur-xl"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full h-[100dvh] md:h-auto md:max-w-4xl bg-[#0f0f13] border-t md:border border-white/10 rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Map Side */}
                            <div className="w-full h-48 md:h-[600px] md:w-1/2 relative bg-gray-900 overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-white/5">
                                <LocationVerifier file={formData.image} onLocationVerified={handleLocationVerified} />
                                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
                                    <MapPin size={14} className="text-[#ff7ec9]" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">The Spot</span>
                                </div>
                            </div>

                            {/* Form Side */}
                            <div className="w-full md:w-1/2 flex flex-col h-full relative">
                                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f13] shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2 heading-font tracking-tight">
                                           Spill A Memory
                                        </h2>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Where it all happened.</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32 md:pb-8">
                                    {/* Photo */}
                                    <div className="space-y-3">
                                        <label className={`relative flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-3xl cursor-pointer transition-all group overflow-hidden ${formData.image ? 'border-[#ff7ec9] bg-[#ff7ec9]/5' : 'border-white/5 hover:border-[#ff7ec9]/30 hover:bg-white/[0.02]'}`}>
                                            {formData.image ? (
                                                <>
                                                    <img src={URL.createObjectURL(formData.image)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                                    <div className="relative z-10 flex items-center gap-2 text-[#ff7ec9] font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-[#ff7ec9]/30 text-xs">
                                                        <CircleCheck size={16} /> Memory Captured
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-[#ff7ec9]">
                                                    <Camera size={24} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">Add A Photo</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                                        </label>
                                    </div>

                                    {/* Type */}
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            {['Moment', 'Crush', 'Secret', 'Laugh'].map(v => (
                                                <button
                                                  key={v}
                                                  type="button"
                                                  onClick={() => setFormData({...formData, type: v})}
                                                  className={`flex-1 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.type === v ? 'bg-[#ff7ec9] border-[#ff7ec9] text-white shadow-lg shadow-pink-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                                                >
                                                  {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Story */}
                                    <div className="space-y-2">
                                        <textarea
                                            value={formData.caption}
                                            onChange={e => setFormData({ ...formData, caption: e.target.value })}
                                            className="w-full h-24 md:h-32 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#ff7ec9]/50 transition resize-none placeholder:text-slate-600 italic"
                                            placeholder="What happened here? Tell your story..."
                                        />
                                    </div>

                                    {/* Identity */}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, anonymous: !prev.anonymous }))}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                                            formData.anonymous ? 'bg-[#ff7ec9]/10 border-[#ff7ec9]/20' : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${formData.anonymous ? 'bg-[#ff7ec9] text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                <Ghost size={16} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-white uppercase tracking-tight">{formData.anonymous ? 'Anonymous' : 'Public'}</p>
                                                <p className="text-[10px] text-slate-500">Your identity will be hidden.</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full border flex items-center px-1 transition-all ${formData.anonymous ? 'bg-[#ff7ec9]/20 border-[#ff7ec9] justify-end' : 'bg-slate-800 border-white/10 justify-start'}`}>
                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </button>
                                </form>

                                {/* Submit */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13] to-transparent shrink-0">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] text-white font-bold shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm uppercase tracking-widest heading-font"
                                    >
                                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /><span>Spill It</span></>}
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
