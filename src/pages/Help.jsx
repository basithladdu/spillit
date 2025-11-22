import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaQuestionCircle, FaMapMarkedAlt, FaVoteYea, FaTrophy, 
  FaUserShield, FaLock, FaRoute, FaInfoCircle 
} from 'react-icons/fa';
import { MdSupportAgent } from 'react-icons/md';

// --- Sub-Component: FAQ Card ---
const FaqCard = ({ question, answer, icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-[#0F172A]/70 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 hover:bg-[#0F172A]/90 transition-all duration-300 group h-full"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-white/5 text-cyan-400 group-hover:text-white group-hover:bg-cyan-500/20 transition-colors shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
            {question}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

function Help() {
  const faqs = [
    {
      question: "How do I report an issue?",
      answer: "Click the 'Report' button on the Map page. You'll be asked to provide a photo, a description, and the severity level. The app automatically captures your location.",
      icon: <FaMapMarkedAlt size={20} />
    },
    {
      question: "What do the statuses mean?",
      answer: "Reports track through three states: 'New' (just submitted), 'In-Progress' (assigned to a department), and 'Resolved' (fixed and verified).",
      icon: <FaInfoCircle size={20} />
    },
    {
      question: "Why only one upvote?",
      answer: "To ensure fair community data, upvoting is limited to one vote per user per issue. You can toggle your vote at any time to remove it.",
      icon: <FaVoteYea size={20} />
    },
    {
      question: "How is the leaderboard ranked?",
      answer: "Departments earn points based on efficiency: +50 points for every Resolved issue and +10 points for every Community Upvote received.",
      icon: <FaTrophy size={20} />
    },
    {
      question: "Automatic assignments?",
      answer: "Our routing engine analyzes the 'Issue Type' (e.g., Pothole, Water Leak) and automatically dispatches the report to the relevant municipal department.",
      icon: <FaRoute size={20} />
    },
    {
      question: "How do I become a moderator?",
      answer: "Moderator access is restricted to verified municipal employees. Please contact your system administrator to request dashboard access.",
      icon: <FaUserShield size={20} />
    },
    {
      question: "Is my data private?",
      answer: "We only store data relevant to the issue (photo, location, description). Your personal user profile is kept private and never shared externally.",
      icon: <FaLock size={20} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A1E] text-gray-200 font-sans selection:bg-cyan-500/30 pb-20 relative overflow-hidden">
      
      {/* --- Background Atmosphere --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="h-20"></div> {/* Navbar Spacer */}

      <main className="container mx-auto px-6 py-10 max-w-6xl relative z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4"
          >
            <MdSupportAgent className="text-4xl text-blue-400" />
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Help Center & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FAQs</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about using Fixit to improve your community.
          </p>
        </div>

        {/* --- FAQ Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <FaqCard 
              key={index}
              {...faq}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* --- Contact Footer --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 text-center relative overflow-hidden"
        >
           <div className="relative z-10">
             <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
             <p className="text-gray-400 mb-6">Our support team is available to assist with technical issues.</p>
             <button className="px-8 py-3 rounded-full bg-white text-[#0A0A1E] font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
               Contact Support
             </button>
           </div>
           {/* Decorative Overlay */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </motion.div>

      </main>
    </div>
  );
}

export default Help;