import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Video, FileText, CheckCircle, MapPin, Users, Award, ExternalLink, Globe, Loader2, TrendingUp, Activity, BarChart3, Zap, Code, Database, Smartphone, Cloud, Shield, Rocket } from 'lucide-react';
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
                        <div style={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.2500%', paddingBottom: 0, boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', marginTop: '1.6em', marginBottom: '0.9em', overflow: 'hidden', borderRadius: '8px', willChange: 'transform' }}>
                            <iframe
                                loading="lazy"
                                style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0 }}
                                src="https://www.canva.com/design/DAG_-5v3glY/8SIPCXw7KWATWyFbj0sPKw/watch?embed"
                                allowFullScreen
                                allow="fullscreen"
                            >
                            </iframe>
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

                {/* Main Frontend Website Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Main Frontend Website</h3>
                                <p className="text-slate-500 text-sm">Explore the citizen-facing platform and interactive reporting map.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all hover:border-slate-300"
                        >
                            <ExternalLink size={18} />
                            Visit Homepage
                        </button>
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

                {/* Platform Statistics Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-gradient-to-br from-[#FF671F] to-[#046A38] rounded-2xl shadow-xl overflow-hidden text-white p-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="text-white" size={28} />
                        <h2 className="text-2xl font-bold">Prototype Development Stats</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={20} className="text-green-300" />
                                <p className="text-xs uppercase tracking-wider text-white/70">Test Reports</p>
                            </div>
                            <p className="text-3xl font-bold">127</p>
                            <p className="text-xs text-white/60 mt-1">During testing phase</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={20} className="text-blue-300" />
                                <p className="text-xs uppercase tracking-wider text-white/70">Test Users</p>
                            </div>
                            <p className="text-3xl font-bold">43</p>
                            <p className="text-xs text-white/60 mt-1">Team & beta testers</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={20} className="text-green-300" />
                                <p className="text-xs uppercase tracking-wider text-white/70">Features Built</p>
                            </div>
                            <p className="text-3xl font-bold">18</p>
                            <p className="text-xs text-white/60 mt-1">Core functionalities</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={20} className="text-yellow-300" />
                                <p className="text-xs uppercase tracking-wider text-white/70">Dev Time</p>
                            </div>
                            <p className="text-3xl font-bold">6mo</p>
                            <p className="text-xs text-white/60 mt-1">Jul 2025 - Jan 2026</p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Impact Growth Chart */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <TrendingUp className="text-green-600" size={20} />
                        <h3 className="font-bold text-slate-800">Development Progress (Jul 2025 - Jan 2026)</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {[
                                { month: 'July 2025', features: 4, completed: 4, percentage: 100 },
                                { month: 'August 2025', features: 6, completed: 5, percentage: 83 },
                                { month: 'September 2025', features: 8, completed: 7, percentage: 88 },
                                { month: 'October 2025', features: 12, completed: 11, percentage: 92 },
                                { month: 'November 2025', features: 15, completed: 14, percentage: 93 },
                                { month: 'December 2025', features: 18, completed: 17, percentage: 94 },
                                { month: 'January 2026', features: 18, completed: 18, percentage: 100 }
                            ].map((data, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">{data.month}</span>
                                        <span className="text-xs text-slate-500">{data.features} planned • {data.completed} completed</span>
                                    </div>
                                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${data.percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            viewport={{ once: true }}
                                            className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                        />
                                        <span className="absolute right-2 top-0 text-[10px] font-bold text-white">{data.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Feature Implementation Progress */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Rocket className="text-[#FF671F]" size={20} />
                        <h3 className="font-bold text-slate-800">Feature Implementation Status</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { feature: 'Real-time Issue Reporting', progress: 100, color: 'bg-green-500' },
                                { feature: 'GPS Auto-tagging', progress: 100, color: 'bg-green-500' },
                                { feature: 'Municipal Dashboard', progress: 100, color: 'bg-green-500' },
                                { feature: 'AI Issue Classification', progress: 85, color: 'bg-blue-500' },
                                { feature: 'Push Notifications', progress: 90, color: 'bg-blue-500' },
                                { feature: 'Analytics & Heatmaps', progress: 95, color: 'bg-blue-500' },
                                { feature: 'Multi-language Support', progress: 70, color: 'bg-yellow-500' },
                                { feature: 'Citizen Feedback System', progress: 80, color: 'bg-yellow-500' }
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">{item.feature}</span>
                                        <span className="text-xs font-bold text-slate-900">{item.progress}%</span>
                                    </div>
                                    <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.progress}%` }}
                                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                                            viewport={{ once: true }}
                                            className={`absolute h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Technology Stack */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Code className="text-purple-600" size={20} />
                        <h3 className="font-bold text-slate-800">Technology Stack</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Smartphone className="text-blue-600" size={18} />
                                    <h4 className="font-bold text-slate-700">Frontend</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['React.js', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Mapbox GL'].map((tech, idx) => (
                                        <motion.span
                                            key={idx}
                                            whileHover={{ scale: 1.05 }}
                                            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200"
                                        >
                                            {tech}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Database className="text-green-600" size={18} />
                                    <h4 className="font-bold text-slate-700">Backend</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['Node.js', 'Express', 'MongoDB', 'Firebase', 'JWT Auth'].map((tech, idx) => (
                                        <motion.span
                                            key={idx}
                                            whileHover={{ scale: 1.05 }}
                                            className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200"
                                        >
                                            {tech}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Cloud className="text-orange-600" size={18} />
                                    <h4 className="font-bold text-slate-700">Infrastructure</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['Vercel', 'Firebase Hosting', 'Cloudinary', 'GitHub Actions'].map((tech, idx) => (
                                        <motion.span
                                            key={idx}
                                            whileHover={{ scale: 1.05 }}
                                            className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-200"
                                        >
                                            {tech}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Development Timeline */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Activity className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800">Development Timeline</h3>
                    </div>
                    <div className="p-6">
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                            <div className="space-y-6">
                                {[
                                    { phase: 'Ideation & Research', date: 'Jul 2025', status: 'completed', description: 'Problem identification and solution design' },
                                    { phase: 'Initial Prototype', date: 'Aug 2025', status: 'completed', description: 'Basic map and reporting features' },
                                    { phase: 'Core Development', date: 'Sep 2025', status: 'completed', description: 'Firebase integration and authentication' },
                                    { phase: 'Dashboard Creation', date: 'Oct 2025', status: 'completed', description: 'Municipal admin panel development' },
                                    { phase: 'Testing & Polish', date: 'Nov-Dec 2025', status: 'completed', description: 'Bug fixes and UI improvements' },
                                    { phase: 'Innovation Contest', date: 'Jan 2026', status: 'active', description: 'National-level presentation and evaluation' },
                                    { phase: 'Future Enhancements', date: 'Post-Contest', status: 'planned', description: 'Based on feedback and evaluation' }
                                ].map((milestone, idx) => (
                                    <div key={idx} className="relative flex gap-4 items-start">
                                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${milestone.status === 'completed' ? 'bg-green-500' :
                                            milestone.status === 'active' ? 'bg-blue-500 animate-pulse' :
                                                'bg-slate-300'
                                            }`}>
                                            {milestone.status === 'completed' && <CheckCircle size={16} className="text-white" />}
                                            {milestone.status === 'active' && <Zap size={16} className="text-white" />}
                                            {milestone.status === 'planned' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-slate-900">{milestone.phase}</h4>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{milestone.date}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{milestone.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Performance Analytics Dashboard */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <Shield className="text-emerald-600" size={20} />
                        <h3 className="font-bold text-slate-800">System Performance & Reliability</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="text-4xl font-bold text-green-600 mb-2">~95%</div>
                                <div className="text-sm font-medium text-slate-700">Uptime</div>
                                <div className="text-xs text-slate-500 mt-1">Testing period</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                <div className="text-4xl font-bold text-blue-600 mb-2">~2s</div>
                                <div className="text-sm font-medium text-slate-700">Load Time</div>
                                <div className="text-xs text-slate-500 mt-1">Average on 4G</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                <div className="text-4xl font-bold text-purple-600 mb-2">Good</div>
                                <div className="text-sm font-medium text-slate-700">Feedback</div>
                                <div className="text-xs text-slate-500 mt-1">From testers</div>
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
        </div >
    );
};

export default YoutubeSubmission;
