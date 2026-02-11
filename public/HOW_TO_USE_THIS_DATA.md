# AP Roads Department Mapping - User Guide

## 📊 Dataset Overview

**Total Roads Processed:** 6,116 roads across Andhra Pradesh  
**Export Date:** February 10, 2026  
**Data Source:** OpenStreetMap via HOT Export Tool

---

## 📁 Excel File Structure

Your Excel file **`AP_Roads_Department_Mapping.xlsx`** contains **4 sheets**:

### Sheet 1: **All Roads** (6,116 roads)
Complete dataset with all roads including unnamed streets.

**Columns:**
- `osm_id` - Unique OpenStreetMap ID
- `name` - Road name (if available)
- `highway` - Road classification (trunk, primary, residential, etc.)
- `department` - Responsible government department
- `repair_priority` - Priority level for pothole repairs
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `surface` - Road surface type (asphalt, concrete, etc.)
- `width` - Road width (if available)
- `oneway` - One-way road indicator
- `bridge` - Bridge indicator
- `tunnel` - Tunnel indicator

### Sheet 2: **Named Roads Only** (233 roads)
Filtered view showing only roads with official names - useful for major roads.

### Sheet 3: **Department Summary**
Statistical breakdown by responsible department.

### Sheet 4: **Priority Summary**
Statistical breakdown by repair priority level.

---

## 🏛️ Department Assignments

### **NHAI (National Highways Authority)** - 222 roads (3.6%)
- **Jurisdiction:** National Highways (NH)
- **Road Types:** Trunk roads, NH-designated highways
- **Contact:** NHAI Regional Office, Hyderabad
- **Website:** https://www.nhai.gov.in/

### **R&B Department (Roads & Buildings)** - 425 roads (6.9%)
**Subdivided into:**
- **State Highways (SH):** 88 roads (1.4%)
- **Major District Roads (MDR):** 70 roads (1.1%)
- **Other District Roads (ODR):** 267 roads (4.4%)

**Contact:** Commissioner, R&B Department, AP
**Website:** https://aprb.ap.gov.in/

### **Municipal Corporation (City Roads)** - 5,237 roads (85.6%)
**Includes:**
- Residential streets: 5,143 roads
- Pedestrian/Minor roads: 94 roads

**Responsible Corporations:**
- GVMC (Greater Visakhapatnam)
- VMC (Vijayawada)
- GMC (Guntur)
- Others based on location

### **Panchayat Raj (Rural Roads)** - 216 roads (3.5%)
- **Jurisdiction:** Village roads, unclassified rural roads
- **Department:** Panchayat Raj Engineering Department (PRED)

---

## ⚠️ Repair Priority Levels

### **Critical (NH)** - 219 roads (3.6%)
- National Highways
- **Response Time:** Within 24 hours
- **Department:** NHAI

### **High (SH)** - 91 roads (1.5%)
- State Highways
- **Response Time:** Within 48 hours
- **Department:** R&B Department

### **Medium (District)** - 330 roads (5.4%)
- District Roads (MDR/ODR)
- **Response Time:** Within 7 days
- **Department:** R&B Department

### **Medium (Municipal)** - 4,938 roads (80.7%)
- City residential roads
- **Response Time:** Within 14 days
- **Department:** Municipal Corporation

### **Low** - 538 roads (8.8%)
- Rural roads, pedestrian paths
- **Response Time:** As needed
- **Department:** Panchayat Raj / Municipal

---

## 🔗 Integration with Pothole Detection System

### Step 1: Import to Database

```sql
CREATE TABLE ap_roads (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE,
    road_name VARCHAR(255),
    highway_type VARCHAR(50),
    department VARCHAR(100),
    repair_priority VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    surface VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for fast coordinate lookup
CREATE INDEX idx_ap_roads_coordinates 
ON ap_roads (latitude, longitude);
```

### Step 2: Match Pothole Detection to Department

When your YOLOv4 model detects a pothole at coordinates (lat, lon):

```python
def get_responsible_department(pothole_lat, pothole_lon):
    """
    Find the nearest road and return responsible department
    """
    query = """
        SELECT 
            road_name,
            department,
            repair_priority,
            ST_Distance(
                ST_MakePoint(%s, %s)::geography,
                ST_MakePoint(longitude, latitude)::geography
            ) as distance_meters
        FROM ap_roads
        WHERE latitude BETWEEN %s - 0.01 AND %s + 0.01
          AND longitude BETWEEN %s - 0.01 AND %s + 0.01
        ORDER BY distance_meters
        LIMIT 1
    """
    
    result = db.execute(query, (
        pothole_lon, pothole_lat,
        pothole_lat, pothole_lat,
        pothole_lon, pothole_lon
    ))
    
    return result.fetchone()
```

