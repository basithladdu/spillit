import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Video, FileText, CheckCircle, MapPin, Users, Award, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const YoutubeSubmission = () => {
    // Hardcoded to "White" theme style
    const isLightMode = true;

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className={`min-h-screen font-sans ${isLightMode ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0f172a] text-white'}`}>

            {/* Navbar / Header Area */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FF671F] via-white to-[#046A38] rounded-xl flex items-center justify-center p-[2px] shadow-lg">
                                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                                    <span className="font-bold text-[#046A38] text-xl">F</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">LetsFixIndia</h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Municipal Dashboard Prototype</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-slate-700">Shaik Abdul Basith</p>
                                <p className="text-xs text-slate-500">Lead Developer</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <Users size={20} className="text-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

                {/* Title Section */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={sectionVariants}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                        <FileText size={14} /> Assignment 4 Submission
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Prototype Submission & <span className="text-[#FF671F]">Video Overview</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-slate-600">
                        A comprehensive walkthrough of the LetsFixIndia platform, featuring the Citizen App and the Municipal Command Center.
                    </p>
                </motion.div>

                {/* Credentials Card */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Award className="text-[#046A38]" size={20} />
                        <h3 className="font-bold text-slate-800">Innovation Credentials</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Innovation Title</span>
                                    <span className="text-sm font-bold text-slate-900 text-right">A CrowdSourced Civic Issue Resolution (LetsFixIndia)</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Innovation ID</span>
                                    <span className="text-sm font-mono font-bold text-[#FF671F]">IR2025-990755</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Regional Meet City</span>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1"><MapPin size={14} /> Vijayawada</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Theme/Sector</span>
                                    <span className="text-sm font-bold text-slate-900">Civic Technology</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Status</span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        <CheckCircle size={12} /> Shortlisted
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Willing to Exhibit</span>
                                    <span className="text-sm font-bold text-slate-900">Yes</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Team Size</span>
                                    <span className="text-sm font-bold text-slate-900">2 Participants</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Dashboard Access</span>
                                    <span className="text-sm font-mono text-slate-600 text-right">
                                        U: india@gmail.com <br /> P: india
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* The Innovation Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-[#FF671F] mb-3">For Citizens</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            A real-time interactive map to report issues like potholes or garbage with instant GPS tagging. Citizens can track their report status and receive notifications upon resolution.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-[#046A38] mb-3">For Municipalities</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            A white-themed, smart dashboard to prioritize, assign, and track issue resolution efficiently. Features AI-driven analysis, departmental coordination, and live heatmaps.
                        </p>
                    </div>
                </motion.div>

                {/* Video Embed Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Video className="text-[#FF671F]" size={20} />
                            <h3 className="font-bold text-slate-800">Official Prototype Pitch</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">3 Minute Explanation</span>
                    </div>

                    <div className="p-6 bg-slate-100">
                        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl bg-black relative group">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                title="LetsFixIndia Prototype Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <p className="mt-4 text-center text-sm text-slate-500 italic">
                            Note: This is a placeholder. You will replace this with your actual YouTube URL before final submission.
                        </p>
                    </div>
                </motion.div>

                {/* Footer / Notes */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="text-center space-y-6 pt-8 border-t border-slate-200"
                >
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Submitted By</h4>
                        <p className="text-lg font-bold text-slate-800">Shaik Abdul Basith (Lead) <span className="text-slate-300">|</span> Shaik Abdul Muqeeth</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Organization</h4>
                        <p className="text-base font-medium text-slate-700">G. Pulla Reddy Engineering College, Kurnool</p>
                    </div>

                    <div className="pt-8">
                        <Link to="/municipal-dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                            <LayoutDashboard size={18} /> Enter Dashboard
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default YoutubeSubmission;
