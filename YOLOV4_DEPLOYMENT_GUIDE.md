# 🚀 YOLOv4 Deployment Guide for letsfixindia.com

## 📋 Overview

This guide will help you replace the Roboflow API with your own YOLOv4 model in the fixit project.

**Current Setup**:
- ✅ Frontend: React app (letsfixindia.com)
- ✅ Video Upload: Cloudinary
- ✅ Detection: Roboflow API (to be replaced)
- ✅ Backend: Railway deployment

**New Setup**:
- ✅ Frontend: Same (no changes needed)
- ✅ Video Upload: Same (Cloudinary)
- ✅ Detection: **YOLOv4 (your own model)** ← NEW
- ✅ Backend: Railway with YOLOv4

---

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Same as current)
- **Pros**: Already using Railway, easy migration
- **Cons**: CPU only (slower), 512MB RAM limit
- **Cost**: ~$5-10/month
- **Speed**: 1-2 FPS (acceptable for 3-second intervals)

### Option 2: AWS EC2 with GPU
- **Pros**: Much faster (20-30 FPS), better for production
- **Cons**: More expensive, more complex setup
- **Cost**: ~$400-500/month (g4dn.xlarge)
- **Speed**: 20-30 FPS

### Option 3: Hybrid (Recommended for Production)
- **Frontend**: Vercel/Firebase (current)
- **Video Storage**: Cloudinary (current)
- **Processing**: AWS Lambda + EFS (serverless)
- **Cost**: Pay per use (~$50-100/month)

---

## 🚀 Quick Start: Deploy to Railway (Same as Current)

### Step 1: Prepare Model Files

The YOLOv4 model files are **too large** for Railway's free tier. We have 2 options:

#### Option A: Use Railway Volumes (Recommended)
```bash
# 1. Create a Railway volume
railway volume create yolov4-models

# 2. Upload model files to volume
# (You'll need to do this via Railway CLI or dashboard)
```

#### Option B: Use Smaller Model (YOLOv4-Tiny)
- Smaller file size (~25MB vs 245MB)
- Faster inference
- Lower accuracy (41% vs 69% mAP)

### Step 2: Update Backend Code

Replace `backend/video_processor.py` with `backend/video_processor_yolov4.py`:

```bash
cd C:\Users\basit\Downloads\CODE\fixit\fixit\backend

# Backup current file
copy video_processor.py video_processor_roboflow_backup.py

# Replace with YOLOv4 version
copy video_processor_yolov4.py video_processor.py
```

### Step 3: Update Requirements

Edit `backend/requirements.txt`:

```txt
flask==3.0.0
flask-cors==4.0.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
cloudinary==1.36.0
gunicorn==21.2.0
requests==2.31.0
```

### Step 4: Add Model Files to Railway

**Option A: Include in Deployment** (if using YOLOv4-Tiny)

```bash
# Download YOLOv4-Tiny weights (smaller)
cd backend
mkdir models
# Download from: https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights

# Update paths in video_processor.py
WEIGHTS_PATH = 'models/yolov4-tiny.weights'
CFG_PATH = 'models/yolov4-tiny.cfg'
```

**Option B: Use Railway Volumes** (for full YOLOv4)

1. Create volume in Railway dashboard
2. Mount to `/app/models`
3. Upload weights and config files

### Step 5: Deploy to Railway

```bash
cd backend

# Login to Railway
railway login

# Link to existing project
railway link

# Set environment variables
railway variables set CLOUDINARY_CLOUD_NAME=fixit
railway variables set CLOUDINARY_API_KEY=435969829275136
railway variables set CLOUDINARY_API_SECRET=hcqg6yQ4TUjuVGW-eWvE7Nngw2w

# Deploy
railway up
```

### Step 6: Update Frontend (No Changes Needed!)

The API interface is the same, so your frontend will work without changes!

```javascript
// This stays the same in your React app
const response = await fetch(`${BACKEND_URL}/api/process-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_url: cloudinaryUrl })
});
```

---

## 🌐 Alternative: Deploy to AWS (Better Performance)

### Why AWS?
- ✅ GPU support (20-30x faster)
- ✅ More memory (no 512MB limit)
- ✅ Better for production
- ❌ More expensive (~$400-500/month)

### Quick AWS Setup

```bash
# 1. Launch EC2 instance
# - Type: g4dn.xlarge (NVIDIA T4 GPU)
# - OS: Ubuntu 22.04
# - Storage: 50GB

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install dependencies
sudo apt update
sudo apt install -y python3-pip python3-venv nginx

# 4. Install CUDA (for GPU)
# Follow: https://developer.nvidia.com/cuda-downloads

# 5. Clone your backend
git clone your-repo
cd backend

# 6. Install Python packages
pip3 install -r requirements.txt

# 7. Copy model files
mkdir models
# Upload weights and config

# 8. Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 600 video_processor:app

