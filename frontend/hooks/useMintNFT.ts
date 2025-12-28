"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, some } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
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
// Upload metadata to Arweave via Irys
  const uploadMetadata = useCallback(
    async (umi: any, metadata: NFTMetadata): Promise<string> => {
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
      };

      // Convert JSON to bytes for upload
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadataJson));

      // Upload to Arweave via Irys and get the permanent URI
      const [uri] = await umi.uploader.upload([metadataBytes]);
      
      return uri;
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
        // Create Umi instance with Irys uploader for Arweave
        const umi = createUmi(RPC_ENDPOINT)
          .use(mplTokenMetadata())
          .use(irysUploader());
        umi.use(walletAdapterIdentity(wallet));

        // Generate a new mint address
        const mint = generateSigner(umi);

        // Upload metadata to Arweave and get URI
        const metadataUri = await uploadMetadata(umi, metadata);

        // Create the NFT with Arweave metadata URI
        // This will create the NFT AND mint it to your wallet (tokenOwner defaults to identity)
        const tx = await createNft(umi, {
          mint,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: percentAmount(5), // 5% royalty
          creators: some([
            {
              address: umi.identity.publicKey,
              verified: true,
              share: 100,
            },
          ]),
        }).sendAndConfirm(umi);

        const signature = base58.deserialize(tx.signature)[0];

        return mint.publicKey.toString();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Mint error:", err);
        }
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
    loading,
    error,
    setError,
  };
}
