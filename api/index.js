/**
 * Index API - Health check and endpoint listing.
 *
 * GET /api
 */

const { successResponse, generateRequestId } = require('./_utils');

module.exports = async (req, res) => {
    const requestId = generateRequestId('index');

    const response = successResponse({
        name: 'Demo API Endpoints',
        version: '1.0.0',
        description: 'Free hosted API endpoints for Salesforce UoW framework demos',
        health: 'OK',
        endpoints: {
            fsc: {
                description: 'Financial Services Cloud demo endpoints',
                endpoints: [
                    { path: '/api/fsc/credit-bureau', method: 'POST', description: 'Credit score lookup' },
                    { path: '/api/fsc/fraud-detection', method: 'POST', description: 'Fraud screening' },
                    { path: '/api/fsc/property-valuation', method: 'GET', description: 'AVM property valuation' },
                    { path: '/api/fsc/income-verification', method: 'POST', description: 'Payroll verification' },
                    { path: '/api/fsc/ofac-check', method: 'POST', description: 'Sanctions screening' }
                ]
            },
            utility: {
                description: 'Generic testing utilities',
                endpoints: [
                    { path: '/api/echo', method: 'ANY', description: 'Echo request details' },
                    { path: '/api/delay', method: 'GET', description: 'Delayed response (?ms=1000)' },
                    { path: '/api/status', method: 'GET', description: 'Return specific HTTP status (?code=404)' },
                    { path: '/api/random-fail', method: 'GET', description: 'Random failures (?rate=0.3)' }
                ]
            }
        },
        documentation: 'See README.md for full documentation',
        scenarioParam: 'All FSC endpoints support ?scenario= parameter: success, fail, timeout, and endpoint-specific scenarios'
    }, requestId);

    res.status(200).json(response);
};
