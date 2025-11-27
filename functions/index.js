const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered when a new issue is reported.
 * Performs validation and initial processing.
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

            // 2. Geo-Fencing (Placeholder)
            // Example: Check if within supported city limits
            // const isInsideCity = checkPointInPolygon(newValue.lat, newValue.lng, cityPolygon);
            // if (!isInsideCity) ...

            // 3. Mark as Processed & Ready for Review
            // We can also trigger AI analysis here in the future
            await snap.ref.update({
                status: "received",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                priorityScore: calculatePriority(newValue), // Simple heuristic
                tags: ["new-report"]
            });

            console.log(`Issue ${issueId} processed successfully.`);

        } catch (error) {
            console.error(`Error processing issue ${issueId}:`, error);
        }
    });

/**
 * Simple heuristic to calculate initial priority
 */
function calculatePriority(data) {
    let score = 1;
    if (data.severity === 'Critical') score += 5;
    if (data.severity === 'High') score += 3;
    if (data.severity === 'Medium') score += 1;

    // Boost if description contains keywords
    const keywords = ['danger', 'accident', 'fire', 'blocked'];
    if (data.desc && keywords.some(k => data.desc.toLowerCase().includes(k))) {
        score += 2;
    }
    return score;
}
