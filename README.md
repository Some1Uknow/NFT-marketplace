# PixelMart (Solana + Next.js)

Comprehensive technical README for the PixelMart monorepo. This repository contains a Next.js frontend and an Anchor-based Solana program (on-chain marketplace). The README documents architecture, developer setup, build & deploy steps, testing, and troubleshooting.

---

## Table of Contents

- Project Overview
- Repository Layout
- Architecture
- Prerequisites
- Local Development
  - Frontend (Next.js)
  - Solana Program (Anchor)
- Building for Production
- Deploying Contracts & Frontend
- Testing
- Common Tasks & Scripts
- Environment Variables
- Project Conventions
- Troubleshooting
- Contributing
- Appendix: Helpful File Links

---

## Project Overview

This project implements a simple NFT marketplace on Solana. It includes:

- A Next.js TypeScript frontend that interacts with the Solana program and on-chain marketplace.
- An Anchor (Rust) program that defines marketplace logic (listings, buys, marketplace state).
- Scripts for deployment, automated tests, and IDL/type generation.

Use cases:

- Create/list NFTs for sale
- Browse and purchase listed NFTs
- Query listings and ownership via the frontend

## Repository Layout

- `frontend/` — Next.js application (TypeScript, React, pnpm workspace)
  - Key files: `app/`, `components/`, `lib/`, `hooks/`, `providers/`
- `solana-program/` — Anchor program (Rust) and migrations
  - Key files: `programs/marketplace/src/lib.rs`, `Anchor.toml`, `migrations/`
- `tests/` — on-chain integration tests (near `solana-program` / `tests` folder)

See these locations in the tree for details: [frontend](frontend) and [solana-program](solana-program).

## Architecture

- On-chain: Anchor program `marketplace` handles listings, escrow, and transfers.
- Off-chain: Next.js frontend talks to Solana via wallet adapters and Anchor-generated client types.
- Data flow: Users sign transactions in their wallet (Phantom / Solflare). Marketplace state is stored in program accounts.

## Prerequisites

- Node.js (v18+ recommended)
- pnpm (used by frontend workspace)
- Rust toolchain (stable) and `cargo`
- Solana CLI (`solana`) — compatible version recommended by Anchor
- Anchor (Rust + `anchor-cli`) for building and deploying the program
- Irys + Metaplex for NFT Minting logic

Install notes (macOS):

```bash
# Node + pnpm
brew install node
npm install -g pnpm

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI (check Anchor docs for compatible versions)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.27.0 anchor-cli --locked
```

Adjust versions as required by `Anchor.toml` and `Cargo.toml` in `solana-program/`.

## Local Development

Preamble: run the frontend locally and run Anchor program on localnet/test validator.

### Frontend (Next.js)

1. Install dependencies

```bash
cd frontend
pnpm install
```

2. Environment variables

Copy `.env.example` (if present) or set required vars described below in `Environment Variables`.

3. Run dev server

```bash
pnpm dev
# or
pnpm next dev
```

The app will typically be available at `http://localhost:3000`.

Important frontend locations:

- UI components: [frontend/components](frontend/components)
- Wallet provider: [frontend/providers/WalletProvider.tsx](frontend/providers/WalletProvider.tsx)
- Program helpers & marketplace client: [frontend/lib/program.ts](frontend/lib/program.ts)

### Solana Program (Anchor)

This project uses Anchor for program development. Common flows:

1. Start `solana-test-validator` (local cluster):

```bash
solana-test-validator --reset
```

2. Configure Solana CLI to localnet:

```bash
solana config set --url http://127.0.0.1:8899
```

3. Fund your local wallet (optional for specific wallets):

```bash
solana airdrop 10
```

4. Build and deploy Anchor program locally

```bash
cd solana-program
anchor build
anchor deploy --provider.cluster localnet
```

Notes:

