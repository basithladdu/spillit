import { Link } from 'react-router-dom';
import {
  ExternalLink,
  MapPin,
  Mail,
  Linkedin,
  Ghost,
  Heart,
  Camera,
  Globe,
} from 'lucide-react';

const STACK = [
  { name: 'React', role: 'Frontend' },
  { name: 'Supabase', role: 'Backend' },
  { name: 'Mapbox', role: 'Maps' },
  { name: 'Cloudinary', role: 'Images' },
];

function AboutView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-font text-3xl font-bold text-foreground">About Spill It</h1>
        <p className="mt-1 text-muted-foreground">A place where moments live on the map.</p>
      </header>

      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-sticker">
        <h2 className="mb-4 text-xl font-bold text-foreground">What is Spill It?</h2>
        <p className="leading-relaxed text-muted-foreground">
          Spill It is a map-based memory board. Drop a photo, write your memory, pick a spot.
          Everyone sees it — nobody knows who you are. It is not a complaint system or a civic
          platform; it is a public journal of small joys, strange sights, and whatever you feel
          like leaving behind at a place.
        </p>
      </section>

      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-sticker">
        <h2 className="mb-4 text-xl font-bold text-foreground">How Memories Work</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Camera, title: 'Drop a Photo', desc: 'Snap or upload any photo that captures the moment.', color: 'text-accent' },
            { icon: MapPin, title: 'Pin the Spot', desc: 'Your location is captured automatically, or you can choose any place.', color: 'text-secondary' },
            { icon: Ghost, title: 'Stay Anonymous', desc: 'No name, no profile, no trace — just the memory and the place.', color: 'text-quaternary' },
          ].map((step) => {
            const StepIcon = step.icon;
            return (
              <div key={step.title} className="rounded-xl border border-border bg-muted p-4">
                <div className="mb-2 flex items-center gap-2">
                  <StepIcon size={16} className={step.color} aria-hidden />
                  <h3 className={`font-bold ${step.color}`}>{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-sticker">
        <h2 className="mb-4 text-xl font-bold text-foreground">Resources</h2>
        <div className="space-y-3">
          <a
            href="https://support.google.com/maps/answer/2839911"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-accent"
          >
            <MapPin size={20} aria-hidden />
            <span>How to enable location on your device</span>
            <ExternalLink size={16} aria-hidden />
          </a>
          <Link to="/help" className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-accent">
            <Ghost size={20} aria-hidden />
            <span>Help &amp; FAQs</span>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-sticker">
        <h2 className="mb-4 text-xl font-bold text-foreground">
          Built by <span className="text-accent">devit.</span>
        </h2>
        <p className="mb-6 text-muted-foreground">
          We design, build, and scale exceptional software for startups and businesses.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-foreground">Contact</h3>
            <a
              href="mailto:workwithdevit@gmail.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
            >
              <Mail size={16} aria-hidden />
              workwithdevit@gmail.com
            </a>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-foreground">Connect</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://www.linkedin.com/in/basithladoo/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-[#0A66C2]"
              >
                <Linkedin size={16} aria-hidden />
                LinkedIn — Basith
              </a>
              <a
                href="https://www.wedevit.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-semibold text-accent hover:underline"
              >
                <Globe size={16} aria-hidden />
                Visit wedevit.in
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-sticker">
        <h2 className="mb-4 text-xl font-bold text-foreground">Technology Stack</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STACK.map(({ name, role }) => (
            <div key={name} className="rounded-lg border border-border bg-muted p-3 text-center">
              <p className="font-bold text-foreground">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{role}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 py-4 text-center text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()}</span>
        <span className="font-semibold text-accent">devit</span>
        <span>— built with</span>
        <Heart size={14} className="text-secondary" aria-hidden />
        <span>for anonymous moments</span>
      </p>
    </div>
  );
}

export default AboutView;
