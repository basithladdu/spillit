import { motion } from 'framer-motion';
import { FaUsers, FaLightbulb, FaHandshake, FaCode, FaInstagram, FaTwitter, FaEnvelope, FaGlobe, FaLinkedin } from 'react-icons/fa';
import '../styles/municipal.css';

const About = () => {
    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20">
            <main className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white"
                    >
                        Smart Pothole Detection for <span className="text-[#FF671F]">Safer Roads</span>
                    </motion.h1>
                    <p className="text-[var(--muni-text-muted)] text-lg max-w-2xl mx-auto">
                        Transforming road safety with AI-driven detection and accelerated repair workflows for Andhra Pradesh infrastructure.
                    </p>
                </div>

                {/* Mission Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="muni-card p-8 mb-12 border-t-4 border-[#FF671F]"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FF671F]/10 rounded-lg text-[#FF671F]">
                            <FaLightbulb size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">Challenge & Vision</h2>
                            <p className="text-[var(--muni-text-muted)] leading-relaxed mb-4">
                                Manual road inspection is slow and inconsistent. Our vision is an <strong>AI-Enabled Road Defect Management Platform</strong> that uses vehicle-mounted cameras, municipal CCTV feeds, and citizen images to automatically detect potholes and assess severity in real-time.
                            </p>
                            <p className="text-[var(--muni-text-muted)] leading-relaxed">
                                Partnering with the <strong>Roads & Buildings (R&B) Department</strong>, we aim to reduce repair delays, enhance road safety, and ensure high-quality maintenance across urban and rural networks.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Inspirational Quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto mb-16 text-center"
                >
                    <div className="relative p-8 bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#FF671F]"></div>
                        <p className="text-lg text-gray-300 italic font-serif leading-relaxed">
                            "According to all aerodynamic laws, the bumblebee cannot fly because its body weight is not in the right proportion to its wingspan... but ignoring these laws, the bee flies anyway."
                        </p>
                    </div>
                </motion.div>

                {/* Impact Section - Tender Specific */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#046A38]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaUsers className="text-[#046A38] text-xl" />
                            <h3 className="text-lg font-bold text-white">Impact: Citizens</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm leading-relaxed">
                            Safer roads, fewer accidents, and quicker response to reported defects. Transparent visibility into repair status and civic accountability.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="muni-card p-6 border-l-4 border-[#FF671F]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaHandshake className="text-[#FF671F] text-xl" />
                            <h3 className="text-lg font-bold text-white">Impact: Department</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm leading-relaxed">
                            Reduced manual inspections, better maintenance scheduling, and significantly improved field crew productivity through AI-prioritized routing.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="muni-card p-6 border-l-4 border-[#06038D]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaGlobe className="text-[#06038D] text-xl" />
                            <h3 className="text-lg font-bold text-white">Impact: Government</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm leading-relaxed">
                            Strengthened smart city initiatives with transparent, data-driven road maintenance audits and improved digital public infrastructure.
                        </p>
                    </motion.div>
                </div>

                {/* Contribution / Partnership Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="muni-card p-8 mb-16 border-l-4 border-[#FF671F] bg-gradient-to-r from-[#FF671F]/10 to-transparent"
                >
                    <h3 className="text-2xl font-bold text-white mb-4">Partner with Us</h3>
                    <p className="text-[var(--muni-text-muted)] leading-relaxed mb-6">
                        We are actively seeking collaborations to scale our impact. Whether you represent a <strong>Municipality</strong>, <strong>Government Body</strong>, <strong>NGO</strong>, or are looking for <strong>CSR (Corporate Social Responsibility)</strong> opportunities or <strong>Investment or Incubation support</strong>, we want to work with you to transform civic infrastructure.
                    </p>
                    <a href="mailto:workwithdevit@gmail.com" className="inline-flex items-center gap-2 text-[#FF671F] font-bold hover:text-white transition-colors">
                        <FaEnvelope /> Get in Touch
                    </a>
                </motion.div>

                {/* Team Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="inline-block p-3 bg-white/5 rounded-full mb-6">
                        <FaCode className="text-white text-xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-8">Built with Passion</h2>
                    <p className="text-[var(--muni-text-muted)] max-w-2xl mx-auto mb-8">
                        LetsFixIndia is an initiative driven by a community of developers, designers, and civic enthusiasts committed to digital public infrastructure. It is developed by the people at Devit.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <a href="https://www.wedevit.in" target="_blank" rel="noopener noreferrer" className="muni-btn-primary no-underline flex items-center gap-2">
                            <FaGlobe /> Visit Devit
                        </a>
                        <a href="https://www.linkedin.com/company/thedevit" target="_blank" rel="noopener noreferrer" className="muni-btn-ghost no-underline flex items-center gap-2">
                            <FaLinkedin /> LinkedIn
                        </a>
                        <a href="https://instagram.com/devit.company" target="_blank" rel="noopener noreferrer" className="muni-btn-ghost no-underline flex items-center gap-2">
                            <FaInstagram /> devit.company
                        </a>
                        <a href="https://twitter.com/letsfixindia" target="_blank" rel="noopener noreferrer" className="muni-btn-ghost no-underline flex items-center gap-2">
                            <FaTwitter /> @letsfixindia
                        </a>
                        <a href="mailto:workwithdevit@gmail.com" className="muni-btn-ghost no-underline flex items-center gap-2">
                            <FaEnvelope /> Contact Us
                        </a>
                    </div>
                </motion.section>

            </main>
        </div>
    );
};

export default About;
