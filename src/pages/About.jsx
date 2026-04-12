import { motion } from 'framer-motion';
import { Users, Lightbulb, Heart, Code, Instagram, Twitter, Mail, Globe, Linkedin, MapPin, Camera } from 'lucide-react';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="min-h-screen bg-[var(--spillit-bg)] text-[var(--spillit-text-main)] font-sans pt-12 md:pt-16 pb-20 overflow-x-hidden">
            <main className="container mx-auto px-6 max-w-5xl relative z-10">

                {/* Header */}
                <div className="text-center mb-16 pt-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-[var(--spillit-primary)] to-[var(--spillit-secondary)] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-[var(--spillit-primary)]/20"
                    >
                        <Heart size={32} fill="currentColor" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-6 tracking-tight heading-font uppercase"
                    >
                        Spill <span className="text-[var(--spillit-primary)] italic">It</span>
                    </motion.h1>
                    <p className="text-[var(--spillit-text-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        A digital sanctuary for anonymous memories, pinned forever to the spots where life happened.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-10 border-l-4 border-[var(--spillit-primary)]"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-[var(--spillit-primary)]/10 rounded-2xl text-[var(--spillit-primary)]">
                                <Lightbulb size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white heading-font uppercase tracking-widest">The Vision</h2>
                        </div>
                        <p className="text-[var(--spillit-text-muted)] leading-relaxed text-base">
                            Spill It is a map-based memory board. We believe that every coordinate on Earth holds a story — a first kiss, a lonely walk, a sudden realization, or a moment of pure joy. We built this to give those fleeting moments a permanent home, tied to the very ground where they occurred.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-10 border-l-4 border-[var(--spillit-secondary)]"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-[var(--spillit-secondary)]/10 rounded-2xl text-[var(--spillit-secondary)]">
                                <Users size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white heading-font uppercase tracking-widest">The Community</h2>
                        </div>
                        <p className="text-[var(--spillit-text-muted)] leading-relaxed text-base">
                            Spill It is for the dreamers, the travelers, and the locals who see beauty in the mundane. It&apos;s a shared public journal where anonymity breeds authenticity. No judgment, no filters (except the ones on the map), just real moments from real people.
                        </p>
                    </motion.div>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <div className="glass-card p-8 text-center space-y-4 border-white/5">
                        <Camera size={32} className="mx-auto text-[var(--spillit-primary)]" />
                        <h3 className="font-bold text-white uppercase tracking-widest heading-font">Snap</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Capture the scene exactly as it is. A photo is worth a thousand memories.</p>
                    </div>
                    <div className="glass-card p-8 text-center space-y-4 border-white/5">
                        <MapPin size={32} className="mx-auto text-[var(--spillit-secondary)]" />
                        <h3 className="font-bold text-white uppercase tracking-widest heading-font">Pin</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Drop it on the map. Let your story live forever at that specific point in space.</p>
                    </div>
                    <div className="glass-card p-8 text-center space-y-4 border-white/5">
                        <Ghost size={32} className="mx-auto text-[var(--spillit-accent)]" />
                        <h3 className="font-bold text-white uppercase tracking-widest heading-font">Spill</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Write what you felt. Share it anonymously with the world.</p>
                    </div>
                </div>

                {/* Quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-20 text-center"
                >
                    <div className="relative p-12 bg-white/2 border border-white/5 rounded-[40px] overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[var(--spillit-primary)] to-[var(--spillit-secondary)]"></div>
                        <p className="text-2xl md:text-3xl text-gray-200 italic font-serif leading-relaxed px-4">
                            &quot;In a world of constant moving, Spill It is our way of saying: something happened here, and it mattered.&quot;
                        </p>
                    </div>
                </motion.div>

                {/* Team / Contact */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center pb-20"
                >
                    <div className="inline-block p-4 bg-white/5 rounded-3xl mb-8 border border-white/10">
                        <Code className="text-white" size={24} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 heading-font tracking-widest uppercase">Built with Love</h2>
                    <p className="text-[var(--spillit-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Spill It is a small project from the folks at Devit. We love maps, we love stories, and we love building things that make the internet a little more human.
                    </p>

                    <div className="flex justify-center gap-6 flex-wrap">
                        <a href="mailto:workwithdevit@gmail.com" className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-[var(--spillit-primary)] hover:text-white transition-all shadow-xl">
                            <Mail size={18} /> Contact Us
                        </a>
                        <a href="https://instagram.com/devit.company" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                            <Instagram size={18} /> Instagram
                        </a>
                    </div>
                </motion.section>

                <Footer />
            </main>
        </div>
    );
};

const Ghost = ({ size, className }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
    </svg>
);

export default About;
