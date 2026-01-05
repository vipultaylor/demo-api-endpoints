/**
 * Income Verification API - Simulates payroll/income verification.
 *
 * POST /api/fsc/income-verification
 *
 * Request Body (optional):
 * - employerName: Employer name
 * - statedIncome: Applicant's stated annual income
 *
 * Scenarios:
 * - success (default): Income verified, matches stated
 * - higher: Verified income higher than stated
 * - lower: Verified income lower than stated (mismatch)
 * - mismatch: Significant discrepancy in income
 * - unverifiable: Cannot verify employment/income
 * - fail: Returns API error
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, generateRequestId } = require('../_utils');

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('iv');
    const scenario = getScenario(req, 'success');

    // Parse request body
    let body = {};
    if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const statedIncome = body.statedIncome || 120000;
    const employerName = body.employerName || 'Acme Corporation';

    try {
        // Handle timeout scenario
        if (scenario === 'timeout') {
            await delay(10000);
        }

        // Handle failure scenario
        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'VERIFICATION_SERVICE_UNAVAILABLE',
                'Income verification service is temporarily unavailable.',
                requestId
            ));
            return;
        }

        // Handle unverifiable scenario
        if (scenario === 'unverifiable') {
            res.status(200).json(successResponse({
                verified: false,
                verificationStatus: 'UNABLE_TO_VERIFY',
                reason: 'Employer not in verification network',
                recommendation: 'REQUEST_MANUAL_DOCUMENTATION',
                alternativeVerification: ['W2', 'Tax Returns', 'Bank Statements']
            }, requestId));
            return;
        }

        let verifiedIncome, employmentVerified, incomeMatch, variance;

        switch (scenario) {
            case 'success':
                // Income matches stated (+/- 5%)
                variance = randomInRange(-5, 5) / 100;
                verifiedIncome = Math.round(statedIncome * (1 + variance));
                employmentVerified = true;
                incomeMatch = 'MATCHES';
                break;

            case 'higher':
                // Verified income 10-25% higher
                variance = randomInRange(10, 25) / 100;
                verifiedIncome = Math.round(statedIncome * (1 + variance));
                employmentVerified = true;
                incomeMatch = 'HIGHER_THAN_STATED';
                break;

            case 'lower':
                // Verified income 10-20% lower
                variance = randomInRange(10, 20) / 100;
                verifiedIncome = Math.round(statedIncome * (1 - variance));
                employmentVerified = true;
                incomeMatch = 'LOWER_THAN_STATED';
                break;

            case 'mismatch':
                // Significant discrepancy (30-50% different)
                variance = randomInRange(30, 50) / 100;
                verifiedIncome = Math.round(statedIncome * (1 - variance));
                employmentVerified = true;
                incomeMatch = 'SIGNIFICANT_DISCREPANCY';
                break;

            default:
                variance = randomInRange(-5, 5) / 100;
                verifiedIncome = Math.round(statedIncome * (1 + variance));
                employmentVerified = true;
                incomeMatch = 'MATCHES';
        }

        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - randomInRange(1, 10));

        const data = {
            verified: true,
            verificationStatus: 'VERIFIED',
            employmentVerified,
            incomeVerified: true,
            statedIncome,
            verifiedIncome,
            incomeMatch,
            variancePercent: Math.round(((verifiedIncome - statedIncome) / statedIncome) * 100),
            employmentDetails: {
                employerName,
                employerVerified: true,
                position: 'Senior Analyst',
                employmentStatus: 'ACTIVE',
                employmentType: 'FULL_TIME',
                startDate: startDate.toISOString().split('T')[0],
                payFrequency: 'BI_WEEKLY'
            },
            incomeBreakdown: {
                baseSalary: Math.round(verifiedIncome * 0.85),
                bonus: Math.round(verifiedIncome * 0.10),
                otherIncome: Math.round(verifiedIncome * 0.05)
            },
            lastPayDate: new Date(Date.now() - randomInRange(1, 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            ytdEarnings: Math.round((verifiedIncome / 12) * (new Date().getMonth() + 1))
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
