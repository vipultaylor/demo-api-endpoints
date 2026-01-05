/**
 * Random Fail API - Randomly fails based on specified rate.
 * Useful for testing retry logic and error handling.
 *
 * GET /api/random-fail?rate=0.3
 *
 * Query Parameters:
 * - rate: Failure rate from 0.0 to 1.0 (default: 0.5 = 50% failure)
 */

const { successResponse, errorResponse, handleCors, generateRequestId, randomItem } = require('./_utils');

// Random error scenarios
const ERROR_SCENARIOS = [
    { code: 500, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    { code: 502, error: 'BAD_GATEWAY', message: 'Upstream server returned invalid response' },
    { code: 503, error: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
    { code: 504, error: 'GATEWAY_TIMEOUT', message: 'Upstream server timed out' },
    { code: 429, error: 'RATE_LIMITED', message: 'Too many requests, please slow down' }
];

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('rf');

    // Parse failure rate from query params (default 0.5 = 50%)
    let failureRate = parseFloat(req.query?.rate);
    if (isNaN(failureRate)) {
        failureRate = 0.5;
    }
    failureRate = Math.min(Math.max(failureRate, 0), 1); // Clamp to 0-1

    const shouldFail = Math.random() < failureRate;

    if (shouldFail) {
        const errorScenario = randomItem(ERROR_SCENARIOS);
        res.status(errorScenario.code).json(errorResponse(
            errorScenario.error,
            errorScenario.message,
            requestId
        ));
        return;
    }

    res.status(200).json(successResponse({
        failureRate,
        message: 'Request succeeded',
        tip: `With rate=${failureRate}, approximately ${Math.round(failureRate * 100)}% of requests will fail`
    }, requestId));
};
