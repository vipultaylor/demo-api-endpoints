/**
 * OFAC/Sanctions Check API - Simulates sanctions list screening.
 *
 * POST /api/fsc/ofac-check
 *
 * Request Body (optional):
 * - firstName: First name to check
 * - lastName: Last name to check
 * - dateOfBirth: DOB for matching
 * - country: Country of residence
 *
 * Scenarios:
 * - success (default): Clear, no matches
 * - potential: Potential match requiring manual review
 * - match: Confirmed match to sanctions list
 * - fail: Returns API error
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, generateRequestId, randomInRange } = require('../_utils');

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('ofac');
    const scenario = getScenario(req, 'success');

    // Parse request body
    let body = {};
    if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const firstName = body.firstName || 'John';
    const lastName = body.lastName || 'Smith';

    try {
        // Handle timeout scenario
        if (scenario === 'timeout') {
            await delay(10000);
        }

        // Handle failure scenario
        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'OFAC_SERVICE_UNAVAILABLE',
                'OFAC screening service is temporarily unavailable.',
                requestId
            ));
            return;
        }

        let onWatchlist, matchType, matchScore, matches, recommendation, listsChecked;

        // Common lists checked
        listsChecked = [
            'OFAC SDN List',
            'OFAC Consolidated List',
            'UN Security Council',
            'EU Sanctions List',
            'UK HM Treasury'
        ];

        switch (scenario) {
            case 'success':
                onWatchlist = false;
                matchType = 'NO_MATCH';
                matchScore = 0;
                matches = [];
                recommendation = 'CLEAR';
                break;

            case 'potential':
                onWatchlist = false;
                matchType = 'POTENTIAL_MATCH';
                matchScore = randomInRange(60, 80);
                matches = [
                    {
                        listName: 'OFAC SDN List',
                        matchedName: `${firstName} ${lastName}`.toUpperCase(),
                        matchScore: matchScore,
                        matchType: 'NAME_SIMILARITY',
                        listingDate: '2020-03-15',
                        program: 'SDGT',
                        notes: 'Name similarity detected - manual review recommended'
                    }
                ];
                recommendation = 'MANUAL_REVIEW';
                break;

            case 'match':
                onWatchlist = true;
                matchType = 'CONFIRMED_MATCH';
                matchScore = randomInRange(95, 100);
                matches = [
                    {
                        listName: 'OFAC SDN List',
                        matchedName: `${firstName} ${lastName}`.toUpperCase(),
                        matchScore: matchScore,
                        matchType: 'EXACT_MATCH',
                        listingDate: '2019-07-22',
                        program: 'IRAN',
                        idNumber: 'OFAC-' + randomInRange(10000, 99999),
                        notes: 'Exact name and DOB match to sanctioned individual'
                    }
                ];
                recommendation = 'BLOCK';
                break;

            default:
                onWatchlist = false;
                matchType = 'NO_MATCH';
                matchScore = 0;
                matches = [];
                recommendation = 'CLEAR';
        }

        const data = {
            onWatchlist,
            matchType,
            matchScore,
            screeningResult: recommendation,
            matches,
            searchedName: `${firstName} ${lastName}`,
            listsChecked,
            screeningDate: new Date().toISOString(),
            pepStatus: scenario === 'potential' ? 'POTENTIAL_PEP' : 'NOT_PEP',
            adverseMedia: scenario === 'match' ? ['Associated with sanctioned entities'] : [],
            riskIndicators: scenario === 'match' ? ['SANCTIONS_MATCH', 'HIGH_RISK_JURISDICTION'] :
                           scenario === 'potential' ? ['NAME_SIMILARITY'] : []
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
