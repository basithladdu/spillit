/**
 * Video Processor Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace the placeholder values below with your actual credentials
 * 2. This file is imported by DashcamVideoProcessor.jsx
 */

export const VIDEO_PROCESSOR_CONFIG = {
    // Cloudinary Configuration
    // Using your existing working preset
    cloudinary: {
        cloudName: 'fixit',                  // Your existing Cloudinary account
        uploadPreset: 'fixit_unsigned',      // Your existing working preset
    },

    // Railway Backend Configuration
    // Get this after deploying to Railway
    backend: {
        baseUrl: 'YOUR_RAILWAY_BACKEND_URL', // e.g., 'https://your-app.up.railway.app'
        apiKey: '4b8afa69-5426-44dd-b2af-3977e26d6b5f',
    },

    // Processing Configuration
    processing: {
        maxFileSize: 100000000,              // 100MB
        allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
        confidenceThreshold: 0.5,            // Minimum confidence for detections (0.0 - 1.0)
    }
};

/**
 * QUICK SETUP CHECKLIST:
 * 
 * □ Step 1: Create Cloudinary account at cloudinary.com
 * □ Step 2: Get Cloud Name from Cloudinary Dashboard
 * □ Step 3: Create upload preset named 'dashcam_videos' (unsigned mode)
 * □ Step 4: Deploy backend to Railway (see VIDEO_PROCESSOR_SETUP.md)
 * □ Step 5: Get Railway URL and update backend.baseUrl above
 * □ Step 6: Test the health endpoint: YOUR_RAILWAY_URL/api/health
 * □ Step 7: Upload a test video through the dashboard
 * 
 * For detailed instructions, see: VIDEO_PROCESSOR_SETUP.md
 */
