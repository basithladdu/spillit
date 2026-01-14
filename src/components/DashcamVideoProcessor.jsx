import { useState, useEffect } from 'react';
import { Video, Upload, Loader2, AlertCircle, CheckCircle, MapPin, Clock, TrendingUp } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../utils/firebase';
import { VIDEO_PROCESSOR_CONFIG } from '../config/videoProcessorConfig';

// Toggle between demo mode and production mode
// Set to false when Railway backend is deployed
const USE_DEMO_MODE = false;  // Disabled for production - using live Render backend

export default function DashcamVideoProcessor() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [detectionResults, setDetectionResults] = useState(null);
    const [error, setError] = useState(null);
    const [cloudinaryWidget, setCloudinaryWidget] = useState(null);

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
            document.body.removeChild(script);
        };
    }, []);

    const handleVideoUploadSuccess = async (videoUrl) => {
        setIsProcessing(true);
        setProcessingStatus('Processing Road Footage...');
        setError(null);
        setDetectionResults(null);

        try {
            if (USE_DEMO_MODE) {
                // DEMO MODE: Mock data
                await new Promise(resolve => setTimeout(resolve, 3000));

                const mockDetections = [
                    {
                        timestamp: '00:15',
                        confidence: 0.87,
                        severity: 'Critical',
                        bbox_area: 15000,
                        bbox: { x: 120, y: 200, width: 150, height: 100 },
                        frame_number: 450
                    },
                    {
                        timestamp: '00:32',
                        confidence: 0.72,
                        severity: 'High',
                        bbox_area: 8500,
                        bbox: { x: 200, y: 180, width: 120, height: 70 },
                        frame_number: 960
                    },
                    {
                        timestamp: '00:48',
                        confidence: 0.65,
                        severity: 'Medium',
                        bbox_area: 4200,
                        bbox: { x: 180, y: 220, width: 80, height: 52 },
                        frame_number: 1440
                    },
                    {
                        timestamp: '01:05',
                        confidence: 0.91,
                        severity: 'Critical',
                        bbox_area: 18000,
                        bbox: { x: 150, y: 190, width: 180, height: 100 },
                        frame_number: 1950
                    },
                    {
                        timestamp: '01:22',
                        confidence: 0.58,
                        severity: 'Low',
                        bbox_area: 2800,
                        bbox: { x: 220, y: 240, width: 60, height: 46 },
                        frame_number: 2460
                    }
                ];

                const mockResponse = {
                    detections: mockDetections,
                    total_frames_processed: 82,
                    processing_time_seconds: 3.2,
                    video_duration_seconds: 82.0,
                    mode: 'DEMO_MODE'
                };

                setDetectionResults(mockResponse);
                setProcessingStatus('Processing Complete! (Demo Mode)');
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
    };

    const saveDetectionsToFirestore = async (detections, videoUrl) => {
        const db = getFirestore(app);

        for (const detection of detections) {
            try {
                // Create a new issue for each critical pothole detected
                if (detection.severity === 'Critical' || detection.severity === 'High') {
                    await addDoc(collection(db, 'issues'), {
                        type: 'Pothole',
                        severity: detection.severity.toLowerCase(),
                        status: 'new',
                        desc: `Auto-detected from dashcam footage at ${detection.timestamp}. Confidence: ${Math.round(detection.confidence * 100)}%`,
                        lat: detection.location?.lat || 0, // You'll need to add GPS data
                        lng: detection.location?.lng || 0,
                        address: detection.location?.address || 'Location from dashcam video',
                        imageUrl: detection.frame_url || videoUrl,
                        videoUrl: videoUrl,
                        ts: serverTimestamp(),
                        source: 'dashcam_ai',
                        aiConfidence: detection.confidence,
                        videoTimestamp: detection.timestamp
                    });
                }
            } catch (err) {
                console.error('Error saving detection:', err);
            }
        }
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
                        <div className="text-sm text-gray-300">
                            <p className="font-semibold text-white mb-1">How it works:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
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
                    className="w-full muni-btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            ? Math.round((detectionResults.detections.reduce((acc, d) => acc + d.confidence, 0) / detectionResults.detections.length) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                <CheckCircle size={32} className="text-[#046A38]" />
                            </div>
                        </div>
                    </div>

                    {/* Detection List */}
                    <div className="muni-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-[#FF671F]" />
                            Detection Timeline
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {detectionResults.detections?.map((detection, index) => (
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
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Confidence:</span>
                                                    <span className="text-white font-bold ml-2">{Math.round(detection.confidence * 100)}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--muni-text-muted)]">Size:</span>
                                                    <span className="text-white font-bold ml-2">{detection.bbox_area || 'N/A'}</span>
                                                </div>
                                            </div>
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
