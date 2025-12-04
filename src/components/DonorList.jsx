import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaHeart,
    FaStar,
    FaCheckCircle,
    FaExternalLinkAlt,
    FaShieldAlt
} from "react-icons/fa";
import "../styles/municipal.css";

const DonorList = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Optimized: Use onSnapshot for real-time updates and efficient caching
        const q = query(
            collection(db, "fixit_donors"),
            where("verified", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDonors = snapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .sort((a, b) => (b.amount || 0) - (a.amount || 0));

            setDonors(fetchedDonors);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching donors:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatHiddenAmount = (amount) => {
        if (!amount) return "INR ****";
        const hidden = "*".repeat(amount.toString().length);
        return `INR ${hidden}`;
    };

    // Memoize the grid to prevent unnecessary re-renders of the entire list
    const donorGrid = useMemo(() => {
        if (loading) {
            return (
                <div className="flex justify-center py-32" aria-live="polite" aria-label="Loading donors">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#FF671F]/30 border-t-[#FF671F] rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FaShieldAlt className="text-[#FF671F] text-xs animate-pulse" />
                        </div>
                    </div>
                </div>
            );
        }

        if (donors.length === 0) {
            return (
                <div className="text-center py-24 bg-[#09090b] rounded-3xl border border-[#27272a] border-dashed max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-[#FF671F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaHeart size={32} className="text-[#FF671F]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Be the First Supporter
                    </h3>
                    <p className="text-[var(--muni-text-muted)]">
                        Your contribution becomes part of the city's public record forever.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {donors.map((donor, index) => (
                        <motion.div
                            key={donor.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }} // Reduced delay for faster perception
                            className="relative group bg-[#09090b] rounded-2xl overflow-hidden border border-[#27272a] hover:border-[#FF671F]/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,103,31,0.1)]"
                        >
                            <div className="p-8">
                                {/* Avatar */}
                                <div className="flex items-center gap-5 mb-6">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-[#18181b] text-[#FF671F] border border-[#2c2c2c] group-hover:border-[#FF671F]/30 transition-colors"
                                        aria-hidden="true"
                                    >
                                        {donor.name
                                            ? donor.name.charAt(0).toUpperCase()
                                            : "?"}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-[#FF671F] transition-colors">
                                            {donor.name || "Anonymous"}
                                        </h3>
                                        <div className="text-[#FF671F] font-mono font-bold text-sm">
                                            {donor.hideAmount
                                                ? formatHiddenAmount(donor.amount)
                                                : `₹${donor.amount?.toLocaleString()}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                {donor.message && (
                                    <div className="mb-6 relative">
                                        <FaStar className="text-[#FF671F]/30 absolute -top-4 -left-2 text-lg" aria-hidden="true" />
                                        <p className="text-[var(--muni-text-muted)] text-sm italic leading-relaxed pl-4 border-l-2 border-[#FF671F]/30">
                                            "{donor.message}"
                                        </p>
                                    </div>
                                )}

                                {/* Verification */}
                                {(donor.allocation || donor.proof) && (
                                    <div className="bg-[#046A38]/10 border border-[#046A38]/30 rounded-xl p-4 mb-5">
                                        <div className="text-[10px] text-[#25b35c] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <FaCheckCircle aria-hidden="true" /> Verified Impact
                                        </div>

                                        {donor.allocation && (
                                            <p className="text-xs text-gray-300 mb-2">
                                                <span className="text-[var(--muni-text-muted)]">
                                                    Funded:
                                                </span>{" "}
                                                {donor.allocation}
                                            </p>
                                        )}

                                        {donor.proof && (
                                            <a
                                                href={donor.proof}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#FF671F] hover:text-[#ff9050] flex items-center gap-1"
                                                aria-label={`View proof of work for ${donor.name || 'donor'}`}
                                            >
                                                View Proof of Work
                                                <FaExternalLinkAlt size={10} aria-hidden="true" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-[#27272a] flex justify-between text-[10px] text-[var(--muni-text-muted)] font-mono uppercase">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#25b35c]"></span>
                                        Verified
                                    </span>
                                    {donor.timestamp && (
                                        <span>
                                            {new Date(
                                                donor.timestamp.seconds * 1000
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    }, [donors, loading]);

    return donorGrid;
};

export default React.memo(DonorList);
