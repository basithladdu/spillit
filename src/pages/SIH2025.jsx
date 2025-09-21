import React from 'react';
import { useNavigate } from 'react-router-dom';

function SIH2025() {
  const navigate = useNavigate();

  const teamMembers = [
    { name: 'Basith', role: 'Founder & Founding Engineer' },
    { name: 'Awaiz', role: 'Founding Engineer' },
    { name: 'Kabeer', role: 'Founding Engineer' },
    { name: 'Musa', role: 'Founding Engineer' },
    { name: 'Mubeen Taj', role: 'Founding Engineer' },
    { name: 'Muqeeth', role: 'Marketing & PR' },
  ];

  const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?si=RjE1s_u6sQ4eX1_t"; // Replace this with your video URL

  return (
    <div className="container mx-auto p-4 text-center">
      <div className="h-20"></div> {/* Navbar spacing */}

      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-8 mb-4">
        The Fixit Team - SIH 2025
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Fixit is a community-driven project built with a passion for improving local civic issues. Our dedicated team made this possible.
      </p>

      {/* Problem Statement Details */}
     

      {/* Video Iframe */}
      <div className="w-full max-w-4xl mx-auto mb-12 rounded-lg overflow-hidden shadow-xl">
        <iframe
          className="w-full aspect-video"
          src={videoUrl}
          title="SIH Submission Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
   <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
TEAM - Fixit        </h2>
      {/* Team Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-white/10 dark:bg-gray-900 p-6 rounded-lg shadow-lg">
          
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              {member.name}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              {member.role}
            </p>
          </div>
        ))}
      </div>
      
      {/* Future Functionality */}
      <div className="text-left w-full max-w-4xl mx-auto mb-12 bg-white/10 dark:bg-gray-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          Future Functionality
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The following features from the problem statement are planned for future development to make the platform even more robust and complete.
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
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
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
        >
          ⏪ Go Back
        </button>
      </div>
    </div>
  );
}

export default SIH2025;