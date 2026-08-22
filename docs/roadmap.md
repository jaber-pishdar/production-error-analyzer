# Roadmap

## v1.0 — MVP (Current)

- [x] Project structure & documentation
- [ ] GitHub repository with CI/CD
- [ ] Log parsers for JSON, Apache/Nginx, Node.js, PHP, Python
- [ ] Error normalization and fingerprinting
- [ ] Basic dashboard with 6 key metrics
- [ ] Docker Compose setup
- [ ] One-click local deployment

## v1.1 — Developer UX

- [ ] Real-time log streaming via WebSocket
- [ ] Log file upload via web UI
- [ ] Error detail view with stack trace formatting
- [ ] Search & filter errors
- [ ] Date range picker

## v1.2 — Collaboration

- [ ] Error assignment to team members
- [ ] Comment / annotation on errors
- [ ] Slack / Discord webhook notifications
- [ ] Export report as PDF

## v1.3 — Intelligence

- [ ] Error rate trend detection (spike, gradual increase)
- [ ] Similar error grouping (fuzzy matching)
- [ ] Suggested fixes based on stack trace patterns
- [ ] Integration with Sentry, Datadog, New Relic

## v2.0 — Production Ready

- [ ] Authentication & RBAC
- [ ] Multi-project / multi-environment support
- [ ] Persistent log storage (TimescaleDB)
- [ ] Performance: 10K+ logs/sec throughput
- [ ] Helm chart for Kubernetes deployment