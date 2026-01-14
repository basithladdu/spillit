# 🎥 Dashcam Video Processor - Quick Start

## ✅ What's Been Created

Your video processing pipeline is now ready! Here's what was added:

### 📁 New Files Created:

1. **`src/components/DashcamVideoProcessor.jsx`**
   - React component with Cloudinary Upload Widget
   - Handles video upload, processing status, and results display
   - Auto-saves detections to Firestore

2. **`src/config/videoProcessorConfig.js`**
   - Centralized configuration file
   - **⚠️ YOU NEED TO EDIT THIS FILE** with your credentials

3. **`backend/video_processor.py`**
   - Flask backend for Railway deployment
   - Streams video from Cloudinary
   - Processes 1 frame/second with Roboflow API
   - Classifies severity based on bounding box size

4. **`backend/requirements.txt`**
   - Python dependencies (opencv-python-headless, flask, etc.)

5. **`backend/Procfile`**
   - Railway deployment configuration

6. **`VIDEO_PROCESSOR_SETUP.md`**
   - Comprehensive setup guide with troubleshooting

### 🎨 Dashboard Integration:

- ✅ New "Video Processor" button added to sidebar
- ✅ Component integrated into MunicipalDashboard.jsx
- ✅ Auto-updates map and leaderboard after processing

---

## 🚀 Next Steps (5 Minutes Setup)

### Step 1: Configure Cloudinary (2 min)
1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. Get your **Cloud Name** from the dashboard
3. Create upload preset:
   - Settings → Upload → Add upload preset
   - Name: `dashcam_videos`
   - Signing Mode: **Unsigned**
   - Save

### Step 2: Update Config File (1 min)
Edit `src/config/videoProcessorConfig.js`:
```javascript
cloudName: 'YOUR_CLOUD_NAME',  // Replace with your actual cloud name
```

### Step 3: Deploy Backend to Railway (2 min)
```bash
cd backend
railway login
railway init
railway variables set ROBOFLOW_API_KEY=4b8afa69-5426-44dd-b2af-3977e26d6b5f
railway up
```

After deployment, copy your Railway URL (e.g., `https://your-app.up.railway.app`)

### Step 4: Update Backend URL (30 sec)
Edit `src/config/videoProcessorConfig.js`:
```javascript
baseUrl: 'https://your-app.up.railway.app',  // Your Railway URL
```

### Step 5: Test! 🎉
1. Navigate to Municipal Dashboard
2. Click "Video Processor" in sidebar
3. Upload a test video
4. Watch the magic happen!

---

## 📊 How It Works

```
┌─────────────┐
│   Upload    │  User clicks "Upload Video"
│   Widget    │  → Cloudinary widget opens
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Cloudinary  │  Video uploaded to cloud
│   Storage   │  → Returns secure_url
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Railway   │  Backend streams video
│   Backend   │  → Processes 1 frame/sec
│             │  → Calls Roboflow API
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Frontend   │  Displays results
│  Dashboard  │  → Saves to Firestore
│             │  → Updates map & leaderboard
└─────────────┘
```

---

## 🎯 Key Features

✅ **No Server Storage** - Videos stay in Cloudinary  
✅ **Memory Efficient** - Only processes 1 frame/second  
✅ **Railway Compatible** - Works within 512MB RAM limit  
✅ **AI-Powered** - Roboflow pothole detection  
✅ **Severity Classification** - Critical, High, Medium, Low  
✅ **Auto-Integration** - Updates dashboard automatically  

---

## 🐛 Troubleshooting

### "Upload widget not ready"
→ Refresh the page (Cloudinary script needs to load)

### "Failed to open video stream"
→ Check video is public and in MP4 format

### Backend timeout
→ Use shorter videos (< 2 minutes for testing)

### CORS errors
→ Backend already has `flask-cors` configured

For detailed troubleshooting, see `VIDEO_PROCESSOR_SETUP.md`

---

## 📝 Configuration Reference

All settings are in `src/config/videoProcessorConfig.js`:

- **cloudName**: Your Cloudinary cloud name
- **uploadPreset**: Must be "unsigned" mode
- **baseUrl**: Your Railway backend URL
- **apiKey**: Roboflow API key (already set)
- **maxFileSize**: 100MB default
- **allowedFormats**: mp4, mov, avi, webm
- **confidenceThreshold**: 0.5 (50% minimum confidence)

---

## 🎨 Customization

### Change Severity Thresholds
Edit `backend/video_processor.py` → `classify_severity()` function

### Adjust Processing Speed
Edit `backend/video_processor.py` → line 128:
```python
frame_interval = int(fps)  # 1 fps (default)
frame_interval = int(fps * 2)  # 0.5 fps (slower, more thorough)
```

### Change UI Colors
Edit `src/components/DashcamVideoProcessor.jsx` → `getSeverityColor()` function

---

## 📞 Support

If you get stuck:
1. Check `VIDEO_PROCESSOR_SETUP.md` for detailed instructions
2. Verify Railway logs: `railway logs`
3. Check browser console for errors
4. Test backend health: `YOUR_RAILWAY_URL/api/health`

---

## 🎉 Demo Tips

1. **Prepare test footage**: 30-60 second videos with visible potholes
2. **Pre-warm backend**: Hit the health endpoint before demo
3. **Show the flow**: Upload → Processing → Results → Dashboard update
4. **Highlight efficiency**: "No storage needed, processes in real-time"

---

**Built with ❤️ by devit for better governance**

Need help? Check the comprehensive guide: `VIDEO_PROCESSOR_SETUP.md`
