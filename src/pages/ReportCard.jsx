import React from 'react';
import { FaIdBadge, FaMapMarkerAlt, FaCalendarAlt, FaPaperclip, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// Helper function to get style based on severity
const getSeverityStyles = (severity) => {
    switch (severity) {
        case 'Critical':
            return { color: 'text-red-600', badge: 'bg-red-100 text-red-800', icon: <FaExclamationTriangle className="inline mr-2" /> };
        case 'High':
            return { color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800', icon: <FaExclamationTriangle className="inline mr-2" /> };
        case 'Medium':
            return { color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800', icon: <FaExclamationTriangle className="inline mr-2" /> };
        case 'Low':
            return { color: 'text-green-600', badge: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="inline mr-2" /> };
        default:
            return { color: 'text-gray-600', badge: 'bg-gray-100 text-gray-800', icon: <FaCheckCircle className="inline mr-2" /> };
    }
};

const ReportCard = ({ summaryData, setShowSummary }) => {
    if (!summaryData) return null;

    const { color, icon } = getSeverityStyles(summaryData.severity);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowSummary(false)}
            />
            
            {/* Modal Content Card */}
            <div className="bg-white dark:bg-gray-900 max-w-lg w-full mx-4 p-6 sm:p-8 rounded-xl shadow-2xl relative transform scale-100 transition-all duration-300 border-t-4 border-blue-500">
                
                {/* Close Button */}
                <button
                    onClick={() => setShowSummary(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-3xl font-light transition-colors"
                    aria-label="Close"
                >
                    &times;
                </button>
                
                {/* Header */}
                <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6 text-center">
                    <span className="text-blue-500">🎉</span> Report Submitted!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm text-center">
                    Thank you! Your report has been logged for immediate action.
                </p>
                
                {/* Summary Details Grid */}
                <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
                    
                    {/* Tracking ID */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center"><FaIdBadge className="mr-2 text-blue-500" /> Tracking ID:</span>
                        <span className="text-sm font-mono break-all bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md">{summaryData.id}</span>
                    </div>
                    
                    {/* Issue Type */}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{summaryData.type}</span>
                    </div>

                    {/* Severity */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Severity:</span>
                        <span className={`font-semibold ${color} flex items-center`}>
                            {icon} {summaryData.severity}
                        </span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Assigned Department:</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">{summaryData.department || 'N/A'}</span>
                    </div>
                    
                    {/* Location & Date */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center col-span-2 sm:col-span-1"><FaMapMarkerAlt className="mr-2 text-green-500" /> Coordinates:</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 col-span-2 sm:col-span-1 break-all">{summaryData.lat?.toFixed(5)}, {summaryData.lng?.toFixed(5)}</span>
                        
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center col-span-2 sm:col-span-1"><FaCalendarAlt className="mr-2 text-yellow-500" /> Reported Date:</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 col-span-2 sm:col-span-1">{summaryData.reportedDate}</span>
                    </div>
                </div>
                
                {/* Description */}
                <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                    <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center mb-1"><FaPaperclip className="mr-2 text-blue-500" /> Description:</span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">{summaryData.desc || 'No detailed description provided.'}</p>
                </div>

                {/* Image (if available) */}
                {summaryData.imageUrl && (
                    <div className="flex flex-col items-center mt-4">
                        <img 
                            src={summaryData.imageUrl} 
                            alt="Reported issue photo" 
                            className="max-w-full h-auto max-h-40 object-cover rounded-lg shadow-md border-2 border-blue-200 dark:border-blue-400" 
                        />
                    </div>
                )}
                
                {/* Action Button */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setShowSummary(false)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-lg"
                    >
                        Close Map
                    </button>
                </div>
            </div>
            
            {/* Inline CSS for Modal Animation */}
            <style jsx="true">{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in > div:nth-child(2) {
                    animation: fadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default ReportCard;