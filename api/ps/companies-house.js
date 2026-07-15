/**
 * Companies House API - Simulates a UK company profile lookup.
 *
 * POST /api/ps/companies-house
 *
 * Scenarios:
 * - success (default): Returns an active company in good standing
 * - active: Same as success
 * - dissolved: Returns a dissolved company (licence application should be refused)
 * - liquidation: Returns a company in liquidation
 * - overdue: Active company with overdue accounts / confirmation statement
 * - not-found: Returns 404 - company number not registered
 * - fail: Returns API error (500)
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, randomItem, generateRequestId } = require('../_utils');

const SIC_CODES = [
    { code: '35110', description: 'Production of electricity' },
    { code: '35140', description: 'Trade of electricity' },
    { code: '35210', description: 'Manufacture of gas' },
    { code: '35230', description: 'Trade of gas through mains' },
    { code: '35130', description: 'Distribution of electricity' }
];

const OFFICES = [
    { addressLine1: '10 Millbank', locality: 'London', postalCode: 'SW1P 3GE', country: 'United Kingdom' },
    { addressLine1: 'Commonwealth House, 32 Albion Street', locality: 'Glasgow', postalCode: 'G1 1LH', country: 'United Kingdom' },
    { addressLine1: '1 Cathedral Road', locality: 'Cardiff', postalCode: 'CF11 9SB', country: 'United Kingdom' }
];

function buildProfile(scenario, companyNumber) {
    const incorporationYear = randomInRange(2008, 2021);
    const base = {
        companyNumber,
        companyName: 'CASCADE ENERGY LIMITED',
        companyType: 'ltd',
        jurisdiction: 'england-wales',
        incorporationDate: `${incorporationYear}-0${randomInRange(1, 9)}-1${randomInRange(0, 9)}`,
        registeredOfficeAddress: randomItem(OFFICES),
        sicCodes: [randomItem(SIC_CODES)],
        officerCount: randomInRange(2, 6),
        hasCharges: false,
        hasInsolvencyHistory: false
    };

    switch (scenario) {
        case 'dissolved':
            return {
                ...base,
                companyStatus: 'dissolved',
                dissolutionDate: `${incorporationYear + 5}-06-30`,
                hasInsolvencyHistory: true,
                accounts: { nextDue: null, lastMadeUpTo: `${incorporationYear + 4}-12-31`, overdue: false },
                confirmationStatement: { nextDue: null, overdue: false }
            };
        case 'liquidation':
            return {
                ...base,
                companyStatus: 'liquidation',
                hasInsolvencyHistory: true,
                hasCharges: true,
                accounts: { nextDue: '2026-09-30', lastMadeUpTo: '2025-12-31', overdue: true },
                confirmationStatement: { nextDue: '2026-08-15', overdue: true }
            };
        case 'overdue':
            return {
                ...base,
                companyStatus: 'active',
                accounts: { nextDue: '2026-03-31', lastMadeUpTo: '2024-12-31', overdue: true },
                confirmationStatement: { nextDue: '2026-02-15', overdue: true }
            };
        case 'active':
        case 'success':
        default:
            return {
                ...base,
                companyStatus: 'active',
                accounts: { nextDue: '2027-09-30', lastMadeUpTo: '2025-12-31', overdue: false },
                confirmationStatement: { nextDue: '2027-01-15', overdue: false }
            };
    }
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('ch');
    const scenario = getScenario(req, 'success');
    const companyNumber = (req.body && (req.body.crn || req.body.companyNumber)) || String(randomInRange(10000000, 99999999));

    try {
        if (scenario === 'timeout') {
            await delay(10000);
        }

        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'COMPANIES_HOUSE_UNAVAILABLE',
                'The Companies House service is temporarily unavailable. Please try again later.',
                requestId
            ));
            return;
        }

        if (scenario === 'not-found') {
            res.status(404).json(errorResponse(
                'COMPANY_NOT_FOUND',
                `No company is registered with number ${companyNumber}.`,
                requestId
            ));
            return;
        }

        const profile = buildProfile(scenario, companyNumber);
        res.status(200).json(successResponse(profile, requestId));

    } catch (error) {
        res.status(500).json(errorResponse(
            'INTERNAL_ERROR',
            'An unexpected error occurred.',
            requestId
        ));
    }
};
