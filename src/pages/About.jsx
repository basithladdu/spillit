import { motion } from 'framer-motion';
import { Heart, Lightbulb, Users, Camera, MapPin, Ghost, Code, Mail, Instagram } from 'lucide-react';

const About = () => {
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-6 pt-16">

        {/* ── Hero ── */}
        <div className="text-center py-20 relative">
          {/* Blobs */}
          <div className="pointer-events-none absolute top-8 left-8 w-32 h-32 bg-tertiary rounded-full opacity-30 blur-2xl" />
          <div className="pointer-events-none absolute bottom-8 right-8 w-40 h-40 bg-secondary rounded-full opacity-20 blur-3xl" />

          <motion.div {...fadeUp}>
            <div className="w-24 h-24 rounded-full bg-accent border-2 border-foreground flex items-center justify-center text-white mx-auto mb-8 shadow-pop">
              <Heart size={36} strokeWidth={2.5} fill="currentColor" />
            </div>
            <h1 className="heading-font text-6xl md:text-7xl font-bold mb-4 text-foreground">
              Spill <span className="text-accent italic">It</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              A digital sanctuary for anonymous memories, pinned forever to the spots where life happened.
            </p>
          </motion.div>
        </div>

        {/* ── Vision + Community ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div {...fadeUp} className="bg-card border-2 border-foreground rounded-2xl p-8 shadow-pop">
            <div className="w-12 h-12 rounded-full bg-accent border-2 border-foreground flex items-center justify-center mb-6 shadow-pop">
              <Lightbulb size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="heading-font text-2xl font-bold text-foreground mb-4">The Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              Spill It is a map-based memory board. We believe every coordinate on Earth holds a story — a first kiss, a lonely walk, a sudden realization, a moment of pure joy. We built this to give those fleeting moments a permanent home.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-card border-2 border-foreground rounded-2xl p-8 shadow-sticker-pink">
            <div className="w-12 h-12 rounded-full bg-secondary border-2 border-foreground flex items-center justify-center mb-6 shadow-pop">
              <Users size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="heading-font text-2xl font-bold text-foreground mb-4">The Community</h2>
            <p className="text-muted-foreground leading-relaxed">
              Spill It is for dreamers, travelers, and locals who see beauty in the mundane. A shared public journal where anonymity breeds authenticity. No judgment, just real moments from real people.
            </p>
          </motion.div>
        </div>

        {/* ── How it works ── */}
        <motion.div {...fadeUp} className="mb-16">
          <h2 className="heading-font text-3xl font-bold text-foreground text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Camera, label: 'Snap', desc: 'Capture the scene exactly as it is.', color: 'bg-accent' },
              { icon: MapPin, label: 'Pin', desc: 'Drop it on the map. Let your story live at that exact point in space.', color: 'bg-secondary' },
              { icon: Ghost, label: 'Spill', desc: 'Write what you felt. Share it anonymously with the world.', color: 'bg-quaternary' },
            ].map(({ icon: Icon, label, desc, color }, i) => (
              <div key={label} className="bg-card border-2 border-foreground rounded-2xl p-8 text-center shadow-sticker flex flex-col items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${color} border-2 border-foreground flex items-center justify-center shadow-pop`}>
                  <Icon size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="heading-font text-xl font-bold text-foreground">{label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Quote ── */}
        <motion.div {...fadeUp} className="mb-16">
          <div className="bg-accent border-2 border-foreground rounded-2xl p-12 text-center shadow-pop relative overflow-hidden">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full opacity-10" />
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white rounded-full opacity-10" />
            <p className="text-2xl md:text-3xl text-white italic font-bold leading-relaxed relative z-10">
              "In a world of constant moving, Spill It is our way of saying: something happened here, and it mattered."
            </p>
          </div>
        </motion.div>

        {/* ── Contact ── */}
        <motion.div {...fadeUp} className="text-center pb-16">
          <div className="w-12 h-12 rounded-full bg-tertiary border-2 border-foreground flex items-center justify-center mx-auto mb-6 shadow-pop">
            <Code size={22} className="text-foreground" strokeWidth={2.5} />
          </div>
          <h2 className="heading-font text-3xl font-bold text-foreground mb-4">Built with Love</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Spill It is a small project from the folks at Devit. We love maps, we love stories, and we love building things that make the internet a little more human.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="mailto:workwithdevit@gmail.com"
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-white border-2 border-foreground rounded-full font-bold shadow-pop hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all heading-font uppercase tracking-widest text-sm"
            >
              <Mail size={16} strokeWidth={2.5} /> Contact Us
            </a>
            <a
              href="https://instagram.com/devit.company"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-card border-2 border-foreground text-foreground rounded-full font-bold shadow-pop hover:bg-muted hover:shadow-pop-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all heading-font uppercase tracking-widest text-sm"
            >
              <Instagram size={16} strokeWidth={2.5} /> Instagram
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default About;
