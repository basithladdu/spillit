# GPS Integration & Database Schema Summary

## ✅ Implementation Complete

### 1. GPS Extraction Module (`src/utils/gpsExtractor.js`)
- **`extractGPSFromVideo()`**: Simulates GPS track extraction from video metadata
  - Generates GPS points along a simulated bus route in Andhra Pradesh
  - Returns array of GPS points with timestamps, coordinates, altitude, speed, heading
  - In production: Would parse NMEA sentences, EXIF data, or GPX files

- **`matchFrameToGPS()`**: Matches detection frame timestamp to closest GPS coordinate
  - Finds nearest GPS point by timestamp
  - Returns complete GPS data for the detection

- **`reverseGeocode()`**: Converts coordinates to address (mock implementation)
  - In production: Would use Google Maps Geocoding API

- **`checkDuplicateDetection()`**: Prevents duplicate detections within 20m radius
  - Uses Haversine formula to calculate distance
  - Prevents multiple complaints for same pothole

### 2. Severity Classification Engine (`src/utils/severityClassifier.js`)
- **`classifySeverity()`**: Automated severity grading
  - Based on bounding box area, confidence, and context features
  - Returns: 'low', 'medium', 'high', 'critical'
  - Considers clustering and location type (highway vs residential)

- **`calculatePriorityScore()`**: Priority scoring (0-100)
  - Factors: severity (50%), traffic density (30%), last repair age (20%)
  - Used for ranking and auto-submission decisions

- **`shouldAutoSubmitToPGRS()`**: Determines if detection should auto-submit
  - Critical/High severity → auto-submit
  - Medium with priority ≥60 → auto-submit

### 3. Updated DashcamVideoProcessor (`src/components/DashcamVideoProcessor.jsx`)

#### GPS Integration Flow:
1. **Extract GPS Track**: `extractGPSFromVideo()` generates GPS points from video
2. **Process Detections**: AI detects potholes in video frames
3. **Match to GPS**: Each detection is matched to GPS coordinate by timestamp
4. **Classify Severity**: Automated severity classification
5. **Reverse Geocode**: Convert coordinates to address
6. **Calculate Priority**: Priority score for ranking
7. **Save to Database**: Store with complete GPS metadata

#### Enhanced Detection Data Structure:
```javascript
{
  detection_id: "det_1234567890_1",
  timestamp: "00:15",
  frame_timestamp: 15.0,
  frame_number: 450,
  confidence: 0.87,
  severity: "Critical", // Formatted
  severity_level: "critical", // Lowercase for DB
  bbox_area: 12500,
  bbox: { x: 100, y: 200, width: 150, height: 100 },
  location: {
    latitude: 17.686800,
    longitude: 83.218500,
    lat: 17.686800, // Alias for compatibility
    lng: 83.218500, // Alias for compatibility
    altitude: 12.5,
    speed: 35.2, // km/h
    heading: 45.0, // degrees
    address: "Beach Road Corridor, Visakhapatnam"
  },
  priority_score: 75,
  should_auto_submit: true,
  video_source: "Bus_Route_14_AM"
}
```

### 4. Database Schema (Firestore Collection: `issues`)

#### Complete Field List:
```javascript
{
  // Basic Issue Info
  type: "Pothole",
  severity: "critical" | "high" | "medium" | "low",
  status: "new" | "assigned" | "in_progress" | "repaired" | "verified",
  desc: "Auto-detected from dashcam footage at 00:15. Confidence: 87%",
  
  // Location Data (GPS)
  lat: 17.686800, // Legacy field
  lng: 83.218500, // Legacy field
  latitude: 17.686800, // New field
  longitude: 83.218500, // New field
  address: "Beach Road Corridor, Visakhapatnam",
  
  // GPS Metadata
  gps_altitude: 12.5,
  gps_speed: 35.2,
  gps_heading: 45.0,
  
  // Video Source
  videoUrl: "https://res.cloudinary.com/...",
  videoTimestamp: "00:15",
  video_source: "Bus_Route_14_AM",
  source: "dashcam_ai",
  
  // Detection Metadata
  detection_id: "det_1234567890_1",
  frame_number: 450,
  frame_timestamp: 15.0,
  bbox_area: 12500,
  bbox: { x: 100, y: 200, width: 150, height: 100 },
  aiConfidence: 0.87,
  
  // Priority & PGRS
  priority_score: 75,
  pgrs_auto_submit: true,
  pgrs_complaint_id: null, // Set when submitted to PGRS
  pgrs_status: "pending" | "submitted" | "assigned" | "completed",
  
  // Media
  imageUrl: "https://res.cloudinary.com/...",
  
  // Timestamps
  ts: serverTimestamp(), // Firestore server timestamp
  created_at: "2026-02-11T14:30:22Z" // ISO string
}
```

