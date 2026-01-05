/**
 * Fraud Detection API - Simulates fraud screening.
 *
 * POST /api/fsc/fraud-detection
 *
 * Scenarios:
 * - success (default): No fraud detected, low risk
 * - medium: Medium fraud risk with some alerts
 * - high: High fraud risk with multiple alerts
 * - flagged: Identity flagged for manual review
 * - fail: Returns API error
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, generateRequestId, randomItem } = require('../_utils');

// Alert types for different scenarios
const ALERT_TYPES = {
    medium: [
        { code: 'ALT001', type: 'ADDRESS_MISMATCH', severity: 'MEDIUM', description: 'Address does not match recent records' },
        { code: 'ALT002', type: 'VELOCITY_CHECK', severity: 'LOW', description: 'Multiple applications in short period' }
    ],
    high: [
        { code: 'ALT003', type: 'IDENTITY_THEFT_INDICATOR', severity: 'HIGH', description: 'SSN associated with known fraud' },
        { code: 'ALT004', type: 'SYNTHETIC_IDENTITY', severity: 'HIGH', description: 'Identity elements inconsistent' },
        { code: 'ALT005', type: 'DEVICE_REPUTATION', severity: 'MEDIUM', description: 'Device associated with suspicious activity' }
    ],
    flagged: [
        { code: 'ALT006', type: 'OFAC_POTENTIAL_MATCH', severity: 'CRITICAL', description: 'Potential match to sanctions list' },
        { code: 'ALT007', type: 'PEP_INDICATOR', severity: 'HIGH', description: 'Politically exposed person indicator' }
    ]
};

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('fd');
    const scenario = getScenario(req, 'success');

    try {
        // Handle timeout scenario
        if (scenario === 'timeout') {
            await delay(10000);
        }

        // Handle failure scenario
        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'FRAUD_SERVICE_UNAVAILABLE',
                'Fraud detection service is temporarily unavailable.',
                requestId
            ));
            return;
        }

        let fraudRisk, riskScore, alerts, identityVerified, addressVerified, recommendation;

        switch (scenario) {
            case 'success':
                fraudRisk = 'LOW';
                riskScore = randomInRange(0, 25);
                alerts = [];
                identityVerified = true;
                addressVerified = true;
                recommendation = 'APPROVE';
                break;

            case 'medium':
                fraudRisk = 'MEDIUM';
                riskScore = randomInRange(40, 60);
                alerts = ALERT_TYPES.medium;
                identityVerified = true;
                addressVerified = false;
                recommendation = 'REVIEW';
                break;

            case 'high':
                fraudRisk = 'HIGH';
                riskScore = randomInRange(70, 90);
                alerts = ALERT_TYPES.high;
                identityVerified = false;
                addressVerified = false;
                recommendation = 'DENY';
                break;

            case 'flagged':
                fraudRisk = 'CRITICAL';
                riskScore = randomInRange(90, 100);
                alerts = ALERT_TYPES.flagged;
                identityVerified = false;
                addressVerified = false;
                recommendation = 'MANUAL_REVIEW_REQUIRED';
                break;

            default:
                fraudRisk = 'LOW';
                riskScore = randomInRange(0, 25);
                alerts = [];
                identityVerified = true;
                addressVerified = true;
                recommendation = 'APPROVE';
        }

        const data = {
            fraudRisk,
            riskScore,
            riskScoreRange: { min: 0, max: 100 },
            alerts,
            identityVerified,
            addressVerified,
            phoneVerified: fraudRisk === 'LOW',
            emailVerified: fraudRisk !== 'CRITICAL',
            recommendation,
            verificationDetails: {
                nameMatch: fraudRisk !== 'HIGH' && fraudRisk !== 'CRITICAL',
                dobMatch: fraudRisk !== 'CRITICAL',
                ssnMatch: fraudRisk === 'LOW' || fraudRisk === 'MEDIUM'
            }
        };

        res.status(200).json(successResponse(data, requestId));

    } catch (error) {
        res.status(500).json(errorResponse(
            'INTERNAL_ERROR',
            'An unexpected error occurred.',
            requestId
        ));
    }
};
