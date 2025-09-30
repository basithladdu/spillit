import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

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
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [likedIssues, setLikedIssues] = useState(new Set());
  const [viewCounts, setViewCounts] = useState({});
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

  const handleLike = (issueId) => {
    const newLikedIssues = new Set(likedIssues);
    if (newLikedIssues.has(issueId)) {
      newLikedIssues.delete(issueId);
    } else {
      newLikedIssues.add(issueId);
    }
    setLikedIssues(newLikedIssues);
    localStorage.setItem('galleryLikes', JSON.stringify([...newLikedIssues]));
  };

  const handleView = (issueId) => {
    const newViewCounts = { ...viewCounts };
    newViewCounts[issueId] = (newViewCounts[issueId] || 0) + 1;
    setViewCounts(newViewCounts);
    localStorage.setItem('galleryViews', JSON.stringify(newViewCounts));
  };

  const handleShare = async (issue) => {
    const shareUrl = `${window.location.origin}/report/${issue.id}`;
    const shareText = `Check out this community issue: ${issue.desc}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Community Issue Report',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
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
      return b.ts?.toDate() - a.ts?.toDate();
    }
    if (filters.sortBy === 'Oldest First') {
      return a.ts?.toDate() - b.ts?.toDate();
    }
    if (filters.sortBy === 'Most Liked') {
      return (likedIssues.has(b.id) ? 1 : 0) - (likedIssues.has(a.id) ? 1 : 0);
    }
    if (filters.sortBy === 'Most Viewed') {
      return (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredAndSortedIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIssues = filteredAndSortedIssues.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'All',
      category: 'All',
      severity: 'All',
      sortBy: 'Newest First'
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading community reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black text-white min-h-screen">
      <div className="h-20"></div>

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
          )}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedIssues.length)} of {filteredAndSortedIssues.length} reports
          </p>
          <div className="text-gray-400 text-sm">
            {filteredAndSortedIssues.length === 0 ? 'No reports found' : `${totalPages} page${totalPages > 1 ? 's' : ''}`}
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
                    {getStatusDisplay(issue.status)}
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
                    <span>0 upvotes</span>
                  </div>
                  <Link 
                    to={`/report/${issue.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition"
                  >
                    View Details
                  </Link>
                </div>
              );
            })
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
              <FaArrowLeft />
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
              <FaArrowRight />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Gallery;