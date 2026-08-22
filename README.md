# Production Error Analyzer

> Turn raw production logs into actionable error intelligence.

[![CI](https://github.com/yourusername/production-error-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/production-error-analyzer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## The Problem

Production logs are noisy, duplicate, and context-poor. Finding the root cause of an error takes 30–60 minutes of digging through thousands of log lines.

## The Solution

Production Error Analyzer ingests logs from multiple formats, normalizes them, groups identical errors, and presents a clean dashboard with the metrics that matter.

```
Raw Logs → Parsing → Normalization → Grouping → Classification → Dashboard
```

## Supported Formats

| Format        | Status |
|---------------|--------|
| JSON logs     | ✅ Done |
| Apache/Nginx  | ✅ Done |
| Node.js       | ✅ Done |
| PHP           | ✅ Done |
| Python        | ✅ Done |

## Dashboard

- **Total Errors** — live counter
- **Unique Errors** — distinct error fingerprints
- **Critical Errors** — 5xx, fatal, uncaught exceptions
- **Most Frequent Errors** — ranked table
- **Errors by Endpoint** — per-route breakdown
- **Errors by Time** — histogram timeline

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/production-error-analyzer.git
cd production-error-analyzer

# Start with Docker (recommended)
docker compose up

# Or run locally
pnpm install
pnpm dev
```

Open http://localhost:3000 and paste your production logs.

## Architecture

```
apps/
  web/          React + TypeScript frontend (Vite)
  api/          Node.js + TypeScript backend
packages/
  parser/       Log format parsers
  analyzer/     Error grouping & statistics
  shared/       Types & utilities
```

## Use Cases

- **On-call engineers** — quickly triage production incidents
- **Dev teams** — understand error patterns before they become critical
- **CTOs / Tech leads** — get a high-level view of system health

## Roadmap

See [ROADMAP.md](./docs/roadmap.md) for planned features.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT