import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../hooks/useAuth';
import { uploadToSupabase } from '../utils/supabaseStorage';
import { CheckCircle, XCircle, Loader2, ShieldAlert, Upload, FileText, Calendar, DollarSign, User, MessageSquare, Link } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import '../styles/municipal.css';

const AdminDonors = () => {
    const { currentUser } = useAuth();
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualData, setManualData] = useState({
        name: '',
        amount: '',
        message: '',
        date: '',
        allocation: '',
        hideAmount: false
    });
    const [proofFile, setProofFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        // Query unverified donors
        const q = query(
            collection(db, 'fixit_donors'),
            where('verified', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDonors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort
            fetchedDonors.sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                return dateB - dateA;
            });
            setDonors(fetchedDonors);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching donors:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleApprove = async (id) => {
        try {
            const donorRef = doc(db, 'fixit_donors', id);
            await updateDoc(donorRef, {
                verified: true,
                verificationTimestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error approving donor:", error);
            alert("Failed to approve donor.");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject and delete this donation record?")) return;
        try {
            await deleteDoc(doc(db, 'fixit_donors', id));
        } catch (error) {
            console.error("Error rejecting donor:", error);
            alert("Failed to reject donor.");
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        if (!manualData.name) return alert("Name is required.");

        setUploading(true);
        try {
            let timestamp = serverTimestamp();
            if (manualData.date) {
                timestamp = Timestamp.fromDate(new Date(manualData.date));
            }

            let proofUrl = '';
            if (proofFile) {
                const timestampStr = Date.now();
                const path = `donors/proof_${timestampStr}_${proofFile.name}`;
                proofUrl = await uploadToSupabase(proofFile, path);
            }

            await addDoc(collection(db, 'fixit_donors'), {
                ...manualData,
                amount: manualData.amount ? Number(manualData.amount) : 0,
                proof: proofUrl,
                verified: true,
                timestamp: timestamp,
                verificationTimestamp: serverTimestamp(),
                manualEntry: true
            });

            setManualData({ name: '', amount: '', message: '', date: '', allocation: '', hideAmount: false });
            setProofFile(null);
            alert("Donor added successfully!");
        } catch (error) {
            console.error("Error adding donor manually:", error);
            alert("Failed to add donor: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-[var(--muni-bg)] text-white">
                <div className="text-center">
                    <ShieldAlert size={48} className="mx-auto text-[#FF671F] mb-4" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-[var(--muni-text-muted)] mt-2">You must be logged in to view this panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20 relative overflow-hidden">
            {/* Grand Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF671F]/5 via-transparent to-[#046A38]/5 pointer-events-none"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF671F]/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#046A38]/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-xl"
                    >
                        <ShieldAlert size={20} />
                        <span>DONOR VERIFICATION COMMAND CENTER</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-[#FF671F] to-white bg-clip-text text-transparent"
                    >
                        Honoring Our Champions
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[var(--muni-text-muted)] text-lg max-w-2xl mx-auto"
                    >
                        Every donor is a pillar of progress. Review and celebrate their contributions with the dignity they deserve.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 inline-flex items-center gap-6"
                    >
                        <div className="bg-[var(--muni-surface)] backdrop-blur-xl px-8 py-4 rounded-2xl border-2 border-[#FF671F]/30 shadow-2xl shadow-[#FF671F]/20">
                            <div className="text-xs font-mono text-[var(--muni-text-muted)] uppercase tracking-wider mb-1">Pending Review</div>
                            <div className="text-4xl font-black text-[#FF671F]">{donors.length}</div>
                        </div>
                    </motion.div>
                </header>

                {/* Manual Entry Form */}
                <div className="muni-card p-8 mb-12 border-t-4 border-t-[#046A38]">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <CheckCircle size={20} className="text-[#046A38]" /> Manual Entry & Transparency
                    </h3>
                    <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative group">
                            <User size={16} className="absolute left-3 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                            <input
                                type="text"
                                placeholder="Donor Name"
                                value={manualData.name}
                                onChange={e => setManualData({ ...manualData, name: e.target.value })}
                                className="muni-input !pl-12"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="relative group flex-1">
                                <DollarSign size={16} className="absolute left-3 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                                <input
                                    type="number"
                                    placeholder="Amount (₹)"
                                    value={manualData.amount}
                                    onChange={e => setManualData({ ...manualData, amount: e.target.value })}
                                    min="1"
                                    onKeyDown={(e) => {
                                        if (e.key === '-' || e.key === 'e') {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="muni-input !pl-12"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-[var(--muni-surface)] border border-[var(--muni-border)] rounded-lg px-4 hover:border-[#FF671F] transition-colors cursor-pointer" onClick={() => setManualData({ ...manualData, hideAmount: !manualData.hideAmount })}>
                                <input
                                    type="checkbox"
                                    id="hideAmount"
                                    checked={manualData.hideAmount}
                                    onChange={e => setManualData({ ...manualData, hideAmount: e.target.checked })}
                                    className="w-4 h-4 accent-[#FF671F] cursor-pointer"
                                />
                                <label htmlFor="hideAmount" className="text-xs text-[var(--muni-text-muted)] whitespace-nowrap cursor-pointer font-bold uppercase">Hide</label>
                            </div>
                        </div>

                        <div className="relative group">
                            <Calendar size={16} className="absolute left-3 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                            <input
                                type="date"
                                value={manualData.date}
                                onChange={e => setManualData({ ...manualData, date: e.target.value })}
                                className="muni-input !pl-12"
                            />
                        </div>

                        <div className="relative group md:col-span-3">
                            <MessageSquare size={16} className="absolute left-3 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                            <input
                                type="text"
                                placeholder="Message (Optional)"
                                value={manualData.message}
                                onChange={e => setManualData({ ...manualData, message: e.target.value })}
                                className="muni-input !pl-12"
                            />
                        </div>

                        <div className="relative group">
                            <Link size={16} className="absolute left-3 top-3.5 text-[var(--muni-text-muted)] group-focus-within:text-[#FF671F] transition-colors" />
                            <input
                                type="text"
                                placeholder="Allocation (e.g. Road Repair)"
                                value={manualData.allocation}
                                onChange={e => setManualData({ ...manualData, allocation: e.target.value })}
                                className="muni-input !pl-12"
                            />
                        </div>

                        {/* File Upload for Proof */}
                        <div className="relative md:col-span-2">
                            <input
                                type="file"
                                onChange={e => setProofFile(e.target.files[0])}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className="muni-input flex items-center gap-3 cursor-pointer group-hover:border-[#FF671F] transition-colors">
                                <Upload size={16} className="text-[#FF671F]" />
                                <span className={`truncate text-sm ${proofFile ? 'text-white font-bold' : 'text-[var(--muni-text-muted)]'}`}>
                                    {proofFile ? proofFile.name : "Upload Proof (PDF/Image)"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="md:col-span-3 bg-[#FF671F] text-black font-bold rounded-lg px-6 py-4 hover:bg-[#e55d1b] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-[#FF671F]/20"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                            {uploading ? "UPLOADING & ADDING..." : "ADD VERIFIED DONOR"}
                        </button>
                    </form>
                </div>

                {
                    loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-[#FF671F]" size={40} />
                        </div>
                    ) : donors.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--muni-surface)] rounded-2xl border border-[var(--muni-border)] border-dashed">
                            <CheckCircle size={48} className="mx-auto text-[#046A38] mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-[var(--muni-text-muted)]">All Caught Up!</h3>
                            <p className="text-[var(--muni-text-muted)] mt-2">No pending donations to verify.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {donors.map((donor) => (
                                    <motion.div
                                        key={donor.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[var(--muni-surface)] border border-[var(--muni-border)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg hover:border-[var(--muni-text-muted)] transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">{donor.name || "Anonymous"}</h3>
                                                <span className="bg-[#FF671F]/10 text-[#FF671F] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border border-[#FF671F]/20">
                                                    ₹{donor.amount}
                                                </span>
                                            </div>
                                            <p className="text-[var(--muni-text-muted)] text-sm mb-3 italic">"{donor.message || "No message provided."}"</p>
                                            <div className="flex items-center gap-4 text-xs text-[var(--muni-text-muted)] font-mono">
                                                <span>ID: {donor.id}</span>
                                                <span>•</span>
                                                <span>{donor.timestamp?.toDate().toLocaleString() || "Date Unknown"}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <button
                                                onClick={() => handleReject(donor.id)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider"
                                            >
                                                <XCircle size={18} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(donor.id)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#046A38] text-white shadow-lg shadow-[#046A38]/20 hover:bg-[#058c4a] hover:scale-105 transition-all font-bold text-sm uppercase tracking-wider"
                                            >
                                                <CheckCircle size={18} />
                                                Approve
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default AdminDonors;
