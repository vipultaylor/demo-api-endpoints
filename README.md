# Demo API Endpoints

Free hosted API endpoints for Salesforce UoW framework demos. Deploy to Vercel in minutes.

## Quick Start

### 1. Deploy to Vercel (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up (free)
3. Click "New Project" → Import your GitHub repo
4. Click "Deploy" - done!

Your endpoints will be live at: `https://your-project-name.vercel.app/api/...`

### 2. Local Development

```bash
npm install -g vercel
vercel dev
```

Endpoints available at `http://localhost:3000/api/...`

---

## Architecture

The Vercel **Hobby plan caps a deployment at 12 Serverless Functions**. Giving every
endpoint its own file under `api/` burned one function each, so the project hit the
ceiling as soon as a second demo was added.

Instead, all line-of-business endpoints are served by a **single generic dispatcher**:

```
api/
├── [lob]/[service].js     ← ONE function serving every LOB endpoint
├── _utils.js              ← shared helpers (underscore = not a function)
├── _lib/
│   ├── fsc/               ← handler modules (not functions)
│   │   ├── credit-bureau.js
│   │   └── ...
│   └── ps/
│       ├── companies-house.js
│       └── ...
├── echo.js  delay.js  status.js  random-fail.js  index.js   ← 5 utilities
```

**Total: 6 functions — regardless of how many demos exist.** Public URLs are unchanged
(`/api/fsc/credit-bureau`, `/api/ps/companies-house`, ...).

### Adding a new LOB (e.g. NPC)

1. Drop handler modules in `api/_lib/npc/<service>.js`. Each exports `async (req, res)`
   and owns its own CORS / scenario / timeout / failure handling — see any existing
   handler for the shape.
2. Register them in the `REGISTRY` in `api/[lob]/[service].js`:
   ```js
   npc: {
       'donor-lookup': require('../_lib/npc/donor-lookup')
   }
   ```
3. Done — `/api/npc/donor-lookup` is live. **No new serverless functions.**

> The registry uses **static** `require()` calls deliberately: Vercel's bundler traces
> requires statically, so a computed `require('../_lib/' + lob)` would not be bundled
> and would fail at runtime.

---

## Available Endpoints

### FSC Loan Demo Endpoints

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/fsc/credit-bureau` | POST | Credit score lookup | `scenario=success\|low\|fail` |
| `/api/fsc/fraud-detection` | POST | Fraud screening | `scenario=success\|flagged\|fail` |
| `/api/fsc/property-valuation` | GET | AVM property value | `address`, `scenario` |
| `/api/fsc/income-verification` | POST | Payroll verification | `scenario=success\|mismatch\|fail` |
| `/api/fsc/ofac-check` | POST | Sanctions screening | `scenario=success\|match\|fail` |

### PS Licensing Demo Endpoints

UK gas & electricity licensing (Public Sector) demo.

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/ps/companies-house` | POST | Company profile lookup | `scenario=success\|active\|dissolved\|liquidation\|overdue\|not-found\|fail\|timeout` |
| `/api/ps/director-check` | POST | Director disqualification screening | `scenario=success\|clear\|disqualified\|previously-disqualified\|unmatched\|fail\|timeout` |
| `/api/ps/address-verification` | POST | OS Places / UPRN address verification | `scenario=success\|ambiguous\|not-found\|fail\|timeout` |

### Generic Test Endpoints

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/echo` | ANY | Echo back request | Any |
| `/api/delay` | GET | Delayed response | `ms=1000` |
| `/api/status` | GET | Return specific status | `code=200` |
| `/api/random-fail` | GET | Random failures | `rate=0.3` (30% fail) |

---

## Scenario Parameter

All FSC and PS endpoints support a `scenario` query parameter to simulate different outcomes:

- `scenario=success` - Normal successful response (default)
- `scenario=fail` - Simulates API error (500)
- `scenario=timeout` - Simulates timeout (10s delay)
- `scenario=low` / `scenario=high` / etc. - Endpoint-specific scenarios

### Example Usage

```bash
# Success scenario (default)
curl https://your-project.vercel.app/api/fsc/credit-bureau \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"ssn": "123-45-6789"}'

