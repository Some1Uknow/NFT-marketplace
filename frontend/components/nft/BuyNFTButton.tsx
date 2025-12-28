"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button, TransactionModal } from "@/components/retroui";
import { useProgram } from "@/hooks/useProgram";
import { buyNft, ListingWithMetadata } from "@/lib/program";
import { formatSol } from "@/lib/constants";

interface BuyNFTButtonProps {
  listing: ListingWithMetadata;
  onSuccess?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BuyNFTButton({ 
  listing, 
  onSuccess, 
  className,
  size = "lg" 
}: BuyNFTButtonProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useProgram();
  
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    isOpen: boolean;
    status: "pending" | "success" | "error";
    message?: string;
    signature?: string;
  }>({ isOpen: false, status: "pending" });

  const { account } = listing;
  const isSeller = publicKey?.equals(account.seller);

  const handleBuy = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (!program || !publicKey) {
      setTxStatus({
        isOpen: true,
        status: "error",
        message: "Wallet not connected",
      });
      return;
    }

    if (isSeller) {
      setTxStatus({
        isOpen: true,
        status: "error",
        message: "You cannot buy your own NFT",
      });
      return;
    }

    try {
      setLoading(true);
      setTxStatus({ isOpen: true, status: "pending" });

      const signature = await buyNft(program, account.nftMint);

      setTxStatus({
        isOpen: true,
        status: "success",
        message: "Congratulations! You now own this NFT!",
        signature,
      });

      onSuccess?.();
    } catch (err: unknown) {
      console.error("Error buying NFT:", err);
      setTxStatus({
        isOpen: true,
        status: "error",
        message: err instanceof Error ? err.message : "Failed to buy NFT",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSeller) {
    return (
      <Button className={className} size={size} disabled variant="secondary">
        Your Listing
      </Button>
    );
  }

  return (
    <>
      <Button
        className={className}
        size={size}
        onClick={handleBuy}
        disabled={loading || !account.isActive}
      >
        {loading ? "Processing..." : `Buy for ${formatSol(account.price.toNumber())} SOL`}
      </Button>

      <TransactionModal
        isOpen={txStatus.isOpen}
        onClose={() => setTxStatus({ ...txStatus, isOpen: false })}
        status={txStatus.status}
        message={txStatus.message}
        txSignature={txStatus.signature}
      />
    </>
  );
}
