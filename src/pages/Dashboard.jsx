import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaTrashAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    bySeverity: {},
    byStatus: {},
    lastReportTime: null
  });
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  // Reusable toast function
  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Function to delete an issue
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await deleteDoc(doc(db, 'issues', id));
      showToast('Issue deleted successfully!', 'success');
      setSelectedIssue(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Error deleting issue:', error);
      showToast('Error deleting issue: ' + error.message, 'error');
    }
  };

  // Function to update issue status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'issues', id), { status: newStatus });
      showToast(`Issue status updated to ${newStatus}!`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status: ' + error.message, 'error');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      const categorycounts = {};
      const severityCounts = {};
      const statusCounts = {};
      let lastTimestamp = null;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        issuesData.push(data);

        // Count by category
        categorycounts[data.type] = (categorycounts[data.type] || 0) + 1;

        // Count by severity
        severityCounts[data.severity] = (severityCounts[data.severity] || 0) + 1;
        
        // Count by status
        statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;

        // Track latest timestamp
        if (data.ts && (!lastTimestamp || data.ts.toDate() > lastTimestamp)) {
          lastTimestamp = data.ts.toDate();
        }
      });

      setIssues(issuesData);
      setStats({
        total: issuesData.length,
        byCategory: categorycounts,
        bySeverity: severityCounts,
        byStatus: statusCounts,
        lastReportTime: lastTimestamp
      });
    });

    return () => unsubscribe();
  }, []);

  // Filter issues based on all selected filters and search query
  const filteredIssues = issues.filter(issue => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      issue.id.toLowerCase().includes(searchLower) ||
      issue.type.toLowerCase().includes(searchLower) ||
      issue.desc.toLowerCase().includes(searchLower) ||
      (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower) ||
      (issue.lat?.toFixed(4) + ', ' + issue.lng?.toFixed(4)).includes(searchLower) ||
      (issue.lat?.toFixed(3) + ', ' + issue.lng?.toFixed(3)).includes(searchLower);

    return (
      (selectedStatus === 'All' || issue.status === selectedStatus) &&
      (selectedCategory === 'All' || issue.type === selectedCategory) &&
      (selectedSeverity === 'All' || issue.severity === selectedSeverity) &&
      matchesSearch
    );
  });
  
  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setShowDetails(true);
  };

  const closeDetailsModal = () => {
    setShowDetails(false);
    setSelectedIssue(null);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Total Reports
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Categories
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {Object.keys(stats.byCategory).length}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Severities
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {Object.keys(stats.bySeverity).length}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
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

        {/* Issues by Status */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Issues by Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(stats.byStatus).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                No issues reported yet.
              </p>
            ) : (
              Object.entries(stats.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="bg-white/10 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow"
                >
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {status}
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
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1">
              <label htmlFor="search-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Search</label>
              <input
                id="search-input"
                type="text"
                placeholder="Search by ID, type, description, or coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {/* Status Filter */}
            <div className="flex flex-col">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>All</option>
                <option>New</option>
                <option>In-Progress</option>
                <option>Resolved</option>
              </select>
            </div>
            {/* Category Filter */}
            <div className="flex flex-col">
              <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>All</option>
                <option>Pothole</option>
                <option>Garbage</option>
                <option>Water Leak</option>
                <option>Streetlight Outage</option>
                <option>Public Nuisance</option>
                <option>Other</option>
              </select>
            </div>
            {/* Severity Filter */}
            <div className="flex flex-col">
              <label htmlFor="severity-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
              <select
                id="severity-filter"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>All</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg shadow-lg overflow-hidden">
            {filteredIssues.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 p-8">
                No issues with this status found.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIssues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => handleIssueClick(issue)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full mr-3">
                            {issue.type}
                          </span>
                          <span className="inline-block px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 rounded-full mr-3">
                            {issue.severity}
                          </span>
                          <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-full">
                            {issue.status}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
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
                      <div className="flex items-center mt-4 sm:mt-0">
                        {issue.imageUrl && (
                          <div className="sm:ml-4 flex-shrink-0 mr-4">
                            <img
                              src={issue.imageUrl}
                              alt="Issue photo"
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, 'in-progress'); }}
                            className={`px-4 py-2 text-white rounded transition text-xs flex items-center gap-1 ${
                              issue.status === 'in-progress' ? 'bg-yellow-800 border border-yellow-500' : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                          >
                            <FaSpinner />
                            <span>In-Progress</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, 'resolved'); }}
                            className={`px-4 py-2 text-white rounded transition text-xs flex items-center gap-1 ${
                              issue.status === 'resolved' ? 'bg-green-800 border border-green-500' : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            <FaCheckCircle />
                            <span>Resolved</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(issue.id); }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs flex items-center gap-1"
                          >
                            <FaTrashAlt />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {showDetails && selectedIssue && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDetailsModal}
          />
          <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-8 rounded-lg relative">
            <button
              onClick={closeDetailsModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Issue Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-semibold w-24">ID:</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm break-all">{selectedIssue.id}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Type:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.type}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Severity:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.severity}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Status:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.status}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Coordinates:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.lat?.toFixed(5)}, {selectedIssue.lng?.toFixed(5)}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold mb-1">Description:</span>
                <p className="text-gray-700 dark:text-gray-300">{selectedIssue.desc}</p>
              </div>
              {selectedIssue.imageUrl && (
                <div className="flex justify-center mt-4">
                  <img src={selectedIssue.imageUrl} alt="Reported issue" className="max-w-xs rounded-lg shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;