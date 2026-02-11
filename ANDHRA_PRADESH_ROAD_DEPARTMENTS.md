# Andhra Pradesh Road Department Information

## Road Department Structure in Andhra Pradesh

### 1. **Roads & Buildings (R&B) Department**
- **Jurisdiction**: State Highways (SH), Major District Roads (MDR), Other District Roads (ODR)
- **Website**: https://aprb.ap.gov.in/
- **Contact**: Commissioner, Roads & Buildings Department, Andhra Pradesh

### 2. **National Highways Authority of India (NHAI)**
- **Jurisdiction**: National Highways (NH) passing through Andhra Pradesh
- **Website**: https://www.nhai.gov.in/
- **Regional Office**: Hyderabad

### 3. **Municipal Corporations**
- **Jurisdiction**: Municipal roads within city limits
- **Examples**: 
  - Greater Visakhapatnam Municipal Corporation (GVMC)
  - Vijayawada Municipal Corporation
  - Guntur Municipal Corporation

### 4. **Panchayat Raj Engineering Department (PRED)**
- **Jurisdiction**: Rural roads, Village roads
- **Website**: https://apeda.gov.in/

### 5. **Public Works Department (PWD)**
- **Jurisdiction**: Some state roads and infrastructure

---

## Road Classification in Andhra Pradesh

### **National Highways (NH)**
- Maintained by: **NHAI** (National Highways Authority of India)
- Examples: NH-16, NH-65, NH-44
- **Coordinate Data**: Available from NHAI GIS portal

### **State Highways (SH)**
- Maintained by: **R&B Department**
- Examples: SH-1, SH-2, etc.
- **Coordinate Data**: Available from R&B Department GIS

### **District Roads**
- **Major District Roads (MDR)**: R&B Department
- **Other District Roads (ODR)**: R&B Department
- **Village Roads**: PRED (Panchayat Raj Engineering Department)

### **Municipal Roads**
- Maintained by: **Municipal Corporations**
- City-specific roads within municipal limits

---

## Where to Find Road Coordinate Data

### **1. Andhra Pradesh R&B Department**
- **GIS Portal**: https://aprb.ap.gov.in/ (Check for GIS/Map section)
- **Contact**: Commissioner, Roads & Buildings Department
- **Email**: Usually available on official website
- **Data Format**: Shapefiles, KML, or Excel with coordinates

### **2. OpenStreetMap (OSM)**
- **Website**: https://www.openstreetmap.org/
- **Export Tool**: https://www.openstreetmap.org/export
- **Data Format**: OSM XML, GeoJSON, Shapefile
- **Contains**: Road names, coordinates, road types
- **Note**: Free but may not have department assignments

### **3. Bhuvan - ISRO Geo Platform**
- **Website**: https://bhuvan.nrsc.gov.in/
- **Andhra Pradesh Data**: Available under state layers
- **Road Network**: State and National highways with coordinates

### **4. Municipal Corporation GIS Portals**
- **GVMC GIS**: Greater Visakhapatnam Municipal Corporation
- **VMC GIS**: Vijayawada Municipal Corporation
- **Contact**: Respective municipal corporation websites

### **5. Data.gov.in**
- **Website**: https://data.gov.in/
- **Search**: "Andhra Pradesh roads" or "road network"
- **Format**: CSV, Excel, Shapefiles

---

## Recommended Data Sources

### **For Road Coordinates (Lat/Long):**

1. **OpenStreetMap Overpass API**
   - Query tool: https://overpass-turbo.eu/
   - Can export road data with coordinates
   - Free and regularly updated

2. **Google Maps API**
   - Road data with coordinates
   - Requires API key
   - Paid service

3. **Andhra Pradesh State GIS Portal**
   - Check: https://apgis.ap.gov.in/ (if available)
   - Official state GIS data

4. **NHAI GIS Portal**
   - For National Highways
   - Website: https://www.nhai.gov.in/

### **For Department Assignment:**

1. **Contact R&B Department directly**
   - They maintain road inventory with department assignments
   - May provide Excel sheets or GIS data

2. **Municipal Corporation Offices**
   - For city roads
   - Each corporation maintains road database

3. **District Collectorate**
   - For district-level road information

---

## Creating Your Own Road-Department Mapping

### **Step 1: Get Road Coordinates**
- Use OpenStreetMap to export road data
- Or use Google Maps Geocoding API
- Format: Road Name, Latitude, Longitude

### **Step 2: Assign Departments**
Based on road type:
- **NH-*** → NHAI
- **SH-*** → R&B Department
- **City Roads** → Municipal Corporation
- **Village Roads** → PRED

### **Step 3: Create Excel Sheet**
```
Road_Name | Road_Type | Department | Latitude | Longitude | District
NH-16     | National  | NHAI      | 17.6868  | 83.2185   | Visakhapatnam
SH-1      | State     | R&B       | 16.5062  | 80.6480   | Guntur
```

---

## Quick Links

1. **Andhra Pradesh R&B Department**: https://aprb.ap.gov.in/
2. **NHAI**: https://www.nhai.gov.in/
3. **OpenStreetMap**: https://www.openstreetmap.org/
4. **Overpass Turbo** (OSM Query Tool): https://overpass-turbo.eu/
5. **Bhuvan ISRO**: https://bhuvan.nrsc.gov.in/
6. **Data.gov.in**: https://data.gov.in/

---

## Sample Query for OpenStreetMap (Overpass Turbo)

To get roads in Visakhapatnam with coordinates:

```overpass
[out:json][timeout:25];
(
  way["highway"~"^(primary|secondary|tertiary|trunk)"]["name"]({{bbox}});
);
out geom;
```

This will export road data with coordinates in GeoJSON format.

---

## Note for Your Project

Since you're working on a **pothole detection system for Andhra Pradesh**, you can:

1. **Use OpenStreetMap** to get road coordinates
2. **Create a mapping function** that assigns department based on:
   - Road name prefix (NH, SH, etc.)
   - Location (municipal limits vs. rural)
   - District boundaries

3. **Store in your database**:
   - Road segment coordinates
   - Assigned department
   - Road type/classification

This way, when a pothole is detected at specific coordinates, your system can automatically determine which department is responsible for that road segment.

