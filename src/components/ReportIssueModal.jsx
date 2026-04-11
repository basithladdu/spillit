import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crosshair, Send, Camera, CheckCircle2, AlertTriangle, FileText, MapPin, XCircle } from 'lucide-react';
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
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] max-w-md w-full mx-4"
    >
        <div className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${type === 'error'
            ? 'bg-red-500/10 border-red-500/50 text-red-200'
            : 'bg-[#046A38]/10 border-[#046A38]/50 text-green-200'
            }`}>
            <div className="flex-shrink-0">
                {type === 'error' ? (
                    <XCircle className="text-red-400" size={24} />
                ) : (
                    <CheckCircle2 className="text-[#046A38]" size={24} />
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

const ReportIssueModal = ({ show, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        type: 'Pothole',
        severity: 'Low',
        desc: '',
        image: null,
        lat: null,
        lng: null,
        address: '',
        anonymous: true,
        audienceName: '',
        colorChoice: '#FF6B00'
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

        // Validation with themed toasts
        if (!formData.image) {
            showToast("📸 Please attach a photo before spilling.");
            return;
        }
        if (!formData.lat || !formData.lng) {
            showToast("📍 Please verify your location on the map before submitting.");
            return;
        }

        setIsSubmitting(true);

        // Use setTimeout to allow UI to update (show spinner) before heavy compression
        setTimeout(async () => {
            try {
                let imageFile = formData.image;
                try {
                    const options = {
                        maxSizeMB: 0.15,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    };
                    imageFile = await imageCompression(formData.image, options);
                } catch (error) {
                    console.error("Image compression failed:", error);
                }

                const imgUrl = await uploadToCloudinary(imageFile);

                // Extract and exclude file objects from Firestore data
                const { image, lat, lng, address, anonymous, audienceName, colorChoice, ...cleanData } = formData;

                // Save references for background AI processing BEFORE clearing formData
                const savedImage = formData.image;
                const savedType = formData.type;

                // Save to issues collection (without the File object)
                const newDoc = await addDoc(collection(db, "issues"), {
                    type: cleanData.type,
                    severity: cleanData.severity,
                    desc: cleanData.desc,
                    lat,
                    lng,
                    address,
                    imageUrl: imgUrl,
                    ts: serverTimestamp(),
                    userId: anonymous || !currentUser ? "anonymous_citizen" : currentUser.uid,
                    upvotes: 0,
                    audienceName: audienceName || null,
                    colorChoice: colorChoice || null,
                });

                setFormData({
                    type: "Pothole",
                    severity: "Low",
                    desc: "",
                    image: null,
                    lat: null,
                    lng: null,
                    address: '',
                    anonymous: true,
                    audienceName: '',
                    colorChoice: '#FF6B00'
                });
                onSuccess({
                    ...cleanData,
                    lat,
                    lng,
                    address,
                    anonymous,
                    audienceName,
                    colorChoice,
                    imageUrl: imgUrl,
                    id: newDoc.id
                });

                showToast("✅ Report submitted successfully!", "success");

                // Close modal immediately
                setTimeout(() => onClose(), 1500);

            } catch (err) {
                console.error(err);
                showToast("❌ Upload failed. Please check your connection and try again.");
            } finally {
                setIsSubmitting(false);
            }
        }, 100);
    };

    return (
        <>
            {/* Toast Notifications */}
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full h-[100dvh] md:h-[85vh] md:max-w-5xl bg-[#18181b] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* --- Left Column: Map (Desktop) / Top (Mobile) --- */}
                            {/* Mobile: h-60 fixed height (compact), z-10 to stay on top. Desktop: h-full, w-1/2 */}
                            <div className="w-full h-60 md:h-full md:w-1/2 relative bg-gray-900 border-b md:border-b-0 md:border-r border-white/10 z-10 shadow-2xl md:shadow-none shrink-0">
                    <div className="absolute inset-0 z-0">
                                    <div className="w-full h-full flex flex-col">
                                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
                                        <MapPin size={14} className="text-[var(--fixit-primary)]" />
                                            <span className="text-xs font-bold text-white">Location Verification</span>
                                        </div>
                                        <div className="flex-1 w-full h-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:rounded-none [&>div>div]:border-0">
                                            <LocationVerifier file={formData.image} onLocationVerified={handleLocationVerified} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Right Column: Form --- */}
                            <div className="w-full md:w-1/2 flex flex-col h-full bg-[#18181b] relative z-0">

                                {/* Header */}
                                <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#18181b] z-20 shrink-0">
                                    <div>
                                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 heading-font tracking-[0.16em] uppercase">
                                            <Crosshair className="text-[var(--fixit-primary)]" size={18} /> New Spill
                                        </h2>
                                        <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                                            Snap it, color it, spill it. That&apos;s the whole app.
                                        </p>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Scrollable Form Body */}
                                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-32 md:pb-6">

                                    {/* Image Upload (Compact) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Camera size={12} /> Photo
                                        </label>
                                        <label className={`relative flex flex-col items-center justify-center w-full h-24 md:h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all group overflow-hidden ${formData.image ? 'border-[#046A38] bg-[#046A38]/10' : 'border-white/10 hover:border-[#FF671F]/50 hover:bg-[#FF671F]/5'}`}>
                                            {formData.image ? (
                                                <>
                                                    <img src={URL.createObjectURL(formData.image)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                                                    <div className="relative z-10 flex items-center gap-2 text-[#046A38] font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-[#046A38]/30 text-xs">
                                                        <CheckCircle2 size={14} /> Photo Attached
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 text-gray-500 group-hover:text-[#FF671F]">
                                                    <div className="p-2 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                                        <Camera size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-bold">Tap to Upload</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                                        </label>
                                    </div>

                                    {/* Type & Severity Row (kept simple but still configurable) */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle size={12} /> Type
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm outline-none focus:border-[var(--fixit-primary)] transition appearance-none cursor-pointer hover:bg-white/5"
                                                >
                                                    <option>Pothole</option>
                                                    <option>Garbage</option>
                                                    <option>Water Leak</option>
                                                    <option>Street Light</option>
                                                    <option>Other</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle size={12} /> Severity
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.severity}
                                                    onChange={e => setFormData({ ...formData, severity: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm outline-none focus:border-[var(--fixit-primary)] transition appearance-none cursor-pointer hover:bg-white/5"
                                                >
                                                    <option>Low</option>
                                                    <option>Medium</option>
                                                    <option>High</option>
                                                    <option>Critical</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={12} /> Details
                                        </label>
                                        <textarea
                                            value={formData.desc}
                                            onChange={e => setFormData({ ...formData, desc: e.target.value })}
                                            className="w-full h-20 md:h-32 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs md:text-sm outline-none focus:border-[#FF671F] transition resize-none placeholder:text-gray-600"
                                            placeholder="Describe what&apos;s broken, how long it&apos;s been there..."
                                        />
                                    </div>

                                    {/* Audience / recipient */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Who are you spilling to?</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.audienceName}
                                            onChange={e => setFormData({ ...formData, audienceName: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs md:text-sm outline-none focus:border-[var(--fixit-primary)] transition placeholder:text-gray-600"
                                            placeholder="Eg. My street, Berlin, Mumbai Ward 42, My Apartment RWA..."
                                        />
                                        <p className="text-[10px] text-gray-500">
                                            People from anywhere in the world can direct an issue to a person, place, or institution.
                                        </p>
                                    </div>

                                    {/* Color choice */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Choose a color for this spill</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[
                                                { label: 'Saffron', value: '#FF6B00' },
                                                { label: 'India Green', value: '#138808' },
                                                { label: 'Sky', value: '#38BDF8' },
                                                { label: 'Lilac', value: '#A855F7' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, colorChoice: opt.value }))}
                                                    className={`w-8 h-8 rounded-full border-2 hover:scale-105 transition-transform ${
                                                        formData.colorChoice === opt.value
                                                            ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                                                            : 'border-white/30 opacity-80'
                                                    }`}
                                                    style={{ backgroundColor: opt.value }}
                                                    aria-label={opt.label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Anonymous toggle */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Identity</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, anonymous: !prev.anonymous }))}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs md:text-sm transition-all ${
                                                formData.anonymous
                                                    ? 'bg-black/60 border-[var(--fixit-primary)] text-[var(--fixit-primary)]'
                                                    : 'bg-black/40 border-white/10 text-gray-300'
                                            }`}
                                        >
                                            <span className="flex flex-col text-left">
                                                <span className="font-semibold">
                                                    {formData.anonymous ? 'Posted as Anonymous Citizen 🇮🇳' : 'Posted with my account'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {formData.anonymous
                                                        ? 'We only share your report, not your name.'
                                                        : 'Your account may be visible to municipal partners.'}
                                                </span>
                                            </span>
                                            <span
                                                className={`ml-3 inline-flex h-5 w-9 items-center rounded-full border transition-all ${
                                                    formData.anonymous
                                                        ? 'bg-[var(--fixit-primary)]/20 border-[var(--fixit-primary)] justify-end'
                                                        : 'bg-black/60 border-white/20 justify-start'
                                                }`}
                                            >
                                                <span className="h-4 w-4 rounded-full bg-white" />
                                            </span>
                                        </button>
                                    </div>
                                </form>

                                {/* Sticky Footer Action */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#18181b]/90 backdrop-blur-xl border-t border-white/10 z-30">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-3 rounded-xl bg-[var(--fixit-primary)] text-black font-bold shadow-lg shadow-[rgba(255,107,0,0.45)] hover:shadow-[0_0_32px_rgba(255,107,0,0.7)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-sm md:text-base heading-font tracking-[0.16em] uppercase"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                <span>Spill This →</span>
                                            </>
                                        )}
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

export default ReportIssueModal;
