# NFT Marketplace - Frontend

A modern NFT marketplace built on Solana with Next.js 16 and TypeScript.

## Features

- 🎨 Mint NFTs with metadata stored on Arweave via Irys
- 🏪 List NFTs for sale on the marketplace
- 💰 Buy and sell NFTs with SOL
- 👛 Solana wallet integration (Phantom, Solflare, etc.)
- 🔍 Browse and explore NFT collections
- 📱 Responsive retro pixel art design

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript
- **Blockchain**: Solana (Anchor framework)
- **Storage**: Arweave (via Irys)
- **Wallet**: Solana Wallet Adapter
- **Metadata**: Metaplex Token Metadata
- **Styling**: Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

For production, use a paid RPC provider like Helius or QuickNode.

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

- `app/` - Next.js app directory (pages and layouts)
- `components/` - Reusable React components
- `hooks/` - Custom React hooks for blockchain interactions
- `lib/` - Utilities and Solana program interface
- `providers/` - Context providers (Wallet, etc.)

## Key Features

### Minting NFTs
- Upload metadata to Arweave via Irys
- Create Metaplex-compatible NFTs
- Automatic wallet token account creation

### Marketplace
- List NFTs with custom pricing
- Browse all listings
- Buy NFTs with SOL
- Cancel listings

### Wallet Management
- Multi-wallet support (Phantom, Solflare, etc.)
- View balance and transaction history
- Send SOL to other addresses

## Configuration

Update `lib/constants.ts` for:
- Program ID (from deployed Solana program)
- RPC endpoint
- Network configuration

## Deployment

Deploy to Vercel with one click:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy
