import { motion } from 'framer-motion';
import { FaUsers, FaLightbulb, FaHandshake, FaCode, FaInstagram, FaTwitter, FaEnvelope, FaGlobe, FaLinkedin } from 'react-icons/fa';
import '../styles/municipal.css';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-12 md:pt-16 pb-20">
            <main className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <div className="text-center mb-6">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-2 tracking-tight"
                    >
                        About <span className="text-[#FF671F]">LetsFixIndia</span><span className="text-white"></span>
                    </motion.h1>
                    <p className="text-[var(--muni-text-muted)] text-base md:text-lg max-w-2xl mx-auto">
                        Empowering citizens to build better communities through technology and transparency.
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
                            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-[var(--muni-text-muted)] leading-relaxed">
                                LetsFixIndia is a mobile-first crowdsourced platform designed to bridge the gap between citizens and municipal authorities. We believe that active citizenship, coupled with responsive governance, is the key to solving civic issues like potholes, garbage dumps, and water leaks. Our goal is to make reporting issues as easy as taking a photo.
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

                {/* How It Works Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#046A38]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaUsers className="text-[#046A38] text-xl" />
                            <h3 className="text-xl font-bold text-white">For Citizens</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm">
                            Simply spot an issue, snap a picture, and upload it. LetsFixIndia automatically captures the location and routes the report to the relevant department. Track the status in real-time.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[#22c55e]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaHandshake className="text-[#22c55e] text-xl" />
                            <h3 className="text-xl font-bold text-white">For Authorities</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm">
                            Access a comprehensive dashboard to view, prioritize, and resolve issues. Gain insights into hotspots and performance metrics to optimize resource allocation.
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

                <Footer />
            </main>
        </div>
    );
};

export default About;
