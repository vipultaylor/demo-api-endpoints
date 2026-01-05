/**
 * Delay API - Returns response after specified delay.
 * Useful for testing timeout handling.
 *
 * GET /api/delay?ms=1000
 *
 * Query Parameters:
 * - ms: Delay in milliseconds (default: 1000, max: 30000)
 */

const { successResponse, handleCors, delay, generateRequestId } = require('./_utils');

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('delay');
    const startTime = Date.now();

    // Parse delay from query params (default 1000ms, max 30000ms)
    let delayMs = parseInt(req.query?.ms) || 1000;
    delayMs = Math.min(delayMs, 30000); // Cap at 30 seconds
    delayMs = Math.max(delayMs, 0); // No negative delays

    await delay(delayMs);

    const actualDelay = Date.now() - startTime;

    res.status(200).json(successResponse({
        requestedDelay: delayMs,
        actualDelay,
        message: `Response delayed by ${actualDelay}ms`
    }, requestId));
};
