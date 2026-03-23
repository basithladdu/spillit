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
                        className="text-4xl md:text-6xl font-bold mb-2 tracking-tight heading-font"
                    >
                        About <span className="text-[var(--fixit-primary)]">Spill It</span>
                    </motion.h1>
                    <p className="text-[var(--muni-text-muted)] text-base md:text-lg max-w-2xl mx-auto">
                        A tiny corner of the internet where anyone can spill what they see in the world with a photo, a color, and a message.
                    </p>
                </div>

                {/* What is Spill It? */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="muni-card p-8 mb-12 border-t-4 border-[var(--fixit-primary)]"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-[var(--fixit-primary)]/10 rounded-lg text-[var(--fixit-primary)]">
                            <FaLightbulb size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 heading-font tracking-[0.14em] uppercase">What is Spill It?</h2>
                            <p className="text-[var(--muni-text-muted)] leading-relaxed">
                                Spill It is a playful, map‑based feed where people from anywhere in the world can drop
                                a photo, a short message, a color, and (optionally) who they&apos;re sending it to.
                                It&apos;s not an official complaint system, not a ticketing tool, and not a serious
                                civic reporting platform. It&apos;s closer to a public mood board of broken things,
                                strange sights, small joys, and whatever else you feel like spilling.
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
                            &quot;Most things on the internet are trying to sell you something or fix you somehow.
                            Spill It just wants to hear what&apos;s on your mind and put it on the map.&quot;
                        </p>
                    </div>
                </motion.div>

                {/* How it works */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="muni-card p-6 border-l-4 border-[var(--fixit-primary)]"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FaUsers className="text-[var(--fixit-primary)] text-xl" />
                            <h3 className="text-xl font-bold text-white">For humans on the internet</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm">
                            See something interesting, annoying, beautiful, or broken? Open Spill It, snap a photo,
                            pick a color, write a tiny note, and (optionally) choose who you&apos;re addressing it to.
                            That&apos;s it. No forms, no categories, no &quot;required fields&quot; beyond a photo and your words.
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
                            <h3 className="text-xl font-bold text-white">What it is not</h3>
                        </div>
                        <p className="text-[var(--muni-text-muted)] text-sm">
                            Spill It does not replace your city&apos;s complaint system, emergency services,
                            or formal channels. It does not guarantee that anything will get &quot;resolved&quot;.
                            Think of it as a shared public notebook – a way to see what people are noticing, not an official workflow.
                        </p>
                    </motion.div>
                </div>

                {/* Why we built this */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="muni-card p-8 mb-16 border-l-4 border-[var(--fixit-primary)] bg-gradient-to-r from-[var(--fixit-primary)]/10 to-transparent"
                >
                    <h3 className="text-2xl font-bold text-white mb-4 heading-font tracking-[0.14em] uppercase">Why we built this</h3>
                    <p className="text-[var(--muni-text-muted)] leading-relaxed mb-6">
                        Spill It started as a side project at Devit – we were tinkering with maps, cameras, and real‑time
                        feeds and realised it would be fun to build a place where people can simply drop what they see
                        in the world. No heavy onboarding, no dashboards, just vibes and a live map.
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
                    <h2 className="text-3xl font-bold text-white mb-8 heading-font tracking-[0.16em] uppercase">Built with curiosity</h2>
                    <p className="text-[var(--muni-text-muted)] max-w-2xl mx-auto mb-8">
                        Spill It is a tiny experiment from the folks at Devit. We like building tools for cities and public
                        infrastructure, but we also like weird, playful things that don&apos;t have a strict KPI attached.
                        This is one of those.
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
