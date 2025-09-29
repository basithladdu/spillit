import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaTrophy, FaCheckCircle, FaThumbsUp } from 'react-icons/fa';

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'issues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const departments = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const department = data.department || 'Unassigned';
        const status = data.status;
        const upvotes = data.upvotes || 0;

        if (!departments[department]) {
          departments[department] = {
            resolvedCount: 0,
            upvoteCount: 0,
            totalIssues: 0,
          };
        }

        departments[department].totalIssues += 1;
        if (status === 'resolved') {
          departments[department].resolvedCount += 1;
        }
        departments[department].upvoteCount += upvotes;
      });

      const sortedDepartments = Object.entries(departments)
        .map(([name, stats]) => ({
          name,
          ...stats,
          progressPercentage: stats.totalIssues > 0 ? (stats.resolvedCount / stats.totalIssues) * 100 : 0,
          score: (stats.resolvedCount * 1.5) + (stats.upvoteCount * 0.1) // Increased resolved weight
        }))
        .sort((a, b) => b.score - a.score);

      setLeaderboardData(sortedDepartments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}

      <main className="container mx-auto p-4 max-w-3xl flex-grow">
        <h1 className="text-4xl font-extrabold text-white mt-8 mb-10 tracking-wide text-center drop-shadow-md">
          <FaTrophy className="inline-block text-yellow-400 mr-2" />
          Civic Leaderboard
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400"></div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <section className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl glass text-center">
            <p className="text-gray-400">
              No data to display on the leaderboard yet. Report an issue to get started!
            </p>
          </section>
        ) : (
          <section className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="p-4 text-center">Rank</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Resolved <FaCheckCircle className="inline-block text-green-500 ml-1" /></th>
                    <th className="p-4 text-center">Upvotes <FaThumbsUp className="inline-block text-blue-500 ml-1" /></th>
                    <th className="p-4 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((dept, index) => (
                    <tr key={dept.name} className="border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center">
                        <span className="font-bold text-lg">
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        {dept.name}
                      </td>
                      <td className="p-4 text-center text-green-400">
                        {dept.resolvedCount}
                      </td>
                      <td className="p-4 text-center text-blue-400">
                        {dept.upvoteCount}
                      </td>
                      <td className="p-4">
                        <div className="w-24 bg-gray-700 rounded-full h-2.5 mx-auto">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{ width: `${dept.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs block text-center mt-1 text-gray-400">
                          {dept.progressPercentage.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;