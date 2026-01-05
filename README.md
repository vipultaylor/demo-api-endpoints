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

## Available Endpoints

### FSC Loan Demo Endpoints

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/fsc/credit-bureau` | POST | Credit score lookup | `scenario=success\|low\|fail` |
| `/api/fsc/fraud-detection` | POST | Fraud screening | `scenario=success\|flagged\|fail` |
| `/api/fsc/property-valuation` | GET | AVM property value | `address`, `scenario` |
| `/api/fsc/income-verification` | POST | Payroll verification | `scenario=success\|mismatch\|fail` |
| `/api/fsc/ofac-check` | POST | Sanctions screening | `scenario=success\|match\|fail` |

### Generic Test Endpoints

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/echo` | ANY | Echo back request | Any |
| `/api/delay` | GET | Delayed response | `ms=1000` |
| `/api/status` | GET | Return specific status | `code=200` |
| `/api/random-fail` | GET | Random failures | `rate=0.3` (30% fail) |

---

## Scenario Parameter

All FSC endpoints support a `scenario` query parameter to simulate different outcomes:

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

---

## License

MIT - Use freely for demos and testing.
