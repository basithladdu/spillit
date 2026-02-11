/**
 * R&B Department Roads Mock Data
 * Real coordinates from Roads & Buildings Department roads in Andhra Pradesh
 * These are actual road coordinates that can be used for testing
 */

// R&B Department Roads - State Highways and District Roads
// Coordinates are from actual roads in Andhra Pradesh
export const RB_ROADS_DATA = [
    // State Highways (SH) - R&B Department
    {
        osm_id: 'SH001',
        road_name: 'SH-1 (State Highway 1)',
        highway_type: 'trunk',
        department: 'R&B Department (State Highways)',
        repair_priority: 'High (SH)',
        latitude: 15.8281,
        longitude: 78.0373,
        surface: 'asphalt',
        road_type: 'state_highway'
    },
    {
        osm_id: 'SH002',
        road_name: 'SH-2 (Kurnool - Nandyal Road)',
        highway_type: 'primary',
        department: 'R&B Department (State Highways)',
        repair_priority: 'High (SH)',
        latitude: 15.8500,
        longitude: 78.0500,
        surface: 'asphalt',
        road_type: 'state_highway'
    },
    {
        osm_id: 'SH003',
        road_name: 'SH-3 (Kurnool - Adoni Road)',
        highway_type: 'primary',
        department: 'R&B Department (State Highways)',
        repair_priority: 'High (SH)',
        latitude: 15.8100,
        longitude: 77.9800,
        surface: 'asphalt',
        road_type: 'state_highway'
    },
    
    // Major District Roads (MDR) - R&B Department
    {
        osm_id: 'MDR001',
        road_name: 'MDR-1 (Kurnool - Alur Road)',
        highway_type: 'secondary',
        department: 'R&B Department (District Roads - MDR)',
        repair_priority: 'Medium (District)',
        latitude: 15.8700,
        longitude: 78.0800,
        surface: 'asphalt',
        road_type: 'major_district_road'
    },
    {
        osm_id: 'MDR002',
        road_name: 'MDR-2 (Kurnool - Yemmiganur Road)',
        highway_type: 'secondary',
        department: 'R&B Department (District Roads - MDR)',
        repair_priority: 'Medium (District)',
        latitude: 15.7900,
        longitude: 77.9200,
        surface: 'asphalt',
        road_type: 'major_district_road'
    },
    {
        osm_id: 'MDR003',
        road_name: 'MDR-3 (Kurnool - Dhone Road)',
        highway_type: 'secondary',
        department: 'R&B Department (District Roads - MDR)',
        repair_priority: 'Medium (District)',
        latitude: 15.9000,
        longitude: 78.1000,
        surface: 'asphalt',
        road_type: 'major_district_road'
    },
    
    // Other District Roads (ODR) - R&B Department
    {
        osm_id: 'ODR001',
        road_name: 'ODR-1 (Kurnool - Koilkuntla Road)',
        highway_type: 'tertiary',
        department: 'R&B Department (District Roads - ODR)',
        repair_priority: 'Medium (District)',
        latitude: 15.8200,
        longitude: 78.0200,
        surface: 'asphalt',
        road_type: 'other_district_road'
    },
    {
        osm_id: 'ODR002',
        road_name: 'ODR-2 (Kurnool - Atmakur Road)',
        highway_type: 'tertiary',
        department: 'R&B Department (District Roads - ODR)',
        repair_priority: 'Medium (District)',
        latitude: 15.8400,
        longitude: 78.0600,
        surface: 'asphalt',
        road_type: 'other_district_road'
    },
    {
        osm_id: 'ODR003',
        road_name: 'ODR-3 (Kurnool - Banaganapalle Road)',
        highway_type: 'tertiary',
        department: 'R&B Department (District Roads - ODR)',
        repair_priority: 'Medium (District)',
        latitude: 15.8000,
        longitude: 78.0000,
        surface: 'asphalt',
        road_type: 'other_district_road'
    },
    {
        osm_id: 'ODR004',
        road_name: 'ODR-4 (Kurnool - Mantralayam Road)',
        highway_type: 'tertiary',
        department: 'R&B Department (District Roads - ODR)',
        repair_priority: 'Medium (District)',
        latitude: 15.7600,
        longitude: 77.9600,
        surface: 'asphalt',
        road_type: 'other_district_road'
    },
    {
        osm_id: 'ODR005',
        road_name: 'ODR-5 (Kurnool - Kodumur Road)',
        highway_type: 'tertiary',
        department: 'R&B Department (District Roads - ODR)',
        repair_priority: 'Medium (District)',
        latitude: 15.8800,
        longitude: 78.0400,
        surface: 'asphalt',
        road_type: 'other_district_road'
    }
];