# 9. Configure Nginx
sudo nano /etc/nginx/sites-available/pothole-api
```

Nginx config:
```nginx
server {
    listen 80;
    server_name api.letsfixindia.com;
    
    client_max_body_size 500M;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 600s;
    }
}
```

---

## 💡 Recommended Approach for letsfixindia.com

### Phase 1: Test with Railway (Current Setup)
1. Deploy YOLOv4-Tiny to Railway
2. Test with your existing frontend
3. Verify it works end-to-end
4. **Cost**: ~$5-10/month

### Phase 2: Upgrade to AWS (When Ready for Production)
1. Launch AWS EC2 with GPU
2. Deploy full YOLOv4 model
3. Update frontend to point to AWS
4. **Cost**: ~$400-500/month

### Phase 3: Optimize (Optional)
1. Use AWS Lambda for serverless
2. Only pay when processing videos
3. **Cost**: ~$50-100/month

---

## 📊 Performance Comparison

| Deployment | Model | Speed | Cost/Month | Best For |
|-----------|-------|-------|------------|----------|
| **Railway (CPU)** | YOLOv4-Tiny | 1-2 FPS | $5-10 | Testing |
| **Railway (CPU)** | YOLOv4-Fixed | 0.5-1 FPS | $5-10 | Low volume |
| **AWS EC2 (GPU)** | YOLOv4-Fixed | 20-30 FPS | $400-500 | Production |
| **AWS Lambda** | YOLOv4-Tiny | 5-10 FPS | $50-100 | Medium volume |

**For 30-second video**:
- Railway (CPU): 2-5 minutes
- AWS EC2 (GPU): 10-20 seconds

---

## 🔧 Model File Options

### Option 1: YOLOv4-Tiny (Recommended for Railway)
- **Size**: 23MB
- **mAP**: 40-41%
- **Speed**: Fast
- **Download**: https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights

### Option 2: YOLOv4-Fixed (Your Model - Best Accuracy)
- **Size**: 245MB
- **mAP**: 69.34%
- **Speed**: Slower
- **Location**: Already in your project

### Option 3: Custom Compressed Model
- Use model compression techniques
- Reduce size while maintaining accuracy
- Requires additional work

---

## 📝 Step-by-Step Migration Checklist

### Pre-Deployment
- [ ] Backup current `video_processor.py`
- [ ] Test YOLOv4 model locally
- [ ] Prepare model files (weights + config)
- [ ] Update requirements.txt

### Railway Deployment
- [ ] Update backend code
- [ ] Upload model files (volume or include)
- [ ] Set environment variables
- [ ] Deploy to Railway
- [ ] Test health endpoint

### Frontend Integration
- [ ] No changes needed (API compatible)
- [ ] Test video upload
- [ ] Verify detections appear on map
- [ ] Check Firestore updates

### Post-Deployment
- [ ] Monitor Railway logs
- [ ] Check processing times
- [ ] Verify accuracy
- [ ] Plan for AWS upgrade if needed

---

## 🚨 Important Notes

### Model File Size Issue
Railway has a **500MB slug size limit**. Your YOLOv4 weights are 245MB.

**Solutions**:
1. **Use Railway Volumes** (recommended)
2. **Use YOLOv4-Tiny** (23MB)
3. **Download on startup** (slower first run)
4. **Use external storage** (S3, Cloudinary)

### Memory Constraints
Railway free tier has 512MB RAM. YOLOv4 needs ~1GB.

**Solutions**:
1. **Upgrade Railway plan** ($5/month for 1GB)
2. **Process smaller frames** (320x320 instead of 608x608)
3. **Use YOLOv4-Tiny**

### Processing Speed
CPU processing is slow (1-2 FPS).

**Solutions**:
1. **Process fewer frames** (every 5 seconds instead of 3)
2. **Use smaller input size**
3. **Upgrade to AWS with GPU**

---

## 🎯 Recommended Path

### For Testing (Now):
```bash
# 1. Use YOLOv4-Tiny on Railway
cd backend
# Download tiny model
wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights

# 2. Update code to use tiny model
# Edit video_processor.py

# 3. Deploy
railway up

# 4. Test with frontend
```

### For Production (Later):
```bash
# 1. Launch AWS EC2 with GPU
# 2. Deploy full YOLOv4 model
# 3. Update frontend URL
# 4. Monitor and optimize
```

---

## 📞 Next Steps

1. **Read this guide completely**
2. **Decide**: Railway (testing) or AWS (production)?
3. **Choose model**: YOLOv4-Tiny (fast) or YOLOv4-Fixed (accurate)?
4. **Follow deployment steps** above
5. **Test thoroughly**
6. **Monitor performance**

---

## 🆘 Troubleshooting

### "Model not loaded"
- Check model files are in correct location
- Verify file paths in code
- Check Railway logs

### "Out of memory"
- Upgrade Railway plan
- Use smaller model (YOLOv4-Tiny)
- Process smaller frames

### "Too slow"
- Increase frame interval (5 seconds)
- Use smaller input size
- Consider AWS with GPU

### "Slug size too large"
- Use Railway volumes
- Use YOLOv4-Tiny
- Download model on startup

---

**Ready to deploy? Start with Railway + YOLOv4-Tiny for testing!**

See `RAILWAY_YOLOV4_DEPLOY.md` for detailed Railway deployment steps.
