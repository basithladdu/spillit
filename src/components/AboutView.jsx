import React from 'react';
import { ExternalLink, Twitter, MapPin, Mail, Linkedin, Ghost, Heart, Camera, Globe } from 'lucide-react';

const AboutView = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">About Spillit</h1>
                <p className="text-[var(--muni-text-muted)] mt-1">
                    A place where moments live on the map
                </p>
            </div>

            {/* What is Spillit */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">What is Spillit?</h2>
                <p className="text-[var(--muni-text-muted)] leading-relaxed">
                    Spillit is a place where moments live on the map. Drop a photo, write your memory,
                    pick a spot. Everyone sees. Nobody knows who you are.
                    It is not a complaint system, not a ticketing tool, and not a civic platform.
                    It is closer to a public memory board of strange sights, small joys, and whatever
                    you feel like leaving behind at a place.
                </p>
            </div>

            {/* How it works */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">How Memories Work</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <div className="flex items-center gap-2 mb-2">
                            <Camera size={16} className="text-[var(--spillit-primary)]" />
                            <h3 className="text-[var(--spillit-primary)] font-bold">Drop a Photo</h3>
                        </div>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            Snap or upload any photo that captures the moment
                        </p>
                    </div>
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-[var(--spillit-secondary)]" />
                            <h3 className="text-[var(--spillit-secondary)] font-bold">Pin the Spot</h3>
                        </div>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            Your location is captured automatically or you can choose any place
                        </p>
                    </div>
                    <div className="bg-[var(--muni-bg)] p-4 rounded border border-[var(--muni-border)]">
                        <div className="flex items-center gap-2 mb-2">
                            <Ghost size={16} className="text-[var(--spillit-accent)]" />
                            <h3 className="text-[var(--spillit-accent)] font-bold">Stay Anonymous</h3>
                        </div>
                        <p className="text-sm text-[var(--muni-text-muted)]">
                            No name, no profile, no trace. Just the memory and the place
                        </p>
                    </div>
                </div>
            </div>

            {/* Resources */}
            <div className="muni-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Resources</h2>
                <div className="space-y-3">
                    <a
                        href="https://support.google.com/maps/answer/2839911"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[var(--muni-text-muted)] hover:text-[var(--spillit-primary)] transition-colors"
                    >
                        <MapPin size={20} />
                        <span>How to enable location on your device?</span>
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://twitter.com/spillit_world"
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
                    Built by <span className="text-[var(--spillit-primary)]">devit.</span>
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
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[var(--spillit-primary)]"
                            >
                                <Mail size={16} />
                                workwithdevit@gmail.com
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
                                className="flex items-center gap-2 text-[var(--muni-text-muted)] hover:text-[var(--spillit-primary)]"
                            >
                                <Mail size={16} />
                                basithladoo@gmail.com
                            </a>
                            <a
                                href="https://www.wedevit.in/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[var(--spillit-primary)] hover:underline font-semibold"
                            >
                                <Globe size={16} />
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
                        <p className="text-white font-bold">Mapbox</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Maps</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--muni-bg)] rounded border border-[var(--muni-border)]">
                        <p className="text-white font-bold">Cloudinary</p>
                        <p className="text-xs text-[var(--muni-text-muted)] mt-1">Image Storage</p>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-sm text-[var(--muni-text-muted)] py-4">
                <p className="flex items-center justify-center gap-2">
                    <span>© {new Date().getFullYear()}</span>
                    <span className="text-[var(--spillit-primary)] font-semibold">devit</span>
                    <span>— built with</span>
                    <Heart size={14} className="text-[var(--spillit-accent)]" />
                    <span>for anonymous moments</span>
                </p>
            </div>
        </div>
    );
};

export default AboutView;
