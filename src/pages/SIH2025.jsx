import React from 'react';
import { useNavigate } from 'react-router-dom';

function SIH2025() {
  const navigate = useNavigate();

  const teamMembers = [
    { name: 'Basith', role: 'Founder & Founding Engineer' },
    { name: 'Awaiz', role: 'Founding Engineer' },
    { name: 'Kabeer', role: 'Founding Engineer' },
    { name: 'Musa', role: 'Founding Engineer' },
    { name: 'Dakshayini', role: 'Founding Engineer' },
    { name: 'Muqeeth', role: 'Founding Engineer' },
  ];

  return (
    <div className="min-h-screen bg-[var(--muni-bg)] text-[var(--muni-text-main)] font-sans selection:bg-[#FF671F]/30 pb-20">
      <div className="container mx-auto p-4 text-center">
        <div className="h-20"></div> {/* Navbar spacing */}

        <h1 className="text-4xl font-bold text-white mt-8 mb-4">
          The Fixit Team - <span className="text-[#FF671F]">SIH 2025</span>
        </h1>
        <p className="text-[var(--muni-text-muted)] mb-8">
          Fixit is a community-driven project built with a passion for improving local civic issues. Our dedicated team made this possible.
        </p>

        {/* Problem Statement Details */}
        <h1 className="text-4xl font-bold text-[#FF671F] mt-8 mb-4">
          YOUTUBE VIDEO and MOBILE APP INCOMING
        </h1>
        <h2 className="text-2xl font-bold text-[#046A38] mb-4">
          WORK-IN-PROGRESS
        </h2>

        <h2 className="text-2xl font-bold text-white mb-4">
          TEAM - <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]">Fixit</span>
        </h2>
        {/* Team Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-[var(--muni-surface)] p-6 rounded-lg shadow-lg border border-white/10 hover:border-[#FF671F]/50 transition-colors">

              <h3 className="text-xl font-semibold text-white">
                {member.name}
              </h3>
              <p className="text-[var(--muni-text-muted)] mt-2">
                {member.role}
              </p>
            </div>
          ))}
        </div>

        {/* Future Functionality */}
        <div className="text-left w-full max-w-4xl mx-auto mb-12 bg-[var(--muni-surface)] p-8 rounded-xl shadow-lg border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Future Functionality
          </h2>
          <p className="text-[var(--muni-text-muted)] mb-4">
            The following features from the problem statement are planned for future development to make the platform even more robust and complete.
          </p>
          <ul className="list-disc list-inside text-[var(--muni-text-muted)] space-y-2">
            <li>A dedicated mobile application 📱 for a seamless user experience</li>
            <li>User accounts with the ability to track the progress of their reports 📈</li>
            <li>Notifications to citizens for each stage of their report's lifecycle (confirmation, acknowledgment, resolution)</li>
            <li>An advanced administrative portal that allows municipal staff to filter, categorize, and assign reports</li>
            <li>A scalable backend to handle high volumes of multimedia content and APIs for future integrations 🔌</li>
            <li>Analytics and reporting features that provide insights into reporting trends and departmental response times📊</li>
          </ul>
        </div>

        {/* Go Back Button */}
        <div className="mt-12">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#06038D] hover:bg-[#06038D]/80 text-white rounded-lg transition shadow-lg"
          >
            ⏪ Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default SIH2025;