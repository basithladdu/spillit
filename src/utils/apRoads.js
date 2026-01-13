// Andhra Pradesh Road Departments Classification

export const AP_DEPARTMENTS = {
    RNB: {
        name: 'Roads & Buildings (R&B)',
        code: 'RNB',
        description: 'State Highways and Major District Roads',
        color: '#FF9800'
    },
    GPRN: {
        name: 'Gram Panchayat Rural Roads (GPRN)',
        code: 'GPRN',
        description: 'Village and Rural Roads',
        color: '#8BC34A'
    },
    NHAI: {
        name: 'National Highways Authority of India (NHAI)',
        code: 'NHAI',
        description: 'National Highways',
        color: '#2196F3'
    },
    MUNICIPAL: {
        name: 'Municipal Corporation',
        code: 'MUNICIPAL',
        description: 'Urban Roads and City Streets',
        color: '#9C27B0'
    },
    PWD: {
        name: 'Public Works Department (PWD)',
        code: 'PWD',
        description: 'Government Buildings and Infrastructure',
        color: '#607D8B'
    }
};

/**
 * Classify road department based on road name
 * @param {string} roadName - Name of the road
 * @returns {string} - Department code
 */
export const classifyRoadDepartment = (roadName) => {
    if (!roadName) return 'RNB';

    const name = roadName.toLowerCase();

    // National Highways
    if (name.includes('nh-') || name.includes('national highway')) {
        return 'NHAI';
    }

    // State Highways
    if (name.includes('sh-') || name.includes('state highway')) {
        return 'RNB';
    }

    // Village/Rural Roads
    if (name.includes('village') || name.includes('gram') || name.includes('rural') || name.includes('panchayat')) {
        return 'GPRN';
    }

    // Urban/City Roads
    if (name.includes('street') || name.includes('road') || name.includes('avenue') || name.includes('city')) {
        return 'MUNICIPAL';
    }

    // Default to R&B
    return 'RNB';
};

/**
 * Classify pothole depth based on dimensions and confidence
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {number} confidence - Detection confidence (0-1)
 * @returns {string} - Depth classification
 */
export const classifyDepth = (width, height, confidence) => {
    const avgSize = (width + height) / 2;

    if (avgSize < 50 || confidence < 0.6) {
        return 'SHALLOW';
    } else if (avgSize < 100) {
        return 'MEDIUM';
    } else {
        return 'DEEP';
    }
};

/**
 * Get severity based on depth
 * @param {string} depth - SHALLOW, MEDIUM, or DEEP
 * @returns {string} - Severity level
 */
export const getSeverityFromDepth = (depth) => {
    switch (depth) {
        case 'DEEP':
            return 'Critical';
        case 'MEDIUM':
            return 'High';
        case 'SHALLOW':
            return 'Medium';
        default:
            return 'Low';
    }
};

export const DEPTH_COLORS = {
    SHALLOW: '#4CAF50',
    MEDIUM: '#FF9800',
    DEEP: '#FF3D00',
    UNKNOWN: '#9E9E9E'
};
