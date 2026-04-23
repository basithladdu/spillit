/**
 * Memory Processor Configuration
 *
 * All sensitive values are loaded from environment variables.
 * See .env.example for required configuration.
 */

export const VIDEO_PROCESSOR_CONFIG = {
    // Cloudinary Configuration
    cloudinary: {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'spillit',
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'spillit_unsigned',
    },

    // Backend Configuration
    backend: {
        baseUrl: import.meta.env.VITE_VIDEO_PROCESSOR_BASE_URL || 'https://api.spillit.app',
        apiKey: import.meta.env.VITE_VIDEO_PROCESSOR_API_KEY || '77-spill-it-77',
    },

    // Processing Configuration
    processing: {
        maxFileSize: 100000000,              // 100MB
        allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'gif'],
        confidenceThreshold: 0.5,
    }
};

/**
 * QUICK SETUP CHECKLIST:
 * 
 * □ Step 1: Create Cloudinary account at cloudinary.com
 * □ Step 2: Get Cloud Name from Cloudinary Dashboard
 * □ Step 3: Create upload preset named 'spillit_memories' (unsigned mode)
 * □ Step 4: Deploy vibe processor backend
 * □ Step 5: Update backend.baseUrl above
 * □ Step 6: Test the health endpoint
 * □ Step 7: Upload a test file through the studio
 */
