/**
 * Director Check API - Simulates a UK director disqualification screening.
 *
 * POST /api/ps/director-check
 *
 * Scenarios:
 * - success (default): All directors clear, no disqualifications
 * - clear: Same as success
 * - disqualified: One director is currently disqualified (licence should be refused)
 * - previously-disqualified: A director has a spent disqualification (refer for review)
 * - unmatched: Declared directors cannot be reconciled with the register
 * - fail: Returns API error (500)
 * - timeout: Simulates 10s delay
 */

const { successResponse, errorResponse, handleCors, getScenario, delay, randomInRange, randomItem, generateRequestId } = require('../_utils');

const NAMES = [
    { firstName: 'Jordan', lastName: 'Rivera' },
    { firstName: 'Priya', lastName: 'Nair' },
    { firstName: 'Callum', lastName: 'Fraser' },
    { firstName: 'Amara', lastName: 'Okafor' },
    { firstName: 'Tomas', lastName: 'Novak' }
];

const DISQUALIFICATION_REASONS = [
    'Unfit conduct in the management of an insolvent company (CDDA 1986 s.6)',
    'Failure to file statutory accounts and returns (CDDA 1986 s.3)',
    'Fraudulent or wrongful trading (CDDA 1986 s.4)'
];

function buildDirector(index, status) {
    const name = NAMES[index % NAMES.length];
    const director = {
        officerId: `OFF-${randomInRange(100000, 999999)}`,
        firstName: name.firstName,
        lastName: name.lastName,
        role: index === 0 ? 'director' : randomItem(['director', 'secretary']),
        appointedOn: `20${randomInRange(15, 23)}-0${randomInRange(1, 9)}-1${randomInRange(0, 9)}`,
        nationality: 'British',
        countryOfResidence: 'United Kingdom',
        disqualified: false,
        matchedOnRegister: true
    };

    if (status === 'disqualified') {
        return {
            ...director,
            disqualified: true,
            disqualification: {
                active: true,
                reason: randomItem(DISQUALIFICATION_REASONS),
                disqualifiedFrom: '2024-04-01',
                disqualifiedUntil: '2031-04-01',
                courtName: 'High Court of Justice'
            }
        };
    }

    if (status === 'previously-disqualified') {
        return {
            ...director,
            disqualified: false,
            disqualification: {
                active: false,
                reason: randomItem(DISQUALIFICATION_REASONS),
                disqualifiedFrom: '2012-01-01',
                disqualifiedUntil: '2017-01-01',
                courtName: 'High Court of Justice'
            }
        };
    }

    if (status === 'unmatched') {
        return { ...director, matchedOnRegister: false };
    }

    return director;
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    const requestId = generateRequestId('dc');
    const scenario = getScenario(req, 'success');
    const organisation = (req.body && (req.body.organisation || req.body.companyName)) || 'CASCADE ENERGY LIMITED';

    try {
        if (scenario === 'timeout') {
            await delay(10000);
        }

        if (scenario === 'fail') {
            res.status(500).json(errorResponse(
                'DIRECTOR_REGISTER_UNAVAILABLE',
                'The disqualified directors register is temporarily unavailable. Please try again later.',
                requestId
            ));
            return;
        }

        const directorCount = randomInRange(2, 4);
        const directors = [];
        for (let i = 0; i < directorCount; i++) {
            // Only the first director carries the scenario condition; the rest are clear.
            directors.push(buildDirector(i, i === 0 ? scenario : 'clear'));
        }

        const disqualifiedCount = directors.filter(d => d.disqualified).length;
        const unmatchedCount = directors.filter(d => !d.matchedOnRegister).length;

        let outcome = 'CLEAR';
        if (disqualifiedCount > 0) outcome = 'DISQUALIFIED';
        else if (unmatchedCount > 0) outcome = 'UNMATCHED';
        else if (scenario === 'previously-disqualified') outcome = 'REFER';

        const data = {
            organisation,
            checkedAt: new Date().toISOString(),
            outcome,
            directorsChecked: directors.length,
            disqualifiedCount,
            unmatchedCount,
            directors
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
