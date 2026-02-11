/**
 * Kurnool District Road Matcher
 * Matches pothole detections to roads in Kurnool district
 * Uses the AP_Roads_Department_Mapping.xlsx data filtered for Kurnool
 */

import { findNearestRBRoad, getAllRBRoads } from './rbRoadsMockData';

// Kurnool District Boundaries (approximate)
const KURNOOL_BOUNDS = {
    minLat: 15.5,
    maxLat: 16.2,
    minLon: 77.5,
    maxLon: 78.5
};

// Kurnool City Center
const KURNOOL_CENTER = {
    lat: 15.8281,
    lon: 78.0373
};

/**
 * Check if coordinates are within Kurnool district
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean}
 */
export function isInKurnoolDistrict(lat, lon) {
    return (
        lat >= KURNOOL_BOUNDS.minLat &&
        lat <= KURNOOL_BOUNDS.maxLat &&
        lon >= KURNOOL_BOUNDS.minLon &&
        lon <= KURNOOL_BOUNDS.maxLon
    );
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Match pothole detection to nearest road in Kurnool
 * Uses R&B Department roads mock data
 * 
 * @param {number} potholeLat - Pothole latitude
 * @param {number} potholeLon - Pothole longitude
 * @param {Array} roadsData - Array of road objects (from Excel/DB)
 * @returns {Object|null} Road information with department
 */
export function matchPotholeToKurnoolRoad(potholeLat, potholeLon, roadsData = []) {
    // First try to use provided roads data
    let kurnoolRoads = roadsData.filter(road => 
        road.latitude &&
        road.longitude &&
        isInKurnoolDistrict(road.latitude, road.longitude)
    );
    
    // If no roads provided, use R&B mock data
    if (kurnoolRoads.length === 0) {
        const rbRoads = getAllRBRoads();
        kurnoolRoads = rbRoads.filter(road => 
            isInKurnoolDistrict(road.latitude, road.longitude)
        );
    }
    
    // Find nearest road
    let nearestRoad = null;
    let minDistance = Infinity;
    
    for (const road of kurnoolRoads) {
        const distance = calculateDistance(
            potholeLat,
            potholeLon,
            road.latitude,
            road.longitude
        );
        
        // Search within 500 meters (larger radius for R&B roads)
        if (distance < 500 && distance < minDistance) {
            minDistance = distance;
            nearestRoad = {
                ...road,
                distance_meters: Math.round(distance)
            };
        }
    }
    
    // If found R&B road, return it
    if (nearestRoad) {
        return nearestRoad;
    }
    
    // Try R&B roads directly if not found in filtered list
    const rbNearest = findNearestRBRoad(potholeLat, potholeLon);
    if (rbNearest && rbNearest.distance_meters < 1000) {
        return rbNearest;
    }
    
    // Fallback: Use road classification based on coordinates
    return getRoadDepartmentByLocation(potholeLat, potholeLon);
}

/**
 * Get department based on location (fallback when road data not available)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Department information
 */
function getRoadDepartmentByLocation(lat, lon) {
    // Check if in Kurnool city limits (approximate)
    const cityRadius = 0.05; // ~5km radius
    const isInCity = 
        Math.abs(lat - KURNOOL_CENTER.lat) < cityRadius &&
        Math.abs(lon - KURNOOL_CENTER.lon) < cityRadius;
    
    if (isInCity) {
        return {
            road_name: 'Kurnool City Road',
            department: 'Kurnool Municipal Corporation (KMC)',
            repair_priority: 'Medium (Municipal)',
            highway_type: 'residential',
            latitude: lat,
            longitude: lon,
            distance_meters: null
        };
    } else {
        // Rural area - likely Panchayat Raj
        return {
            road_name: 'Rural Road',
            department: 'Panchayat Raj Engineering Department (PRED)',
            repair_priority: 'Low',
            highway_type: 'unclassified',
            latitude: lat,
            longitude: lon,
            distance_meters: null
        };
    }
}

/**
 * Load Kurnool roads from Excel/CSV data
 * In production, this would load from database or API
 * 
 * @returns {Promise<Array>} Array of road objects
 */
export async function loadKurnoolRoads() {
    try {
        // Try to load from public folder
        const response = await fetch('/AP_Roads_Department_Mapping.xlsx');
        
        if (!response.ok) {
            console.warn('Could not load road data, using fallback');
            return [];
        }
        
        // Note: In production, you'd parse the Excel file
        // For now, return empty array (will use fallback)
        return [];
    } catch (error) {
        console.warn('Error loading Kurnool roads:', error);
        return [];
    }
}

/**
 * Get department color for map display
 * @param {string} department - Department name
 * @returns {string} Hex color code
 */
export function getDepartmentColor(department) {
    const colors = {
        'NHAI (National Highways Authority)': '#FF0000',
        'R&B Department (State Highways)': '#FF6600',
        'R&B Department (District Roads - MDR)': '#FFAA00',
        'R&B Department (District Roads - ODR)': '#FFDD00',
        'Kurnool Municipal Corporation (KMC)': '#00AA00',
        'Municipal Corporation (City Roads)': '#00AA00',
        'Panchayat Raj Engineering Department (PRED)': '#0066FF',
        'Panchayat Raj (Rural Roads)': '#0066FF'
    };
    
    return colors[department] || '#808080';
}

/**
 * Get repair priority response time
 * @param {string} priority - Priority level
 * @returns {string} Response time description
 */
export function getPriorityResponseTime(priority) {
    const responseTimes = {
        'Critical (NH)': 'Within 24 hours',
        'High (SH)': 'Within 48 hours',
        'Medium (District)': 'Within 7 days',
        'Medium (Municipal)': 'Within 14 days',
        'Low': 'As needed'
    };
    
    return responseTimes[priority] || 'As needed';
}

/**
 * Check if detection should auto-submit to PGRS based on department and priority
 * @param {Object} roadInfo - Road information from matchPotholeToKurnoolRoad
 * @returns {boolean}
 */
export function shouldAutoSubmitToPGRS(roadInfo) {
    if (!roadInfo) return false;
    
    const autoSubmitPriorities = [
        'Critical (NH)',
        'High (SH)'
    ];
    
    return autoSubmitPriorities.includes(roadInfo.repair_priority);
}

