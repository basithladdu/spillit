import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { FaTrashAlt, FaCheckCircle, FaSpinner, FaArrowLeft, FaArrowRight, FaSearch, FaFilter, FaChartBar, FaEye, FaEyeSlash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Status badge with animations
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return '✅';
      case 'in-progress': return '🔄';
      case 'new': return '🆕';
      default: return '📋';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
    </span>
  );
};

// Severity badge with animations
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical': return '🔥';
      case 'High': return '⚠️';
      case 'Medium': return '📢';
      case 'Low': return '💚';
      default: return '📋';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${getSeverityColor(severity)}`}>
      {getSeverityIcon(severity)}
      {severity}
    </span>
  );
};

// Animated stats card
const StatsCard = ({ title, value, color, icon, onClick }) => (
  <BubbleAnimation
    onClick={onClick}
    className={`bg-white/10 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${color}`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-3xl font-bold">
      {value}
    </p>
  </BubbleAnimation>
);

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    bySeverity: {},
    byStatus: {},
    byDepartment: {},
    lastReportTime: null
  });
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('ts');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    // You can replace this with a proper toast notification library
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleDelete = async (id) => {
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'issues', id), { status: newStatus.toLowerCase() });
      showToast(`Issue status updated to ${newStatus}!`, 'success');
      setIssues(prevIssues => prevIssues.map(issue =>
        issue.id === id ? { ...issue, status: newStatus.toLowerCase() } : issue
      ));
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(prev => ({ ...prev, status: newStatus.toLowerCase() }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status: ' + error.message, 'error');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('ts', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      const categoryCounts = {};
      const severityCounts = {};
      const statusCounts = {};
      const departmentCounts = {};
      let lastTimestamp = null;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        issuesData.push(data);
        categoryCounts[data.type] = (categoryCounts[data.type] || 0) + 1;
        severityCounts[data.severity] = (severityCounts[data.severity] || 0) + 1;
        statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
        if (data.department) {
          departmentCounts[data.department] = (departmentCounts[data.department] || 0) + 1;
        }
        if (data.ts && (!lastTimestamp || data.ts.toDate() > lastTimestamp)) {
          lastTimestamp = data.ts.toDate();
        }
      });

      setIssues(issuesData);
      setStats({
        total: issuesData.length,
        byCategory: categoryCounts,
        bySeverity: severityCounts,
        byStatus: statusCounts,
        byDepartment: departmentCounts,
        lastReportTime: lastTimestamp
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredIssues = issues
    .filter(issue => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        issue.id.toLowerCase().includes(searchLower) ||
        issue.type.toLowerCase().includes(searchLower) ||
        issue.desc.toLowerCase().includes(searchLower) ||
        (issue.department?.toLowerCase() || '').includes(searchLower) ||
        (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower);

      const statusMatch = selectedStatus === 'All' || issue.status === selectedStatus.toLowerCase();
      const categoryMatch = selectedCategory === 'All' || issue.type === selectedCategory;
      const severityMatch = selectedSeverity === 'All' || issue.severity === selectedSeverity;
      const departmentMatch = selectedDepartment === 'All' || (issue.department && issue.department === selectedDepartment);
      
      const tabMatch = activeTab === 'all' || 
        (activeTab === 'new' && issue.status === 'new') ||
        (activeTab === 'in-progress' && issue.status === 'in-progress') ||
        (activeTab === 'resolved' && issue.status === 'resolved');

      return matchesSearch && statusMatch && categoryMatch && severityMatch && departmentMatch && tabMatch;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'ts') {
        aValue = aValue?.toDate?.() || new Date(0);
        bValue = bValue?.toDate?.() || new Date(0);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIssues = sortedAndFilteredIssues.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of the list
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setShowDetails(true);
  };

  const closeDetailsModal = () => {
    setShowDetails(false);
    setSelectedIssue(null);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="opacity-30" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black ">
      <div className="h-20"></div>

      <main className="container mx-auto px-4 py-8">
        {/* Header with animated gradient */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-pulse">
            Fixit Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Track and analyze civic issues in your community
          </p>
        </div>

        {/* Quick Stats Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {['all', 'new', 'in-progress', 'resolved'].map(tab => (
            <BubbleAnimation
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-blue-100 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
              ({tab === 'all' ? issues.length : issues.filter(issue => issue.status === tab).length})
            </BubbleAnimation>
          ))}
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Reports"
            value={stats.total}
            color="text-blue-600 dark:text-blue-400"
            icon="📊"
            onClick={() => setActiveTab('all')}
          />
          <StatsCard
            title="Categories"
            value={Object.keys(stats.byCategory).length}
            color="text-green-600 dark:text-green-400"
            icon="📁"
          />
          <StatsCard
            title="Active Issues"
            value={issues.filter(issue => issue.status !== 'resolved').length}
            color="text-orange-600 dark:text-orange-400"
            icon="🚧"
            onClick={() => setActiveTab('in-progress')}
          />
          <StatsCard
            title="Resolved"
            value={issues.filter(issue => issue.status === 'resolved').length}
            color="text-purple-600 dark:text-purple-400"
            icon="✅"
            onClick={() => setActiveTab('resolved')}
          />
        </div>

        {/* Interactive Filters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaFilter className="text-blue-600" />
              Filters & Search
            </h2>
            <BubbleAnimation
              onClick={() => setExpandedFilters(!expandedFilters)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            >
              {expandedFilters ? <FaEyeSlash /> : <FaEye />}
              {expandedFilters ? 'Hide Filters' : 'Show Filters'}
            </BubbleAnimation>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, type, description, or coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300"
            />
          </div>

          {/* Expandable Filters */}
          {expandedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300"
                >
                  <option>All</option>
                  <option value="new">New</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300"
                >
                  <option>All</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-300"
                >
                  <option>All</option>
                  {Object.keys(stats.byDepartment).map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Issues List */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FaChartBar className="text-green-600" />
                Issues ({sortedAndFilteredIssues.length})
              </h2>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show:
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="ml-2 px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Issues List */}
        {sortedAndFilteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No issues found with the current filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentIssues.map((issue, index) => (
              <div
                key={issue.id}
                className="p-6 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer group animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleIssueClick(issue)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full transition-all duration-300 hover:scale-105">
                        📝 {issue.type}
                      </span>
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                        {issue.ts ? new Date(issue.ts.toDate()).toLocaleDateString() : 'Unknown date'}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {issue.desc}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>📍 {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}</span>
                      {issue.department && (
                        <span className="inline-flex items-center gap-1">
                          🏢 {issue.department}
                        </span>
                      )}
                      <span className="font-mono">ID: {issue.id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {issue.imageUrl && (
                      <div className="relative group/image">
                        <img
                          src={issue.imageUrl}
                          alt="Issue"
                          className="w-16 h-16 rounded-lg object-cover shadow-md transition-all duration-300 group-hover/image:scale-110"
                        />
                        <div className="absolute inset-0  bg-opacity-0 group-hover/image:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">👁️</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={issue.status === 'resolved'}
                          onChange={(e) => {
                            const newStatus = e.target.checked ? 'resolved' : 'in-progress';
                            handleStatusChange(issue.id, newStatus);
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>

                      <BubbleAnimation
                        onClick={(e) => { e.stopPropagation(); handleDelete(issue.id); }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 text-sm"
                      >
                        <FaTrashAlt />
                        Remove
                      </BubbleAnimation>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedAndFilteredIssues.length)} of {sortedAndFilteredIssues.length} issues
                </div>
                
                <div className="flex items-center space-x-2">
                  <BubbleAnimation
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition flex items-center gap-2"
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
                          className={`px-4 py-2 rounded-lg text-sm transition ${
                            currentPage === pageNum 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
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
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition flex items-center gap-2"
                  >
                    Next
                    <FaArrowRight />
                  </BubbleAnimation>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Issue Details Modal */}
      {showDetails && selectedIssue && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={closeDetailsModal}
          />
          <div className="bg-white dark:bg-gray-900 max-w-2xl w-full rounded-2xl shadow-2xl relative overflow-hidden animate-scaleIn">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <button
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold z-10 transition-colors"
            >
              ×
            </button>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                Issue Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">ID</label>
                    <p className="text-gray-800 dark:text-gray-200 font-mono text-sm break-all mt-1">
                      {selectedIssue.id}
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">Type</label>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">{selectedIssue.type}</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">Severity</label>
                    <div className="mt-1">
                      <SeverityBadge severity={selectedIssue.severity} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={selectedIssue.status} />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">Department</label>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">
                      {selectedIssue.department || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 dark:text-gray-400">Coordinates</label>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">
                      {selectedIssue.lat?.toFixed(5)}, {selectedIssue.lng?.toFixed(5)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Description</label>
                <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {selectedIssue.desc}
                </p>
              </div>

              {selectedIssue.imageUrl && (
                <div className="mb-6">
                  <label className="font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Photo</label>
                  <img 
                    src={selectedIssue.imageUrl} 
                    alt="Reported issue" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update issue status
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-6 mb-6">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">In Progress</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={selectedIssue.status === 'resolved'}
                      onChange={(e) => {
                        const newStatus = e.target.checked ? 'resolved' : 'in-progress';
                        handleStatusChange(selectedIssue.id, newStatus);
                      }}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Resolved</span>
                </div>

                <div className="flex gap-4">
                  <BubbleAnimation
                    onClick={() => handleDelete(selectedIssue.id)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <FaTrashAlt />
                    Delete Issue
                  </BubbleAnimation>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bubble {
          animation: bubble 0.6s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;