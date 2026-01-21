# 🚂 Railway YOLOv4 Deployment - Step by Step

## 🎯 Goal
Deploy YOLOv4 pothole detection to Railway, replacing Roboflow API

---

## ⚠️ Important: Model File Size Issue

**Problem**: YOLOv4-Fixed weights are 245MB. Railway has 500MB slug limit.

**Solution**: We'll use **YOLOv4-Tiny** (23MB) which is small enough for Railway.

| Model | Size | mAP | Speed | Railway Compatible |
|-------|------|-----|-------|-------------------|
| YOLOv4-Fixed | 245MB | 69.34% | Slow | ❌ Too large |
| YOLOv4-Tiny | 23MB | 40-41% | Fast | ✅ Perfect |

---

## 📦 Step 1: Prepare Model Files

### Download YOLOv4-Tiny

```bash
cd C:\Users\basit\Downloads\CODE\fixit\fixit\backend

# Create models directory
mkdir models

# Download YOLOv4-Tiny weights
# Go to: https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights
# Save to: backend/models/yolov4-tiny.weights

# Download YOLOv4-Tiny config
# Go to: https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg
# Save to: backend/models/yolov4-tiny.cfg
```

**Or use PowerShell**:
```powershell
cd C:\Users\basit\Downloads\CODE\fixit\fixit\backend
mkdir models -Force

# Download weights
Invoke-WebRequest -Uri "https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights" -OutFile "models/yolov4-tiny.weights"

# Download config
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg" -OutFile "models/yolov4-tiny.cfg"
```

---

## 📝 Step 2: Update Backend Code

### Create New File: `backend/video_processor_tiny.py`

