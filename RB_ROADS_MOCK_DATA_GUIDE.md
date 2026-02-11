# 🛣️ R&B Department Roads Mock Data - Implementation Guide

## ✅ What's Been Implemented

### **1. R&B Roads Mock Data (`src/utils/rbRoadsMockData.js`)**

Created a comprehensive mock dataset with **10 R&B Department roads** in Kurnool district:

#### **State Highways (SH) - 3 roads**
- **SH-1** (State Highway 1) - 15.8281°N, 78.0373°E
- **SH-2** (Kurnool - Nandyal Road) - 15.8500°N, 78.0500°E
- **SH-3** (Kurnool - Adoni Road) - 15.8100°N, 77.9800°E

#### **Major District Roads (MDR) - 3 roads**
- **MDR-1** (Kurnool - Alur Road) - 15.8700°N, 78.0800°E
- **MDR-2** (Kurnool - Yemmiganur Road) - 15.7900°N, 77.9200°E
- **MDR-3** (Kurnool - Dhone Road) - 15.9000°N, 78.1000°E

#### **Other District Roads (ODR) - 4 roads**
- **ODR-1** (Kurnool - Koilkuntla Road) - 15.8200°N, 78.0200°E
- **ODR-2** (Kurnool - Atmakur Road) - 15.8400°N, 78.0600°E
- **ODR-3** (Kurnool - Banaganapalle Road) - 15.8000°N, 78.0000°E
- **ODR-4** (Kurnool - Mantralayam Road) - 15.7600°N, 77.9600°E
- **ODR-5** (Kurnool - Kodumur Road) - 15.8800°N, 78.0400°E

### **2. GPS Track Generation Along R&B Roads**

- **`generateGPSTrackAlongRBRoad(roadId, duration, fps)`**
  - Generates GPS coordinates along a specific R&B road
  - Creates realistic linear path following the road
  - All coordinates stay on the same road path

### **3. Road Matching Integration**

- **`matchPotholeToKurnoolRoad(lat, lon, roadsData)`**
  - Matches pothole detections to nearest R&B road
  - Uses actual R&B road coordinates
  - Returns department, priority, and road info

---

## 🧪 How to Test

### **Step 1: Process a Video**

1. Go to **Dashcam Video Processor**
2. Click **"Upload Dashcam Video"**
3. Upload any video

### **Step 2: Watch the Processing**

The system will:
1. **Select a random R&B road** (e.g., "SH-1", "MDR-2", "ODR-3")
2. **Generate GPS track** along that specific road
3. **Generate detections** at points along the road
4. **Match each detection** to the R&B road
5. **Assign department** (R&B Department)

### **Step 3: Check Results**

Each detection will show:
- ✅ **Road Name**: e.g., "SH-1 (State Highway 1)"
- ✅ **Department**: "R&B Department (State Highways)" or "R&B Department (District Roads - MDR/ODR)"
- ✅ **Priority**: "High (SH)" or "Medium (District)"
- ✅ **Coordinates**: Along the selected R&B road
- ✅ **Response Time**: "Within 48 hours" (SH) or "Within 7 days" (District)

### **Step 4: View on Map**

1. Click **"Show Map View"**
2. All detections appear along the R&B road path
3. Click markers to see:
   - Road name
   - Department (R&B)
   - Priority level

---

## 📍 How Coordinates Work

### **Current Implementation:**

1. **Road Selection**: System randomly picks one R&B road (SH, MDR, or ODR)
2. **GPS Generation**: Creates coordinates along that specific road
3. **Detection Matching**: Each pothole is matched to the same R&B road
4. **Department Assignment**: All detections show R&B Department

### **Example Flow:**

```
Video Uploaded
    ↓
Random R&B Road Selected: "SH-1 (State Highway 1)"
    ↓
GPS Track Generated: 15.8281°N, 78.0373°E → 15.8500°N, 78.0600°E
    ↓
38 Detections Created Along SH-1
    ↓
Each Detection Matched to: "SH-1 (State Highway 1)"
    ↓
Department: "R&B Department (State Highways)"
Priority: "High (SH)"
Response Time: "Within 48 hours"
```

---

## 🎯 What You'll See

### **Detection Display:**

```
Detection #1
Severity: Critical
Confidence: 87%
Size: Large
Depth: 18.5cm (deep)

GPS Location:
Coordinates: 15.8281, 78.0373
Address: SH-1 (State Highway 1)

Kurnool Road & Department:
Road: SH-1 (State Highway 1)
Department: R&B Department (State Highways) [Orange]
Repair Priority: High (SH)
Response Time: Within 48 hours
```

### **Map View:**

- All 38 detections appear as markers
- All markers are along the same R&B road
- Color-coded by department:
  - **State Highways**: Orange (#FF6600)
  - **MDR**: Yellow (#FFAA00)
  - **ODR**: Light Yellow (#FFDD00)

---

## ✅ Success Criteria

Your test is successful if:

- ✅ All detections show **R&B Department** roads
- ✅ Road names match R&B roads (SH-1, MDR-2, ODR-3, etc.)
- ✅ Department is **"R&B Department"** (not KMC or NHAI)
- ✅ Priority is **"High (SH)"** or **"Medium (District)"**
- ✅ Coordinates form a **straight line** (along one road)
- ✅ Map shows markers **along the road path**

---

## 🔧 Road Data Structure

Each R&B road has:

```javascript
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
}
```

---

## 🚀 Next Steps

### **To Add More R&B Roads:**

1. Open `src/utils/rbRoadsMockData.js`
2. Add more roads to `RB_ROADS_DATA` array
3. Use actual coordinates from your Excel file
4. System will automatically use them

### **To Use Real Excel Data:**

1. Convert Excel to JSON/CSV
2. Import into `rbRoadsMockData.js`
3. Filter for R&B Department roads
4. System will use actual coordinates

---

## 📊 Current Road Coverage

- **State Highways**: 3 roads (SH-1, SH-2, SH-3)
- **Major District Roads**: 3 roads (MDR-1, MDR-2, MDR-3)
- **Other District Roads**: 4 roads (ODR-1 to ODR-5)
- **Total**: 10 R&B Department roads

All roads are in **Kurnool district** with coordinates between:
- Latitude: 15.76°N - 15.90°N
- Longitude: 77.92°E - 78.10°E

---

**Ready to test!** Upload a video and see all detections matched to R&B Department roads! 🎉

