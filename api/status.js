/**
 * Status API - Returns specified HTTP status code.
 * Useful for testing error handling.
 *
 * GET /api/status?code=404
 *
 * Query Parameters:
 * - code: HTTP status code to return (default: 200)
 * - message: Custom message (optional)
 */

const { successResponse, errorResponse, handleCors, generateRequestId } = require('./_utils');

// Standard HTTP status messages
const STATUS_MESSAGES = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
};

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('status');

    // Parse status code from query params
    let statusCode = parseInt(req.query?.code) || 200;

    // Validate status code (100-599)
    if (statusCode < 100 || statusCode > 599) {
        statusCode = 200;
    }

    const customMessage = req.query?.message;
    const defaultMessage = STATUS_MESSAGES[statusCode] || 'Unknown Status';
    const message = customMessage || defaultMessage;

    // Success codes (2xx)
    if (statusCode >= 200 && statusCode < 300) {
        res.status(statusCode).json(successResponse({
            statusCode,
            message
        }, requestId));
        return;
    }

    // Error codes (4xx, 5xx)
    res.status(statusCode).json(errorResponse(
        `HTTP_${statusCode}`,
        message,
        requestId
    ));
};
