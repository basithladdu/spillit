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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                How do I report an issue?
              </h3>
              <p className="text-gray-400">
                Click the 'Report Issue' button on the Map page. You'll be asked to provide a photo, a description, and the severity level. The app will automatically capture your location. You'll get a unique ID to track your report.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                What do the different statuses mean?
              </h3>
              <p className="text-gray-400">
                Reports can be in one of four states: 'New' (just reported), 'In-Progress' (a department is working on it), and 'Resolved' (the issue has been fixed).
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                I want to be a moderator!
              </h3>
              <p className="text-gray-400">
                To become a moderator and help manage issues on the Dashboard, you need to register and be approved by the system administrators. Please contact the project team directly for more information.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                How is a report automatically assigned to a department?
              </h3>
              <p className="text-gray-400">
                The system has a built-in routing engine that uses the 'Issue Type' to determine which department is responsible. For example, 'Pothole' reports are automatically sent to 'Public Works'.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Help;
