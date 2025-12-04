import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaArrowRight,
    FaEnvelope,
    FaPhone,
    FaShieldAlt
} from "react-icons/fa";
import "../styles/municipal.css";

// Lazy load the optimized component to improve TBT and initial load
const DonorList = React.lazy(() => import("../components/DonorList"));

const Donors = () => {
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

                {/* Optimized Data Loading with Suspense */}
                <Suspense fallback={
                    <div className="flex justify-center py-32">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#FF671F]/30 border-t-[#FF671F] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FaShieldAlt className="text-[#FF671F] text-xs animate-pulse" />
                            </div>
                        </div>
                    </div>
                }>
                    <DonorList />
                </Suspense>

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
