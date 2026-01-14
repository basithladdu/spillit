# Dashcam Video Processor - Setup Guide

This guide will help you set up the complete video processing pipeline for your Municipal Dashboard.

## 🎯 Overview

The system consists of three main components:
1. **Frontend (React)** - Cloudinary Upload Widget
2. **Backend (Python/Flask)** - Video streaming and AI processing on Railway
3. **Integration** - Automatic dashboard updates

---

## 📋 Prerequisites

- Cloudinary account (free tier works)
- Railway account for backend hosting
- Roboflow API key: `4b8afa69-5426-44dd-b2af-3977e26d6b5f`

---

## 🔧 Step 1: Cloudinary Setup

### 1.1 Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Navigate to Dashboard

### 1.2 Get Your Credentials
From your Cloudinary Dashboard, note down:
- **Cloud Name** (e.g., `dxxxxx`)
- **API Key**
- **API Secret**

### 1.3 Create Upload Preset
1. Go to Settings → Upload
2. Click "Add upload preset"
3. Configure:
   - **Preset name**: `dashcam_videos`
   - **Signing Mode**: Unsigned
   - **Folder**: `dashcam_videos`
   - **Resource type**: Video
   - **Access mode**: Public
4. Save the preset

### 1.4 Update Frontend Code
Edit `src/components/DashcamVideoProcessor.jsx`:

```javascript
// Line 17-18, replace with your values:
cloudName: 'YOUR_CLOUD_NAME',  // e.g., 'dxxxxx'
uploadPreset: 'dashcam_videos',
```

---

## 🚂 Step 2: Railway Backend Deployment

### 2.1 Prepare Backend Files
Your backend files are already created in `backend/`:
- `video_processor.py` - Main Flask app
- `requirements.txt` - Python dependencies
- `Procfile` - Railway deployment config

### 2.2 Deploy to Railway

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Navigate to backend folder
cd backend

# Initialize Railway project
railway init

# Add environment variables
railway variables set ROBOFLOW_API_KEY=4b8afa69-5426-44dd-b2af-3977e26d6b5f
railway variables set ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pothole-detection-model/1

# Deploy
railway up
```

#### Option B: Using Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `/backend`
5. Add environment variables:
   - `ROBOFLOW_API_KEY`: `4b8afa69-5426-44dd-b2af-3977e26d6b5f`
   - `ROBOFLOW_MODEL_ENDPOINT`: `https://detect.roboflow.com/pothole-detection-model/1`
6. Deploy

### 2.3 Get Your Railway URL
After deployment, Railway will give you a URL like:
`https://your-app.up.railway.app`

### 2.4 Update Frontend Code
Edit `src/components/DashcamVideoProcessor.jsx`:

```javascript
// Line 72, replace with your Railway URL:
const response = await fetch('https://your-app.up.railway.app/api/process-video', {
```

---

## 🔗 Step 3: Configure CORS (if needed)

If you encounter CORS errors, update your Railway backend:

1. The backend already has `flask-cors` installed
2. For production, you can restrict origins in `video_processor.py`:

```python
# Replace line 13 with:
CORS(app, origins=['https://your-frontend-domain.com'])
```

---

## 🧪 Step 4: Testing

### 4.1 Test Backend Health
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "dashcam-video-processor",
  "timestamp": "2026-01-14T..."
}
```

### 4.2 Test Video Processing
1. Navigate to Municipal Dashboard
2. Click "Video Processor" in sidebar
3. Click "Upload Dashcam Video"
4. Select a test video (MP4 recommended, < 100MB)
5. Wait for processing (shows "Processing Road Footage...")
6. View results in the detection timeline

### 4.3 Verify Dashboard Integration
After processing:
1. Go to "Issue Tracker" - new pothole issues should appear
2. Go to "Dashboard" - map should show new markers
3. Go to "Leaderboard" - counters should increment

---

## 📊 Step 5: Roboflow Model Configuration

### 5.1 Using Your Own Model (Optional)
If you want to use a different Roboflow model:

1. Train/select your model on Roboflow
2. Get the API endpoint (e.g., `https://detect.roboflow.com/your-model/version`)
3. Update Railway environment variable:
   ```bash
   railway variables set ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/your-model/version
   ```

### 5.2 Adjusting Confidence Threshold
Edit `backend/video_processor.py`, line 147:

