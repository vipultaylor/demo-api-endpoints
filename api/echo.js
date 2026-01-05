/**
 * Echo API - Returns request details back to caller.
 * Useful for debugging and testing.
 *
 * ANY /api/echo
 */

const { handleCors, generateRequestId } = require('./_utils');

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('echo');

    // Parse body if present
    let body = null;
    if (req.body) {
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            body = req.body;
        }
    }

    const response = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
    };

    res.status(200).json(response);
};