- `Anchor.toml` controls program ID and cluster config. After `anchor build`, the IDL is generated to `target/idl/` and TypeScript types to `target/types/` (if using `anchor-client-gen` / build steps configured).
- After deploying, update frontend config (`frontend/lib/constants.ts` or `frontend/lib/program.ts`) with the program ID if it differs.

## Building for Production

Frontend:

```bash
cd frontend
pnpm build
pnpm start # or use hosting platform commands
```

Solana program:

- For mainnet deployment compile with `anchor build -- --release` and deploy with `anchor deploy --provider.cluster mainnet` (ensure careful audits & funding).

## Deploying Contracts & Frontend

1. Program deployment

- Configure `Anchor.toml` with the correct `cluster` and `programs` entries.
- Ensure the deployer keypair is funded for the chosen cluster.
- Run `anchor build` and `anchor deploy`.

2. Frontend deployment

- Build the Next.js app: `pnpm build`.
- Deploy to Vercel / Netlify / any provider that supports Next.js. Ensure env vars are set in hosting provider.

## Testing

### On-chain tests (Anchor)

Anchor-based tests are typically in the `tests/` directory under the `solana-program` workspace. Run them with:

```bash
cd solana-program
anchor test
```

This boots a local validator, runs migrations, deploys the program, runs tests, and tears down.

### Frontend tests

If present, run the frontend test scripts (`pnpm test` or `pnpm jest`). This project scaffold may not include frontend tests by default.

## Common Tasks & Scripts

- `pnpm build` — build the Next.js frontend (run from `frontend/`).
- `pnpm dev` — run Next.js in development.
- `anchor build` — compile the Anchor program.
- `anchor test` — run Anchor tests.
- `anchor deploy` — deploy to configured cluster.

## Environment Variables

The project may require the following env vars (example names — check frontend code for exact names):

- `NEXT_PUBLIC_SOLANA_CLUSTER` — cluster RPC URL (e.g., `http://127.0.0.1:8899` or mainnet-beta RPC)
- `NEXT_PUBLIC_PROGRAM_ID` — deployed Marketplace program ID
- `RPC_URL` — optional RPC override for backend calls

Store secrets (private keys) securely. Do not check private key files into source control.

## Project Conventions

- Code style: TypeScript + ESLint (see `eslint.config.mjs` in `frontend/`).
- Monorepo uses `pnpm` workspace in `frontend`.
- Anchor program follows Rust/Anchor idioms: account structs, handlers, and events.

## Troubleshooting

- Anchor build/deploy errors: ensure `anchor-cli`, `solana` CLI, and Rust toolchain versions are compatible with `Anchor.toml` and `Cargo.toml`.
- Wallet connection issues: ensure the wallet adapter is configured for the same cluster as the program and the wallet is funded.
- Missing IDL/types in frontend: confirm `anchor build` produced `target/idl/marketplace.json` and that frontend is reading the correct path.

Common debug commands:

```bash
# Show solana config
solana config get

# Show anchor info
anchor --version

# Inspect program logs after sending a tx
solana logs --program <PROGRAM_ID>
```

## Contributing

See the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

## Security & Auditing

- Review on-chain program logic carefully before deploying to mainnet.
- Ensure appropriate access controls and checks exist in the program (e.g., ownership, authority checks, safe token transfers).

## Appendix: Helpful File Links

- Frontend entry: [frontend/app/page.tsx](frontend/app/page.tsx)
- Frontend wallet provider: [frontend/providers/WalletProvider.tsx](frontend/providers/WalletProvider.tsx)
- Program source: [solana-program/programs/marketplace/src/lib.rs](solana-program/programs/marketplace/src/lib.rs)
- Anchor config: [solana-program/Anchor.toml](solana-program/Anchor.toml)
- Program IDL / types: [solana-program/target/idl](solana-program/target/idl)

---

If you want, I can:

- Add an `.env.example` file to `frontend/` listing required env vars.
- Run a local smoke test: start validator, deploy program, run the frontend.
- Generate a short developer quick-start checklist.

Tell me which you'd like next.