```python
# Change from 0.5 to your preferred threshold (0.0 - 1.0)
if confidence > 0.5:  # Lower = more detections, Higher = fewer but more accurate
```

---

## ⚙️ Step 6: Performance Optimization

### 6.1 Frame Processing Rate
By default, processes 1 frame per second. To adjust:

Edit `backend/video_processor.py`, line 128:
```python
# Process every Nth frame
frame_interval = int(fps)  # 1 fps
# frame_interval = int(fps * 2)  # 0.5 fps (slower, more thorough)
# frame_interval = int(fps / 2)  # 2 fps (faster, less thorough)
```

### 6.2 Video Length Limit
Default: 5 minutes (300 frames at 1 fps)

Edit `backend/video_processor.py`, line 158:
```python
if frames_processed >= 300:  # Change to your limit
```

### 6.3 Memory Management
Railway free tier: 512MB RAM

Current settings are optimized for this. If you upgrade:
- Increase workers in `Procfile`: `--workers 2`
- Process more frames: `frame_interval = int(fps / 2)`

---

## 🐛 Troubleshooting

### Issue: "Upload widget not ready"
**Solution**: Refresh the page. The Cloudinary script needs time to load.

### Issue: "Failed to open video stream"
**Causes**:
1. Video URL is private/expired
2. Cloudinary upload failed
3. Unsupported video format

**Solution**: Ensure video is public and in MP4 format.

### Issue: Backend timeout
**Causes**:
1. Video too long (> 5 minutes)
2. Roboflow API slow/down
3. Railway cold start

**Solution**: 
- Use shorter videos for testing
- Wait 30s and retry
- Check Railway logs: `railway logs`

### Issue: No detections found
**Causes**:
1. Video quality too low
2. No potholes in footage
3. Confidence threshold too high

**Solution**:
- Use HD video (720p+)
- Test with known pothole footage
- Lower confidence threshold (see Step 5.2)

### Issue: CORS errors
**Solution**: Ensure `flask-cors` is installed and configured (see Step 3)

---

## 📈 Monitoring

### Railway Logs
```bash
railway logs --tail
```

### Check Processing Stats
After each video, check the response:
```json
{
  "detections": [...],
  "total_frames_processed": 120,
  "processing_time_seconds": 45.2,
  "video_duration_seconds": 120.0
}
```

**Ideal ratio**: `processing_time / video_duration < 2`
(e.g., 2-minute video should process in < 4 minutes)

---

## 🎨 Customization

### Severity Logic
Edit `backend/video_processor.py`, function `classify_severity()`:

```python
def classify_severity(bbox_area: float, confidence: float) -> str:
    normalized_area = bbox_area / (640 * 640)
    
    # Customize these thresholds:
    if normalized_area > 0.15 and confidence > 0.7:
        return 'Critical'
    elif normalized_area > 0.08 or confidence > 0.8:
        return 'High'
    # ... etc
```

### UI Colors
Edit `src/components/DashcamVideoProcessor.jsx`, function `getSeverityColor()`:

```javascript
const getSeverityColor = (severity) => {
    switch (severity) {
        case 'Critical': return '#EF4444';  // Red
        case 'High': return '#F97316';      // Orange
        // ... customize colors
    }
};
```

---

## 🚀 Production Checklist

- [ ] Cloudinary credentials configured
- [ ] Railway backend deployed
- [ ] Environment variables set
- [ ] Backend health check passes
- [ ] Test video processed successfully
- [ ] Dashboard updates automatically
- [ ] CORS configured for production domain
- [ ] Error handling tested
- [ ] Performance monitoring enabled

---

## 💡 Tips for Demo

1. **Prepare test footage**: Have 2-3 short videos (30-60s) with visible potholes
2. **Pre-warm backend**: Make a health check request before demo
3. **Show the pipeline**: 
   - Upload → Processing → Results → Dashboard update
4. **Highlight efficiency**: "Processes 1 frame/second, no storage needed"
5. **Show severity classification**: Point out Critical vs Low severity

---

## 📞 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test backend health endpoint
5. Ensure Cloudinary upload preset is "unsigned"

---

## 🎯 Next Steps

After basic setup works:
1. Add GPS coordinates from video metadata
2. Implement batch processing for multiple videos
3. Add progress bar for long videos
4. Create admin panel to view processing history
5. Add email notifications for critical detections

---

**Built with ❤️ by devit for better governance**
