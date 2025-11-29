import { motion } from 'framer-motion';
import { MdSupportAgent } from 'react-icons/md';
import { FaMapMarkedAlt, FaInfoCircle, FaTrophy, FaRoute, FaUserShield, FaLock } from 'react-icons/fa';
import '../styles/municipal.css';

// --- Sub-Component: FAQ Card ---
const FaqCard = ({ question, answer, icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="muni-card p-6 h-full hover:border-[#FF671F] transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-white/5 text-[#FF671F] group-hover:text-white group-hover:bg-[#FF671F] transition-colors shrink-0 border border-[#FF671F]/20">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FF671F] transition-colors">
            {question}
          </h3>
          <p className="text-[var(--muni-text-muted)] text-sm leading-relaxed">
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
    <div className="municipal-theme min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans pt-24 pb-20">

      <main className="container mx-auto px-6 max-w-6xl">

        {/* --- Header --- */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 rounded-full bg-[#046A38]/10 border border-[#046A38]/30 mb-6"
          >
            <MdSupportAgent className="text-4xl text-[#046A38]" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Help Center & <span className="text-[#FF671F]">FAQs</span>
          </h1>
          <p className="text-[var(--muni-text-muted)] text-lg max-w-2xl mx-auto">
            Everything you need to know about using Fixit to improve your community.
          </p>
        </div>

        {/* --- FAQ Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          className="mt-16 muni-card p-8 border-t-4 border-[#046A38] text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
            <p className="text-[var(--muni-text-muted)] mb-6">Our support team is available to assist with technical issues.</p>
            <button className="muni-btn-primary px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">
              Contact Support
            </button>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

export default Help;