"""
Railway Backend - Dashcam Video Processor (PRODUCTION READY)
Streams video from Cloudinary and processes frames for pothole detection
Optimized for 512MB RAM limit with frame saving to Cloudinary
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import requests
from datetime import datetime
import os
from typing import List, Dict
import base64
import cloudinary
import cloudinary.uploader

app = Flask(__name__)
CORS(app)

# Configuration
ROBOFLOW_API_KEY = os.getenv('ROBOFLOW_API_KEY', '4b8afa69-5426-44dd-b2af-3977e26d6b5f')
ROBOFLOW_MODEL_ENDPOINT = os.getenv('ROBOFLOW_MODEL_ENDPOINT', 'https://detect.roboflow.com/pothole-669/1')

# Cloudinary Configuration for saving frames
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'fixit')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '435969829275136')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'hcqg6yQ4TUjuVGW-eWvE7Nngw2w')

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# Processing configuration
FRAME_INTERVAL_SECONDS = 3  # Process every 3 seconds (saves API calls and memory)


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


def draw_bounding_boxes(frame: np.ndarray, predictions: List[Dict]) -> np.ndarray:
    """
    Draw bounding boxes on frame for detected potholes
    
    Args:
        frame: OpenCV frame
        predictions: List of Roboflow predictions
    
    Returns:
        Frame with bounding boxes drawn
    """
    annotated_frame = frame.copy()
    
    for pred in predictions:
        x = int(pred.get('x', 0))
        y = int(pred.get('y', 0))
        width = int(pred.get('width', 0))
        height = int(pred.get('height', 0))
        confidence = pred.get('confidence', 0)
        
        # Calculate bbox coordinates
        x1 = int(x - width / 2)
        y1 = int(y - height / 2)
        x2 = int(x + width / 2)
        y2 = int(y + height / 2)
        
        # Determine color based on severity
        bbox_area = width * height
        severity = classify_severity(bbox_area, confidence)
        
        if severity == 'Critical':
            color = (0, 0, 255)  # Red
        elif severity == 'High':
            color = (0, 165, 255)  # Orange
        elif severity == 'Medium':
            color = (0, 255, 255)  # Yellow
        else:
            color = (0, 255, 0)  # Green
        
        # Draw rectangle
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{severity} {int(confidence * 100)}%"
        cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
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


def detect_pothole_roboflow(frame: np.ndarray) -> List[Dict]:
    """
    Send frame to Roboflow API for pothole detection
    
    Args:
        frame: OpenCV frame (numpy array)
    
    Returns:
        List of detections with bounding boxes and confidence
    """
    try:
        # Encode frame as JPEG
        _, img_encoded = cv2.imencode('.jpg', frame)
        
        # Send to Roboflow
        response = requests.post(
            ROBOFLOW_MODEL_ENDPOINT,
            params={'api_key': ROBOFLOW_API_KEY},
            files={'file': img_encoded.tobytes()},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('predictions', [])
        else:
            print(f"Roboflow API error: {response.status_code}")
            return []
            
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
    Main endpoint for processing dashcam videos
    
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
            "processing_time_seconds": 45.2
        }
    """
    start_time = datetime.now()
    
    try:
        # Get video URL from request
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'video_url is required'}), 400
        
        print(f"Processing video: {video_url}")
        
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
        
        print(f"Video info - FPS: {fps}, Total frames: {total_frames}, Duration: {duration:.2f}s")
        
        detections = []
        frames_processed = 0
        frame_count = 0
        
        # Process every 3 seconds (saves API calls and memory)
        frame_interval = int(fps * FRAME_INTERVAL_SECONDS) if fps > 0 else 90
        
        print(f"Processing every {FRAME_INTERVAL_SECONDS} seconds (frame interval: {frame_interval})")
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Only process every Nth frame (every 3 seconds)
            if frame_count % frame_interval == 0:
                current_time = frame_count / fps if fps > 0 else 0
                
                # Resize frame for faster processing
                frame_resized = cv2.resize(frame, (640, 640))
                
                # Detect potholes
                predictions = detect_pothole_roboflow(frame_resized)
                
                # Process each detection
                if predictions:
                    # Draw bounding boxes on frame
                    annotated_frame = draw_bounding_boxes(frame_resized, predictions)
                    
                    # Upload annotated frame to Cloudinary
                    frame_url = upload_frame_to_cloudinary(annotated_frame, video_id, frame_count)
                    
                    for pred in predictions:
                        confidence = pred.get('confidence', 0)
                        
                        # Only include high-confidence detections
                        if confidence > 0.5:
                            bbox = {
                                'x': pred.get('x', 0),
                                'y': pred.get('y', 0),
                                'width': pred.get('width', 0),
                                'height': pred.get('height', 0)
                            }
                            
                            bbox_area = bbox['width'] * bbox['height']
                            severity = classify_severity(bbox_area, confidence)
                            
                            detections.append({
                                'timestamp': format_timestamp(current_time),
                                'confidence': round(confidence, 3),
                                'severity': severity,
                                'bbox_area': int(bbox_area),
                                'bbox': bbox,
                                'frame_number': frame_count,
                                'frame_url': frame_url  # Cloudinary URL of annotated frame
                            })
                
                frames_processed += 1
                
                # Memory management - limit processing for very long videos
                if frames_processed >= 100:  # Max ~5 minutes at 3-second intervals
                    print("Reached processing limit (100 frames)")
                    break
            
            frame_count += 1
        
        # Release video capture
        cap.release()
        
        # Calculate processing time
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        print(f"Processing complete - {len(detections)} detections in {processing_time:.2f}s")
        
        return jsonify({
            'detections': detections,
            'total_frames_processed': frames_processed,
            'processing_time_seconds': round(processing_time, 2),
            'video_duration_seconds': round(duration, 2),
            'frame_interval_seconds': FRAME_INTERVAL_SECONDS
        }), 200
        
    except Exception as e:
        print(f"Error processing video: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'dashcam-video-processor',
        'timestamp': datetime.now().isoformat(),
        'frame_interval_seconds': FRAME_INTERVAL_SECONDS
    }), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
