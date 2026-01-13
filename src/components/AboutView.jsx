import React from 'react';
import { ExternalLink, Twitter, MapPin, Mail, Phone, Linkedin } from 'lucide-react';

const AboutView = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">About LetsFixIndia</h1>
                <p className="text-[var(--muni-text-muted)] mt-1">
                    Empowering citizens to report and track civic issues
                </p>
            </div>

            {/* Mission Section */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-[var(--muni-text-muted)] leading-relaxed">
                    LetsFixIndia is a citizen-driven platform designed to bridge the gap between communities
                    and municipal authorities. We empower citizens to report civic issues like potholes,
                    broken streetlights, and other infrastructure problems, while providing municipal
                    administrators with powerful tools to track, manage, and resolve these issues efficiently.
                </p>
            </div>

            {/* AI-Powered Detection */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">AI-Powered Pothole Detection</h2>
                <p className="text-[var(--muni-text-muted)] leading-relaxed mb-4">
                    Our platform uses advanced AI technology powered by Roboflow to automatically detect
                    and classify potholes from user-submitted images. This helps prioritize repairs based
                    on severity and provides accurate data for infrastructure planning.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <h3 className="text-[#FF671F] font-bold mb-2">Automatic Detection</h3>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            AI analyzes images and identifies potholes with bounding boxes
                        </p>
                    </div>
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <h3 className="text-[#FF671F] font-bold mb-2">Severity Classification</h3>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            Categorizes potholes as Deep, Moderate, or Shallow
                        </p>
                    </div>
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <h3 className="text-[#FF671F] font-bold mb-2">Department Routing</h3>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            Automatically assigns to NHAI, RNB, PWD, or Municipal authorities
                        </p>
                    </div>
                </div>
            </div>

            {/* Resources */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Resources & Help</h2>
                <div className="space-y-3">
                    <a
                        href="https://support.google.com/maps/answer/2839911"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[var(--muni-text-muted)] hover:text-[#FF671F] transition-colors"
                    >
                        <MapPin size={20} />
                        <span>How to enable GPS/Geotagging?</span>
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://twitter.com/letsfixindia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[var(--muni-text-muted)] hover:text-[#1DA1F2] transition-colors"
                    >
                        <Twitter size={20} />
                        <span>Follow us on Twitter</span>
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* Developer Info */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                    Powered by <span className="text-[#FF671F]">devit.</span>
                </h2>
                <p className="text-[var(--muni-text-muted)] mb-6">
                    We design, build, and scale exceptional software for startups and businesses.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 uppercase">Contact</h3>
                        <div className="space-y-2 text-sm">
                            <a
                                href="mailto:workwithdevit@gmail.com"
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#FF671F]"
                            >
                                <Mail size={16} />
                                workwithdevit@gmail.com
                            </a>
                            <a
                                href="tel:+919553321211"
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#FF671F]"
                            >
                                <Phone size={16} />
                                +91 95533 21211
                            </a>
                            <a
                                href="https://wa.me/919553321211"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#25D366]"
                            >
                                <Phone size={16} />
                                WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Connect */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 uppercase">Connect</h3>
                        <div className="space-y-2 text-sm">
                            <a
                                href="https://www.linkedin.com/in/basithladoo/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#0A66C2]"
                            >
                                <Linkedin size={16} />
                                LinkedIn - Basith
                            </a>
                            <a
                                href="mailto:basithladoo@gmail.com"
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[#FF671F]"
                            >
                                <Mail size={16} />
                                basithladoo@gmail.com
                            </a>
                            <a
                                href="https://www.wedevit.in/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#FF671F] hover:underline font-semibold"
                            >
                                <ExternalLink size={16} />
                                Visit wedevit.in
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Technology Stack */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Technology Stack</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-[var(--muni-bg)] rounded border border-[var(--muni-border)]">
                        <p className="text-white font-bold">React</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Frontend</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--muni-bg)] rounded border border-[var(--muni-border)]">
                        <p className="text-white font-bold">Firebase</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Backend</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--muni-bg)] rounded border border-[var(--muni-border)]">
                        <p className="text-white font-bold">Roboflow</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">AI Detection</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--muni-bg)] rounded border border-[var(--muni-border)]">
                        <p className="text-white font-bold">Cloudinary</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Image Storage</p>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-sm text-[var(--muni-text-muted)] py-4">
                <p>
                    © {new Date().getFullYear()} <span className="text-[#FF671F] font-semibold">devit</span>.
                    All rights reserved. | Built with ❤️ for better governance
                </p>
            </div>
        </div>
    );
};

export default AboutView;