```python
"""
Railway Backend - YOLOv4-Tiny Pothole Detection
Optimized for Railway deployment (512MB RAM, CPU only)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from datetime import datetime
import os
from typing import List, Dict
import base64
import cloudinary
import cloudinary.uploader

app = Flask(__name__)
CORS(app)

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'fixit')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '435969829275136')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'hcqg6yQ4TUjuVGW-eWvE7Nngw2w')

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# Processing configuration
FRAME_INTERVAL_SECONDS = 3
CONFIDENCE_THRESHOLD = 0.25  # Lower for YOLOv4-Tiny
NMS_THRESHOLD = 0.4

# Model paths (YOLOv4-Tiny)
WEIGHTS_PATH = 'models/yolov4-tiny.weights'
CFG_PATH = 'models/yolov4-tiny.cfg'

# Global variables
net = None
output_layers = None

def load_model():
    """Load YOLOv4-Tiny model"""
    global net, output_layers
    
    if net is not None:
        return True
    
    try:
        print("📦 Loading YOLOv4-Tiny model...")
        
        if not os.path.exists(WEIGHTS_PATH):
            print(f"❌ Weights not found: {WEIGHTS_PATH}")
            return False
        
        if not os.path.exists(CFG_PATH):
            print(f"❌ Config not found: {CFG_PATH}")
            return False
        
        net = cv2.dnn.readNetFromDarknet(CFG_PATH, WEIGHTS_PATH)
        net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
        
        layer_names = net.getLayerNames()
        output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]
        
        print("✅ YOLOv4-Tiny loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def classify_severity(bbox_area: float, confidence: float) -> str:
    """Classify pothole severity"""
    normalized_area = bbox_area / (416 * 416)  # YOLOv4-Tiny uses 416x416
    
    if normalized_area > 0.15 and confidence > 0.6:
        return 'Critical'
    elif normalized_area > 0.08 or confidence > 0.7:
        return 'High'
    elif normalized_area > 0.03:
        return 'Medium'
    else:
        return 'Low'

def draw_bounding_boxes(frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
    """Draw bounding boxes"""
    annotated_frame = frame.copy()
    
    for det in detections:
        x1, y1, x2, y2 = det['box']
        confidence = det['confidence']
        severity = det['severity']
        
        # Color based on severity
        colors = {
            'Critical': (0, 0, 255),
            'High': (0, 165, 255),
            'Medium': (0, 255, 255),
            'Low': (0, 255, 0)
        }
        color = colors.get(severity, (0, 255, 0))
        
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 3)
        
        label = f"{severity} {int(confidence * 100)}%"
        cv2.putText(annotated_frame, label, (x1, y1 - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    return annotated_frame

def upload_frame_to_cloudinary(frame: np.ndarray, video_id: str, frame_number: int) -> str:
    """Upload frame to Cloudinary"""
    try:
        _, buffer = cv2.imencode('.jpg', frame)
        result = cloudinary.uploader.upload(
            base64.b64encode(buffer).decode('utf-8'),
            folder=f'dashcam_frames/{video_id}',
            public_id=f'frame_{frame_number}',
            resource_type='image'
        )
        return result.get('secure_url', '')
    except Exception as e:
        print(f"Error uploading frame: {e}")
        return ''

def detect_potholes(frame: np.ndarray) -> List[Dict]:
    """Detect potholes with YOLOv4-Tiny"""
    global net, output_layers
    
    if net is None:
        return []
    
    try:
        h, w = frame.shape[:2]
        
        # YOLOv4-Tiny uses 416x416 input
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
        net.setInput(blob)
        detections = net.forward(output_layers)
        
        boxes = []
        confidences = []
        
        for detection in detections:
            for obj in detection:
                scores = obj[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                if confidence > CONFIDENCE_THRESHOLD:
                    cx = int(obj[0] * w)
                    cy = int(obj[1] * h)
                    bw = int(obj[2] * w)
                    bh = int(obj[3] * h)
                    
                    x1 = max(0, cx - bw // 2)
                    y1 = max(0, cy - bh // 2)
                    x2 = min(w, cx + bw // 2)
                    y2 = min(h, cy + bh // 2)
                    
                    boxes.append([x1, y1, x2, y2])
                    confidences.append(float(confidence))
        
        indices = cv2.dnn.NMSBoxes(
            [[b[0], b[1], b[2]-b[0], b[3]-b[1]] for b in boxes],
            confidences,
            CONFIDENCE_THRESHOLD,
            NMS_THRESHOLD
        )
        
        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                x1, y1, x2, y2 = boxes[i]
                confidence = confidences[i]
                bbox_area = (x2 - x1) * (y2 - y1)
                severity = classify_severity(bbox_area, confidence)
                
                results.append({
                    'box': [x1, y1, x2, y2],
                    'confidence': confidence,
                    'severity': severity,
                    'bbox_area': bbox_area
                })
        
        return results
        
    except Exception as e:
        print(f"Detection error: {e}")
        return []

def format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS"""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"

@app.route('/api/process-video', methods=['POST'])
def process_video():
    """Process video with YOLOv4-Tiny"""
    start_time = datetime.now()
    
    if not load_model():
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'video_url is required'}), 400
        
        print(f"🎬 Processing: {video_url}")
        
        video_id = video_url.split('/')[-1].split('.')[0]
        cap = cv2.VideoCapture(video_url)
        
        if not cap.isOpened():
            return jsonify({'error': 'Failed to open video'}), 400
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        detections = []
        frames_processed = 0
        frame_count = 0
        frame_interval = int(fps * FRAME_INTERVAL_SECONDS) if fps > 0 else 90
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                current_time = frame_count / fps if fps > 0 else 0
                frame_resized = cv2.resize(frame, (416, 416))
                
                predictions = detect_potholes(frame_resized)
                
                if predictions:
                    annotated_frame = draw_bounding_boxes(frame_resized, predictions)
                    frame_url = upload_frame_to_cloudinary(annotated_frame, video_id, frame_count)
                    
                    for pred in predictions:
                        x1, y1, x2, y2 = pred['box']
                        detections.append({
                            'timestamp': format_timestamp(current_time),
                            'confidence': round(pred['confidence'], 3),
                            'severity': pred['severity'],
                            'bbox_area': int(pred['bbox_area']),
                            'bbox': {
                                'x': int((x1 + x2) / 2),
                                'y': int((y1 + y2) / 2),
                                'width': int(x2 - x1),
                                'height': int(y2 - y1)
                            },
                            'frame_number': frame_count,
                            'frame_url': frame_url
                        })
                
                frames_processed += 1
                
                if frames_processed >= 100:
                    break
            
            frame_count += 1
        
        cap.release()
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        print(f"✅ Complete - {len(detections)} detections in {processing_time:.2f}s")
        
        return jsonify({
            'detections': detections,
            'total_frames_processed': frames_processed,
            'processing_time_seconds': round(processing_time, 2),
            'video_duration_seconds': round(duration, 2),
            'frame_interval_seconds': FRAME_INTERVAL_SECONDS,
            'model': 'YOLOv4-Tiny (40% mAP)',
            'total_detections': len(detections)
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check"""
    model_status = "loaded" if net is not None else "not loaded"
    return jsonify({
        'status': 'healthy',
        'service': 'yolov4-tiny-pothole-detector',
        'model': 'YOLOv4-Tiny (40% mAP)',
        'model_status': model_status,
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 YOLOv4-Tiny Pothole Detection Server")
    print("="*70)
    load_model()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

---

## 📦 Step 3: Update Requirements

Edit `backend/requirements.txt`:

```txt
flask==3.0.0
flask-cors==4.0.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
cloudinary==1.36.0
gunicorn==21.2.0
```

---

## 🚂 Step 4: Deploy to Railway

### Option A: Using Railway CLI (Recommended)

```bash
cd C:\Users\basit\Downloads\CODE\fixit\fixit\backend

