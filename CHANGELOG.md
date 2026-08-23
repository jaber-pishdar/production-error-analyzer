# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-08-23

### Added

- Node.js log parser (TIMESTAMP LEVEL format)
- Error fingerprinting and grouping engine
- Severity classification (info → low → warning → high → critical)
- HTTP endpoint analysis with per-endpoint error rates
- Time-series aggregation with spike detection (>3× mean)
- Regression detection (before/after release comparison)
- Search, filter by severity, sort by count/severity/time in dashboard
- Error detail view with stack trace display
- Docker single-container deploy (`docker compose up`)
- Seed data generator (`pnpm run seed` — 48 hours, 882 lines)
- Sample incident generator (`pnpm run sample-incident`)
- Demo mode (`pnpm run demo` — 10,000 logs, spike + regression)
- Integration test — full pipeline from v1→v2 regression
- 78 automated tests

### Changed

- Rewrote README as problem-first CTO-facing document
- Added architecture, demo, and how-it-works documentation
- Dashboard screenshot in README
- CI pipeline upgraded to Node 22 + pnpm 9
- Unified single-stage Dockerfile

### Removed

- Removed unsupported parsers (JSON, Apache, PHP, Python) from build
- Removed PostgreSQL dependency (in-memory only for MVP)