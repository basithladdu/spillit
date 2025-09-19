import React from 'react';

function Leaderboard() {
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}
      
      <main className="container mx-auto p-4 max-w-3xl flex-grow">
        <h1 className="text-4xl font-extrabold text-white mt-8 mb-10 tracking-wide text-center drop-shadow-md">
          Leaderboard
        </h1>
        
        <section className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl glass text-center">
          <p className="text-gray-400">
            This is where the community leaderboard will be displayed. This feature is coming soon!
          </p>
        </section>
      </main>
    </div>
  );
}

export default Leaderboard;
