import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaArrowLeft, FaArrowRight, FaThumbsUp } from 'react-icons/fa';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function Gallery() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All', category: 'All', severity: 'All', department: 'All', sortBy: 'Newest First'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const navigate = useNavigate();

  const departmentOptions = ['Public Works Department (PWD)', 'Solid Waste Management Department', 'Water Utilities Department', 'Electric Division', 'Public Nuisance Dept.'];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleUpvote = async (issueId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const issueRef = doc(db, 'issues', issueId);
    try {
      const issue = issues.find(i => i.id === issueId);
      if (!issue) return;

      const userHasVoted = issue.upvoters?.includes(user.uid);

      if (userHasVoted) {
        // Remove upvote
        await updateDoc(issueRef, {
          upvotes: increment(-1),
          upvoters: arrayRemove(user.uid)
        });
      } else {
        // Add upvote
        await updateDoc(issueRef, {
          upvotes: increment(1),
          upvoters: arrayUnion(user.uid)
        });
      }
      
    } catch (error) {
      console.error("Error upvoting issue:", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      snapshot.forEach((doc) => {
        issuesData.push({ id: doc.id, ...doc.data() });
      });
      setIssues(issuesData);
    });
    return () => unsubscribe();
  }, []);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'N/A';
    return status.split('-').map(capitalizeFirstLetter).join('-');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-600';
      case 'in-progress': return 'bg-yellow-600';
      case 'resolved': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const filteredAndSortedIssues = issues.filter(issue => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      issue.desc.toLowerCase().includes(searchLower) ||
      issue.type.toLowerCase().includes(searchLower) ||
      (issue.department?.toLowerCase() || '').includes(searchLower) ||
      (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower);

    return (
      (filters.status === 'All' || issue.status === filters.status) &&
      (filters.category === 'All' || issue.type === filters.category) &&
      (filters.severity === 'All' || issue.severity === filters.severity) &&
      (filters.department === 'All' || issue.department === filters.department) &&
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

  const totalPages = Math.ceil(filteredAndSortedIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIssues = filteredAndSortedIssues.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
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
      <div className="h-20"></div>

      <main className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mt-8 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Community Reports Gallery
            </h1>
            <p className="text-gray-400">
              Explore all public reports and see the progress being made.
            </p>
          </div>
        </div>

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
            <p className="text-3xl font-bold text-purple-400">{issues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end mb-6 gap-4">
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
          <div className="flex flex-wrap items-end justify-center space-x-2">
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
                <option value="in-progress">In-Progress</option>
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
              <label htmlFor="department-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select
                id="department-filter"
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                <option value="All">All</option>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentIssues.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">No issues found with the selected filters.</p>
          ) : (
            currentIssues.map((issue) => {
              const hasUpvoted = issue.upvoters?.includes(user?.uid);
              return (
                <div key={issue.id} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(issue.status)}`}>
                      {getStatusDisplay(issue.status)}
                    </span>
                    <span className="text-sm text-gray-400 ml-auto">
                      {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                  <p className="text-gray-200 mb-2">{issue.desc}</p>
                  {issue.department && (<p className="text-sm text-gray-400 mb-2">Assigned to: {issue.department}</p>)}
                  {issue.imageUrl && (<div className="mt-4"><img src={issue.imageUrl} alt="Issue photo" className="w-full h-48 object-cover rounded-lg" /></div>)}
                  <div className="mt-4 flex justify-between items-center">
                    <button 
                      onClick={() => handleUpvote(issue.id)}
                      className={`flex items-center space-x-2 transition ${hasUpvoted ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    >
                      <FaThumbsUp />
                      <span>{issue.upvotes || 0} upvotes</span>
                    </button>
                    <button onClick={() => navigate(`/report/${issue.id}`)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"><FaArrowLeft /></button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-4 py-2 rounded-lg text-sm ${currentPage === i + 1 ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>{i + 1}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"><FaArrowRight /></button>
          </div>
        )}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl max-w-sm w-full relative text-center">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Sign In to Upvote</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be signed in to show your support.</p>
            <div className="flex flex-col gap-4">
              <Link to="/login" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">Login</Link>
              <Link to="/register" className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition">Register</Link>
            </div>
            <button onClick={() => setShowLoginModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;