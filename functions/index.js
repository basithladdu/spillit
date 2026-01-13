const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const ROBOFLOW_API_KEY = "peobcjxq03y2V330WICG";
const ROBOFLOW_MODEL_ENDPOINT = "https://detect.roboflow.com/pothole-voxrl/1";

/**
 * Auto-detect potholes when a new issue is reported with type "Pothole"
 */
exports.onIssueReported = functions.firestore
    .document("issues/{issueId}")
    .onCreate(async (snap, context) => {
        const newValue = snap.data();
        const issueId = context.params.issueId;

        console.log(`Processing new issue: ${issueId}`);

        try {
            // 1. Basic Validation
            if (!newValue.lat || !newValue.lng || !newValue.imageUrl) {
                console.warn(`Issue ${issueId} missing critical data.`);
                return snap.ref.update({
                    status: "rejected",
                    rejectionReason: "Missing location or image"
                });
            }

            // 2. Auto-detect potholes if type is "Pothole"
            if (newValue.type === "Pothole" && newValue.imageUrl) {
                console.log(`Auto-detecting potholes for issue ${issueId}`);
                await detectAndSavePotholes(newValue, issueId);
            }

            // 3. Mark as Processed
            await snap.ref.update({
                status: "received",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                priorityScore: calculatePriority(newValue),
                tags: ["new-report"]
            });

            console.log(`Issue ${issueId} processed successfully.`);

        } catch (error) {
            console.error(`Error processing issue ${issueId}:`, error);
        }
    });

/**
 * Detect potholes using Roboflow and save individual detections
 */
async function detectAndSavePotholes(issueData, issueId) {
    try {
        // Download image and convert to base64
        const imageResponse = await axios.get(issueData.imageUrl, {
            responseType: 'arraybuffer'
        });
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

        // Call Roboflow API
        const response = await axios.post(
            `${ROBOFLOW_MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`,
            base64Image,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const predictions = response.data.predictions || [];
        console.log(`Detected ${predictions.length} potholes in issue ${issueId}`);

        if (predictions.length === 0) {
            console.log(`No potholes detected in issue ${issueId}`);
            await admin.firestore().collection('issues').doc(issueId).update({
                aiProcessed: true,
                potholeDetectionCount: 0,
                autoDetected: true
            });
            return;
        }

        // Generate annotated image using Canvas
        const { createCanvas, loadImage } = require('canvas');
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const img = await loadImage(imageBuffer);

        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw bounding boxes
        predictions.forEach(pred => {
            const x = pred.x - (pred.width / 2);
            const y = pred.y - (pred.height / 2);

            // Box
            ctx.strokeStyle = '#FF3D00';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, pred.width, pred.height);

            // Label background
            ctx.fillStyle = '#FF3D00';
            const text = `${Math.round(pred.confidence * 100)}%`;
            ctx.font = 'bold 16px Arial';
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);

            // Label text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text, x + 5, y - 5);
        });

        const annotatedBuffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
        const annotatedBase64 = annotatedBuffer.toString('base64');

        // Upload both images to Cloudinary only
        const FormData = require('form-data');

        // Upload original to Cloudinary
        const formDataOriginal = new FormData();
        formDataOriginal.append('file', `data:image/jpeg;base64,${base64Image}`);
        formDataOriginal.append('upload_preset', 'fixit_unsigned');

        const cloudinaryOriginalRes = await axios.post(
            'https://api.cloudinary.com/v1_1/fixit/upload',
            formDataOriginal,
            { headers: formDataOriginal.getHeaders() }
        );
        const cloudinaryOriginalUrl = cloudinaryOriginalRes.data.secure_url;

        // Upload annotated to Cloudinary
        const formDataAnnotated = new FormData();
        formDataAnnotated.append('file', `data:image/jpeg;base64,${annotatedBase64}`);
        formDataAnnotated.append('upload_preset', 'fixit_unsigned');

        const cloudinaryAnnotatedRes = await axios.post(
            'https://api.cloudinary.com/v1_1/fixit/upload',
            formDataAnnotated,
            { headers: formDataAnnotated.getHeaders() }
        );
        const cloudinaryAnnotatedUrl = cloudinaryAnnotatedRes.data.secure_url;

        console.log('Images uploaded to Cloudinary successfully');

        // Create parent report
        const db = admin.firestore();
        const roadName = extractRoadName(issueData.desc || issueData.address) || issueData.address || 'Unknown Road';
        const department = classifyRoadDepartment(roadName);

        const reportRef = await db.collection('pothole_reports').add({
            roadName,
            department,
            originalImageUrl: cloudinaryOriginalUrl,
            annotatedImageUrl: cloudinaryAnnotatedUrl,
            totalDetections: predictions.length,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            location: {
                lat: issueData.lat,
                lng: issueData.lng
            },
            address: issueData.address || '',
            reportedBy: issueData.userId || 'guest',
            sourceIssueId: issueId,
            // Store complete Roboflow API response
            roboflowResponse: {
                predictions: predictions,
                image: response.data.image || {}
            }
        });

        // Save each detection as a separate record
        const batch = db.batch();

        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const depth = classifyDepth(pred.width, pred.height, pred.confidence);
            const severity = getSeverityFromDepth(depth);

            const detectionRef = db.collection('pothole_detections').doc();
            batch.set(detectionRef, {
                // Detection data
                severity,
                depth,
                confidence: pred.confidence,
                class: pred.class,
                width: pred.width,
                height: pred.height,
                x: pred.x,
                y: pred.y,

                // Status tracking
                status: 'PENDING',
                department,
                assignedTo: null,

                // Source information
                sourceIssueId: issueId,
                reportId: reportRef.id,
                detectionIndex: i,
                roadName,

                // Images (both Firebase Storage and Cloudinary)
                originalImageUrl: cloudinaryOriginalUrl,
                annotatedImageUrl: cloudinaryAnnotatedUrl,

                // Location
                location: {
                    lat: issueData.lat,
                    lng: issueData.lng
                },
                address: issueData.address || '',

                // Metadata
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                reportedBy: issueData.userId || 'guest'
            });
        }

        await batch.commit();
        console.log(`Saved ${predictions.length} pothole detections for issue ${issueId}`);

        // Update original issue with detection count
        await db.collection('issues').doc(issueId).update({
            potholeDetectionCount: predictions.length,
            autoDetected: true,
            aiProcessed: true
        });

    } catch (error) {
        console.error('Error in auto-detection:', error);
        // Mark as processed even if failed
        await admin.firestore().collection('issues').doc(issueId).update({
            aiProcessed: true,
            aiProcessingError: error.message
        });
        throw error;
    }
}

