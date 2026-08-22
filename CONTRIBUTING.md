# Contributing to Production Error Analyzer

Thank you for considering contributing! This project aims to help developers debug production errors faster.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Run `pnpm install`
4. Run `pnpm dev` to start the development environment

## Development Workflow

1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run `pnpm lint` and `pnpm test` to ensure quality
4. Commit using conventional commits (see below)
5. Push and open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code refactoring
- `test:` — adding or updating tests
- `chore:` — maintenance, dependencies

## Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- One concern per file

## Pull Request Process

1. Ensure your branch is up to date with main
2. Update documentation if needed
3. Add tests for new functionality
4. The CI pipeline must pass

## Questions?

Open a GitHub Discussion or issue.