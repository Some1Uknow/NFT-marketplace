"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { 
  getProgram, 
  fetchAllListings, 
  fetchListing,
  ListingWithMetadata,
  Marketplace,
  fetchNFTMetadataFromChain
} from "@/lib/program";
import { RPC_ENDPOINT } from "@/lib/constants";

// Create a read-only provider for fetching data
function getReadOnlyProgram(connection: any): Program<Marketplace> {
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return getProgram(provider);
}

export function useListings() {
  const { connection } = useConnection();
  const [listings, setListings] = useState<ListingWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const program = getReadOnlyProgram(connection);
      const fetchedListings = await fetchAllListings(program);
      
      // Fetch metadata for each listing
      const listingsWithMetadata = await Promise.all(
        fetchedListings.map(async (listing) => {
          const metadata = await fetchNFTMetadataFromChain(connection, listing.account.nftMint);
          return {
            ...listing,
            metadata,
          };
        })
      );
      
      setListings(listingsWithMetadata);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { listings, loading, error, refetch };
}

export function useListing(mintAddress: string | null) {
  const { connection } = useConnection();
  const [listing, setListing] = useState<ListingWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!mintAddress) {
      setListing(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const program = getReadOnlyProgram(connection);
      const nftMint = new PublicKey(mintAddress);
      const fetchedListing = await fetchListing(program, nftMint);
      
      if (fetchedListing) {
        // Fetch metadata for the listing
        const metadata = await fetchNFTMetadataFromChain(connection, nftMint);
        setListing({
          ...fetchedListing,
          metadata,
        });
      } else {
        setListing(null);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
      setError("Failed to fetch listing");
    } finally {
      setLoading(false);
    }
  }, [connection, mintAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { listing, loading, error, refetch };
}
