import { motion } from 'framer-motion';
import { MapPin, Ghost, Map, Shield, HelpCircle, MessageSquare, Sparkles } from 'lucide-react';

// --- Sub-Component: FAQ Card ---
const FaqCard = ({ question, answer, icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-8 h-full border border-white/5 hover:border-[var(--spillit-primary)] transition-all group rounded-[32px] overflow-hidden bg-white/2"
    >
      <div className="flex items-start gap-4">
        <div className="p-4 rounded-2xl bg-white/5 text-[var(--spillit-primary)] group-hover:text-white group-hover:bg-[var(--spillit-primary)] transition-colors shrink-0 border border-[var(--spillit-primary)]/20 shadow-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--spillit-primary)] transition-colors heading-font tracking-tight">
            {question}
          </h3>
          <p className="text-[var(--spillit-text-muted)] text-sm leading-relaxed font-medium">
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
      question: "How do I post a memory?",
      answer: "Tap the 'Spill Something' button on the map. Drop a photo, write your memory, and we'll pin it to your current location automatically. No account needed — just pure expression.",
      icon: <MapPin size={22} />
    },
    {
      question: "How do I stay anonymous?",
      answer: "Anonymity is our core. You don't need an account to spill. Your identity is never stored or attached to your memory — no names, no footprints, just the moment.",
      icon: <Ghost size={22} />
    },
    {
      question: "How does the map work?",
      answer: "Every memory is pinned to the exact spot where it happened. Zoom in anywhere in the world and you'll see what people left behind at that location. The map is a global gallery of souls.",
      icon: <Map size={22} />
    },
    {
      question: "Community guidelines",
      answer: "Keep it real and kind. No personal information about others, no harassment, no content that targets individuals. Memories should be about feelings and spots, not attacks.",
      icon: <Shield size={22} />
    },
    {
      question: "Can I see memories near me?",
      answer: "Yes. Use the 'Locate Me' button to center the map on your position and see all the ghost-pills that have been left nearby by other anonymous visitors.",
      icon: <Sparkles size={22} />
    },
    {
      question: "What happens to my post?",
      answer: "Your memory lives on the map forever (unless removed for guideline violations). Anyone visiting that location on Spillit will see your moment, anonymously pinned as a digital artifact.",
      icon: <MessageSquare size={22} />
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--spillit-bg)] text-[var(--spillit-text-main)] font-sans pt-12 md:pt-16 pb-20 overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-[#ff7ec9]/5 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 max-w-6xl relative z-10">

        {/* --- Header --- */}
        <div className="text-center mb-20 pt-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/5 border border-[var(--spillit-primary)]/30 mb-8 shadow-2xl"
          >
            <HelpCircle className="text-[var(--spillit-primary)]" size={32} />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight heading-font">
            Help & <span className="bg-gradient-to-r from-[#ff7ec9] to-[#a78bfa] bg-clip-text text-transparent italic">FAQs</span>
          </h1>
          <p className="text-[var(--spillit-text-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about dropping anonymous memories on the map.
          </p>
        </div>

        {/* --- FAQ Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          className="mt-24 glass-card p-12 rounded-[48px] border-t-4 border-[var(--spillit-secondary)] text-center relative overflow-hidden bg-white/2 shadow-2xl"
        >
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-white mb-4 heading-font uppercase">Still have questions?</h3>
            <p className="text-[var(--spillit-text-muted)] mb-8 max-w-2xl mx-auto leading-relaxed text-base">
              Reach out to our team for any technical issues or feedback. <br />
              Email us at <a href="mailto:workwithdevit@gmail.com" className="text-[var(--spillit-primary)] hover:underline font-bold">workwithdevit@gmail.com</a>
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-[#ff7ec9] hover:text-white transition-all active:scale-95 shadow-pink-500/10">
                Contact Support
              </button>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

export default Help;
