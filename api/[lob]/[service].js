/**
 * Generic LOB endpoint dispatcher.
 *
 * A single Vercel dynamic route that serves EVERY line-of-business demo endpoint:
 *
 *   POST /api/fsc/credit-bureau        -> _lib/fsc/credit-bureau
 *   POST /api/ps/companies-house       -> _lib/ps/companies-house
 *   ...
 *
 * Why: the Vercel Hobby plan caps a deployment at 12 Serverless Functions. Giving
 * each endpoint its own file burned one function each and we hit the ceiling. This
 * route costs ONE function no matter how many LOBs or services exist - adding a new
 * demo (NPC, Health Cloud, Manufacturing...) means dropping a handler module under
 * `api/_lib/<lob>/` and registering it below. No extra functions, and the public
 * URLs are unchanged.
 *
 * Handler contract: each module under `api/_lib/<lob>/<service>.js` exports
 * `async (req, res)` and owns its own CORS / scenario / timeout / failure handling
 * (exactly as when it was a standalone function).
 *
 * NOTE: the registry uses STATIC require() calls on purpose. Vercel's bundler traces
 * requires statically, so a computed require (e.g. require('../_lib/' + lob)) would
 * not be bundled and would fail at runtime.
 */

const { errorResponse, generateRequestId } = require('../_utils');

const REGISTRY = {
    fsc: {
        'credit-bureau': require('../_lib/fsc/credit-bureau'),
        'fraud-detection': require('../_lib/fsc/fraud-detection'),
        'income-verification': require('../_lib/fsc/income-verification'),
        'ofac-check': require('../_lib/fsc/ofac-check'),
        'property-valuation': require('../_lib/fsc/property-valuation')
    },
    ps: {
        'companies-house': require('../_lib/ps/companies-house'),
        'director-check': require('../_lib/ps/director-check'),
        'address-verification': require('../_lib/ps/address-verification')
    }
};

module.exports = async (req, res) => {
    const lob = String(req.query?.lob || '').toLowerCase();
    const service = String(req.query?.service || '').toLowerCase();

    const services = REGISTRY[lob];
    if (!services) {
        res.status(404).json(errorResponse(
            'UNKNOWN_LOB',
            `Unknown line of business '${lob}'. Valid: ${Object.keys(REGISTRY).join(', ')}.`,
            generateRequestId('dispatch')
        ));
        return;
    }

    const handler = services[service];
    if (!handler) {
        res.status(404).json(errorResponse(
            'UNKNOWN_SERVICE',
            `Unknown service '${service}' for '${lob}'. Valid: ${Object.keys(services).join(', ')}.`,
            generateRequestId('dispatch')
        ));
        return;
    }

    return handler(req, res);
};
