import { PublicKey } from "@solana/web3.js";

// Program ID from the deployed Solana program
export const PROGRAM_ID = new PublicKey("DHpGDWHEo3ubcRBcuDBaMR3KDYGH1j9rcSsYxcMsqzA9");

// RPC endpoints
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as "devnet" | "mainnet-beta" | "testnet";

// Fee percentage (in basis points, e.g., 250 = 2.5%)
export const MARKETPLACE_FEE_BPS = 250;

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Placeholder image for NFTs without metadata
export const PLACEHOLDER_IMAGE = "/placeholder-nft.svg";

// Max price in SOL
export const MAX_PRICE_SOL = 10000;

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format SOL amount
export function formatSol(lamports: number | bigint): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

// Format USD (mock - in production would use price feed)
export function formatUsd(lamports: number | bigint, solPrice = 100): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  const usd = sol * solPrice;
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
