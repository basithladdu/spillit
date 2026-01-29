import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Video, FileText, CheckCircle, MapPin, Users, Award, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const YoutubeSubmission = () => {
    // Hardcoded to "White" theme style
    const isLightMode = true;
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleAutoLogin = async (e) => {
        if (e) e.preventDefault();
        setIsLoggingIn(true);
        try {
            await login('india@gmail.com', 'india');
            navigate('/municipal-dashboard');
        } catch (error) {
            console.error("Auto-login failed:", error);
            setIsLoggingIn(false);
        }
    };

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
                            <img src="/india.png" alt="LetsFixIndia Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
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

                {/* Video Embed Section - MOVED TO TOP */}
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
                            <h3 className="font-bold text-slate-800">3-Minute Prototype Pitch & Demonstration</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">National Innovation Contest</span>
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
                            "We have Submitted video as part of National Innovation Contest of Ministry of Education Innovation Cell & AICTE"
                        </p>
                        <p className="mt-2 text-center text-xs text-slate-400">
                            This video introduces our full team, demonstrates the live mobile reporting flow, and showcases the backend dashboard functionality used by city administrators.
                        </p>
                    </div>
                </motion.div>

                {/* Live Prototype Access Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 blur-3xl pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="p-8 md:p-10 relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="text-[#FF671F]" size={24} />
                            <h2 className="text-2xl font-bold">Live Prototype Access <span className="text-slate-400 text-base font-normal">(Hardcoded for Evaluators)</span></h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-slate-300">To facilitate a seamless evaluation of our Municipal Dashboard, please use the following credentials to bypass standard authentication:</p>
                                <div className="pt-2">
                                    <button
                                        onClick={handleAutoLogin}
                                        disabled={isLoggingIn}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF671F] text-white font-bold hover:bg-[#FF671F]/90 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <LayoutDashboard size={18} />}
                                        Launch Live Dashboard
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3 backdrop-blur-sm">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Login Portal</span>
                                    <span className="text-xs font-mono text-slate-400">/municipal-dashboard</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400">Email Address</p>
                                    <p className="font-mono text-[#4ade80] font-bold text-lg select-all">india@gmail.com</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400">Password</p>
                                    <p className="font-mono text-[#4ade80] font-bold text-lg select-all">india</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Credentials Card (Updated) */}
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
                                    <span className="text-sm text-slate-500 font-medium">Already Exhibited</span>
                                    <span className="text-sm font-bold text-slate-900 text-right">Vijayawada SRM UNIVERSITY</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500 font-medium">Team Size</span>
                                    <span className="text-sm font-bold text-slate-900">4 Core Members + 1 Mentor</span>
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

                {/* Development Team Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Users className="text-blue-600" size={20} />
                        <h3 className="font-bold text-slate-800">The Development Team</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">SB</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Shaik Abdul Basith</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">Lead Developer & Project Leader</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">SM</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Shaik Abdul Muqeeth</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">Co-Developer</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">SS</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Shaik Abdus Sami</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">Co-Developer</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">A</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Aadil</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">Co-Developer</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-[#FF671F]/10 flex items-center justify-center font-bold text-[#FF671F]">DU</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Dinesh Uppara</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">Mentor</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-base font-medium text-slate-700">G. Pulla Reddy Engineering College, Kurnool</p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Link */}
                <div className="text-center pt-8 pb-12">
                    <button
                        onClick={handleAutoLogin}
                        disabled={isLoggingIn}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md disabled:opacity-70"
                    >
                        {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LayoutDashboard size={20} />}
                        Direct Dashboard Login
                    </button>
                </div>

            </div>
        </div>
    );
};

export default YoutubeSubmission;
