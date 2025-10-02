import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaIdBadge, FaExternalLinkAlt } from 'react-icons/fa';

// Helper function (Centralized here for clean code)
const getSeverityStyles = (severity) => {
    switch (severity) {
        case 'Critical': return { text: 'text-red-600', badge: 'bg-red-100', icon: '🚨' };
        case 'High': return { text: 'text-orange-600', badge: 'bg-orange-100', icon: '⚠️' };
        case 'Medium': return { text: 'text-yellow-600', badge: 'bg-yellow-100', icon: '🔔' };
        case 'Low': return { text: 'text-green-600', badge: 'bg-green-100', icon: '✅' };
        default: return { text: 'text-gray-600', badge: 'bg-gray-100', icon: '❓' };
    }
};

const MarkerPopup = ({ issue }) => {
    // Note: currentUser and onRemove are no longer needed as the delete feature is removed.
    const { text, icon, badge } = getSeverityStyles(issue.severity);
    const timestamp = issue.ts ? new Date(issue.ts.toDate()).toLocaleString() : 'N/A';

    return (
        // ✅ CRITICAL FIX: Ensure background is white and text is dark for maximum contrast over map
        <div className="w-64 font-sans text-gray-800 bg-white p-3 rounded-lg shadow-md">
            
            {/* Header: Type and Severity Icon */}
            <h3 className="font-bold text-lg mb-2 pb-1 border-b border-gray-200 flex items-center justify-between">
                <span>{issue.type}</span>
                <span className={`text-xl ${text}`}>{icon}</span>
            </h3>
            
            {/* Essential Details */}
            <div className="text-xs space-y-2 mb-3">
                <p className="flex justify-between items-center">
                    <span className="font-medium flex items-center"><FaIdBadge className="mr-1 text-blue-500" /> Report ID:</span>
                    <span className="font-mono text-gray-600 break-all">{issue.id.substring(0, 8)}...</span>
                </p>
                
                <p className="flex justify-between items-center">
                    <span className="font-medium">Severity:</span>
                    <span className={`font-semibold text-xs ${text} ${badge} px-2 py-0.5 rounded-full`}>
                        {issue.severity}
                    </span>
                </p>
                
                <p className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <span className="capitalize text-green-600 font-semibold">{issue.status || 'New'}</span>
                </p>
                
                {/* Short Description */}
                <p className="text-gray-600 italic mt-2 text-sm pt-2 border-t border-gray-100">
                    {issue.desc.substring(0, 70)}...
                </p>
            </div>

            {/* Location and Date */}
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
                <p className="flex items-center"><FaCalendarAlt className="mr-1" /> Reported: {timestamp}</p>
                <p className="flex items-center"><FaMapMarkerAlt className="mr-1" /> Loc: {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}</p>
            </div>
            
            {/* View Full Details Button */}
            <a 
                href={`/report/${issue.id}`} 
                className="block text-center mt-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition font-medium flex items-center justify-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
            >
                View Full Details <FaExternalLinkAlt size={10} />
            </a>
        </div>
    );
};

export default MarkerPopup;