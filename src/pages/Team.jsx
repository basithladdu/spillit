import { Link } from 'react-router-dom';

function Team() {
  const teamMembers = [
    {
      name: 'basith',
      role: 'founder & founding engineer'
    },
    {
      name: 'awaiz',
      role: 'operations & founding engineer'
    },
    {
      name: 'mubeen taj',
      role: 'co-developer'
    },
    {
      name: 'muqeeth',
      role: 'marketing & pr'
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}
      
      <main className="container mx-auto p-4 max-w-3xl text-center flex-grow">
        <h1 className="text-3xl font-bold text-white mb-8 mt-8">
          the fixit team
        </h1>
        
        <section className="bg-white/10 backdrop-blur-sm p-8 rounded-sm shadow-lg">
          <p className="text-sm mb-6 leading-relaxed text-gray-300">
            fixit is a community-driven project built with a passion for improving local civic issues.
            our dedicated team made this possible.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors duration-300">
                <div className="text-lg font-semibold text-white">
                  {member.name}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {member.role}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center space-x-4">
          <Link
            to="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            ← back to map
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            view dashboard →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Team;