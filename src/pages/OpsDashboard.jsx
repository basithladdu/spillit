import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
// import { useAuth } from '../hooks/useAuth';
import { Loader2, Phone, Check, X, FileText, RefreshCw } from 'lucide-react';
import app from '../utils/firebase';
import '../styles/municipal.css';

export default function OpsDashboard() {
    // const { currentUser } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [verificationCode, setVerificationCode] = useState(null);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const db = getFirestore(app);
            const q = query(
                collection(db, 'municipal_registrations'),
                where('status', '==', 'PENDING')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid composite index requirement
            data.sort((a, b) => {
                const dateA = a.submitted_at?.toDate ? a.submitted_at.toDate() : new Date(a.submitted_at);
                const dateB = b.submitted_at?.toDate ? b.submitted_at.toDate() : new Date(b.submitted_at);
                return dateB - dateA;
            });
            setRegistrations(data);
        } catch (error) {
            console.error("Error fetching registrations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleApprove = async (regId) => {
        if (!window.confirm("Are you sure you want to APPROVE this registration? This will create an admin account.")) return;
        setProcessingId(regId);
        try {
            const functions = getFunctions(app);
            const approveFn = httpsCallable(functions, 'approveMunicipalAdmin');
            await approveFn({ registrationId: regId });
            alert("Registration Approved!");
            fetchRegistrations();
        } catch (error) {
            console.error(error);
            alert("Error approving: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (regId) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setProcessingId(regId);
        try {
            // In a real app, call a reject function. For now, we'll just log it.
            console.log("Rejecting", regId, reason);
            alert("Rejection logic would go here.");
        } finally {
            setProcessingId(null);
        }
    };

    const generateCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000);
        setVerificationCode(code);
    };

    return (
        <div className="municipal-theme min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Ops Dashboard</h1>
                        <p className="text-[var(--muni-text-muted)]">Manage Municipal Registrations</p>
                    </div>
                    <button onClick={fetchRegistrations} className="muni-btn-ghost flex items-center gap-2">
                        <RefreshCw size={16} /> Refresh
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : registrations.length === 0 ? (
                    <div className="text-center py-12 text-[var(--muni-text-muted)]">No pending registrations.</div>
                ) : (
                    <div className="grid gap-6">
                        {registrations.map((reg) => (
                            <div key={reg.id} className="muni-card p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">

                                    {/* Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg">{reg.organisation_name}</span>
                                            <span className="muni-badge pending">PENDING</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <p><span className="text-[var(--muni-text-muted)]">Admin:</span> {reg.admin_full_name}</p>
                                            <p><span className="text-[var(--muni-text-muted)]">Email:</span> <span className="font-mono">{reg.official_email}</span></p>
                                            <p><span className="text-[var(--muni-text-muted)]">Phone:</span> {reg.office_phone}</p>
                                            <p><span className="text-[var(--muni-text-muted)]">Mobile:</span> {reg.mobile_phone}</p>
                                            <p className="col-span-2"><span className="text-[var(--muni-text-muted)]">Address:</span> {reg.office_address}</p>
                                        </div>

                                        <div className="mt-4 flex gap-4">
                                            <a href={reg.storage_paths?.government_id} target="_blank" rel="noreferrer" className="text-[var(--muni-accent)] text-sm flex items-center gap-1 hover:underline">
                                                <FileText size={14} /> View Gov ID
                                            </a>
                                            <a href={reg.storage_paths?.proof_of_affiliation} target="_blank" rel="noreferrer" className="text-[var(--muni-accent)] text-sm flex items-center gap-1 hover:underline">
                                                <FileText size={14} /> View Proof
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 min-w-[200px] border-l border-[var(--muni-border)] pl-6">
                                        <div className="bg-[var(--muni-bg)] p-3 rounded border border-[var(--muni-border)] mb-2">
                                            <p className="text-xs text-[var(--muni-text-muted)] mb-2">Manual Verification</p>
                                            {verificationCode ? (
                                                <div className="text-center">
                                                    <div className="text-xl font-mono font-bold tracking-widest mb-1">{verificationCode}</div>
                                                    <p className="text-[10px] text-[var(--muni-text-muted)]">Ask caller to read this code</p>
                                                </div>
                                            ) : (
                                                <button onClick={generateCode} className="w-full muni-btn-ghost text-xs flex items-center justify-center gap-2">
                                                    <Phone size={14} /> Call Verify
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleApprove(reg.id)}
                                            disabled={processingId === reg.id}
                                            className="muni-btn-primary bg-[var(--muni-accent)] text-black flex items-center justify-center gap-2"
                                        >
                                            {processingId === reg.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => handleReject(reg.id)}
                                            disabled={processingId === reg.id}
                                            className="muni-btn-ghost text-red-400 border-red-500/30 hover:border-red-500 flex items-center justify-center gap-2"
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
