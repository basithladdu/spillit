import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';
import { uploadToSupabase } from '../utils/supabaseStorage';
import { FaHeart, FaShieldAlt, FaQrcode, FaArrowRight, FaCheckCircle, FaLock, FaUpload } from 'react-icons/fa';
import '../styles/municipal.css';

const BecomeDonor = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('details'); // details, payment, success
    const [skipDetails, setSkipDetails] = useState(false);
    const [proofFile, setProofFile] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        amount: '',
        message: '',
        isAnonymous: false,
        transactionId: '',
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSkip = () => {
        setSkipDetails(true);
        setStep('payment');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Basic validation
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                alert("Please enter a valid amount to donate.");
                setLoading(false);
                return;
            }

            let proofUrl = '';
            if (proofFile) {
                const timestampStr = Date.now();
                const path = `donors/proof_${timestampStr}_${proofFile.name}`;
                proofUrl = await uploadToSupabase(proofFile, path);
            }

            const donorData = {
                name: formData.isAnonymous ? "Anonymous Hero" : (formData.name || "Anonymous"),
                email: formData.email,
                amount: parseFloat(formData.amount),
                message: formData.message,
                isAnonymous: formData.isAnonymous,
                transactionId: formData.transactionId,
                proof: proofUrl,
                verified: false, // Needs admin approval
                timestamp: serverTimestamp(),
                hideAmount: false // Default to showing amount, can be toggled later by admin or user preference if added
            };

            await addDoc(collection(db, 'fixit_donors'), donorData);
            setStep('success');
        } catch (error) {
            console.error("Error submitting donation:", error);
            alert(`Something went wrong: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20">
            <main className="container mx-auto px-6 max-w-2xl">

                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2 flex items-center justify-center gap-3">
                        <FaShieldAlt className="text-[#FF671F]" />
                        Become a Civic Hero
                    </h1>
                    <p className="text-[var(--muni-text-muted)]">
                        Your contribution fuels the fight for a better India.
                    </p>
                </div>

                <div className="muni-card p-8 rounded-2xl border border-[var(--muni-border)] bg-[#09090b]">

                    {step === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-20 h-20 bg-[#046A38]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#046A38]">
                                <FaCheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Thank You for Your Support!</h2>
                            <p className="text-[var(--muni-text-muted)] mb-8">
                                We have received your details. Once verified, your contribution will be added to the Public Donor Record.
                            </p>
                            <button
                                onClick={() => navigate('/donors')}
                                className="bg-[#FF671F] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#ff8f50] transition-colors"
                            >
                                Return to Wall of Fame
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Toggle for Skip */}
                            {step === 'details' && (
                                <div className="mb-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="text-sm text-[#FF671F] hover:underline flex items-center gap-1 font-mono"
                                    >
                                        Skip details & just pay <FaArrowRight size={12} />
                                    </button>
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {step === 'details' && !skipDetails && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    disabled={formData.isAnonymous}
                                                    className="w-full bg-[#18181b] border border-[var(--muni-border)] rounded-lg px-4 py-3 text-white focus:border-[#FF671F] outline-none transition-colors disabled:opacity-50"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === 'e') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    required
                                                    className="w-full bg-[#18181b] border border-[var(--muni-border)] rounded-lg px-4 py-3 text-white focus:border-[#FF671F] outline-none transition-colors"
                                                    placeholder="1000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Message (We insist!)</label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full bg-[#18181b] border border-[var(--muni-border)] rounded-lg px-4 py-3 text-white focus:border-[#FF671F] outline-none transition-colors"
                                                placeholder="Why are you supporting this cause?"
                                            ></textarea>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-[#18181b] rounded-lg border border-[var(--muni-border)]">
                                            <input
                                                type="checkbox"
                                                name="isAnonymous"
                                                id="isAnonymous"
                                                checked={formData.isAnonymous}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 rounded border-gray-600 text-[#FF671F] focus:ring-[#FF671F] bg-gray-700"
                                            />
                                            <label htmlFor="isAnonymous" className="text-sm text-white cursor-pointer select-none">
                                                Make my donation anonymous (Hide name on public record)
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setStep('payment')}
                                            className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl hover:bg-gray-200 transition-colors mt-4"
                                        >
                                            Proceed to Pay
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'payment' && (
                                    <motion.div
                                        key="payment"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center p-6 bg-white rounded-xl">
                                            <h3 className="text-black font-bold mb-4 uppercase tracking-wider">Scan to Pay</h3>
                                            <div className="w-full max-w-[300px] aspect-square bg-gray-200 mx-auto mb-4 flex items-center justify-center rounded-lg overflow-hidden">
                                                {/* <FaQrcode size={64} className="text-gray-400" /> */}
                                                {/* Replace with actual QR Code Image */}
                                                <img src="qrcode.jpeg" alt="UPI QR" className="w-full h-full " /> </div>
                                            <p className="text-black font-mono font-bold">UPI ID: basithmuqeeth@okaxis</p>
                                        </div>

                                        {skipDetails && (
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Amount Paid (₹)</label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === 'e') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    required
                                                    className="w-full bg-[#18181b] border border-[var(--muni-border)] rounded-lg px-4 py-3 text-white focus:border-[#FF671F] outline-none transition-colors"
                                                    placeholder="Enter amount paid"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Transaction ID / UTR (Optional)</label>
                                            <input
                                                type="text"
                                                name="transactionId"
                                                value={formData.transactionId}
                                                onChange={handleInputChange}
                                                className="w-full bg-[#18181b] border border-[var(--muni-border)] rounded-lg px-4 py-3 text-white focus:border-[#FF671F] outline-none transition-colors"
                                                placeholder="e.g., 1234567890"
                                            />
                                        </div>

                                        {/* File Upload */}
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--muni-text-muted)] uppercase tracking-wider mb-2">Upload Screenshot (Optional)</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setProofFile(e.target.files[0])}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                />
                                                <div className={`border-2 border-dashed border-[var(--muni-border)] rounded-lg p-6 text-center transition-colors ${proofFile ? 'border-[#FF671F] bg-[#FF671F]/10' : 'hover:border-[#FF671F]'}`}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FaUpload className={`text-xl ${proofFile ? 'text-[#FF671F]' : 'text-[var(--muni-text-muted)]'}`} />
                                                        <p className={`text-sm ${proofFile ? 'text-[#FF671F] font-bold' : 'text-[var(--muni-text-muted)]'}`}>
                                                            {proofFile ? proofFile.name : "Click to upload JPG/PNG"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {!skipDetails && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('details')}
                                                    className="flex-1 bg-[#18181b] text-white font-bold py-4 rounded-xl border border-[var(--muni-border)] hover:bg-[#27272a] transition-colors"
                                                >
                                                    Back
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 bg-gradient-to-r from-[#FF671F] to-[#FF8F50] text-black font-black uppercase tracking-wider py-4 rounded-xl hover:shadow-lg hover:shadow-[#FF671F]/20 transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Submitting...' : 'I Have Paid'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BecomeDonor;