# Low credit score scenario
curl "https://your-project.vercel.app/api/fsc/credit-bureau?scenario=low" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"ssn": "123-45-6789"}'

# Failure scenario
curl "https://your-project.vercel.app/api/fsc/credit-bureau?scenario=fail" \
  -X POST
```

---

## Salesforce Named Credential Setup

After deploying, create a Named Credential in Salesforce:

1. **Setup** → **Named Credentials** → **New**
2. **Label**: `Demo API`
3. **URL**: `https://your-project.vercel.app`
4. **Identity Type**: Anonymous
5. **Authentication Protocol**: No Authentication

Then in your Apex code:

```apex
HttpRequest req = new HttpRequest();
req.setEndpoint('callout:Demo_API/api/fsc/credit-bureau');
req.setMethod('POST');
req.setHeader('Content-Type', 'application/json');
req.setBody('{"ssn": "123-45-6789"}');

Http http = new Http();
HttpResponse res = http.send(req);
System.debug(res.getBody());
```

---

## Response Formats

### Credit Bureau Response

```json
{
  "status": "SUCCESS",
  "requestId": "cb-123456",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "creditScore": 720,
    "scoreRange": { "min": 300, "max": 850 },
    "riskCategory": "PRIME",
    "factors": [
      { "code": "F01", "description": "Length of credit history", "impact": "POSITIVE" },
      { "code": "F02", "description": "Payment history", "impact": "POSITIVE" }
    ],
    "inquiries": 2,
    "delinquencies": 0
  }
}
```

### Fraud Detection Response

```json
{
  "status": "SUCCESS",
  "requestId": "fd-123456",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "fraudRisk": "LOW",
    "riskScore": 15,
    "alerts": [],
    "identityVerified": true,
    "addressVerified": true
  }
}
```

### Property Valuation Response

```json
{
  "status": "SUCCESS",
  "requestId": "pv-123456",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "estimatedValue": 450000,
    "confidenceScore": 0.85,
    "valueRange": { "low": 425000, "high": 475000 },
    "lastSalePrice": 380000,
    "lastSaleDate": "2020-06-15"
  }
}
```

### Companies House Response

```json
{
  "status": "SUCCESS",
  "requestId": "ch-123456",
  "timestamp": "2026-07-12T10:30:00Z",
  "data": {
    "companyNumber": "12345678",
    "companyName": "CASCADE ENERGY LIMITED",
    "companyStatus": "active",
    "companyType": "ltd",
    "incorporationDate": "2016-06-12",
    "registeredOfficeAddress": { "addressLine1": "10 Millbank", "locality": "London", "postalCode": "SW1P 3GE" },
    "sicCodes": [{ "code": "35140", "description": "Trade of electricity" }],
    "accounts": { "nextDue": "2027-09-30", "lastMadeUpTo": "2025-12-31", "overdue": false },
    "hasInsolvencyHistory": false
  }
}
```

### Director Check Response

```json
{
  "status": "SUCCESS",
  "requestId": "dc-123456",
  "timestamp": "2026-07-12T10:30:00Z",
  "data": {
    "organisation": "CASCADE ENERGY LIMITED",
    "outcome": "CLEAR",
    "directorsChecked": 3,
    "disqualifiedCount": 0,
    "unmatchedCount": 0,
    "directors": [
      { "officerId": "OFF-123456", "firstName": "Jordan", "lastName": "Rivera", "role": "director", "disqualified": false, "matchedOnRegister": true }
    ]
  }
}
```

### Address Verification Response

```json
{
  "status": "SUCCESS",
  "requestId": "av-123456",
  "timestamp": "2026-07-12T10:30:00Z",
  "data": {
    "postcode": "SW1P 3GE",
    "verified": true,
    "outcome": "MATCHED",
    "matchCount": 1,
    "matches": [
      { "uprn": "100023336956", "addressLine1": "10 Millbank", "locality": "London", "postalCode": "SW1P 3GE", "matchConfidence": 98 }
    ]
  }
}
```

---

## License

MIT - Use freely for demos and testing.
