# 🧪 How to Test Kurnool Road Matching System

## ✅ Quick Test Steps

### **Step 1: Open Dashcam Video Processor**
1. Navigate to your app
2. Go to the **Dashcam Video Processor** page
3. You should see the upload interface

### **Step 2: Process a Video (Mock Mode)**
1. Click **"Upload Dashcam Video"** button
2. Upload any video (or use existing video from library)
3. The system will automatically:
   - Extract GPS coordinates (Kurnool area: 15.8281°N, 78.0373°E)
   - Generate 38 mock pothole detections
   - Match each detection to a Kurnool road
   - Assign department (KMC, R&B, NHAI, PRED)
   - Calculate priority and response time

### **Step 3: View Results**
After processing, you'll see:

#### **Summary Stats:**
- Total Detections (38)
- Critical Issues count
- Average Confidence
- GPS Points extracted

#### **Each Detection Shows:**
- ✅ **Severity** (Critical/High/Medium/Low)
- ✅ **Confidence** (%)
- ✅ **Size** (Small/Medium/Large)
- ✅ **Depth** (cm + shallow/medium/deep)
- ✅ **GPS Coordinates** (Kurnool area)
- ✅ **Road Name** (e.g., "NH-44, Kurnool", "MG Road, Kurnool")
- ✅ **Department** (Color-coded: KMC=Green, NHAI=Red, R&B=Orange)
- ✅ **Repair Priority** (Critical/High/Medium/Low)
- ✅ **Response Time** (e.g., "Within 24 hours")

### **Step 4: View on Map**
1. Click **"Show Map View"** button
2. All detections will appear on the map
3. Click any marker to see:
   - Road name
   - Department
   - Priority
   - Coordinates

### **Step 5: Test Filters**
- **Severity Filter**: Filter by Critical/High/Medium/Low
- **Confidence Filter**: Adjust range slider
- **Clear Filters**: Reset all filters

---

## 🗺️ How Coordinates Work

### **Current Implementation (Mock Mode):**

1. **GPS Extraction** (`gpsExtractor.js`):
   - Generates GPS points along a **straight line** in Kurnool
   - Starting point: **15.8281°N, 78.0373°E** (Kurnool City Center)
   - Moves northeast direction (simulating a road)
   - All points stay on **one road path**

2. **Road Matching** (`kurnoolRoadMatcher.js`):
   - Matches each pothole detection to nearest road
   - Uses Kurnool district boundaries (15.5°-16.2°N, 77.5°-78.5°E)
   - Assigns department based on location:
     - **City center** → Kurnool Municipal Corporation (KMC)
     - **Rural areas** → Panchayat Raj (PRED)
     - **Highways** → NHAI or R&B

3. **Display on Map**:
   - All detections appear as markers
   - Color-coded by department
   - Shows road name and department in popup

---

## 🎯 Testing Scenarios

### **Scenario 1: City Road Detection**
- **Expected**: Department = "Kurnool Municipal Corporation (KMC)"
- **Priority**: "Medium (Municipal)"
- **Response Time**: "Within 14 days"
- **Color**: Green marker

### **Scenario 2: Highway Detection**
- **Expected**: Department = "NHAI" or "R&B Department"
- **Priority**: "Critical (NH)" or "High (SH)"
- **Response Time**: "Within 24 hours" or "Within 48 hours"
- **Color**: Red or Orange marker

### **Scenario 3: Rural Road Detection**
- **Expected**: Department = "Panchayat Raj Engineering Department (PRED)"
- **Priority**: "Low"
- **Response Time**: "As needed"
- **Color**: Blue marker

---

## 📍 Coordinate Accuracy

### **Current Mock Implementation:**
- ✅ Coordinates are **realistic** (Kurnool area)
- ✅ All points follow **one straight road path**
- ✅ GPS noise is **minimal** (2 meters) - keeps points on same road
- ✅ Road matching uses **fallback logic** (location-based)

### **For Production:**
To use **actual road coordinates** from Excel:

1. **Load Excel Data**:
   ```javascript
   // In kurnoolRoadMatcher.js
   import { loadKurnoolRoads } from './kurnoolRoadMatcher';
   
   const roads = await loadKurnoolRoads(); // Load from Excel/DB
   ```

2. **Match to Real Roads**:
   ```javascript
   const roadInfo = matchPotholeToKurnoolRoad(lat, lon, roads);
   // Will find nearest road from Excel data
   ```

3. **Draw Roads on Map**:
   - Load road coordinates from Excel
   - Draw polylines connecting road segments
   - Show potholes along actual road paths

---

## 🔍 What to Check

### **✅ Verify These:**

1. **Coordinates are in Kurnool**:
   - Check lat: ~15.8°N (should be 15.5-16.2)
   - Check lon: ~78.0°E (should be 77.5-78.5)

2. **All detections on same road**:
   - Coordinates should form a **straight line**
   - Small variations only (GPS noise)

3. **Department assignment**:
   - City area → KMC
   - Rural area → PRED
   - Highway → NHAI/R&B

4. **Map display**:
   - Markers appear in Kurnool area
   - Click markers to see road info
   - Colors match departments

---

## 🚀 Next Steps for Production

### **To Use Real Road Data:**

1. **Import Excel to Database**:
   ```sql
   -- Import AP_Roads_Department_Mapping.xlsx
   -- Filter for Kurnool district roads
   CREATE TABLE kurnool_roads AS
   SELECT * FROM ap_roads
   WHERE latitude BETWEEN 15.5 AND 16.2
     AND longitude BETWEEN 77.5 AND 78.5;
   ```

2. **Update Road Matcher**:
   ```javascript
   // Load from database instead of mock
   const roads = await db.query(
     'SELECT * FROM kurnool_roads WHERE ...'
   );
   ```

3. **Draw Actual Roads**:
   - Use road coordinates to draw polylines
   - Match potholes to actual road segments
   - Show road names from database

---

## 🎬 Demo Flow

1. **Upload Video** → Processing starts
2. **GPS Extraction** → "Extracting GPS Data from Video Metadata..."
3. **AI Detection** → "Detecting Road Imperfections..."
4. **Road Matching** → Each detection matched to Kurnool road
5. **Results Display** → Shows all detections with road info
6. **Map View** → Click "Show Map View" to see on map
7. **Filter** → Test severity and confidence filters

---

## ⚠️ Current Limitations (Mock Mode)

- **Road matching** uses fallback logic (not actual Excel data)
- **Coordinates** are simulated (straight line path)
- **Road names** are generic (NH-44, MG Road, etc.)

### **To Fix:**
- Load actual road data from Excel
- Use real road coordinates
- Match to actual road segments

---

## ✅ Success Criteria

Your test is successful if:
- ✅ All detections show Kurnool coordinates
- ✅ Each detection has a road name
- ✅ Department is assigned correctly
- ✅ Map shows markers in Kurnool area
- ✅ Filters work correctly
- ✅ Road info displays in detection list

---

**Ready to test?** Just upload a video and watch the magic happen! 🎉

