import { useState, useEffect, useCallback } from 'react';
import { Video, Upload, Loader2, AlertCircle, CheckCircle, MapPin, Clock, TrendingUp, Filter, Play, X } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import app from '../utils/firebase';
import { VIDEO_PROCESSOR_CONFIG } from '../config/videoProcessorConfig';
import { extractGPSFromVideo, matchFrameToGPS, reverseGeocode, checkDuplicateDetection } from '../utils/gpsExtractor';
import { classifySeverity, calculatePriorityScore, shouldAutoSubmitToPGRS, formatSeverity } from '../utils/severityClassifier';
import { matchPotholeToKurnoolRoad, getDepartmentColor, getPriorityResponseTime, shouldAutoSubmitToPGRS as shouldAutoSubmitByRoad } from '../utils/kurnoolRoadMatcher';
import { generateGPSTrackAlongRBRoad, getRandomRBRoad, getAllRBRoads } from '../utils/rbRoadsMockData';
import DashboardMap from './DashboardMap';

// Toggle between demo mode and production mode
// Set to true when Railway backend is deployed
const USE_DEMO_MODE = true;  // Enabled for development/demo - simulate AI processing logic

export default function DashcamVideoProcessor() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [detectionResults, setDetectionResults] = useState(null);
    const [error, setError] = useState(null);
    const [cloudinaryWidget, setCloudinaryWidget] = useState(null);
    const [recentVideos, setRecentVideos] = useState([]);

    // Filters
    const [severityFilter, setSeverityFilter] = useState('all');
    const [confidenceFilter, setConfidenceFilter] = useState([0, 100]);
    const [showVideo, setShowVideo] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Fetch recent dashcam videos from Firestore
    useEffect(() => {
        const fetchRecentVideos = async () => {
            try {
                const db = getFirestore(app);
                // Simple query to avoid index errors
                const q = query(
                    collection(db, 'issues'),
                    orderBy('ts', 'desc'),
                    limit(40)
                );

                const querySnapshot = await getDocs(q);
                const videos = [];
                const seenUrls = new Set();

                // Add hardcoded sample first
                const sampleUrl = 'https://res.cloudinary.com/fixit/video/upload/v1769007356/dashcam_videos/rcy1fztshdple3zmdky1.mp4';
                videos.push({
                    url: sampleUrl,
                    name: 'Sample: Road Test',
                    ts: new Date(),
                    thumb: sampleUrl.replace('.mp4', '.jpg')
                });
                seenUrls.add(sampleUrl);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.source === 'dashcam_ai' && data.videoUrl && !seenUrls.has(data.videoUrl)) {
                        videos.push({
                            url: data.videoUrl,
                            name: `Upload: ${data.videoTimestamp || 'Recent'}`,
                            ts: data.ts?.toDate() || new Date(),
                            thumb: data.videoUrl.replace('.mp4', '.jpg')
                        });
                        seenUrls.add(data.videoUrl);
                    }
                });

                setRecentVideos(videos.slice(0, 6)); // Show top 6
            } catch (err) {
                console.error('Error fetching recent videos:', err);
            }
        };

        fetchRecentVideos();
    }, []);

    const handleVideoUploadSuccess = useCallback(async (videoUrl) => {
        setIsProcessing(true);
        setProcessingStatus('Processing Road Footage...');
        setError(null);
        setDetectionResults(null);

        try {
            if (USE_DEMO_MODE) {
                // SIMULATED AI PROCESSING PIPELINE WITH GPS INTEGRATION
                setProcessingStatus('Extracting GPS Data from Video Metadata...');
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Step 1: Extract GPS track from video using R&B Department road
                const videoDuration = 120; // seconds
                const fps = 30;

                // Select a random R&B road for this video
                const selectedRBRoad = getRandomRBRoad();
                console.log(`🛣️ Using R&B Road: ${selectedRBRoad.road_name}`);

                // Generate GPS track along the selected R&B road
                const gpsTrack = generateGPSTrackAlongRBRoad(selectedRBRoad.osm_id, videoDuration, fps);
                console.log(`📍 Extracted ${gpsTrack.length} GPS points along ${selectedRBRoad.road_name}`);

                setProcessingStatus('Initializing Neural Network...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setProcessingStatus('Analyzing Frame Sequences (1 FPS)...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                setProcessingStatus('Detecting Road Imperfections...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Step 2: Generate mock detections with proper timestamps
                const numDetections = 38;
                const mockDetections = [];

                for (let i = 0; i < numDetections; i++) {
                    // Calculate frame timestamp (every 2 seconds)
                    const frameTimestamp = (i * 2) % videoDuration;
                    const timestampStr = `${Math.floor(frameTimestamp / 60).toString().padStart(2, '0')}:${Math.floor(frameTimestamp % 60).toString().padStart(2, '0')}`;

                    // Generate detection properties
                    const confidence = 0.75 + Math.random() * 0.2;
                    const bbox_area = 5000 + Math.random() * 15000;

                    // Step 3: Match detection to GPS coordinate
                    const gpsLocation = matchFrameToGPS(frameTimestamp, gpsTrack);

                    // Step 4: Match to R&B Department road and get department
                    // Use R&B roads data for matching
                    const rbRoads = getAllRBRoads();
                    const roadInfo = matchPotholeToKurnoolRoad(
                        gpsLocation?.latitude || 15.8281,
                        gpsLocation?.longitude || 78.0373,
                        rbRoads  // Pass R&B roads data
                    );

                    // Step 5: Classify severity using the severity engine
                    const severity = classifySeverity(bbox_area, confidence, {
                        clusterCount: i % 7 === 0 ? 4 : 1, // Some clusters
                        locationType: i % 3 === 0 ? 'highway' : 'residential'
                    });

                    // Step 6: Reverse geocode to get address
                    const address = gpsLocation
                        ? await reverseGeocode(gpsLocation.latitude, gpsLocation.longitude)
                        : roadInfo?.road_name || 'Location from dashcam video';

                    // Step 7: Calculate priority score (combine AI severity + road priority)
                    const priorityScore = calculatePriorityScore(severity, {
                        trafficDensity: 0.5 + Math.random() * 0.3,
                        lastRepairAge: Math.random() * 365,
                        roadPriority: roadInfo?.repair_priority || 'Medium (Municipal)'
                    });

                    // Calculate depth estimation (mock - based on bbox area and confidence)
                    const depthEstimate = bbox_area > 10000 ? 'deep' : bbox_area > 5000 ? 'medium' : 'shallow';
                    const depth_cm = depthEstimate === 'deep' ? 15 + Math.random() * 10 : depthEstimate === 'medium' ? 8 + Math.random() * 7 : 3 + Math.random() * 5;

                    mockDetections.push({
                        id: `det_${i + 1}`,
                        detection_id: `det_${Date.now()}_${i}`,
                        timestamp: timestampStr,
                        frame_timestamp: frameTimestamp,
                        frame_number: Math.floor(frameTimestamp * fps),
                        confidence: Math.round(confidence * 1000) / 1000,
                        severity: formatSeverity(severity),
                        severity_level: severity,
                        bbox_area: Math.round(bbox_area),
                        bbox: {
                            x: 100 + i * 2,
                            y: 150 + i,
                            width: 100,
                            height: 80
                        },
                        // Depth information
                        depth: depthEstimate,
                        depth_cm: Math.round(depth_cm * 10) / 10,
                        size_category: bbox_area > 10000 ? 'large' : bbox_area > 5000 ? 'medium' : 'small',
                        // Location data - use GPS matched location (all on same road in Kurnool)
                        location: {
                            lat: gpsLocation?.latitude || 15.8281,
                            lng: gpsLocation?.longitude || 78.0373,
                            latitude: gpsLocation?.latitude || 15.8281,
                            longitude: gpsLocation?.longitude || 78.0373,
                            altitude: gpsLocation?.altitude,
                            speed: gpsLocation?.speed,
                            heading: gpsLocation?.heading,
                            address: address
                        },
                        priority_score: priorityScore,
                        should_auto_submit: shouldAutoSubmitToPGRS(severity, priorityScore) || shouldAutoSubmitByRoad(roadInfo),
                        video_source: 'Bus_Route_14_AM',
                        created_at: new Date().toISOString(),
                        // Kurnool road matching data
                        road_info: {
                            road_name: roadInfo?.road_name || 'Unknown Road',
                            department: roadInfo?.department || 'Kurnool Municipal Corporation (KMC)',
                            repair_priority: roadInfo?.repair_priority || 'Medium (Municipal)',
                            highway_type: roadInfo?.highway_type || 'residential',
                            response_time: getPriorityResponseTime(roadInfo?.repair_priority || 'Medium (Municipal)'),
                            distance_to_road: roadInfo?.distance_meters || null
                        }
                    });
                }

                // Use the specific processed video URL for demo
                const PROCESSED_VIDEO_URL = 'https://res.cloudinary.com/fixit/video/upload/v1769679278/inference_output_2_psh9hg.mp4';

                // Generate thumbnail URL from video using Cloudinary transformations
                // Extract first frame (so_0 = start offset 0) and convert to JPG image
                // Cloudinary automatically extracts frame from video when using image transformations
                // Format: /upload/transformations/version/filename.mp4 (but served as image)
                const VIDEO_THUMBNAIL_URL = 'https://res.cloudinary.com/fixit/video/upload/w_400,h_300,c_fill,f_jpg,so_0/v1769679278/inference_output_2_psh9hg.mp4';

                // Add thumbnail URL to each detection for map display
                mockDetections.forEach(detection => {
                    detection.frame_url = VIDEO_THUMBNAIL_URL;
                    detection.thumbnail_url = VIDEO_THUMBNAIL_URL;
                    detection.imageUrl = VIDEO_THUMBNAIL_URL; // For map compatibility
                });

                const mockResponse = {
                    detections: mockDetections,
                    total_frames_processed: 120,
                    processing_time_seconds: 12.5,
                    video_duration_seconds: videoDuration,
                    mode: 'DEMO_MODE_WITH_GPS',
                    video_url: videoUrl, // Original uploaded video URL
                    processed_video_url: PROCESSED_VIDEO_URL, // Processed video with bounding boxes
                    video_thumbnail_url: VIDEO_THUMBNAIL_URL, // Thumbnail for map display
                    gps_points_extracted: gpsTrack.length,
                    gps_track: gpsTrack.slice(0, 10) // Include sample GPS points
                };

                setDetectionResults(mockResponse);
                setProcessingStatus(`AI Analysis Complete! (${numDetections} Potholes Detected with GPS)`);
                await saveDetectionsToFirestore(mockDetections, videoUrl);
            } else {
                // PRODUCTION MODE: Real AI Backend Call
                const response = await fetch(`${VIDEO_PROCESSOR_CONFIG.backend.baseUrl}/api/process-video`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ video_url: videoUrl })
                });

                if (!response.ok) {
                    throw new Error(`AI Backend Error: ${response.status}. Please check Render logs.`);
                }

                const result = await response.json();

                // Extract GPS and match detections in production mode too
                setProcessingStatus('Extracting GPS Data and Matching Coordinates...');
                const videoDuration = result.video_duration_seconds || 120;
                const fps = 30;
                const gpsTrack = extractGPSFromVideo(videoUrl, videoDuration, fps);

                // Match each detection to GPS
                if (result.detections && result.detections.length > 0) {
                    for (const detection of result.detections) {
                        // Parse timestamp to seconds
                        const [mins, secs] = detection.timestamp.split(':').map(Number);
                        const frameTimestamp = mins * 60 + secs;

                        const gpsLocation = matchFrameToGPS(frameTimestamp, gpsTrack);
                        if (gpsLocation) {
                            detection.location = {
                                lat: gpsLocation.latitude,
                                lng: gpsLocation.longitude,
                                latitude: gpsLocation.latitude,
                                longitude: gpsLocation.longitude,
                                altitude: gpsLocation.altitude,
                                address: await reverseGeocode(gpsLocation.latitude, gpsLocation.longitude)
                            };

                            // Classify severity if not already done
                            if (!detection.severity_level) {
                                detection.severity_level = classifySeverity(
                                    detection.bbox_area || 0,
                                    detection.confidence || 0.5
                                );
                                detection.severity = formatSeverity(detection.severity_level);
                            }
                        }
                    }
                }

                result.gps_points_extracted = gpsTrack.length;
                setDetectionResults(result);
                setProcessingStatus('AI Analysis Complete!');

                if (result.detections && result.detections.length > 0) {
                    await saveDetectionsToFirestore(result.detections, videoUrl);
                }
            }

        } catch (err) {
            console.error('Processing error:', err);
            setError(err.message || 'Failed to process video');
            setProcessingStatus('');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        // Load Cloudinary Upload Widget script
        const script = document.createElement('script');
        script.src = 'https://upload-widget.cloudinary.com/global/all.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            const widget = window.cloudinary.createUploadWidget(
                {
                    cloudName: VIDEO_PROCESSOR_CONFIG.cloudinary.cloudName,
                    uploadPreset: VIDEO_PROCESSOR_CONFIG.cloudinary.uploadPreset,
                    sources: ['local', 'camera'],
                    multiple: false,
                    resourceType: 'video',
                    clientAllowedFormats: VIDEO_PROCESSOR_CONFIG.processing.allowedFormats,
                    maxFileSize: VIDEO_PROCESSOR_CONFIG.processing.maxFileSize,
                    folder: 'dashcam_videos',
                    tags: ['dashcam', 'pothole_detection'],
                    showPoweredBy: false,
                    styles: {
                        palette: {
                            window: '#09090B',
                            windowBorder: '#FF671F',
                            tabIcon: '#FF671F',
                            menuIcons: '#FFFFFF',
                            textDark: '#000000',
                            textLight: '#FFFFFF',
                            link: '#FF671F',
                            action: '#FF671F',
                            inactiveTabIcon: '#A1A1AA',
                            error: '#EF4444',
                            inProgress: '#FF671F',
                            complete: '#046A38',
                            sourceBg: '#18181B'
                        }
                    }
                },
                (error, result) => {
                    if (!error && result && result.event === 'success') {
                        const videoUrl = result.info.secure_url;
                        handleVideoUploadSuccess(videoUrl);
                    }
                    if (error) {
                        setError('Upload failed: ' + error.message);
                        setIsProcessing(false);
                    }
                }
            );
            setCloudinaryWidget(widget);
        };

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [handleVideoUploadSuccess]);

    const saveDetectionsToFirestore = async (detections, videoUrl) => {
        const db = getFirestore(app);

        // Fetch existing detections to check for duplicates
        let existingDetections = [];
        try {
            const q = query(
                collection(db, 'issues'),
                orderBy('ts', 'desc'),
                limit(100)
            );
            const snapshot = await getDocs(q);
            existingDetections = snapshot.docs.map(doc => doc.data());
        } catch (err) {
            console.warn('Could not fetch existing detections for duplicate check:', err);
        }

        let savedCount = 0;
        let duplicateCount = 0;
        let autoSubmittedCount = 0;

        // Create a Parent Issue for the entire video run
        let parentIssueId = null;
        try {
            const parentData = {
                type: 'Pothole',
                source: 'dashcam_ai',
                ts: serverTimestamp(),
                videoUrl: videoUrl,
                status: 'PENDING',
                roadName: detections[0]?.road_info?.road_name || 'Dashcam Video Audit',
                department: detections[0]?.road_info?.department || 'R&B Department',
                desc: `AI Dashcam Audit: ${detections.length} potholes detected from road footage.`,
                latitude: detections[0]?.location?.latitude || 0,
                longitude: detections[0]?.location?.longitude || 0,
                address: detections[0]?.location?.address || 'Location from video',
                imageUrl: detections[0]?.frame_url || videoUrl,
                isGrouped: true,
                totalDetections: detections.length
            };
            const parentRef = await addDoc(collection(db, 'issues'), parentData);
            parentIssueId = parentRef.id;
            console.log(`📡 Parent Issue created: ${parentIssueId}`);
        } catch (err) {
            console.error('Error creating parent issue:', err);
        }

        for (const detection of detections) {
            try {
                const lat = detection.location?.latitude || detection.location?.lat || 0;
                const lng = detection.location?.longitude || detection.location?.lng || 0;

                // Check for duplicates (within 20m radius)
                if (lat !== 0 && lng !== 0 && checkDuplicateDetection(lat, lng, existingDetections, 20)) {
                    console.log(`⚠️ Duplicate detection skipped at ${lat}, ${lng}`);
                    duplicateCount++;
                    continue;
                }

                // Determine what to save based on severity
                const severity = detection.severity_level || detection.severity?.toLowerCase() || 'medium';
                const shouldSave = severity === 'critical' || severity === 'high' || severity === 'medium';

                if (shouldSave) {
                    const depthValue = (detection.depth || 'medium').toUpperCase();
                    const detectionData = {
                        sourceIssueId: parentIssueId,
                        reportId: parentIssueId,
                        type: 'Pothole',
                        severity: severity,
                        status: 'PENDING',
                        desc: `AI detection at ${detection.timestamp}. Conf: ${Math.round((detection.confidence || 0) * 100)}%`,
                        lat: lat,
                        lng: lng,
                        latitude: lat,
                        longitude: lng,
                        address: detection.location?.address || 'Location from dashcam video',
                        roadName: detection.location?.address || 'Road from dashcam',
                        imageUrl: detection.frame_url || videoUrl,
                        originalImageUrl: videoUrl,
                        annotatedImageUrl: detection.frame_url || videoUrl,
                        depth: depthValue === 'SHALLOW' ? 'SHALLOW' : depthValue === 'DEEP' ? 'DEEP' : 'MEDIUM',
                        ts: serverTimestamp(),
                        timestamp: serverTimestamp(),
                        source: 'dashcam_ai',
                        aiConfidence: detection.confidence || 0,
                        confidence: detection.confidence || 0,
                        videoTimestamp: detection.timestamp,
                        frame_number: detection.frame_number,
                        frame_timestamp: detection.frame_timestamp,
                        bbox_area: detection.bbox_area,
                        width: detection.bbox?.width || 0,
                        height: detection.bbox?.height || 0,
                        priority_score: detection.priority_score,
                        department: parentIssueId ? (detections[0]?.road_info?.department || 'R&B Department') : 'R&B Department'
                    };

                    // Save to pothole_detections (sub-items)
                    await addDoc(collection(db, 'pothole_detections'), detectionData);

                    savedCount++;

                    // Add to existing detections to prevent duplicates in same batch
                    existingDetections.push(detectionData);

                    if (detection.should_auto_submit) {
                        autoSubmittedCount++;
                    }
                }
            } catch (err) {
                console.error('Error saving detection:', err, detection);
            }
        }
        console.log(`📊 Detection Summary: ${savedCount} saved to pothole_detections, ${duplicateCount} duplicates skipped, ${autoSubmittedCount} high priority`);
    };

    const openUploadWidget = () => {
        if (cloudinaryWidget) {
            cloudinaryWidget.open();
        } else {
            setError('Upload widget not ready. Please refresh the page.');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return '#EF4444';
            case 'High': return '#F97316';
            case 'Medium': return '#EAB308';
            case 'Low': return '#22C55E';
            default: return '#A1A1AA';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="muni-card p-6 border-t-4 border-[#FF671F]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FF671F]/10 flex items-center justify-center border border-[#FF671F]/30">
                        <Video size={24} className="text-[#FF671F]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Dashcam Video Processor</h2>
                        <p className="text-sm text-[var(--muni-text-muted)]">AI-powered pothole detection from road footage</p>
                    </div>
                </div>

                <div className="bg-[#046A38]/10 border border-[#046A38]/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-[#046A38] flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-[var(--muni-text-main)] mb-2 uppercase tracking-tight">System Intelligence - How it works:</p>
                            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--muni-text-main)] font-medium">
                                <li>Upload dashcam video directly to Cloudinary (no server storage needed)</li>
                                <li>AI processes 1 frame per second to detect potholes efficiently</li>
                                <li>Results automatically populate the map and leaderboard</li>
                                <li>Works within Railway's 512MB RAM limit</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Upload Button */}
                <button
                    onClick={openUploadWidget}
                    disabled={isProcessing}
                    className="w-full muni-btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            {processingStatus}
                        </>
                    ) : (
                        <>
                            <Upload size={24} />
                            Upload Dashcam Video
                        </>
                    )}
                </button>

                {/* Video Library (Dynamic & Samples) */}
                <div className="border-t border-white/10 pt-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Video size={16} className="text-[#FF671F]" />
                        Dashcam Video Library
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentVideos.map((video, idx) => (
                            <div
                                key={idx}
                                className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#FF671F]/50 transition-all cursor-pointer"
                                onClick={() => !isProcessing && handleVideoUploadSuccess(video.url)}
                            >
                                <div className="aspect-video relative overflow-hidden bg-black">
                                    <img
                                        src={video.thumb}
                                        alt={video.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrendingUp size={24} className="text-[#FF671F]" />
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded font-bold">
                                        READY
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs font-bold text-white truncate group-hover:text-[#FF671F] transition-colors">{video.name}</p>
                                    <p className="text-[10px] text-[var(--muni-text-muted)] mt-1">
                                        {video.ts.toLocaleDateString()} • {video.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="muni-card p-6 border-l-4 border-red-500 bg-red-500/5">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-red-500" />
                        <div>
                            <h3 className="font-bold text-white">Processing Error</h3>
                            <p className="text-sm text-gray-300">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Results */}
            {detectionResults && (
                <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="muni-card p-4 border-l-4 border-[#FF671F]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold">Total Detections</p>
                                    <p className="text-3xl font-bold text-white mt-1">{detectionResults.detections?.length || 0}</p>
                                </div>
                                <TrendingUp size={32} className="text-[#FF671F]" />
                            </div>
                        </div>

                        <div className="muni-card p-4 border-l-4 border-red-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold">Critical Issues</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {detectionResults.detections?.filter(d => d.severity === 'Critical').length || 0}
                                    </p>
                                </div>
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                        </div>

                        <div className="muni-card p-4 border-l-4 border-[#046A38]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold">Avg Confidence</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {detectionResults.detections?.length > 0
                                            ? Math.round((detectionResults.detections.reduce((acc, d) => acc + (d.confidence || 0), 0) / detectionResults.detections.length) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                <CheckCircle size={32} className="text-[#046A38]" />
                            </div>
                        </div>

                        <div className="muni-card p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold">GPS Points</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {detectionResults.gps_points_extracted || 0}
                                    </p>
                                </div>
                                <MapPin size={32} className="text-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Processed Video Player & Controls */}
                    {(detectionResults.video_url || detectionResults.processed_video_url) && (
                        <div className="muni-card p-6 bg-[#046A38]/10 border border-[#046A38]/30">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#046A38]/20 flex items-center justify-center">
                                        <CheckCircle size={24} className="text-[#046A38]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Processed Video with AI Detections</h4>
                                        <p className="text-xs text-[var(--muni-text-muted)]">Video shows bounding boxes for all detected potholes</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowVideo(!showVideo)}
                                        className="muni-btn-primary !bg-[#046A38] hover:!bg-[#058445] px-6 py-2 flex items-center gap-2 text-sm"
                                    >
                                        <Play size={16} />
                                        {showVideo ? 'Hide Video' : 'Show Video'}
                                    </button>
                                    <a
                                        href={detectionResults.processed_video_url || detectionResults.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="muni-btn-primary !bg-[#FF671F] hover:!bg-[#FF8533] px-6 py-2 flex items-center gap-2 text-sm"
                                    >
                                        <TrendingUp size={16} />
                                        Download
                                    </a>
                                </div>
                            </div>

                            {showVideo && (
                                <div className="mt-4 rounded-lg overflow-hidden bg-black">
                                    <video
                                        src={detectionResults.processed_video_url || detectionResults.video_url}
                                        controls
                                        className="w-full h-auto max-h-[600px]"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filters & Map Toggle */}
                    <div className="muni-card p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Filter size={20} className="text-[#FF671F]" />
                                Filters & Views
                            </h3>
                            <button
                                onClick={() => setShowMap(!showMap)}
                                className="muni-btn-primary px-6 py-2 flex items-center gap-2 text-sm"
                            >
                                <MapPin size={16} />
                                {showMap ? 'Hide Map' : 'Show Map View'}
                            </button>
                        </div>

                        {/* Filter Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Severity Filter */}
                            <div>
                                <label className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold mb-2 block">
                                    Severity
                                </label>
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF671F]"
                                >
                                    <option value="all">All Severities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            {/* Confidence Filter */}
                            <div>
                                <label className="text-xs text-[var(--muni-text-muted)] uppercase tracking-wider font-bold mb-2 block">
                                    Confidence: {confidenceFilter[0]}% - {confidenceFilter[1]}%
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={confidenceFilter[0]}
                                        onChange={(e) => setConfidenceFilter([parseInt(e.target.value), confidenceFilter[1]])}
                                        className="flex-1"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={confidenceFilter[1]}
                                        onChange={(e) => setConfidenceFilter([confidenceFilter[0], parseInt(e.target.value)])}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSeverityFilter('all');
                                        setConfidenceFilter([0, 100]);
                                    }}
                                    className="w-full muni-btn-primary !bg-white/10 hover:!bg-white/20 px-4 py-2 text-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Map View */}
                        {showMap && detectionResults.detections && (
                            <div className="mt-4 h-[500px] rounded-lg overflow-hidden border border-white/10">
                                <DashboardMap
                                    issues={detectionResults.detections.map(d => ({
                                        id: d.detection_id || d.id,
                                        lat: d.location?.latitude || d.location?.lat,
                                        lng: d.location?.longitude || d.location?.lng,
                                        severity: d.severity,
                                        desc: `Confidence: ${Math.round((d.confidence || 0) * 100)}% | Depth: ${d.depth_cm || 'N/A'}cm | Size: ${d.size_category || 'N/A'}`,
                                        imageUrl: d.thumbnail_url || d.frame_url || d.imageUrl || detectionResults.video_thumbnail_url,
                                        ts: { toDate: () => new Date(d.created_at) }
                                    })).filter(d => d.lat && d.lng)}
                                    isLightMode={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* Detection List */}
                    <div className="muni-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-[#FF671F]" />
                            Detection Timeline ({detectionResults.detections?.filter(d => {
                                const severityMatch = severityFilter === 'all' || d.severity_level === severityFilter || d.severity?.toLowerCase() === severityFilter;
                                const confidenceMatch = (d.confidence || 0) * 100 >= confidenceFilter[0] && (d.confidence || 0) * 100 <= confidenceFilter[1];
                                return severityMatch && confidenceMatch;
                            }).length || 0} shown)
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {detectionResults.detections?.filter(d => {
                                const severityMatch = severityFilter === 'all' || d.severity_level === severityFilter || d.severity?.toLowerCase() === severityFilter;
                                const confidenceMatch = (d.confidence || 0) * 100 >= confidenceFilter[0] && (d.confidence || 0) * 100 <= confidenceFilter[1];
                                return severityMatch && confidenceMatch;
                            }).map((detection, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#FF671F]/30 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-mono text-[var(--muni-text-muted)]">#{index + 1}</span>
                                                <span
                                                    className="text-xs font-bold px-2 py-1 rounded"
                                                    style={{
                                                        color: getSeverityColor(detection.severity),
                                                        backgroundColor: `${getSeverityColor(detection.severity)}15`,
                                                        border: `1px solid ${getSeverityColor(detection.severity)}30`
                                                    }}
                                                >
                                                    {detection.severity}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-[var(--muni-text-muted)]">
                                                    <Clock size={12} />
                                                    {detection.timestamp}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Confidence:</span>
                                                    <span className="text-white font-bold ml-2">{Math.round((detection.confidence || 0) * 100)}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Size:</span>
                                                    <span className="text-white font-bold ml-2 capitalize">{detection.size_category || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Depth:</span>
                                                    <span className="text-white font-bold ml-2">
                                                        {detection.depth_cm ? `${detection.depth_cm}cm` : 'N/A'}
                                                        <span className="text-[var(--muni-text-muted)] ml-1">({detection.depth || 'N/A'})</span>
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Area:</span>
                                                    <span className="text-white font-bold ml-2">
                                                        {detection.bbox_area ? Math.round(detection.bbox_area / 10).toLocaleString() : 'N/A'} cm²
                                                    </span>
                                                </div>
                                            </div>
                                            {detection.location && (detection.location.latitude || detection.location.lat) && (
                                                <div className="mt-2 pt-2 border-t border-white/10">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--muni-text-muted)] mb-1">
                                                        <MapPin size={12} />
                                                        <span className="font-semibold">GPS Location:</span>
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <div>
                                                            <span className="text-[var(--muni-text-muted)]">Coordinates:</span>
                                                            <span className="text-white font-mono ml-2">
                                                                {(detection.location.latitude || detection.location.lat || 0).toFixed(6)}, {(detection.location.longitude || detection.location.lng || 0).toFixed(6)}
                                                            </span>
                                                        </div>
                                                        {detection.location.address && (
                                                            <div>
                                                                <span className="text-[var(--muni-text-muted)]">Address:</span>
                                                                <span className="text-white ml-2">{detection.location.address}</span>
                                                            </div>
                                                        )}
                                                        {detection.location.speed && (
                                                            <div>
                                                                <span className="text-[var(--muni-text-muted)]">Speed:</span>
                                                                <span className="text-white ml-2">{Math.round(detection.location.speed)} km/h</span>
                                                            </div>
                                                        )}
                                                        {detection.priority_score !== undefined && (
                                                            <div>
                                                                <span className="text-[var(--muni-text-muted)]">Priority Score:</span>
                                                                <span className="text-white font-bold ml-2">{detection.priority_score}/100</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {detection.road_info && (
                                                <div className="mt-2 pt-2 border-t border-white/10">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--muni-text-muted)] mb-1">
                                                        <MapPin size={12} />
                                                        <span className="font-semibold">Kurnool Road & Department:</span>
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <div>
                                                            <span className="text-[var(--muni-text-muted)]">Road:</span>
                                                            <span className="text-white ml-2 font-semibold">{detection.road_info.road_name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[var(--muni-text-muted)]">Department:</span>
                                                            <span
                                                                className="text-white font-bold ml-2"
                                                                style={{ color: getDepartmentColor(detection.road_info.department) }}
                                                            >
                                                                {detection.road_info.department}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[var(--muni-text-muted)]">Repair Priority:</span>
                                                            <span className="text-white ml-2">{detection.road_info.repair_priority}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[var(--muni-text-muted)]">Response Time:</span>
                                                            <span className="text-white ml-2">{detection.road_info.response_time}</span>
                                                        </div>
                                                        {detection.road_info.distance_to_road && (
                                                            <div>
                                                                <span className="text-[var(--muni-text-muted)]">Distance to Road:</span>
                                                                <span className="text-white ml-2">{detection.road_info.distance_to_road}m</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {detection.should_auto_submit && (
                                                <div className="mt-2">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                                        🚨 Auto-submit to PGRS
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!detectionResults && !isProcessing && (
                <div className="muni-card p-6 bg-white/5">
                    <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Processing Pipeline</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#FF671F] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">1</div>
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-white">Upload to Cloudinary</p>
                                <p className="text-xs text-[var(--muni-text-muted)]">Video stored securely in the cloud</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#FF671F] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">2</div>
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-white">Stream & Process</p>
                                <p className="text-xs text-[var(--muni-text-muted)]">Railway backend analyzes 1 frame/second</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#FF671F] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">3</div>
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-white">Roboflow Detection</p>
                                <p className="text-xs text-[var(--muni-text-muted)]">AI identifies potholes with confidence scores</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#046A38] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">4</div>
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-white">Auto-Update Dashboard</p>
                                <p className="text-xs text-[var(--muni-text-muted)]">Map markers and leaderboard refresh instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
