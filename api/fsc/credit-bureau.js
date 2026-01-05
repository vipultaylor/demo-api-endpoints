/**
 * Credit Bureau API - Simulates credit score lookup.
 *
 * POST /api/fsc/credit-bureau
 *
 * Scenarios:
 * - success (default): Returns good credit score (700-780)
 * - excellent: Returns excellent credit (780-850)
 * - good: Returns good credit (700-759)
 * - fair: Returns fair credit (640-699)
 * - low: Returns low credit score (580-639)
 * - poor: Returns poor credit score (300-579)
 * - fail: Returns API error
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, generateRequestId } = require('../_utils');

// Credit score factors by scenario
const FACTORS_BY_SCENARIO = {
    excellent: [
        { code: 'F01', description: 'Excellent payment history', impact: 'POSITIVE' },
        { code: 'F02', description: 'Low credit utilization', impact: 'POSITIVE' },
        { code: 'F03', description: 'Long credit history', impact: 'POSITIVE' },
        { code: 'F04', description: 'Diverse credit mix', impact: 'POSITIVE' }
    ],
    good: [
        { code: 'F01', description: 'Good payment history', impact: 'POSITIVE' },
        { code: 'F02', description: 'Moderate credit utilization', impact: 'NEUTRAL' },
        { code: 'F03', description: 'Adequate credit history length', impact: 'POSITIVE' }
    ],
    fair: [
        { code: 'F01', description: 'Some late payments', impact: 'NEGATIVE' },
        { code: 'F02', description: 'High credit utilization', impact: 'NEGATIVE' },
        { code: 'F03', description: 'Limited credit history', impact: 'NEUTRAL' }
    ],
    low: [
        { code: 'F01', description: 'Multiple late payments', impact: 'NEGATIVE' },
        { code: 'F02', description: 'Very high credit utilization', impact: 'NEGATIVE' },
        { code: 'F03', description: 'Recent delinquency', impact: 'NEGATIVE' },
        { code: 'F04', description: 'Too many recent inquiries', impact: 'NEGATIVE' }
    ],
    poor: [
        { code: 'F01', description: 'Serious delinquency', impact: 'NEGATIVE' },
        { code: 'F02', description: 'Collections account', impact: 'NEGATIVE' },
        { code: 'F03', description: 'Maxed out credit cards', impact: 'NEGATIVE' },
        { code: 'F04', description: 'Recent bankruptcy or foreclosure', impact: 'NEGATIVE' }
    ]
};

// Risk category mapping
function getRiskCategory(score) {
    if (score >= 780) return 'SUPER_PRIME';
    if (score >= 720) return 'PRIME';
    if (score >= 660) return 'NEAR_PRIME';
    if (score >= 620) return 'SUBPRIME';
    return 'DEEP_SUBPRIME';
}

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('cb');
    const scenario = getScenario(req, 'success');

    try {
        // Handle timeout scenario
        if (scenario === 'timeout') {
            await delay(10000);
        }

        // Handle failure scenario
        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'BUREAU_UNAVAILABLE',
                'Credit bureau service is temporarily unavailable. Please try again later.',
                requestId
            ));
            return;
        }

        // Determine credit score based on scenario
        let creditScore, factors, scenarioKey;

        switch (scenario) {
            case 'excellent':
                creditScore = randomInRange(780, 850);
                scenarioKey = 'excellent';
                break;
            case 'good':
            case 'success':
                creditScore = randomInRange(700, 779);
                scenarioKey = 'good';
                break;
            case 'fair':
                creditScore = randomInRange(640, 699);
                scenarioKey = 'fair';
                break;
            case 'low':
                creditScore = randomInRange(580, 639);
                scenarioKey = 'low';
                break;
            case 'poor':
                creditScore = randomInRange(300, 579);
                scenarioKey = 'poor';
                break;
            default:
                creditScore = randomInRange(700, 779);
                scenarioKey = 'good';
        }

        factors = FACTORS_BY_SCENARIO[scenarioKey] || FACTORS_BY_SCENARIO.good;

        const data = {
            creditScore,
            scoreRange: { min: 300, max: 850 },
            riskCategory: getRiskCategory(creditScore),
            factors,
            inquiries: randomInRange(0, 5),
            delinquencies: scenarioKey === 'poor' ? randomInRange(1, 3) : (scenarioKey === 'low' ? randomInRange(0, 1) : 0),
            oldestAccountAge: randomInRange(2, 15) + ' years',
            totalAccounts: randomInRange(5, 20)
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
