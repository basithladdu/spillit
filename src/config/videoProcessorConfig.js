/**
 * Memory Processor Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace the placeholder values below with your actual credentials
 * 2. This file is used to process high-res memories and visual artifacts
 */

export const VIDEO_PROCESSOR_CONFIG = {
    // Cloudinary Configuration
    cloudinary: {
        cloudName: 'spillit',                 // Your Spillit Cloudinary account
        uploadPreset: 'spillit_unsigned',     // Your Spillit upload preset
    },

    // Backend Configuration
    backend: {
        baseUrl: 'https://api.spillit.app',   // Your processing backend
        apiKey: '77-spill-it-77',
    },

    // Processing Configuration
    processing: {
        maxFileSize: 100000000,              // 100MB
        allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'gif'],
        confidenceThreshold: 0.5,            // Accuracy threshold for vibe detection
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
