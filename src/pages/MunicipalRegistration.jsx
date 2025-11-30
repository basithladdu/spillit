import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../utils/firebase';
import { uploadToSupabase } from '../utils/supabaseStorage';
import '../styles/municipal.css';

export default function MunicipalRegistration() {
    const [formData, setFormData] = useState({
        organisation_name: '',
        official_email: '',
        admin_full_name: '',
        designation: '',
        office_phone: '',
        mobile_phone: '',
        office_address: '',
        brief_purpose: '',
        password: ''
    });
    const [files, setFiles] = useState({
        government_id: null,
        proof_of_affiliation: null
    });
    const [status, setStatus] = useState('idle'); // idle, uploading, submitting, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const validateForm = () => {
        if (!formData.official_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setErrorMsg("Invalid email format.");
            return false;
        }
        if (!files.government_id || !files.proof_of_affiliation) {
            setErrorMsg("Please upload both required documents.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!validateForm()) return;

        setStatus('uploading');
        try {
            const timestamp = Date.now();

            // Upload files to Supabase S3
            const govIdPath = `registrations/${formData.official_email}_${timestamp}/gov_id_${files.government_id.name}`;
            const proofPath = `registrations/${formData.official_email}_${timestamp}/proof_${files.proof_of_affiliation.name}`;

            await uploadToSupabase(files.government_id, govIdPath);
            await uploadToSupabase(files.proof_of_affiliation, proofPath);

            setStatus('submitting');

            // Save directly to Firestore (Client-side)
            // This avoids the need for Firebase Cloud Functions (Blaze Plan)
            await addDoc(collection(db, 'municipal_registrations'), {
                ...formData,
                storage_paths: {
                    government_id: govIdPath,
                    proof_of_affiliation: proofPath,
                    bucket: 'municipal-uploads',
                    provider: 'supabase'
                },
                status: 'pending',
                createdAt: serverTimestamp(),
                userAgent: navigator.userAgent
            });

            setStatus('success');
        } catch (error) {
            console.error("Registration failed:", error);
            setErrorMsg(error.message || "Registration failed. Please try again.");
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="municipal-theme flex items-center justify-center p-6 pt-24 min-h-screen">
                <div className="muni-card max-w-md w-full p-8 text-center border-t-4 border-[#046A38]">
                    <div className="flex justify-center mb-6">
                        <CheckCircle size={64} className="text-[#046A38]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Registration Received</h2>
                    <p className="text-[var(--muni-text-muted)] mb-6">
                        Your application for the Fixit Municipal Dashboard is under review.
                    </p>
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)] mb-6">
                        <p className="font-mono text-sm text-[#046A38]">Expected SLA: 48–72 Hours</p>
                    </div>
                    <p className="text-sm text-[var(--muni-text-muted)]">
                        You will receive an email at <span className="text-white">{formData.official_email}</span> with further instructions.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="municipal-theme min-h-screen page-content p-6 md:p-12 flex justify-center">
            <div className="w-full max-w-3xl">
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">Municipal Registration</h1>
                    <p className="text-[var(--muni-text-muted)]">
                        Secure access request for Municipal Authority Dashboard.
                        <br />
                        <span className="text-xs font-mono text-[#FF671F] font-bold">VERIFIED GOVERNMENT OFFICIALS ONLY</span>
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="muni-card p-6 md:p-8 space-y-8 border-t-4 border-[#FF671F]">
                    {/* Organization Details */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <span className="w-1 h-6 bg-[#FF671F] block rounded-full"></span>
                            Organization Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Organization Name</label>
                                <input
                                    name="organisation_name"
                                    required
                                    className="muni-input focus:border-[#FF671F]"
                                    placeholder="e.g. Kurnool Municipal Corporation"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Official Email</label>
                                <input
                                    name="official_email"
                                    type="email"
                                    required
                                    className="muni-input focus:border-[#FF671F]"
                                    placeholder="admin@kurnool.gov.in"
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-[var(--muni-text-muted)]">Must be a .gov.in or official domain.</p>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Office Address</label>
                                <input
                                    name="office_address"
                                    required
                                    className="muni-input focus:border-[#FF671F]"
                                    placeholder="Full physical address of the municipal office"
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Admin Details */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <span className="w-1 h-6 bg-white block rounded-full"></span>
                            Administrator Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Full Name</label>
                                <input
                                    name="admin_full_name"
                                    required
                                    className="muni-input focus:border-white"
                                    placeholder="Nodal Officer Name"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Designation</label>
                                <input
                                    name="designation"
                                    required
                                    className="muni-input focus:border-white"
                                    placeholder="e.g. Municipal Commissioner"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Office Phone</label>
                                <input
                                    name="office_phone"
                                    required
                                    className="muni-input focus:border-white"
                                    placeholder="Landline with STD code"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Mobile Phone</label>
                                <input
                                    name="mobile_phone"
                                    required
                                    className="muni-input focus:border-white"
                                    placeholder="+91 XXXXX XXXXX"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Password (Remember this Password)</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="muni-input focus:border-white"
                                    placeholder="Set a secure password"
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Verification Docs */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <span className="w-1 h-6 bg-[#046A38] block rounded-full"></span>
                            Verification Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Government ID (Upload)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        name="government_id"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <div className="muni-input flex items-center gap-2 cursor-pointer hover:border-[#046A38]">
                                        <Upload size={16} className="text-[#046A38]" />
                                        <span className="truncate">
                                            {files.government_id ? files.government_id.name : "Choose File (PDF/JPG)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Proof of Affiliation (Letterhead)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        name="proof_of_affiliation"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <div className="muni-input flex items-center gap-2 cursor-pointer hover:border-[#046A38]">
                                        <Upload size={16} className="text-[#046A38]" />
                                        <span className="truncate">
                                            {files.proof_of_affiliation ? files.proof_of_affiliation.name : "Choose File (PDF/JPG)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm text-[var(--muni-text-muted)]">Brief Purpose / Notes</label>
                                <textarea
                                    name="brief_purpose"
                                    className="muni-input h-24 resize-none focus:border-[#046A38]"
                                    placeholder="Describe your department's role in using Fixit..."
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span className="text-sm">{errorMsg}</span>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={status === 'uploading' || status === 'submitting'}
                            className="bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] text-black font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            {(status === 'uploading' || status === 'submitting') && <Loader2 size={16} className="animate-spin" />}
                            {status === 'uploading' ? 'Uploading Docs...' : status === 'submitting' ? 'Submitting...' : 'Submit Registration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
