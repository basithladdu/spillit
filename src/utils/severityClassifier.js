/**
 * Severity Classification Engine
 * Implements automated severity grading for pothole detections
 * Based on bounding box area, confidence, and context features
 */

/**
 * Classify pothole severity based on multiple factors
 * 
 * @param {number} bboxArea - Bounding box area in pixels²
 * @param {number} confidence - Detection confidence (0-1)
 * @param {Object} contextFeatures - Additional context (optional)
 * @returns {string} Severity level: 'low', 'medium', 'high', 'critical'
 */
export function classifySeverity(bboxArea, confidence, contextFeatures = {}) {
    // Normalize area (assuming 640x640 frame)
    const frameArea = 640 * 640;
    const normalizedArea = bboxArea / frameArea;
    
    // Base severity from area and confidence
    let severity = 'low';
    
    // Critical: Large area + high confidence
    if (normalizedArea > 0.15 && confidence > 0.7) {
        severity = 'critical';
    }
    // High: Medium-large area OR very high confidence
    else if (normalizedArea > 0.08 || confidence > 0.8) {
        severity = 'high';
    }
    // Medium: Small-medium area
    else if (normalizedArea > 0.03) {
        severity = 'medium';
    }
    // Low: Small area
    else {
        severity = 'low';
    }
    
    // Adjust based on context features
    if (contextFeatures.clusterCount && contextFeatures.clusterCount > 3) {
        // Multiple potholes in cluster -> upgrade severity
        if (severity === 'medium') severity = 'high';
        if (severity === 'high') severity = 'critical';
    }
    
    if (contextFeatures.locationType === 'highway') {
        // Highway potholes are more dangerous
        if (severity === 'medium') severity = 'high';
    }
    
    return severity;
}

/**
 * Calculate priority score for pothole
 * Used for ranking and auto-submission to PGRS
 * 
 * @param {string} severity - Severity level
 * @param {Object} factors - Priority factors
 * @returns {number} Priority score (0-100)
 */
export function calculatePriorityScore(severity, factors = {}) {
    // Severity weight (0-50 points)
    const severityWeights = {
        'critical': 50,
        'high': 35,
        'medium': 20,
        'low': 10
    };
    
    let score = severityWeights[severity] || 10;
    
    // Traffic density factor (0-30 points)
    const trafficDensity = factors.trafficDensity || 0.5;
    score += trafficDensity * 30;
    
    // Last repair age factor (0-20 points)
    // Older repairs = higher priority
    const lastRepairAge = factors.lastRepairAge || 0; // days since last repair
    score += Math.min(lastRepairAge / 365 * 20, 20);
    
    return Math.min(Math.round(score), 100);
}

/**
 * Determine if detection should be auto-submitted to PGRS
 * 
 * @param {string} severity - Severity level
 * @param {number} priorityScore - Priority score
 * @returns {boolean} True if should auto-submit
 */
export function shouldAutoSubmitToPGRS(severity, priorityScore) {
    // Auto-submit critical and high severity
    if (severity === 'critical' || severity === 'high') {
        return true;
    }
    
    // Auto-submit medium with high priority score
    if (severity === 'medium' && priorityScore >= 60) {
        return true;
    }
    
    return false;
}

/**
 * Format severity for display
 * 
 * @param {string} severity - Severity level
 * @returns {string} Formatted severity (capitalized)
 */
export function formatSeverity(severity) {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
}

