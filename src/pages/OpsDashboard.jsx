import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Loader2, Phone, Check, X, FileText, RefreshCw, Shield, Users, Building2, Search, ArrowRight, ExternalLink } from 'lucide-react';
import app from '../utils/firebase';
import '../styles/municipal.css';
import { toast } from 'react-toastify';

export default function OpsDashboard() {
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [verificationCode, setVerificationCode] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const db = getFirestore(app);
            const q = query(collection(db, 'municipal_registrations'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                return dateB - dateA;
            });

            setAllRegistrations(data);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            toast.error("Cloud Sync Failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const stats = {
        total: allRegistrations.length,
        pending: allRegistrations.filter(r => (r.status || 'PENDING').toLowerCase() === 'pending').length,
        active: allRegistrations.filter(r => r.status?.toLowerCase() === 'approved').length
    };

    const filteredRegistrations = allRegistrations.filter(reg => {
        const matchesStatus = (reg.status || 'PENDING').toLowerCase() === activeTab;
        const matchesSearch = reg.organisation_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reg.admin_full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleApprove = async (regId) => {
        if (!window.confirm("Approve this municipality for platform access?")) return;
        setProcessingId(regId);
        try {
            const functions = getFunctions(app);
            const approveFn = httpsCallable(functions, 'approveMunicipalAdmin');
            await approveFn({ registrationId: regId });
            toast.success("Strategic Approval Confirmed!", { theme: "dark" });
            fetchRegistrations();
        } catch (error) {
            console.error(error);
            toast.error("Approval Error: " + error.message, { theme: "dark" });
        } finally {
            setProcessingId(null);
        }
    };

    const generateCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000);
        setVerificationCode(code);
    };

    const getDocLink = (path) => {
        // Placeholder link
        return `https://supabase.com/dashboard/project/.../storage/buckets/municipal-uploads/${path}`;
    };

    return (
        <div className="municipal-theme min-h-screen content-container p-6 selection:bg-[#22c55e]/30">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Global Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#22c55e]/10 rounded-2xl border border-[#22c55e]/20">
                            <Shield className="text-[#22c55e]" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Super-Ops Dashboard</h1>
                            <p className="text-[var(--muni-text-muted)] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                                Institutional Oversight & Governance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchRegistrations} className="muni-btn-ghost flex items-center gap-2 group hover:bg-white/5 transition-all">
                            <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                            SYNC DATA
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="muni-card p-6 border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--muni-text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Incoming Requests</p>
                                <p className="text-4xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Building2 className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-6 border-l-4 border-yellow-500 bg-gradient-to-br from-yellow-500/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--muni-text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Awaiting Review</p>
                                <p className="text-4xl font-bold text-white">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl">
                                <Users className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                    <div className="muni-card p-6 border-l-4 border-[#22c55e] bg-gradient-to-br from-[#22c55e]/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--muni-text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Approved Partners</p>
                                <p className="text-4xl font-bold text-white">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-[#22c55e]/10 rounded-xl">
                                <Check className="text-[#22c55e]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {/* Tabs and Search */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--muni-border)] pb-2">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'text-[#22c55e]' : 'text-[var(--muni-text-muted)] hover:text-white'}`}
                            >
                                Pending Review
                                {activeTab === 'pending' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#22c55e] rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'approved' ? 'text-[#22c55e]' : 'text-[var(--muni-text-muted)] hover:text-white'}`}
                            >
                                Active Partners
                                {activeTab === 'approved' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#22c55e] rounded-t-full" />}
                            </button>
                        </div>
                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muni-text-muted)] group-focus-within:text-[#22c55e] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by Org or Admin..."
                                className="muni-input pl-10 w-full !bg-white/5 border-none focus:ring-1 focus:ring-[#22c55e]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <RefreshCw className="animate-spin text-[#22c55e]" size={48} />
                            <p className="text-sm font-mono text-[var(--muni-text-muted)] animate-pulse">CONSULTING BLOCKCHAIN LEDGER...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredRegistrations.length === 0 ? (
                                <div className="muni-card py-20 text-center flex flex-col items-center gap-4 bg-white/[0.02]">
                                    <Building2 size={64} className="opacity-10" />
                                    <p className="text-[var(--muni-text-muted)] italic font-mono">No {activeTab} registrations found in this sector.</p>
                                </div>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={reg.id}
                                        className="muni-card overflow-hidden group hover:border-[#22c55e]/30 transition-all border-l-4 border-l-transparent hover:border-l-[#22c55e]"
                                    >
                                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--muni-border)]">
                                            {/* Entity Profile */}
                                            <div className="p-6 lg:w-2/3">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-[#22c55e] transition-colors">{reg.organisation_name}</h3>
                                                        <p className="text-xs font-mono text-[var(--muni-text-muted)] mt-1 flex items-center gap-2 uppercase">
                                                            <ExternalLink size={12} /> Registry ID: {reg.id.substring(0, 12)}...
                                                        </p>
                                                    </div>
                                                    <span className={`muni-badge ${(reg.status || 'PENDING').toLowerCase() === 'approved' ? 'success' : 'pending'}`}>
                                                        {(reg.status || 'PENDING').toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Lead Administrator</p>
                                                        <p className="text-white font-medium">{reg.admin_full_name} <span className="text-[var(--muni-text-muted)] font-normal">({reg.designation})</span></p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Communication Channel</p>
                                                        <p className="text-white font-mono text-sm">{reg.official_email}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Tele-Verification</p>
                                                        <p className="text-white text-sm">{reg.office_phone} / {reg.mobile_phone}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase tracking-wider">Command Address</p>
                                                        <p className="text-white text-sm line-clamp-1">{reg.office_address}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-[var(--muni-border)]">
                                                    <button onClick={() => window.open(getDocLink(reg.storage_paths?.government_id))} className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20 transition-all">
                                                        <FileText size={14} /> GOVERNMENT_ID.PDF
                                                    </button>
                                                    <button onClick={() => window.open(getDocLink(reg.storage_paths?.proof_of_affiliation))} className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20 transition-all">
                                                        <FileText size={14} /> PROOF_AFFILIATION.PDF
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tactical Actions */}
                                            <div className="p-6 lg:w-1/3 bg-white/[0.01] flex flex-col justify-center gap-4">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <div className="bg-black/40 p-4 rounded-xl border border-[var(--muni-border)] text-center relative overflow-hidden group">
                                                            <p className="text-[10px] font-bold text-[var(--muni-text-muted)] uppercase mb-3 tracking-widest">Manual Voice Verification</p>
                                                            {verificationCode ? (
                                                                <div className="animate-in fade-in zoom-in duration-300">
                                                                    <div className="text-3xl font-mono font-bold tracking-[0.5em] text-[#22c55e] mb-1">{verificationCode}</div>
                                                                    <p className="text-[9px] text-yellow-500/80 font-bold uppercase">Code Active for Call Session</p>
                                                                </div>
                                                            ) : (
                                                                <button onClick={generateCode} className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-[#22c55e]/10 text-white rounded-lg border border-white/10 hover:border-[#22c55e]/40 transition-all group/btn">
                                                                    <Phone size={18} className="group-hover/btn:animate-bounce" />
                                                                    <span className="text-xs font-bold uppercase tracking-widest">Initiate Call</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => handleApprove(reg.id)}
                                                            disabled={processingId === reg.id}
                                                            className="h-12 w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-[#22c55e]/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                                                        >
                                                            {processingId === reg.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                                                            Finalize Approval
                                                        </button>

                                                        <button
                                                            onClick={() => {/* Reject Logic */ }}
                                                            disabled={processingId === reg.id}
                                                            className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest hover:bg-red-500/5 py-2 rounded transition-all"
                                                        >
                                                            Deny Access Request
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                                                        <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/30">
                                                            <Check size={32} />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold uppercase tracking-widest">Access Active</p>
                                                            <p className="text-[var(--muni-text-muted)] text-[10px] mt-1 italic">Verified Account</p>
                                                        </div>
                                                        <button className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-2">
                                                            View Audit Logs <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