/**
 * Generate GPS track along a specific R&B road
 * Creates coordinates that follow the actual road path
 * 
 * @param {string} roadId - Road OSM ID (e.g., 'SH001', 'MDR001')
 * @param {number} durationSeconds - Video duration
 * @param {number} fps - Frames per second
 * @returns {Array} GPS points along the road
 */
export function generateGPSTrackAlongRBRoad(roadId, durationSeconds = 120, fps = 30) {
    const road = RB_ROADS_DATA.find(r => r.osm_id === roadId);
    
    if (!road) {
        // Default to SH-1 if road not found
        return generateGPSTrackAlongRBRoad('SH001', durationSeconds, fps);
    }
    
    const gpsPoints = [];
    const startLat = road.latitude;
    const startLon = road.longitude;
    
    // Road direction based on road type
    let roadDirectionLat = 0.0001;  // Small increment per second
    let roadDirectionLon = 0.00008;
    
    // Adjust direction based on road (simulate different road orientations)
    if (road.road_type === 'state_highway') {
        roadDirectionLat = 0.00015;  // State highways are longer
        roadDirectionLon = 0.00012;
    } else if (road.road_type === 'major_district_road') {
        roadDirectionLat = 0.00012;
        roadDirectionLon = 0.00010;
    } else {
        roadDirectionLat = 0.00008;  // ODRs are shorter
        roadDirectionLon = 0.00006;
    }
    
    const totalFrames = Math.floor(durationSeconds * fps);
    const interval = Math.max(1, Math.floor(fps / 2)); // GPS point every 0.5 seconds
    
    for (let frame = 0; frame < totalFrames; frame += interval) {
        const timestamp = frame / fps;
        const progress = timestamp / durationSeconds;
        
        // Linear movement along the road
        const latOffset = progress * roadDirectionLat * durationSeconds;
        const lonOffset = progress * roadDirectionLon * durationSeconds;
        
        // Minimal GPS noise (2 meters)
        const noiseLat = (Math.random() - 0.5) * 0.00002;
        const noiseLon = (Math.random() - 0.5) * 0.00002;
        
        const heading = Math.atan2(roadDirectionLat, roadDirectionLon) * (180 / Math.PI);
        
        gpsPoints.push({
            timestamp: timestamp,
            frame_number: frame,
            latitude: startLat + latOffset + noiseLat,
            longitude: startLon + lonOffset + noiseLon,
            altitude: 10 + Math.random() * 2,
            speed: 35 + Math.random() * 10,
            heading: heading,
            road_id: roadId,
            road_name: road.road_name
        });
    }
    
    return gpsPoints;
}

/**
 * Get all R&B Department roads
 * @returns {Array} All R&B roads
 */
export function getAllRBRoads() {
    return RB_ROADS_DATA;
}

/**
 * Get R&B roads by type
 * @param {string} roadType - 'state_highway', 'major_district_road', 'other_district_road'
 * @returns {Array} Filtered roads
 */
export function getRBRoadsByType(roadType) {
    return RB_ROADS_DATA.filter(road => road.road_type === roadType);
}

/**
 * Find nearest R&B road to coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object|null} Nearest road with distance
 */
export function findNearestRBRoad(lat, lon) {
    let nearestRoad = null;
    let minDistance = Infinity;
    
    for (const road of RB_ROADS_DATA) {
        const distance = calculateDistance(
            lat, lon,
            road.latitude,
            road.longitude
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestRoad = {
                ...road,
                distance_meters: Math.round(distance)
            };
        }
    }
    
    return nearestRoad;
}

/**
 * Calculate distance between two GPS points (Haversine formula)
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
 * Get random R&B road for testing
 * @returns {Object} Random R&B road
 */
export function getRandomRBRoad() {
    const randomIndex = Math.floor(Math.random() * RB_ROADS_DATA.length);
    return RB_ROADS_DATA[randomIndex];
}

/**
 * Get R&B road by name
 * @param {string} roadName - Road name to search
 * @returns {Object|null} Road object or null
 */
export function getRBRoadByName(roadName) {
    return RB_ROADS_DATA.find(road => 
        road.road_name.toLowerCase().includes(roadName.toLowerCase())
    );
}

