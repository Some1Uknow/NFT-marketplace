# Contributing to NFT Marketplace

Thank you for considering contributing to this project — your help improves the platform for everyone. This document explains how to contribute, the expected code standards, how to run tests, and the PR process for this full-stack Solana + Next.js product.

## Table of Contents

- Ways to contribute
- Code of conduct
- Getting the repo
- Branching & commit conventions
- Running the project locally
- Tests and CI
- Reporting security issues
- PR checklist

## Ways to contribute

- Report bugs by opening an issue with steps to reproduce.
- Request features by opening an issue describing the problem and proposed UX/behavior.
- Contribute code: pick an issue, or open a pull request with a clear description and tests.
- Improve docs: README, this `CONTRIBUTING.md`, or inline code docs.

## Code of conduct

This project follows a standard open source Code of Conduct. Be respectful, inclusive, and constructive. If you need a formal `CODE_OF_CONDUCT.md` added, open an issue and we will add one and link it from the repo.

## Getting the repo

Clone and install dependencies for development:

```bash
git clone <REPO_URL>
cd NFT-marketplace/frontend
pnpm install
```

You will also need Rust, the Solana CLI, and Anchor to build and test the on-chain program. See [README.md](README.md) for the full prerequisite list and install instructions.

## Branching & commit conventions

- Use feature branches named `feat/<short-description>`, bug branches `fix/<short-description>`, or `chore/<task>`.
- Keep commits focused and atomic. Use imperative present tense in commit messages (e.g., "Add wallet adapter support").
- Use conventional commits or at least a clear message format to make changelogs easier.

## Running the project locally

Refer to the main `README.md` for step-by-step local development instructions. Quick summary:

1. Start a local Solana validator:

```bash
solana-test-validator --reset
```

2. Build & deploy the Anchor program locally:

```bash
cd solana-program
anchor build
anchor deploy --provider.cluster localnet
```

3. Run the frontend:

```bash
cd frontend
pnpm dev
```

Make sure you configure the frontend to use the program ID produced by your local deploy if it differs from the repo default.

## Tests and CI

- On-chain tests: run `anchor test` from `solana-program/` to run integration tests against a fresh local validator.
- Frontend/unit tests: run `pnpm test` from `frontend/` if tests are present.
- Ensure tests pass locally before opening a PR. If you add tests, include them in CI.

## Reporting security issues

If you find a security vulnerability (especially in the on-chain program), please do not open a public issue. Instead contact the maintainers privately (create an issue marked "private" or send an email to the maintainer listed in the project). We will coordinate disclosure and remediation.

## Pull Request process & PR checklist

1. Fork the repo and create a branch for your change.
2. Run and add tests for any behavior you change or add.
3. Keep PRs small and focused. Large architectural changes are best discussed as an issue first.
4. Include a clear description of what the PR does and why.

PR checklist (use before requesting review):

- [ ] The PR has a descriptive title and summary.
- [ ] Changes are covered by tests (unit/integration) where appropriate.
- [ ] Linting passes and code is formatted.
- [ ] Documentation (README or inline) updated if behavior changed.
- [ ] No secrets or private key material included.

## Maintainer notes

- Maintainers should label issues (bug, enhancement, help wanted) and assign reviewers.
- Tag releases and update `CHANGELOG.md` (if present) when merging significant changes.

---

If you'd like, I can also add:

- A `CODE_OF_CONDUCT.md` file.
- GitHub PR and issue templates under `.github/`.
- A lightweight `CONTRIBUTING` section in `package.json` or `frontend/README` linking here.

Open an issue or tell me which of those you'd like next.
