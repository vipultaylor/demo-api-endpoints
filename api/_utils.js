/**
 * Shared utilities for demo API endpoints.
 */

/**
 * Generate a unique request ID.
 */
function generateRequestId(prefix = 'req') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a standard success response.
 */
function successResponse(data, requestId) {
    return {
        status: 'SUCCESS',
        requestId: requestId || generateRequestId(),
        timestamp: new Date().toISOString(),
        data
    };
}

/**
 * Create a standard error response.
 */
function errorResponse(code, message, requestId) {
    return {
        status: 'ERROR',
        requestId: requestId || generateRequestId(),
        timestamp: new Date().toISOString(),
        error: {
            code,
            message
        }
    };
}

/**
 * Handle CORS preflight requests.
 */
function handleCors(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

/**
 * Parse scenario from query params with default.
 */
function getScenario(req, defaultScenario = 'success') {
    return req.query?.scenario?.toLowerCase() || defaultScenario;
}

/**
 * Simulate delay (for timeout scenarios).
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random number in range.
 */
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random item from array.
 */
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
    generateRequestId,
    successResponse,
    errorResponse,
    handleCors,
    getScenario,
    delay,
    randomInRange,
    randomItem
};
