# IMPORTANT FUNCTIONS IMPLEMENTATION CODE

# backend/video_processor.py -> classify_severity
# Classify pothole severity based on bounding box area and confidence
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

# backend/video_processor.py -> detect_pothole_yolov4
# Detect potholes using YOLOv4 model
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

# backend/video_processor.py -> process_video
# Main API endpoint for processing dashcam videos with YOLOv4
@app.route('/api/process-video', methods=['POST'])
def process_video():
    """
    Main endpoint for processing dashcam videos with YOLOv4
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
        
        # Generate unique video ID from URL
        video_id = video_url.split('/')[-1].split('.')[0]
        
        # Open video stream from Cloudinary URL
        cap = cv2.VideoCapture(video_url)
        
        if not cap.isOpened():
            return jsonify({'error': 'Failed to open video stream'}), 400
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        detections = []
        frames_processed = 0
        frame_count = 0
        
        # Process every 3 seconds (saves processing time and memory)
        frame_interval = int(fps * FRAME_INTERVAL_SECONDS) if fps > 0 else 90
        
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            if frame_count % frame_interval == 0:
                current_time = frame_count / fps if fps > 0 else 0
                frame_resized = cv2.resize(frame, (640, 640))
                predictions = detect_pothole_yolov4(frame_resized)
                
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
                if frames_processed >= 100: break
            frame_count += 1
        
        cap.release()
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return jsonify({
            'detections': detections,
            'total_frames_processed': frames_processed,
            'processing_time_seconds': round(processing_time, 2),
            'model': 'YOLOv4-Fixed (69.34% mAP)',
            'total_detections': len(detections)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# src/utils/gpsExtractor.js -> extractGPSFromVideo
# Simulate GPS track extraction from video
export function extractGPSFromVideo(videoUrl, durationSeconds = 120, fps = 30) {
    const gpsPoints = [];
    const startLat = 15.8281;
    const startLon = 78.0373;
    const roadDirectionLat = 0.00015;
    const roadDirectionLon = 0.00012;
    
    const totalFrames = Math.floor(durationSeconds * fps);
    const interval = Math.max(1, Math.floor(fps / 2)); 
    
    for (let frame = 0; frame < totalFrames; frame += interval) {
        const timestamp = frame / fps;
        const progress = timestamp / durationSeconds;
        const latOffset = progress * roadDirectionLat * durationSeconds;
        const lonOffset = progress * roadDirectionLon * durationSeconds;
        const noiseLat = (Math.random() - 0.5) * 0.00002;
        const noiseLon = (Math.random() - 0.5) * 0.00002;
        const heading = Math.atan2(roadDirectionLat, roadDirectionLon) * (180 / Math.PI);
        
        gpsPoints.push({
            timestamp: timestamp,
            frame_number: frame,
            latitude: startLat + latOffset + noiseLat,
            longitude: startLon + lonOffset + noiseLon,
            altitude: 10 + Math.random() * 2,
            speed: 35 + Math.random() * 10,
            heading: heading
        });
    }
    return gpsPoints;
}

# src/utils/gpsExtractor.js -> checkDuplicateDetection
# Check for duplicate detections within radius to prevent redundant reporting
export function checkDuplicateDetection(lat, lon, existingDetections, radiusMeters = 20) {
    for (const existing of existingDetections) {
        const distance = calculateDistance(
            lat, lon,
            existing.latitude || existing.lat,
            existing.longitude || existing.lng
        );
        
        if (distance < radiusMeters) {
            return true;
        }
    }
    return false;
}

# src/utils/severityClassifier.js -> classifySeverity
# Classify pothole severity based on multiple factors like area and confidence
export function classifySeverity(bboxArea, confidence, contextFeatures = {}) {
    const frameArea = 640 * 640;
    const normalizedArea = bboxArea / frameArea;
    let severity = 'low';
    
    if (normalizedArea > 0.15 && confidence > 0.7) {
        severity = 'critical';
    } else if (normalizedArea > 0.08 || confidence > 0.8) {
        severity = 'high';
    } else if (normalizedArea > 0.03) {
        severity = 'medium';
    } else {
        severity = 'low';
    }
    
    if (contextFeatures.clusterCount && contextFeatures.clusterCount > 3) {
        if (severity === 'medium') severity = 'high';
        if (severity === 'high') severity = 'critical';
    }
    
    if (contextFeatures.locationType === 'highway') {
        if (severity === 'medium') severity = 'high';
    }
    return severity;
}

# src/utils/severityClassifier.js -> calculatePriorityScore
# Calculate priority score (0-100) for pothole ranking and auto-submission
export function calculatePriorityScore(severity, factors = {}) {
    const severityWeights = {
        'critical': 50,
        'high': 35,
        'medium': 20,
        'low': 10
    };
    
    let score = severityWeights[severity] || 10;
    const trafficDensity = factors.trafficDensity || 0.5;
    score += trafficDensity * 30;
    const lastRepairAge = factors.lastRepairAge || 0; 
    score += Math.min(lastRepairAge / 365 * 20, 20);
    
    return Math.min(Math.round(score), 100);
}
