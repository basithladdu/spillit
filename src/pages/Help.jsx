import React from 'react';
import { motion as Motion } from 'framer-motion';
import { MapPin, Ghost, Map, Shield, HelpCircle, MessageSquare, Sparkles, Mail, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    id: 'post',
    question: 'How do I post a memory?',
    answer: "Tap Spill Something on the map. Write your memory, optionally add a photo, and choose a point on the map or enter coordinates. No account required.",
    icon: MapPin,
  },
  {
    id: 'anonymous',
    question: 'How do I stay anonymous?',
    answer: "You can post without an account. Signed-in users can choose to link a memory to their account. Names are not displayed on memories, but your story, photo and location are public.",
    icon: Ghost,
  },
  {
    id: 'map',
    question: 'How does the map work?',
    answer: 'Every memory is pinned to the exact spot where it happened. Zoom anywhere in the world to see what people left behind.',
    icon: Map,
  },
  {
    id: 'guidelines',
    question: 'Community guidelines',
    answer: 'Keep it real and kind. No personal information about others, no harassment. Memories should be about feelings and places, not attacks.',
    icon: Shield,
  },
  {
    id: 'nearby',
    question: 'Can I see memories near me?',
    answer: "Yes. Use Locate Me to center the map on your position and browse spills left nearby by other anonymous visitors.",
    icon: Sparkles,
  },
  {
    id: 'persistence',
    question: 'What happens to my post?',
    answer: 'Your memory lives on the map unless removed for guideline violations. Anyone visiting that spot on Spill It can see it as an anonymous artifact.',
    icon: MessageSquare,
  },
  {
    id: 'account',
    question: 'Do I need an account?',
    answer: (
      <>
        No — posting is anonymous without signing in.{' '}
        <Link to="/register" className="font-bold text-accent hover:underline">Create an account</Link>
        {' '}if you want a profile, account-linked memory stats, or to upvote.
      </>
    ),
    icon: KeyRound,
  },
  {
    id: 'password',
    question: 'Forgot your password?',
    answer: (
      <>
        On the <Link to="/login" className="font-bold text-accent hover:underline">login page</Link>, tap Forgot password?, enter your email, and follow the reset link. You will land on a page to choose a new password.
      </>
    ),
    icon: Mail,
  },
];

const FaqCard = ({ question, answer, icon, delay }) => (
  <Motion.article
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="h-full rounded-2xl border-2 border-foreground bg-card p-8 shadow-pop transition-all hover:border-accent group"
  >
    <div className="flex items-start gap-4">
      <div className="shrink-0 rounded-full border-2 border-foreground bg-accent p-3 text-white shadow-pop transition-colors group-hover:bg-secondary">
        {icon && React.createElement(icon, { size: 22, strokeWidth: 2.5, 'aria-hidden': true })}
      </div>
      <div>
        <h3 className="heading-font mb-2 text-xl font-bold text-foreground">{question}</h3>
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">{answer}</p>
      </div>
    </div>
  </Motion.article>
);

function Help() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-24 text-foreground">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-full max-w-[1200px] -translate-x-1/2 bg-gradient-to-b from-secondary/10 via-transparent to-transparent blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-32">
        <header className="mb-20 text-center">
          <Motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground bg-card shadow-pop"
          >
            <HelpCircle className="text-accent" size={32} strokeWidth={2.5} aria-hidden />
          </Motion.div>
          <h1 className="heading-font mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Help & <span className="text-accent italic">FAQs</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Everything you need to know about dropping anonymous memories on the map.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {FAQS.map((faq, index) => (
            <FaqCard key={faq.id} {...faq} delay={index * 0.1} />
          ))}
        </div>

        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mt-24 overflow-hidden rounded-2xl border-2 border-foreground bg-accent p-12 text-center shadow-pop"
        >
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white opacity-10" aria-hidden />
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white opacity-10" aria-hidden />
          <div className="relative z-10">
            <h2 className="heading-font mb-4 text-3xl font-bold text-white">Still have questions?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/90">
              Reach out for technical issues or feedback at{' '}
              <a href="mailto:workwithdevit@gmail.com" className="font-bold underline hover:text-white/80">
                workwithdevit@gmail.com
              </a>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-white px-10 py-4 text-xs font-black uppercase tracking-widest text-foreground shadow-pop transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-hover"
              >
                <Map size={16} strokeWidth={2.5} aria-hidden />
                Open the map
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-white/90 px-10 py-4 text-xs font-black uppercase tracking-widest text-foreground shadow-pop transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-hover"
              >
                <KeyRound size={16} strokeWidth={2.5} aria-hidden />
                Sign in
              </Link>
              <a
                href="mailto:workwithdevit@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-pop transition-all hover:bg-white/10"
              >
                <Mail size={16} strokeWidth={2.5} aria-hidden />
                Contact Support
              </a>
            </div>
          </div>
        </Motion.section>
      </main>
    </div>
  );
}

export default Help;
