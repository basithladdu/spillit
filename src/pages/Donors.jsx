import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaHeart,
    FaStar,
    FaCheckCircle,
    FaExternalLinkAlt,
    FaShieldAlt,
    FaArrowRight,
    FaEnvelope,
    FaPhone
} from "react-icons/fa";
import "../styles/municipal.css";

const Donors = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonors = async () => {
            try {
                const q = query(
                    collection(db, "fixit_donors"),
                    where("verified", "==", true)
                );
                const snapshot = await getDocs(q);

                const fetchedDonors = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .sort((a, b) => (b.amount || 0) - (a.amount || 0));

                setDonors(fetchedDonors);
            } catch (error) {
                console.error("Error fetching donors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonors();
    }, []);

    const formatHiddenAmount = (amount) => {
        if (!amount) return "INR ****";
        const hidden = "*".repeat(amount.toString().length);
        return `INR ${hidden}`;
    };

    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20">
            <main className="container mx-auto px-6 max-w-7xl">

                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#FF671F] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase relative z-10"
                    >
                        Civic{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] to-[#FF8F50]">
                            Heroes
                        </span>
                    </motion.h1>

                    <p className="text-[var(--muni-text-muted)] text-lg md:text-xl max-w-3xl mx-auto font-light relative z-10">
                        Honoring the people who choose impact over comfort.
                        Every contribution strengthens the system that we’re trying to build.
                    </p>

                    {/* 🔥 Founder Message */}


                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-10 relative z-10"
                    >
                        <Link
                            to="/become-donor"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FF671F] to-[#FF8F50] text-black font-black text-lg px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-[#FF671F]/30 hover:scale-105 transition-all uppercase tracking-wider"
                        >
                            Become a Donor <FaArrowRight />
                        </Link>
                    </motion.div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#FF671F]/30 border-t-[#FF671F] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FaShieldAlt className="text-[#FF671F] text-xs animate-pulse" />
                            </div>
                        </div>
                    </div>
                ) : donors.length === 0 ? (

                    /* No Donors Yet */
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

                ) : (
                    /* Donor Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {donors.map((donor, index) => (
                            <motion.div
                                key={donor.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.07 }}
                                className="relative group bg-[#09090b] rounded-2xl overflow-hidden border border-[#27272a] hover:border-[#FF671F]/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,103,31,0.1)]"
                            >
                                <div className="p-8">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-5 mb-6">
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-[#18181b] text-[#FF671F] border border-[#2c2c2c] group-hover:border-[#FF671F]/30 transition-colors"
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
                                            <FaStar className="text-[#FF671F]/30 absolute -top-4 -left-2 text-lg" />
                                            <p className="text-[var(--muni-text-muted)] text-sm italic leading-relaxed pl-4 border-l-2 border-[#FF671F]/30">
                                                "{donor.message}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Verification */}
                                    {(donor.allocation || donor.proof) && (
                                        <div className="bg-[#046A38]/10 border border-[#046A38]/30 rounded-xl p-4 mb-5">
                                            <div className="text-[10px] text-[#25b35c] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <FaCheckCircle /> Verified Impact
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
                                                >
                                                    View Proof of Work
                                                    <FaExternalLinkAlt size={10} />
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
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-24 border-t border-[#27272a] pt-12 text-center">
                    <h3 className="text-xl font-bold text-white mb-6">Have Questions?</h3>
                    <div className="flex flex-col md:flex-row justify-center gap-8">
                        <a href="mailto:workwithdevit@gmail.com" className="flex items-center justify-center gap-3 text-[var(--muni-text-muted)] hover:text-[#FF671F] transition-colors">
                            <FaEnvelope size={20} />
                            <span>workwithdevit@gmail.com</span>
                        </a>
                        <a href="tel:+919553321211" className="flex items-center justify-center gap-3 text-[var(--muni-text-muted)] hover:text-[#FF671F] transition-colors">
                            <FaPhone size={20} />
                            <span>+91 9553321211</span>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Donors;
