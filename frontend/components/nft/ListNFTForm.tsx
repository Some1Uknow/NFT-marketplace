"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Button, Card, CardContent, Input, TransactionModal } from "@/components/retroui";
import { useProgram } from "@/hooks/useProgram";
import { 
  formatSol,
  LAMPORTS_PER_SOL, 
  MARKETPLACE_FEE_BPS,
  MAX_PRICE_SOL 
} from "@/lib/constants";
import { listNft } from "@/lib/program";

interface ListNFTFormProps {
  mintAddress: string;
  tokenAccount: string;
  onSuccess?: () => void;
}

export function ListNFTForm({ mintAddress, tokenAccount, onSuccess }: ListNFTFormProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useProgram();
  
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<{
    isOpen: boolean;
    status: "pending" | "success" | "error";
    message?: string;
    signature?: string;
  }>({ isOpen: false, status: "pending" });

  // Calculate fees
  const priceInLamports = parseFloat(price || "0") * LAMPORTS_PER_SOL;
  const feeAmount = (priceInLamports * MARKETPLACE_FEE_BPS) / 10000;
  const sellerReceives = priceInLamports - feeAmount;

  const validatePrice = (): boolean => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Please enter a valid price");
      return false;
    }
    if (numPrice > MAX_PRICE_SOL) {
      setError(`Maximum price is ${MAX_PRICE_SOL} SOL`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleList = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (!program || !publicKey) {
      setError("Wallet not connected");
      return;
    }

    if (!validatePrice()) {
      return;
    }

    try {
      setLoading(true);
      setTxStatus({ isOpen: true, status: "pending" });

      const nftMint = new PublicKey(mintAddress);
      const priceInLamports = Math.floor(parseFloat(price) * 1e9);
      
      const signature = await listNft(
        program,
        nftMint,
        priceInLamports
      );

      setTxStatus({
        isOpen: true,
        status: "success",
        message: "Your NFT has been listed for sale!",
        signature,
      });

      onSuccess?.();
    } catch (err: unknown) {
      console.error("Error listing NFT:", err);
      setTxStatus({
        isOpen: true,
        status: "error",
        message: err instanceof Error ? err.message : "Failed to list NFT",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-head text-lg font-bold mb-4">Set Your Price</h3>
            
            <Input
              label="Price (SOL)"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(null);
              }}
              error={error || undefined}
              min="0"
              step="0.01"
            />
          </div>

          {parseFloat(price) > 0 && (
            <div className="space-y-2 p-4 bg-muted border-2 border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Listing price</span>
                <span>{formatSol(priceInLamports)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Platform fee ({MARKETPLACE_FEE_BPS / 100}%)
                </span>
                <span className="text-destructive">-{formatSol(feeAmount)} SOL</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t-2 border-border">
                <span>You receive</span>
                <span className="text-green-600">{formatSol(sellerReceives)} SOL</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleList}
            disabled={loading || !price}
          >
            {loading ? "Listing..." : connected ? "List for Sale" : "Connect Wallet"}
          </Button>
        </CardContent>
      </Card>

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
