"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { RPC_ENDPOINT } from "@/lib/constants";

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: { trait_type: string; value: string }[];
}

export function useMintNFT() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define uploadMetadata first before it's used in mintNFT
  const uploadMetadata = useCallback(
    async (metadata: NFTMetadata): Promise<string> => {
      // Create proper metadata JSON following Metaplex standard
      const metadataJson = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes || [],
        properties: {
          files: [{ uri: metadata.image, type: "image/png" }],
          category: "image",
          creators: [
            {
              address: wallet.publicKey!.toString(),
              share: 100,
            },
          ],
        },
        external_url: "",
      };

      // Use data URI for demo - in production upload to Arweave/IPFS
      // Data URIs work for devnet testing and support any image URL
      if (typeof window !== "undefined") {
        const jsonString = JSON.stringify(metadataJson);
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        return `data:application/json;base64,${base64}`;
      }
      
      return "";
    },
    [wallet]
  );

  const mintNFT = useCallback(
    async (metadata: NFTMetadata): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Create Umi instance
        const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());
        umi.use(walletAdapterIdentity(wallet));

        // Generate a new mint address
        const mint = generateSigner(umi);

        // Create proper metadata JSON
        const metadataUri = await uploadMetadata(metadata);

        // Create the NFT with proper metadata URI
        const tx = await createNft(umi, {
          mint,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri, // Now uses proper JSON metadata URI
          sellerFeeBasisPoints: percentAmount(5), // 5% royalty
          creators: [
            {
              address: umi.identity.publicKey,
              verified: true,
              share: 100,
            },
          ],
        }).sendAndConfirm(umi);

        const signature = base58.deserialize(tx.signature)[0];
        console.log("NFT Minted!", signature);
        console.log("Mint Address:", mint.publicKey);

        return mint.publicKey.toString();
      } catch (err) {
        console.error("Mint error:", err);
        setError(err instanceof Error ? err.message : "Failed to mint NFT");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet, uploadMetadata]
  );

  return {
    mintNFT,
    uploadMetadata,
    loading,
    error,
    setError,
  };
}
