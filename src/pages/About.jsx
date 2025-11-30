import { motion } from 'framer-motion';
import { FaUsers, FaLightbulb, FaHandshake, FaCode } from 'react-icons/fa';
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
                        className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
                    >
                        About <span className="text-[#FF671F]">LetsFixIndia</span><span className="text-white"></span>
                    </motion.h1>
                    <p className="text-[var(--muni-text-muted)] text-lg max-w-2xl mx-auto">
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

                    <div className="flex justify-center gap-4">
                        <a href="https://www.wedevit.in" target="_blank" rel="noopener noreferrer" className="muni-btn-primary no-underline">
                            Visit Devit
                        </a>
                        <a href="https://www.wedevit.in/contact" target="_blank" rel="noopener noreferrer" className="muni-btn-ghost no-underline">
                            Contact Us
                        </a>
                    </div>
                </motion.section>

            </main>
        </div>
    );
};

export default About;
