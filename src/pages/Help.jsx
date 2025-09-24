import React from 'react';

function Help() {
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}
      
      <main className="container mx-auto p-4 max-w-3xl flex-grow">
        <h1 className="text-4xl font-extrabold text-white mt-8 mb-10 tracking-wide text-center drop-shadow-md">
          Help & FAQs
        </h1>
        
        <section className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl glass">
          <p className="text-sm mb-8 leading-relaxed text-gray-300 text-center">
            Find answers to common questions and learn how to get the most out of Fixit.
          </p>
          
          <div className="space-y-6">
            {/* Existing FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                How do I report an issue?
              </h3>
              <p className="text-gray-400">
                Click the 'Report Issue' button on the Map page. You'll be asked to provide a photo, a description, and the severity level. The app will automatically capture your location. You'll get a unique ID to track your report.
              </p>
            </div>
            
            {/* Existing FAQ - Improved */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                What do the different statuses mean?
              </h3>
              <p className="text-gray-400">
                Reports can be in one of three states: 'New' (just reported), 'In-Progress' (a department is working on it), and 'Resolved' (the issue has been fixed).
              </p>
            </div>
            
            {/* New FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Why can I only upvote an issue once?
              </h3>
              <p className="text-gray-400">
                Upvoting is limited to **one vote per user** to ensure the integrity of the community support count. You can, however, remove your upvote by clicking the button again.
              </p>
            </div>

            {/* New FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                How is the leaderboard ranked?
              </h3>
              <p className="text-gray-400">
                Departments are ranked based on a score that gives higher weight to **resolved issues** and a lesser weight to **upvotes**. This system prioritizes actual progress over popularity.
              </p>
            </div>

            {/* Existing FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                How is a report automatically assigned to a department?
              </h3>
              <p className="text-gray-400">
                The system has a built-in routing engine that uses the 'Issue Type' to determine which department is responsible. For example, 'Pothole' reports are automatically sent to the 'Public Works Department'.
              </p>
            </div>
            
            {/* New FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                I want to be a moderator!
              </h3>
              <p className="text-gray-400">
                To become a moderator and help manage issues on the Dashboard, you need to register and be approved by the system administrators. Only approved users can access the dashboard.
              </p>
            </div>

            {/* New FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                What happens to my data and privacy?
              </h3>
              <p className="text-gray-400">
                We only collect the necessary information to report an issue: a photo, a description, and your location. Your personal information is kept private. We do not share it with third parties.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Help;