"""
Railway Backend - YOLOv4 Pothole Detection (PRODUCTION READY)
Replaces Roboflow API with local YOLOv4 model
Streams video from Cloudinary and processes frames
Optimized for Railway deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from datetime import datetime
import os
import sys
from typing import List, Dict
import base64
import cloudinary
import cloudinary.uploader
import tempfile
import urllib.request

app = Flask(__name__)
# Allow CORS for all domains (or specific ones)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Cloudinary Configuration for saving frames
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

# Validate Cloudinary credentials
if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    print("❌ Critical Error: Cloudinary credentials not found in environment variables.")
    print("   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
    sys.exit(1)

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# Processing configuration
FRAME_INTERVAL_SECONDS = 3  # Process every 3 seconds
CONFIDENCE_THRESHOLD = 0.3
NMS_THRESHOLD = 0.4

# YOLOv4 Model paths
# Using Tiny version to fit in Render's 512MB RAM
WEIGHTS_PATH = 'models/yolov4-tiny-pothole.weights'
CFG_PATH = 'models/yolov4-tiny-pothole.cfg'

# Global variable for model (load once)
net = None
output_layers = None

def download_model_files():
    """Check if model files exist (files are copied in Docker build)"""
    if not os.path.exists(WEIGHTS_PATH):
        print(f"❌ Custom weights not found at {WEIGHTS_PATH}")
        return False
        
    if not os.path.exists(CFG_PATH):
        print(f"❌ Config not found at {CFG_PATH}")
        return False
        
    return True


def load_yolov4_model():
    """Load YOLOv4 model (called once at startup)"""
    global net, output_layers
    
    if net is not None:
        return True
    
    try:
        print("📦 Loading YOLOv4 model...")
        
        # Check if model files exist
        if not download_model_files():
            print("❌ Model files not found")
            return False
        
        # Load network
        net = cv2.dnn.readNetFromDarknet(CFG_PATH, WEIGHTS_PATH)
        
        # Try to use GPU if available (Railway doesn't have GPU)
        try:
            net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
            net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)
            print("✅ GPU acceleration enabled")
        except:
            net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
            net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
            print("⚠️  Using CPU (GPU not available)")
        
        # Get output layers
        layer_names = net.getLayerNames()
        output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]
        
        print("✅ YOLOv4 model loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False


def classify_severity(bbox_area: float, confidence: float) -> str:
    """
    Classify pothole severity based on bounding box area and confidence
    
    Args:
        bbox_area: Area of bounding box (width * height)
        confidence: Detection confidence (0-1)
    
    Returns:
        Severity label: Critical, High, Medium, or Low
    """
    # Normalize area (assuming 640x640 frame)
    normalized_area = bbox_area / (640 * 640)
    
    if normalized_area > 0.15 and confidence > 0.7:
        return 'Critical'
    elif normalized_area > 0.08 or confidence > 0.8:
        return 'High'
    elif normalized_area > 0.03:
        return 'Medium'
    else:
        return 'Low'


def draw_bounding_boxes(frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
    """
    Draw bounding boxes on frame for detected potholes
    
    Args:
        frame: OpenCV frame
        detections: List of detections from YOLOv4
    
    Returns:
        Frame with bounding boxes drawn
    """
    annotated_frame = frame.copy()
    h, w = frame.shape[:2]
    
    for det in detections:
        x1, y1, x2, y2 = det['box']
        confidence = det['confidence']
        severity = det['severity']
        
        # Determine color based on severity
        if severity == 'Critical':
            color = (0, 0, 255)  # Red
        elif severity == 'High':
            color = (0, 165, 255)  # Orange
        elif severity == 'Medium':
            color = (0, 255, 255)  # Yellow
        else:
            color = (0, 255, 0)  # Green
        
        # Draw rectangle
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 3)
        
        # Draw label
        label = f"{severity} {int(confidence * 100)}%"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        
        # Background for label
        cv2.rectangle(annotated_frame, (x1, y1 - label_size[1] - 10),
                     (x1 + label_size[0], y1), color, -1)
        
        # Label text
        cv2.putText(annotated_frame, label, (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return annotated_frame


def upload_frame_to_cloudinary(frame: np.ndarray, video_id: str, frame_number: int) -> str:
    """
    Upload annotated frame to Cloudinary
    
    Args:
        frame: OpenCV frame with bounding boxes
        video_id: Unique video identifier
        frame_number: Frame number
    
    Returns:
        Cloudinary URL of uploaded frame
    """
    try:
        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            base64.b64encode(buffer).decode('utf-8'),
            folder=f'dashcam_frames/{video_id}',
            public_id=f'frame_{frame_number}',
            resource_type='image'
        )
        
        return result.get('secure_url', '')
    except Exception as e:
        print(f"Error uploading frame to Cloudinary: {e}")
        return ''


def detect_pothole_yolov4(frame: np.ndarray) -> List[Dict]:
    """
    Detect potholes using YOLOv4 model
    
    Args:
        frame: OpenCV frame (numpy array)
    
    Returns:
        List of detections with bounding boxes and confidence
    """
    global net, output_layers
    
    if net is None:
        print("❌ Model not loaded")
        return []
    
    try:
        h, w = frame.shape[:2]
        
        # Prepare input blob
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (608, 608), swapRB=True, crop=False)
        net.setInput(blob)
        
        # Get detections
        detections = net.forward(output_layers)
        
        # Process detections
        boxes = []
        confidences = []
        
        for detection in detections:
            for obj in detection:
                scores = obj[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                if confidence > CONFIDENCE_THRESHOLD:
                    # Get bounding box coordinates
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
        
        # Apply Non-Maximum Suppression
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
    """Convert seconds to MM:SS format"""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


@app.route('/api/process-video', methods=['POST'])
def process_video():
    """
    Main endpoint for processing dashcam videos with YOLOv4
    
    Request body:
        {
            "video_url": "https://res.cloudinary.com/..."
        }
    
    Response:
        {
            "detections": [
                {
                    "timestamp": "00:15",
                    "confidence": 0.85,
                    "severity": "Critical",
                    "bbox_area": 12500,
                    "bbox": {"x": 100, "y": 200, "width": 150, "height": 100},
                    "frame_url": "https://res.cloudinary.com/..."
                }
            ],
            "total_frames_processed": 40,
            "processing_time_seconds": 45.2,
            "model": "YOLOv4-Fixed (69.34% mAP)"
        }
    """
    start_time = datetime.now()
    
    # Ensure model is loaded
    if not load_yolov4_model():
        return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500
    
    try:
        # Get video URL from request
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'video_url is required'}), 400
        
        print(f"🎬 Processing video: {video_url}")
        
        # Generate unique video ID from URL
        video_id = video_url.split('/')[-1].split('.')[0]
        
        # Open video stream from Cloudinary URL
        cap = cv2.VideoCapture(video_url)
        
        if not cap.isOpened():
            return jsonify({'error': 'Failed to open video stream'}), 400
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"📹 Video info - FPS: {fps}, Total frames: {total_frames}, Duration: {duration:.2f}s")
        
        detections = []
        frames_processed = 0
        frame_count = 0
        
        # Process every 3 seconds (saves processing time and memory)
        frame_interval = int(fps * FRAME_INTERVAL_SECONDS) if fps > 0 else 90
        
        print(f"⚙️  Processing every {FRAME_INTERVAL_SECONDS} seconds (frame interval: {frame_interval})")
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Only process every Nth frame (every 3 seconds)
            if frame_count % frame_interval == 0:
                current_time = frame_count / fps if fps > 0 else 0
                
                # Resize frame for faster processing
                frame_resized = cv2.resize(frame, (640, 640))
                
                # Detect potholes with YOLOv4
                predictions = detect_pothole_yolov4(frame_resized)
                
                # Process each detection
                if predictions:
                    # Draw bounding boxes on frame
                    annotated_frame = draw_bounding_boxes(frame_resized, predictions)
                    
                    # Upload annotated frame to Cloudinary
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
                print(f"   ✓ Frame {frames_processed}: {len(predictions)} detections at {format_timestamp(current_time)}")
                
                # Memory management - limit processing for very long videos
                if frames_processed >= 100:  # Max ~5 minutes at 3-second intervals
                    print("⚠️  Reached processing limit (100 frames)")
                    break
            
            frame_count += 1
        
        # Release video capture
        cap.release()
        
        # Calculate processing time
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        print(f"✅ Processing complete - {len(detections)} detections in {processing_time:.2f}s")
        
        return jsonify({
            'detections': detections,
            'total_frames_processed': frames_processed,
            'processing_time_seconds': round(processing_time, 2),
            'video_duration_seconds': round(duration, 2),
            'frame_interval_seconds': FRAME_INTERVAL_SECONDS,
            'model': 'YOLOv4-Fixed (69.34% mAP)',
            'total_detections': len(detections)
        }), 200
        
    except Exception as e:
        print(f"❌ Error processing video: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_status = "loaded" if net is not None else "not loaded"
    
    return jsonify({
        'status': 'healthy',
        'service': 'yolov4-pothole-detector',
        'model': 'YOLOv4-Fixed (69.34% mAP)',
        'model_status': model_status,
        'timestamp': datetime.now().isoformat(),
        'frame_interval_seconds': FRAME_INTERVAL_SECONDS,
        'confidence_threshold': CONFIDENCE_THRESHOLD
    }), 200


if __name__ == '__main__':
    # Load model at startup
    print("\n" + "="*70)
    print("🚀 Starting YOLOv4 Pothole Detection Server")
    print("="*70)
    
    load_yolov4_model()
    
    port = int(os.getenv('PORT', 5000))
    print(f"\n🌐 Server starting on port {port}")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=False)
