import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';

function Gallery() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    severity: 'All',
    sortBy: 'Newest First'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      snapshot.forEach((doc) => {
        issuesData.push({ id: doc.id, ...doc.data() });
      });
      setIssues(issuesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter issues based on all selected filters
  const filteredAndSortedIssues = issues.filter(issue => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      issue.desc.toLowerCase().includes(searchLower) ||
      issue.type.toLowerCase().includes(searchLower) ||
      (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower);

    return (
      (filters.status === 'All' || issue.status === filters.status) &&
      (filters.category === 'All' || issue.type === filters.category) &&
      (filters.severity === 'All' || issue.severity === filters.severity) &&
      matchesSearch
    );
  }).sort((a, b) => {
    if (filters.sortBy === 'Newest First') {
      return b.ts.toDate() - a.ts.toDate();
    }
    if (filters.sortBy === 'Oldest First') {
      return a.ts.toDate() - b.ts.toDate();
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIssues = filteredAndSortedIssues.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-600';
      case 'in-progress': return 'bg-yellow-600';
      case 'resolved': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="h-20"></div> {/* Navbar spacing */}

      <main className="container mx-auto p-4 max-w-7xl">
        <h1 className="text-3xl font-bold text-center mt-8 mb-4">
          Community Reports Gallery
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Explore all public reports and see the progress being made.
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-400">{issues.length}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-yellow-400">{issues.filter(i => i.status === 'in-progress').length}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Resolved Issues</h3>
            <p className="text-3xl font-bold text-green-400">{issues.filter(i => i.status === 'resolved').length}</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Community Support</h3>
            <p className="text-3xl font-bold text-purple-400">0</p>
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <label htmlFor="search-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Search</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search by description or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex flex-col">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                <option value="All">All</option>
                <option value="new">Reported</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                <option value="All">All</option>
                <option>Pothole</option>
                <option>Garbage</option>
                <option>Water Leak</option>
                <option>Streetlight Outage</option>
                <option>Public Nuisance</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="severity-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
              <select
                id="severity-filter"
                value={filters.severity}
                onChange={(e) => setFilters({...filters, severity: e.target.value})}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                <option value="All">All</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentIssues.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
              No issues found with the selected filters.
            </p>
          ) : (
            currentIssues.map((issue) => (
              <div key={issue.id} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                  <span className="text-sm text-gray-400 ml-auto">
                    {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <p className="text-gray-200 mb-2">{issue.desc}</p>
                {issue.imageUrl && (
                  <div className="mt-4">
                    <img src={issue.imageUrl} alt="Issue photo" className="w-full h-48 object-cover rounded-lg" />
                  </div>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <span>0 upvotes</span> {/* Placeholder */}
                  </div>
                  <Link 
                    to={`/report/${issue.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm ${currentPage === i + 1 ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Gallery;