import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaArrowLeft, FaArrowRight, FaSearch, FaFilter, FaHeart, FaRegHeart, FaShare, FaEye, FaSort } from 'react-icons/fa';

// Bubble animation component
const BubbleAnimation = ({ children, onClick, className = "" }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e) => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {isAnimating && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-bubble absolute w-4 h-4 bg-white/30 rounded-full scale-0 opacity-70"></span>
        </span>
      )}
    </button>
  );
};

// Interactive Stats Card
const StatsCard = ({ title, value, color, icon, onClick }) => (
  <BubbleAnimation
    onClick={onClick}
    className={`bg-white/10 p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm ${color}`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-3xl font-bold">{value}</p>
  </BubbleAnimation>
);

// Status Badge with animations
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-600 text-white';
      case 'in-progress': return 'bg-yellow-600 text-white';
      case 'resolved': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new': return '🆕';
      case 'in-progress': return '🔄';
      case 'resolved': return '✅';
      default: return '📋';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
    </span>
  );
};

// Severity Badge
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-600 text-white';
      case 'Medium': return 'bg-yellow-600 text-white';
      case 'Low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'Critical': return '🔥';
      case 'High': return '⚠️';
      case 'Medium': return '📢';
      case 'Low': return '💚';
      default: return '📋';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${getSeverityColor(severity)}`}>
      {getSeverityIcon(severity)}
      {severity}
    </span>
  );
};

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
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [likedIssues, setLikedIssues] = useState(new Set());
  const [viewCounts, setViewCounts] = useState({});
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

    // Load liked issues from localStorage
    const savedLikes = localStorage.getItem('galleryLikes');
    if (savedLikes) {
      setLikedIssues(new Set(JSON.parse(savedLikes)));
    }

    // Load view counts from localStorage
    const savedViews = localStorage.getItem('galleryViews');
    if (savedViews) {
      setViewCounts(JSON.parse(savedViews));
    }
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
      (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower);

    return (
      (filters.status === 'All' || issue.status === filters.status) &&
      (filters.category === 'All' || issue.type === filters.category) &&
      (filters.severity === 'All' || issue.severity === filters.severity) &&
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
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Community Reports Gallery
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore all public reports, support your community, and track progress in real-time
          </p>
        </div>

        {/* Interactive Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Reports"
            value={issues.length}
            color="text-blue-400"
            icon="📊"
          />
          <StatsCard
            title="In Progress"
            value={issues.filter(i => i.status === 'in-progress').length}
            color="text-yellow-400"
            icon="🚧"
            onClick={() => setFilters({...filters, status: 'in-progress'})}
          />
          <StatsCard
            title="Resolved"
            value={issues.filter(i => i.status === 'resolved').length}
            color="text-green-400"
            icon="✅"
            onClick={() => setFilters({...filters, status: 'resolved'})}
          />
          <StatsCard
            title="Community Support"
            value={likedIssues.size}
            color="text-purple-400"
            icon="❤️"
          />
        </div>

        {/* Enhanced Filter and Search Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports by description, type, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-4">
              <BubbleAnimation
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center gap-2"
              >
                <FaFilter />
                {expandedFilters ? 'Hide Filters' : 'Show Filters'}
              </BubbleAnimation>

              <BubbleAnimation
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition"
              >
                Clear All
              </BubbleAnimation>
            </div>
          </div>

          {/* Expandable Filters */}
          {expandedFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  <option value="All">All Status</option>
                  <option value="new">Reported</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  <option value="All">All Categories</option>
                  <option>Pothole</option>
                  <option>Garbage</option>
                  <option>Water Leak</option>
                  <option>Streetlight Outage</option>
                  <option>Public Nuisance</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  <option value="All">All Severity</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Most Liked</option>
                  <option>Most Viewed</option>
                </select>
              </div>
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

        {/* Interactive Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentIssues.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 text-lg mb-4">No reports found with the current filters</p>
              <BubbleAnimation
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Clear Filters
              </BubbleAnimation>
            </div>
          ) : (
            currentIssues.map((issue, index) => (
              <div 
                key={issue.id} 
                className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/10 hover:border-white/20 group animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Header with badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={issue.status} />
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>

                {/* Issue Type */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                    📝 {issue.type}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-200 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  {issue.desc}
                </p>

                {/* Image with overlay */}
                {issue.imageUrl && (
                  <div className="relative mb-4 overflow-hidden rounded-xl group/image">
                    <img 
                      src={issue.imageUrl} 
                      alt="Issue" 
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover/image:scale-110"
                    />
                    <div className="absolute inset-0  bg-opacity-0 group-hover/image:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 text-lg">👁️ View</span>
                    </div>
                  </div>
                )}

                {/* Interactive Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-gray-400">
                    <BubbleAnimation
                      onClick={() => handleLike(issue.id)}
                      className="flex items-center gap-1 transition-all duration-300 hover:text-red-500"
                    >
                      {likedIssues.has(issue.id) ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart />
                      )}
                      <span>{likedIssues.has(issue.id) ? 'Liked' : 'Like'}</span>
                    </BubbleAnimation>
                    
                    <div className="flex items-center gap-1">
                      <FaEye />
                      <span>{viewCounts[issue.id] || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <BubbleAnimation
                      onClick={() => handleShare(issue)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                      title="Share"
                    >
                      <FaShare className="text-sm" />
                    </BubbleAnimation>
                    
                    <BubbleAnimation
                      onClick={() => {
                        handleView(issue.id);
                        // Navigate to details page
                        window.open(`/report/${issue.id}`, '_blank');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition flex items-center gap-2 group/button"
                    >
                      View Details
                      <span className="group-hover/button:translate-x-1 transition-transform duration-300">→</span>
                    </BubbleAnimation>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/10">
            <div className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <BubbleAnimation
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl disabled:opacity-50 transition flex items-center gap-2"
              >
                <FaArrowLeft />
                Previous
              </BubbleAnimation>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <BubbleAnimation
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-xl text-sm transition ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {pageNum}
                    </BubbleAnimation>
                  );
                })}
              </div>

              <BubbleAnimation
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl disabled:opacity-50 transition flex items-center gap-2"
              >
                Next
                <FaArrowRight />
              </BubbleAnimation>
            </div>
          </div>
        )}
      </main>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes bubble {
          0% {
            transform: scale(0);
            opacity: 0.7;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-bubble {
          animation: bubble 0.6s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default Gallery;