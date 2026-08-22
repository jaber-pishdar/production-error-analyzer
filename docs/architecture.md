# Architecture

## Overview

Production Error Analyzer follows a monorepo structure with clear separation between frontend, backend, and processing logic.

```
┌─────────────────────────────────────────────────────────┐
│                        Docker                            │
│  ┌────────────────┐      ┌──────────────────────────┐   │
│  │   apps/web     │ ───→ │       apps/api            │   │
│  │ (React + Vite) │      │ (Node.js + Express)       │   │
│  └────────────────┘      └──────┬───────────────────┘   │
│                                  │                       │
│  ┌────────────────┐      ┌──────▼───────────────────┐   │
│  │    PostgreSQL   │ ←─── │   packages/parser        │   │
│  │  (timescale)    │      │   packages/analyzer      │   │
│  └────────────────┘      │   packages/shared         │   │
│                           └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Repository Structure

```
production-error-analyzer/
│
├── apps/
│   ├── web/          # React + TypeScript frontend (Vite)
│   └── api/          # Node.js + TypeScript backend (Express/Fastify)
│
├── packages/
│   ├── parser/       # Log format parsers (JSON, Apache, Node.js, PHP, Python)
│   ├── analyzer/     # Error grouping, classification, statistics
│   └── shared/       # Shared types, schemas, utilities
│
├── docs/             # Problem definition, architecture, roadmap
├── examples/         # Example log files for each supported format
├── docker/           # Dockerfiles for each service
├── tests/            # Integration & e2e tests
├── .github/          # CI workflows
│
├── docker-compose.yml
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
└── ROADMAP.md
```

## Design Decisions

1. **Monorepo** — all code in one repo for easy development and consistent tooling (pnpm workspaces)
2. **TypeScript everywhere** — shared types between frontend, backend, and processing layers
3. **Docker-first** — one command to run the full stack, minimal local setup
4. **Parser as a package** — pluggable format support, easy to add new log types
5. **PostgreSQL with TimescaleDB** — time-series optimized for log analysis at scale

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React + TypeScript + Vite + Tailwind |
| Backend    | Node.js + TypeScript + Express     |
| Database   | PostgreSQL + TimescaleDB           |
| Processing | Node.js worker threads / Bull queue |
| Container  | Docker + Docker Compose            |
| CI         | GitHub Actions                     |
| Monorepo   | pnpm workspaces                    |