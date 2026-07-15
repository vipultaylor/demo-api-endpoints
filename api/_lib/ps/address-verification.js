/**
 * Address Verification API - Simulates an OS Places / UPRN address lookup.
 *
 * POST /api/ps/address-verification
 *
 * Scenarios:
 * - success (default): Single confident match with a UPRN
 * - ambiguous: Multiple candidate matches, low confidence (refer for review)
 * - not-found: Postcode not matched on the register (404)
 * - fail: Returns API error (500)
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, randomItem, generateRequestId } = require('../../_utils');

const ADDRESSES = [
    { addressLine1: '10 Millbank', locality: 'London', postalCode: 'SW1P 3GE', classification: 'CO01' },
    { addressLine1: 'Commonwealth House, 32 Albion Street', locality: 'Glasgow', postalCode: 'G1 1LH', classification: 'CO01' },
    { addressLine1: '1 Cathedral Road', locality: 'Cardiff', postalCode: 'CF11 9SB', classification: 'CO01' }
];

function buildMatch(address, confidence) {
    return {
        uprn: String(randomInRange(100000000000, 999999999999)),
        udprn: String(randomInRange(10000000, 99999999)),
        addressLine1: address.addressLine1,
        locality: address.locality,
        postalCode: address.postalCode,
        country: 'United Kingdom',
        classificationCode: address.classification,
        classificationDescription: 'Commercial - Office',
        matchConfidence: confidence
    };
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('av');
    const scenario = getScenario(req, 'success');
    const postcode = (req.body && req.body.postcode) || 'SW1P 3GE';

    try {
        if (scenario === 'timeout') {
            await delay(10000);
        }

        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'ADDRESS_SERVICE_UNAVAILABLE',
                'The address verification service is temporarily unavailable. Please try again later.',
                requestId
            ));
            return;
        }

        if (scenario === 'not-found') {
            res.status(404).json(errorResponse(
                'ADDRESS_NOT_FOUND',
                `No registered address was matched for postcode ${postcode}.`,
                requestId
            ));
            return;
        }

        const primary = ADDRESSES.find(a => a.postalCode.toUpperCase() === String(postcode).toUpperCase()) || randomItem(ADDRESSES);

        if (scenario === 'ambiguous') {
            const candidates = ADDRESSES.map(a => buildMatch(a, randomInRange(45, 65)));
            res.status(200).json(successResponse({
                postcode,
                verified: false,
                outcome: 'AMBIGUOUS',
                matchCount: candidates.length,
                matches: candidates
            }, requestId));
            return;
        }

        res.status(200).json(successResponse({
            postcode,
            verified: true,
            outcome: 'MATCHED',
            matchCount: 1,
            matches: [buildMatch(primary, randomInRange(95, 100))]
        }, requestId));

    } catch (error) {
        res.status(500).json(errorResponse(
            'INTERNAL_ERROR',
            'An unexpected error occurred.',
            requestId
        ));
    }
};