/**
 * Classify pothole depth
 */
function classifyDepth(width, height, confidence) {
    const avgSize = (width + height) / 2;
    if (avgSize < 50 || confidence < 0.6) return 'SHALLOW';
    if (avgSize < 100) return 'MEDIUM';
    return 'DEEP';
}

/**
 * Get severity from depth
 */
function getSeverityFromDepth(depth) {
    switch (depth) {
        case 'DEEP': return 'Critical';
        case 'MEDIUM': return 'High';
        case 'SHALLOW': return 'Medium';
        default: return 'Low';
    }
}

/**
 * Classify road department
 */
function classifyRoadDepartment(description) {
    const desc = (description || '').toLowerCase();
    if (desc.includes('nh-') || desc.includes('national highway')) return 'NHAI';
    if (desc.includes('sh-') || desc.includes('state highway')) return 'RNB';
    if (desc.includes('village') || desc.includes('gram') || desc.includes('rural')) return 'GPRN';
    if (desc.includes('street') || desc.includes('road') || desc.includes('city')) return 'MUNICIPAL';
    return 'RNB';
}

/**
 * Extract road name from description
 */
function extractRoadName(description) {
    const desc = description || '';
    const roadPatterns = [
        /NH-\d+/i,
        /SH-\d+/i,
        /National Highway \d+/i,
        /State Highway \d+/i
    ];

    for (const pattern of roadPatterns) {
        const match = desc.match(pattern);
        if (match) return match[0];
    }

    return null;
}

/**
 * Calculate priority score
 */
function calculatePriority(data) {
    let score = 1;
    if (data.severity === 'Critical') score += 5;
    if (data.severity === 'High') score += 3;
    if (data.severity === 'Medium') score += 1;

    const keywords = ['danger', 'accident', 'fire', 'blocked'];
    if (data.desc && keywords.some(k => data.desc.toLowerCase().includes(k))) {
        score += 2;
    }
    return score;
}

/**
 * Municipal Admin Registration
 */
exports.registerMunicipalAdmin = functions.https.onCall(async (data, context) => {
    const required = ['organisation_name', 'official_email', 'admin_full_name', 'designation', 'office_phone', 'mobile_phone', 'office_address'];
    for (const field of required) {
        if (!data[field]) {
            throw new functions.https.HttpsError('invalid-argument', `Missing field: ${field}`);
        }
    }

    try {
        const docRef = admin.firestore().collection('municipal_registrations').doc();
        await docRef.set({
            ...data,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: context.rawRequest ? context.rawRequest.headers['user-agent'] : 'unknown'
        });

        return { success: true, message: 'Registration submitted successfully', id: docRef.id };
    } catch (error) {
        console.error("Registration Error:", error);
        throw new functions.https.HttpsError('internal', 'Database error during registration.');
    }
});

