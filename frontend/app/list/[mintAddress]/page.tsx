"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Skeleton,
  TransactionModal,
} from "@/components/retroui";
import { useProgram } from "@/hooks/useProgram";
import { useNFTs } from "@/hooks/useNFTs";
import { useListings } from "@/hooks/useListings";
import { listNft, getMarketplace } from "@/lib/program";
import { truncateAddress } from "@/lib/constants";
import {
  ArrowLeft,
  ArrowRight,
  Tag,
  Info,
  AlertTriangle,
  Wallet,
  Check,
} from "lucide-react";

type TransactionState = "idle" | "pending" | "success" | "error";

export default function ListNFTPage() {
  const params = useParams();
  const router = useRouter();
  const mintAddress = params.mintAddress as string;
  
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useProgram();
  
  const { nfts, loading: nftsLoading } = useNFTs();
  const { listings } = useListings();

  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [feePercent, setFeePercent] = useState(2); // Default fee
  const [txState, setTxState] = useState<TransactionState>("idle");
  const [txMessage, setTxMessage] = useState("");
  const [txSignature, setTxSignature] = useState("");

  // Find the NFT in user's wallet
  const nft = useMemo(() => {
    return nfts.find((n) => n.mint === mintAddress);
  }, [nfts, mintAddress]);

  // Check if already listed
  const isAlreadyListed = useMemo(() => {
    return listings.some((l) => l.account.nftMint.toString() === mintAddress);
  }, [listings, mintAddress]);

  // Fetch marketplace fee on mount
  useEffect(() => {
    const fetchFee = async () => {
      if (program && publicKey) {
        try {
          const marketplace = await getMarketplace(program, publicKey);
          if (marketplace) {
            setFeePercent(marketplace.feePercent);
          }
        } catch (err) {
          console.error("Failed to fetch marketplace:", err);
        }
      }
    };
    fetchFee();
  }, [program, publicKey]);

  // Price validation
  useEffect(() => {
    if (price) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setPriceError("Price must be greater than 0");
      } else if (numPrice < 0.001) {
        setPriceError("Minimum price is 0.001 SOL");
      } else if (numPrice > 1000000) {
        setPriceError("Maximum price is 1,000,000 SOL");
      } else {
        setPriceError("");
      }
    } else {
      setPriceError("");
    }
  }, [price]);

  const numPrice = parseFloat(price) || 0;
  const feeAmount = numPrice * (feePercent / 100);
  const sellerReceives = numPrice - feeAmount;

  const handleList = async () => {
    if (!program || !nft || !price || priceError) return;

    setTxState("pending");
    setTxMessage("Creating listing...");

    try {
      const priceLamports = Math.floor(parseFloat(price) * 1e9);
      const signature = await listNft(
        program,
        new PublicKey(mintAddress),
        priceLamports
      );
      setTxSignature(signature);
      setTxState("success");
      setTxMessage("NFT listed successfully!");
    } catch (err: unknown) {
      console.error("List error:", err);
      setTxState("error");
      setTxMessage(
        err instanceof Error ? err.message : "Failed to list NFT"
      );
    }
  };

  const closeModal = () => {
    if (txState === "success") {
      router.push(`/nft/${mintAddress}`);
    } else {
      setTxState("idle");
      setTxMessage("");
      setTxSignature("");
    }
  };

  // Not connected
  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted border-2 border-border flex items-center justify-center">
              <Wallet className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-head text-2xl font-bold mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to list NFTs on PixelMart.
            </p>
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setVisible(true)}>
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (nftsLoading) {
    return (
      <div className="min-h-screen">
        <section className="border-b-2 border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-6 w-32" />
          </div>
        </section>
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="aspect-square" />
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // NFT not found or not owned
  if (!nft) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Card className="max-w-lg mx-auto border-destructive">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="font-head text-2xl font-bold mb-2">
              NFT Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This NFT is not in your wallet. You can only list NFTs that you own.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/profile")}>
                View Your NFTs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already listed
  if (isAlreadyListed) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Card className="max-w-lg mx-auto border-yellow-500">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="font-head text-2xl font-bold mb-2">
              Already Listed
            </h2>
            <p className="text-muted-foreground mb-6">
              This NFT is already listed on the marketplace.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push(`/nft/${mintAddress}`)}>
                View Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: NFT Preview */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  {nft.image ? (
                    <Image
                      src={nft.image}
                      alt={nft.name || "NFT"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl">🖼️</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NFT Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{nft.name || "Unnamed"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mint Address</span>
                    <span className="font-mono">{truncateAddress(mintAddress)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Listing Form */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-3">
                  <Tag className="w-3 h-3 mr-1" />
                  List for Sale
                </Badge>
                <h1 className="font-head text-3xl font-bold">
                  {nft.name || "Unnamed NFT"}
                </h1>
              </div>

              {/* Price Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Set Your Price</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      error={priceError}
                      min="0.001"
                      step="0.01"
                      className="text-2xl font-bold pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-head text-muted-foreground">
                      SOL
                    </span>
                  </div>

                  {/* Quick Price Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {[0.1, 0.5, 1, 5, 10].map((p) => (
                      <Button
                        key={p}
                        variant={price === String(p) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPrice(String(p))}
                      >
                        {p} SOL
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Fee Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listing Price</span>
                    <span className="font-medium">{numPrice.toFixed(4)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Marketplace Fee ({feePercent}%)
                    </span>
                    <span className="text-destructive">-{feeAmount.toFixed(4)} SOL</span>
                  </div>
                  <div className="border-t-2 border-border pt-3 flex justify-between">
                    <span className="font-medium">You'll Receive</span>
                    <span className="font-bold text-green-600 text-lg">
                      {sellerReceives.toFixed(4)} SOL
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Warning */}
              <div className="flex gap-3 p-4 bg-yellow-500/10 border-2 border-yellow-500/30">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700">
                    Please review before listing
                  </p>
                  <p className="text-yellow-600/80">
                    Your NFT will be transferred to escrow until sold or cancelled.
                    You can cancel the listing at any time.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleList}
                disabled={!price || !!priceError || !program}
              >
                List NFT for Sale
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={txState !== "idle"}
        onClose={closeModal}
        state={txState === "idle" ? "pending" : txState}
        title={
          txState === "pending"
            ? "Creating Listing..."
            : txState === "success"
            ? "Listed Successfully!"
            : "Listing Failed"
        }
        message={txMessage}
        signature={txSignature}
      />
    </div>
  );
}
