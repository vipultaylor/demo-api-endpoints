/**
 * Property Valuation API - Simulates Automated Valuation Model (AVM).
 *
 * GET /api/fsc/property-valuation
 *
 * Query Parameters:
 * - address: Property address (optional, for logging)
 * - requestedValue: Requested loan property value (used to calculate response)
 *
 * Scenarios:
 * - success (default): Property value matches or exceeds requested
 * - low: Property value below requested (LTV issue)
 * - high: Property value significantly above requested
 * - unavailable: No AVM data available for property
 * - fail: Returns API error
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, generateRequestId } = require('../_utils');

module.exports = async (req, res) => {
    // Handle CORS
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('pv');
    const scenario = getScenario(req, 'success');
    const requestedValue = parseInt(req.query?.requestedValue) || 450000;
    const address = req.query?.address || '123 Main Street, Anytown, USA';

    try {
        // Handle timeout scenario
        if (scenario === 'timeout') {
            await delay(10000);
        }

        // Handle failure scenario
        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'AVM_SERVICE_UNAVAILABLE',
                'Property valuation service is temporarily unavailable.',
                requestId
            ));
            return;
        }

        // Handle unavailable scenario
        if (scenario === 'unavailable') {
            res.status(200).json(successResponse({
                estimatedValue: null,
                confidenceScore: 0,
                dataAvailable: false,
                reason: 'Insufficient comparable sales data for this property',
                recommendation: 'ORDER_FULL_APPRAISAL'
            }, requestId));
            return;
        }

        let estimatedValue, confidenceScore, valueVariance;

        switch (scenario) {
            case 'success':
                // Value at or slightly above requested (good LTV)
                valueVariance = randomInRange(0, 10) / 100; // 0-10% above
                estimatedValue = Math.round(requestedValue * (1 + valueVariance));
                confidenceScore = randomInRange(80, 95) / 100;
                break;

            case 'low':
                // Value below requested (LTV problem)
                valueVariance = randomInRange(10, 25) / 100; // 10-25% below
                estimatedValue = Math.round(requestedValue * (1 - valueVariance));
                confidenceScore = randomInRange(70, 85) / 100;
                break;

            case 'high':
                // Value significantly above requested
                valueVariance = randomInRange(15, 35) / 100; // 15-35% above
                estimatedValue = Math.round(requestedValue * (1 + valueVariance));
                confidenceScore = randomInRange(85, 95) / 100;
                break;

            default:
                valueVariance = randomInRange(0, 10) / 100;
                estimatedValue = Math.round(requestedValue * (1 + valueVariance));
                confidenceScore = randomInRange(80, 95) / 100;
        }

        // Calculate value range based on confidence
        const rangePercent = (1 - confidenceScore) * 0.5; // Lower confidence = wider range
        const lowValue = Math.round(estimatedValue * (1 - rangePercent));
        const highValue = Math.round(estimatedValue * (1 + rangePercent));

        // Generate comparable sales
        const comparables = [
            {
                address: '125 Main Street',
                salePrice: Math.round(estimatedValue * randomInRange(95, 105) / 100),
                saleDate: '2024-08-15',
                sqft: randomInRange(1800, 2400),
                distanceMiles: 0.2
            },
            {
                address: '142 Oak Avenue',
                salePrice: Math.round(estimatedValue * randomInRange(92, 108) / 100),
                saleDate: '2024-07-22',
                sqft: randomInRange(1800, 2400),
                distanceMiles: 0.5
            },
            {
                address: '98 Elm Street',
                salePrice: Math.round(estimatedValue * randomInRange(90, 110) / 100),
                saleDate: '2024-06-10',
                sqft: randomInRange(1800, 2400),
                distanceMiles: 0.8
            }
        ];

        const data = {
            estimatedValue,
            confidenceScore,
            valueRange: { low: lowValue, high: highValue },
            dataAvailable: true,
            propertyDetails: {
                address,
                propertyType: 'SINGLE_FAMILY',
                yearBuilt: randomInRange(1980, 2020),
                sqft: randomInRange(1800, 2800),
                bedrooms: randomInRange(3, 5),
                bathrooms: randomInRange(2, 4),
                lotSize: randomInRange(5000, 15000) + ' sqft'
            },
            lastSalePrice: Math.round(estimatedValue * 0.75),
            lastSaleDate: '2019-04-20',
            comparableSales: comparables,
            marketTrend: randomInRange(-2, 5) + '% YoY'
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
