/**
 * GPS Extraction Mock Utility
 * Simulates GPS data extraction from dashcam video metadata
 * 
 * In production, this would:
 * - Parse NMEA sentences from video metadata
 * - Extract EXIF GPS data
 * - Read separate GPX files
 * - Handle timestamp synchronization
 */

/**
 * Simulate GPS track extraction from video
 * Returns array of GPS points with timestamps
 * Simulates a bus moving along a single straight road in Andhra Pradesh
 * 
 * @param {string} videoUrl - Video URL (for mock, we'll generate a route)
 * @param {number} durationSeconds - Video duration in seconds
 * @param {number} fps - Frames per second
 * @returns {Array<{timestamp: number, latitude: number, longitude: number, altitude?: number}>}
 */
export function extractGPSFromVideo(videoUrl, durationSeconds = 120, fps = 30) {
    // Mock GPS track - simulates a bus route along ONE ROAD in Kurnool District
    // Starting point: Kurnool City Center (15.8281°N, 78.0373°E)
    // Simulating movement along a straight road in Kurnool
    
    const gpsPoints = [];
    
    // Road start point (Kurnool City Center)
    const startLat = 15.8281;
    const startLon = 78.0373;
    
    // Road direction (slight northeast direction - simulating Beach Road)
    // This creates a linear path along one road
    const roadDirectionLat = 0.00015;  // Small increment per second (northward)
    const roadDirectionLon = 0.00012;  // Small increment per second (eastward)
    
    // Simulate bus moving along a single straight road
    const totalFrames = Math.floor(durationSeconds * fps);
    const interval = Math.max(1, Math.floor(fps / 2)); // GPS point every 0.5 seconds
    
    for (let frame = 0; frame < totalFrames; frame += interval) {
        const timestamp = frame / fps;
        
        // Linear movement along the road (no curves, just straight line)
        const progress = timestamp / durationSeconds;
        
        // Calculate position along the road (straight line)
        const latOffset = progress * roadDirectionLat * durationSeconds;
        const lonOffset = progress * roadDirectionLon * durationSeconds;
        
        // Add minimal GPS noise (very small - just for realism, keeps points on same road)
        const noiseLat = (Math.random() - 0.5) * 0.00002; // Very small noise (2 meters)
        const noiseLon = (Math.random() - 0.5) * 0.00002; // Very small noise (2 meters)
        
        // Calculate heading (direction of travel along the road)
        const heading = Math.atan2(roadDirectionLat, roadDirectionLon) * (180 / Math.PI);
        
        gpsPoints.push({
            timestamp: timestamp,
            frame_number: frame,
            latitude: startLat + latOffset + noiseLat,
            longitude: startLon + lonOffset + noiseLon,
            altitude: 10 + Math.random() * 2, // Sea level + small variations (2m range)
            speed: 35 + Math.random() * 10, // km/h (consistent speed along road)
            heading: heading
        });
    }
    
    return gpsPoints;
}

/**
 * Match detection frame to GPS coordinate
 * Finds the closest GPS point by timestamp
 * 
 * @param {number} frameTimestamp - Detection timestamp in seconds
 * @param {Array} gpsTrack - GPS track array from extractGPSFromVideo
 * @returns {{latitude: number, longitude: number, altitude?: number} | null}
 */
export function matchFrameToGPS(frameTimestamp, gpsTrack) {
    if (!gpsTrack || gpsTrack.length === 0) {
        return null;
    }
    
    // Find closest GPS point by timestamp
    let closest = gpsTrack[0];
    let minDiff = Math.abs(gpsTrack[0].timestamp - frameTimestamp);
    
    for (const point of gpsTrack) {
        const diff = Math.abs(point.timestamp - frameTimestamp);
        if (diff < minDiff) {
            minDiff = diff;
            closest = point;
        }
    }
    
    return {
        latitude: closest.latitude,
        longitude: closest.longitude,
        altitude: closest.altitude,
        speed: closest.speed,
        heading: closest.heading,
        timestamp: closest.timestamp
    };
}

/**
 * Reverse geocode coordinates to address
 * Mock implementation - in production would use Google Maps Geocoding API
 * Since all detections are on the same road, return consistent address
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Address string
 */
export async function reverseGeocode(lat, lon) {
    // Mock reverse geocoding - all points are on the same road
    // In production, this would use Google Maps Geocoding API
    // For demo: All detections are on roads in Kurnool District
    
    // Return road name based on location in Kurnool
    const roadNames = [
        'NH-44, Kurnool',
        'MG Road, Kurnool',
        'Collector Office Road, Kurnool',
        'Railway Station Road, Kurnool',
        'City Center Road, Kurnool'
    ];
    
    // Simple hash-based selection for consistency
    const hash = Math.floor((lat + lon) * 1000) % roadNames.length;
    return roadNames[hash];
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 * 
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
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
 * Check for duplicate detections within radius
 * Prevents creating multiple complaints for same pothole
 * 
 * @param {number} lat - Detection latitude
 * @param {number} lon - Detection longitude
 * @param {Array} existingDetections - Array of existing detections
 * @param {number} radiusMeters - Radius in meters (default 20m)
 * @returns {boolean} True if duplicate found
 */
export function checkDuplicateDetection(lat, lon, existingDetections, radiusMeters = 20) {
    for (const existing of existingDetections) {
        const distance = calculateDistance(
            lat, lon,
            existing.latitude || existing.lat,
            existing.longitude || existing.lng
        );
        
        if (distance < radiusMeters) {
            return true;
        }
    }
    
    return false;
}

/**
 * Format GPS coordinates for display
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} precision - Decimal places (default 6)
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(lat, lon, precision = 6) {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

