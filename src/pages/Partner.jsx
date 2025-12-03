import React from 'react';
import { motion } from 'framer-motion';
import { FaHandshake, FaMoneyBillWave, FaBuilding, FaGavel, FaLightbulb, FaUsers, FaEnvelope, FaPhone } from 'react-icons/fa';
import '../styles/municipal.css';

const Partner = () => {
    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20">
            <main className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
                    >
                        Partner with <span className="text-[#FF671F]">Us</span>
                    </motion.h1>
                    <p className="text-[var(--muni-text-muted)] text-lg max-w-2xl mx-auto">
                        Join us in transforming civic infrastructure through technology and collaboration.
                    </p>

                    <p className="text-[var(--muni-text-muted)] text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-medium opacity-90">
                        <span className="text-white font-semibold">
                            “We’re not trying to build a fancy app
                        </span>{" "}
                        we’re building something India has needed for decades.
                        We’ve seen how civic issues get ignored, buried, or passed
                        around without accountability. LetsFixIndia is our attempt to finally
                        bring transparency, public proof, and real responsibility to a
                        system that affects all 1.4 billion of us. We think it's worth giving it a shot.”
                    </p>
                </div>

                {/* Introduction */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="muni-card p-8 mb-12 border-t-4 border-[#FF671F]"
                >
                    <p className="text-[var(--muni-text-muted)] leading-relaxed text-lg">
                        We are actively seeking collaborations to scale our impact. Whether you represent a <strong>Municipality</strong>, <strong>Government Body</strong>, <strong>NGO</strong>, or are looking for <strong>CSR (Corporate Social Responsibility)</strong> opportunities or <strong>Investment</strong> or <strong>Incubation support</strong>, we want to work with you to transform civic infrastructure.
                    </p>
                </motion.section>

                {/* How You Can Help */}
                <h2 className="text-3xl font-bold text-white mb-8 text-center">How You Can Help</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

                    {/* Financial Support */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#22c55e]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaMoneyBillWave className="text-[#22c55e] text-xl" />
                            <h3 className="text-xl font-bold text-white">Financial Support</h3>
                        </div>
                        <ul className="space-y-3 text-[var(--muni-text-muted)] text-sm">
                            <li><strong className="text-white">Investment Capital:</strong> Seeking funding to scale operations.</li>
                            <li><strong className="text-white">Grants:</strong> To support expansion beyond Kurnool and enhance platform capabilities.</li>
                        </ul>
                    </motion.div>

                    {/* Strategic & Partnership Support */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#FF671F]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaHandshake className="text-[#FF671F] text-xl" />
                            <h3 className="text-xl font-bold text-white">Strategic Partnerships</h3>
                        </div>
                        <ul className="space-y-3 text-[var(--muni-text-muted)] text-sm">
                            <li><strong className="text-white">Government Bodies:</strong> Official partnerships for system adoption and data sharing.</li>
                            <li><strong className="text-white">CSR Funding:</strong> Sponsorship from Corporates/NGOs for resolution drives (e.g., pothole repairs, cleanups).</li>
                        </ul>
                    </motion.div>

                    {/* Operational & In-Kind Support */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#046A38]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaGavel className="text-[#046A38] text-xl" />
                            <h3 className="text-xl font-bold text-white">Operational Support</h3>
                        </div>
                        <ul className="space-y-3 text-[var(--muni-text-muted)] text-sm">
                            <li><strong className="text-white">Legal Assistance:</strong> Help with navigating government regulations and contracting.</li>
                            <li><strong className="text-white">Incubation:</strong> Mentorship, resources, and technical guidance (e.g., AICTE, IIC).</li>
                        </ul>
                    </motion.div>

                    {/* Community Support */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-blue-500"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaUsers className="text-blue-500 text-xl" />
                            <h3 className="text-xl font-bold text-white">Community Support</h3>
                        </div>
                        <ul className="space-y-3 text-[var(--muni-text-muted)] text-sm">
                            <li><strong className="text-white">Feedback & Upvotes:</strong> Help us prioritize issues and improve the platform.</li>
                            <li><strong className="text-white">Early Adopters:</strong> Join us in testing and refining the solution.</li>
                        </ul>
                    </motion.div>
                </div>

                {/* Get in Touch */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center bg-white/5 rounded-2xl p-8 border border-white/10"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
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
                </motion.section>

            </main>
        </div>
    );
};

export default Partner;