#### Database Indexes Recommended:
- `ts` (descending) - For recent videos query
- `severity` + `status` - For filtering
- `latitude` + `longitude` - For spatial queries (if using Firestore geohash)
- `pgrs_status` - For PGRS sync queries

### 5. Duplicate Detection Prevention
- Checks existing detections within 20m radius before saving
- Prevents multiple complaints for same pothole
- Logs duplicate count in console

### 6. Display Enhancements
- Added GPS Points stat card
- Enhanced detection timeline with:
  - GPS coordinates (formatted to 6 decimal places)
  - Address from reverse geocoding
  - Speed at detection time
  - Priority score
  - PGRS auto-submit indicator

## 🗄️ Database Verification

### Firestore Collection: `issues`
- **Location**: Firebase Firestore
- **Collection Name**: `issues`
- **Primary Use**: Store pothole detections from dashcam AI

### Key Fields for GPS Integration:
✅ `latitude` / `longitude` - Precise GPS coordinates  
✅ `gps_altitude` - Elevation data  
✅ `gps_speed` - Vehicle speed at detection  
✅ `gps_heading` - Direction of travel  
✅ `detection_id` - Unique detection identifier  
✅ `frame_number` / `frame_timestamp` - Video frame reference  
✅ `priority_score` - Calculated priority (0-100)  
✅ `pgrs_auto_submit` - Flag for PGRS integration  
✅ `pgrs_complaint_id` - PGRS complaint reference  
✅ `pgrs_status` - PGRS workflow status  

### Query Examples:
```javascript
// Get all high/critical severity detections
query(collection(db, 'issues'), 
  where('severity', 'in', ['high', 'critical']),
  orderBy('ts', 'desc')
)

// Get detections ready for PGRS submission
query(collection(db, 'issues'),
  where('pgrs_auto_submit', '==', true),
  where('pgrs_status', '==', 'pending')
)

// Get detections by location (using geohash if implemented)
// Note: Firestore doesn't support native spatial queries
// Consider using geohash library for proximity searches
```

## 🚀 Next Steps (Phase 4: PGRS Integration)

1. **PGRS API Connector** (`src/utils/pgrsConnector.js`)
   - Implement `submitComplaint()` function
   - Map detection data to PGRS complaint format
   - Handle authentication and API calls

2. **Auto-Submission Workflow**
   - Check `pgrs_auto_submit` flag
   - Submit high-priority detections automatically
   - Update `pgrs_complaint_id` and `pgrs_status` after submission

3. **Status Sync**
   - Poll PGRS API for status updates
   - Update `pgrs_status` field in Firestore
   - Sync repair completion status

## 📊 Testing Checklist

- [x] GPS extraction mock generates realistic route
- [x] Frame-to-GPS matching works correctly
- [x] Severity classification based on area/confidence
- [x] Priority score calculation
- [x] Duplicate detection prevention (20m radius)
- [x] Database storage with all GPS fields
- [x] Display shows GPS coordinates and metadata
- [ ] PGRS API integration (Phase 4)
- [ ] Status sync with PGRS (Phase 4)

## 🔍 Database Query Verification

To verify the database structure, run this in browser console after processing a video:

```javascript
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import app from './utils/firebase';

const db = getFirestore(app);
const q = query(collection(db, 'issues'), orderBy('ts', 'desc'), limit(5));
const snapshot = await getDocs(q);

snapshot.forEach(doc => {
  console.log('Detection:', doc.id, doc.data());
});
```

This will show the latest 5 detections with all GPS fields populated.