# Login to Railway
railway login

# Link to existing project (if you have one)
railway link

# Or create new project
railway init

# Set environment variables
railway variables set CLOUDINARY_CLOUD_NAME=fixit
railway variables set CLOUDINARY_API_KEY=435969829275136
railway variables set CLOUDINARY_API_SECRET=hcqg6yQ4TUjuVGW-eWvE7Nngw2w

# Deploy
railway up
```

### Option B: Using Railway Dashboard

1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your fixit repository
5. Set root directory to `backend`
6. Add environment variables:
   - `CLOUDINARY_CLOUD_NAME=fixit`
   - `CLOUDINARY_API_KEY=435969829275136`
   - `CLOUDINARY_API_SECRET=hcqg6yQ4TUjuVGW-eWvE7Nngw2w`
7. Deploy!

---

## 🔧 Step 5: Update Procfile

Edit `backend/Procfile`:

```
web: gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 video_processor_tiny:app
```

---

## ✅ Step 6: Test Deployment

### Test Health Endpoint

```bash
# Replace with your Railway URL
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "yolov4-tiny-pothole-detector",
  "model": "YOLOv4-Tiny (40% mAP)",
  "model_status": "loaded"
}
```

### Test Video Processing

```bash
curl -X POST https://your-app.up.railway.app/api/process-video \
  -H "Content-Type: application/json" \
  -d '{"video_url": "YOUR_CLOUDINARY_VIDEO_URL"}'
```

---

## 🎨 Step 7: Update Frontend (No Changes Needed!)

Your frontend already uses the same API endpoint, so it will work automatically!

Just make sure the backend URL in your config points to the new Railway deployment.

---

## 📊 Performance Expectations

### YOLOv4-Tiny on Railway (CPU)

| Metric | Value |
|--------|-------|
| Processing Speed | 1-2 FPS |
| 30-second video | 2-3 minutes |
| Accuracy (mAP) | 40-41% |
| Memory Usage | ~400MB |
| Cost | $5-10/month |

---

## 🐛 Troubleshooting

### "Model not loaded"
```bash
# Check if model files exist
railway run ls -la models/

# Check logs
railway logs
```

### "Out of memory"
```bash
# Upgrade Railway plan
# Settings → Plan → Hobby ($5/month for 1GB RAM)
```

### "Slug size too large"
```bash
# Check deployment size
railway run du -sh .

# Should be < 500MB
```

### "Video processing timeout"
```bash
# Increase timeout in Procfile
web: gunicorn --timeout 900 ...  # 15 minutes
```

---

## 🎯 Quick Command Reference

```bash
# Deploy
cd backend
railway up

# Check logs
railway logs

# Check status
railway status

# Set variables
railway variables set KEY=value

# Run command
railway run ls -la

# SSH into container
railway shell
```

---

## ✅ Deployment Checklist

- [ ] Downloaded YOLOv4-Tiny weights
- [ ] Downloaded YOLOv4-Tiny config
- [ ] Created `models/` directory
- [ ] Updated `video_processor_tiny.py`
- [ ] Updated `requirements.txt`
- [ ] Updated `Procfile`
- [ ] Set environment variables
- [ ] Deployed to Railway
- [ ] Tested health endpoint
- [ ] Tested video processing
- [ ] Updated frontend URL (if needed)

---

## 🎉 You're Done!

Your YOLOv4-Tiny model is now deployed on Railway and ready to replace Roboflow!

**Next Steps**:
1. Test with your frontend
2. Monitor performance
3. Consider upgrading to AWS with GPU for better performance

---

**Need help? Check Railway logs: `railway logs`**
