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

  // New color map for statuses
  const statusColors = {
    'new': 'text-red-600',
    'in-progress': 'text-yellow-600',
    'resolved': 'text-green-600'
  };

  // List of Indian civic departments for the dropdown
  const departmentOptions = ['Public Works Department (PWD)', 'Solid Waste Management Department', 'Water Utilities Department', 'Electric Division', 'Public Nuisance Dept.'];

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
        departmentCounts[data.department] = (departmentCounts[data.department] || 0) + 1; // Count by department
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

 const filteredIssues = issues.filter(issue => {
  const searchLower = searchQuery.toLowerCase();
  const matchesSearch =
    issue.id.toLowerCase().includes(searchLower) ||
    issue.type.toLowerCase().includes(searchLower) ||
    issue.desc.toLowerCase().includes(searchLower) ||
    (issue.department?.toLowerCase() || '').includes(searchLower) ||
    (issue.lat?.toFixed(5) + ', ' + issue.lng?.toFixed(5)).includes(searchLower) ||
    (issue.lat?.toFixed(4) + ', ' + issue.lng?.toFixed(4)).includes(searchLower) ||
    (issue.lat?.toFixed(3) + ', ' + issue.lng?.toFixed(3)).includes(searchLower);

  return (
    (selectedStatus === 'All' || issue.status === selectedStatus.toLowerCase()) &&
    (selectedCategory === 'All' || issue.type === selectedCategory) &&
    (selectedSeverity === 'All' || issue.severity === selectedSeverity) &&
    (selectedDepartment === 'All' || issue.department === selectedDepartment) &&
    matchesSearch
  );
});

  
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
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

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'N/A';
    return status.split('-').map(capitalizeFirstLetter).join('-');
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
                    {getStatusDisplay(status)}
                  </div>
                  <div className="text-3xl font-extrabold text-gray-800 dark:text-white">
                    {count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Issues by Department */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Issues by Department
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(stats.byDepartment).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                No issues assigned yet.
              </p>
            ) : (
              Object.entries(stats.byDepartment).map(([department, count]) => (
                <div
                  key={department}
                  className="bg-white/10 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow"
                >
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {department}
                  </div>
                  <div className="text-3xl font-extrabold text-gray-800 dark:text-white">
                    {count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Recent Issues
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 mb-4">
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
            <div className="flex flex-col">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>All</option>
                <option value="new">New</option>
                <option value="in-progress">In-Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
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
            <div className="flex flex-col">
  <label htmlFor="department-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Department
  </label>
  <select
    id="department-filter"
    value={selectedDepartment}
    onChange={(e) => setSelectedDepartment(e.target.value)}
    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
  >
    <option>All</option>
    {Object.keys(stats.byDepartment).map((dep) => (
      <option key={dep} value={dep}>{dep}</option>
    ))}
  </select>
</div>

          </div>
          <div className="mb-4 flex items-center justify-between">
              <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Items per page:</label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white/80 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          <div className="bg-white/10 rounded-lg shadow-lg overflow-hidden">
            {filteredIssues.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 p-8">
                No issues with this status found.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentIssues.map((issue) => (
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
                            {getStatusDisplay(issue.status)}
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
                        {issue.department && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Assigned to: {issue.department}
                          </p>
                        )}
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
  onClick={(e) => {
    e.stopPropagation();
    const newStatus = issue.status === 'in-progress' ? 'resolved' : 'in-progress';
    handleStatusChange(issue.id, newStatus);
  }}
  className={`px-4 py-2 rounded text-xs flex items-center gap-2 text-white ${
    issue.status === 'resolved'
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-yellow-600 hover:bg-yellow-700'
  }`}
>
  {issue.status === 'resolved' ? <FaCheckCircle /> : <FaSpinner />}
  <span>{issue.status === 'resolved' ? 'Resolved' : 'In-Progress'}</span>
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
        </div>
      </main>
      
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
                <span className="text-gray-700 dark:text-gray-300">{getStatusDisplay(selectedIssue.status)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Assigned to:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.department || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Coordinates:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedIssue.lat?.toFixed(5)}, {selectedIssue.lng?.toFixed(5)}</span>
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
            </div>
            {/* Action buttons inside the modal */}
           <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 text-center">
  Click a button to update the status of this report
</div>
<div className="flex flex-col sm:flex-row gap-2 mt-4">
  <button
    onClick={() => handleStatusChange(selectedIssue.id, 'In-Progress')}
    className={`flex-1 px-4 py-2 text-white rounded transition text-xs flex items-center justify-center gap-1 ${
      selectedIssue.status === 'in-progress' ? 'bg-yellow-800 border border-yellow-500' : 'bg-yellow-600 hover:bg-yellow-700'
    }`}
  >
    <FaSpinner />
    <span>In-Progress</span>
  </button>
  <button
    onClick={() => handleStatusChange(selectedIssue.id, 'Resolved')}
    className={`flex-1 px-4 py-2 text-white rounded transition text-xs flex items-center justify-center gap-1 ${
      selectedIssue.status === 'resolved' ? 'bg-green-800 border border-green-500' : 'bg-green-600 hover:bg-green-700'
    }`}
  >
    <FaCheckCircle />
    <span>Resolved</span>
  </button>
  <button
    onClick={() => handleDelete(selectedIssue.id)}
    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs flex items-center justify-center gap-1"
  >
    <FaTrashAlt />
    <span>Remove</span>
  </button>
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