### Step 3: Auto-Submit to PGRS

```python
department_info = get_responsible_department(detection['lat'], detection['lon'])

if department_info['repair_priority'] in ['Critical (NH)', 'High (SH)']:
    # Auto-submit to PGRS
    pgrs_complaint_id = submit_to_pgrs({
        'latitude': detection['lat'],
        'longitude': detection['lon'],
        'severity': detection['severity'],
        'department': department_info['department'],
        'priority': department_info['repair_priority'],
        'evidence_url': detection['image_url']
    })
else:
    # Log for manual review
    log_detection_for_review(detection, department_info)
```

---

## 📍 Using the Data in Your Map

### Leaflet.js Example

```javascript
// Load road data
fetch('AP_Roads_Department_Mapping.csv')
  .then(response => response.text())
  .then(csv => {
    const roads = parseCSV(csv);
    
    // Add roads to map with color coding by department
    roads.forEach(road => {
      const color = getDepartmentColor(road.department);
      
      L.marker([road.latitude, road.longitude], {
        icon: L.divIcon({
          className: 'road-marker',
          html: `<div style="background: ${color}"></div>`
        })
      })
      .bindPopup(`
        <strong>${road.name || 'Unnamed Road'}</strong><br>
        Department: ${road.department}<br>
        Priority: ${road.repair_priority}
      `)
      .addTo(map);
    });
  });

function getDepartmentColor(dept) {
  const colors = {
    'NHAI (National Highways Authority)': '#FF0000',
    'R&B Department (State Highways)': '#FF6600',
    'R&B Department (District Roads - MDR)': '#FFAA00',
    'R&B Department (District Roads - ODR)': '#FFDD00',
    'Municipal Corporation (City Roads)': '#00AA00',
    'Panchayat Raj (Rural Roads)': '#0066FF'
  };
  return colors[dept] || '#808080';
}
```

---

## 🎯 Next Steps for Your Hackathon

### 1. **Database Setup** ✅
Import this Excel file into PostgreSQL with PostGIS extension

### 2. **GPS Matching** ✅
When processing dashcam videos, match pothole coordinates to nearest road

### 3. **Department Auto-Assignment** ✅
Use the `department` column to auto-route complaints

### 4. **Priority-Based Workflow** ✅
- **Critical/High:** Auto-submit to PGRS immediately
- **Medium:** Queue for manual review
- **Low:** Log only, batch process weekly

### 5. **Dashboard Integration** ✅
Create filters in your map:
- By department
- By priority
- By road surface quality

---

## 📞 Contact Information

### For Data Issues
- **OpenStreetMap Community:** https://www.openstreetmap.org/
- **HOT Export Tool:** https://export.hotosm.org/

### For Government Integration
- **R&B Department, AP:** https://aprb.ap.gov.in/
- **NHAI:** https://www.nhai.gov.in/
- **PGRS Support:** Contact your district coordinator

---

## ⚠️ Important Notes

1. **Data Currency:** This export is from Feb 10, 2026. Roads may have changed.
2. **Unnamed Roads:** 96.2% of roads don't have official names - use coordinates for matching
3. **Department Verification:** For critical roads, verify department assignment before PGRS submission
4. **Coordinate Precision:** Lat/long are in WGS84 format (EPSG:4326)

---

## 🔄 Updating This Data

To refresh the dataset:

1. Go to https://export.hotosm.org/
2. Use your saved "AP" export
3. Click "Run Export"
4. Download new CSV
5. Re-run the processing script

---

## 📊 Sample Queries

### Find all National Highways
```sql
SELECT * FROM ap_roads 
WHERE department = 'NHAI (National Highways Authority)'
ORDER BY road_name;
```

### Find roads near a pothole
```sql
SELECT * FROM ap_roads 
WHERE latitude BETWEEN 15.8 AND 15.9
  AND longitude BETWEEN 78.0 AND 78.1
ORDER BY repair_priority;
```

### Count roads by department and priority
```sql
SELECT department, repair_priority, COUNT(*) 
FROM ap_roads 
GROUP BY department, repair_priority
ORDER BY COUNT(*) DESC;
```

---

**Dataset prepared for:** AI-Enabled Pothole Detection System  
**Problem Statement:** R&B Department, Government of Andhra Pradesh  
**Hackathon Submission**
