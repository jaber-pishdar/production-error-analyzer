# Demo

## Quick Start

```bash
# Option 1: Docker (recommended)
docker compose up
# Open http://localhost:4000

# Option 2: Local development
pnpm install
pnpm dev
# API on http://localhost:4000, frontend on http://localhost:3000
```

## Try the Incident Simulator

```bash
# Generate a simulated production incident and post it directly to the API
pnpm run sample-incident | curl -X POST http://localhost:4000/api/parse --data-binary @-
```

Or in two steps:

```bash
# Step 1 — generate data
pnpm run sample-incident > incident.log

# Step 2 — send to the API (or paste into the web UI manually)
curl -X POST http://localhost:4000/api/parse --data-binary @incident.log
```

## Seed Data

```bash
pnpm run seed | curl -X POST http://localhost:4000/api/parse --data-binary @-
```

This generates 48 hours of realistic traffic with two error spikes.

## Test Suite

```bash
pnpm test
```

78 tests covering:
- Log parsing (16 tests)
- Error grouping and fingerprinting (18 tests)
- Severity classification (17 tests)
- HTTP endpoint analysis (9 tests)
- Time aggregation and regression detection (12 tests)
- Full pipeline integration (5 tests)

## Manual API Testing

```bash
# Parse a single error
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: text/plain" \
  -d "2026-08-22T10:15:31Z ERROR Database connection failed"

# Parse an error with stack trace
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: text/plain" \
  -d "2026-08-22T10:15:31Z ERROR Connection timeout\n    at Socket.connect (net.js:123:15)"

# Check for regression after a deploy
curl "http://localhost:4000/api/regression?release=2026-08-22T12:00:00Z"

# Get time-series data
curl "http://localhost:4000/api/time-series?interval=1h"
```