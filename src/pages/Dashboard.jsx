import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    lastReportTime: null
  });

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      const categorycounts = {};
      let lastTimestamp = null;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        issuesData.push(data);
        
        // Count by category
        categorycounts[data.type] = (categorycounts[data.type] || 0) + 1;
        
        // Track latest timestamp
        if (data.ts && (!lastTimestamp || data.ts.toDate() > lastTimestamp)) {
          lastTimestamp = data.ts.toDate();
        }
      });

      setIssues(issuesData);
      setStats({
        total: issuesData.length,
        byCategory: categorycounts,
        lastReportTime: lastTimestamp
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="h-20"></div> {/* Navbar spacing */}
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Fixit Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track and analyze civic issues in your community
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Total Reports
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Categories
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {Object.keys(stats.byCategory).length}
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Last Report
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {stats.lastReportTime 
                ? stats.lastReportTime.toLocaleDateString()
                : 'No reports yet'
              }
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Issues by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(stats.byCategory).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                No issues reported yet.
              </p>
            ) : (
              Object.entries(stats.byCategory).map(([category, count]) => (
                <div
                  key={category}
                  className="bg-white/80 dark:bg-gray-900 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow"
                >
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {category}
                  </div>
                  <div className="text-3xl font-extrabold text-gray-800 dark:text-white">
                    {count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Issues */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Recent Issues
          </h2>
          <div className="bg-white/80 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            {issues.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 p-8">
                No issues reported yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {issues.slice(0, 10).map((issue) => (
                  <div key={issue.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full mr-3">
                            {issue.type}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-white mb-2">
                          {issue.desc}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Coordinates: {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}
                        </p>
                      </div>
                      {issue.imageUrl && (
                        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                          <img
                            src={issue.imageUrl}
                            alt="Issue photo"
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;