"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMintNFT } from "@/hooks/useMintNFT";
import { Button, Card, CardContent, Input, Badge } from "@/components/retroui";
import { Wallet, Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

// Sample placeholder images for quick minting
const PLACEHOLDER_IMAGES = [
  "https://arweave.net/placeholder1",
  "https://arweave.net/placeholder2", 
  "https://arweave.net/placeholder3",
];

export default function MintPage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { mintNFT, loading, error, setError } = useMintNFT();

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
  });
  const [mintedAddress, setMintedAddress] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMint = async () => {
    if (!formData.name || !formData.symbol || !formData.imageUrl) {
      setError("Please fill in all required fields");
      return;
    }

    const mintAddress = await mintNFT({
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      image: formData.imageUrl,
    });

    if (mintAddress) {
      setMintedAddress(mintAddress);
    }
  };

  const handleMintAnother = () => {
    setMintedAddress(null);
    setFormData({
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Profile</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              Create NFT
            </Badge>
            <h1 className="font-head text-3xl font-bold mb-2">Mint Your NFT</h1>
            <p className="text-muted-foreground">
              Create a new NFT on the Solana blockchain. Once minted, you can list it for sale on PixelMart.
            </p>
          </div>

          {!connected ? (
            /* Connect Wallet Prompt */
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent flex items-center justify-center border-2 border-border">
                  <Wallet className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="font-head text-xl font-bold mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Connect your Solana wallet to start minting NFTs.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setVisible(true)}
                    className="h-10 px-6 flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : mintedAddress ? (
            /* Success State */
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-head text-2xl font-bold mb-2 text-green-600">
                  NFT Minted Successfully!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your NFT has been created on the Solana blockchain.
                </p>
                
                <div className="bg-accent p-4 border-2 border-border mb-6 max-w-md mx-auto">
                  <p className="text-xs text-muted-foreground mb-1">Mint Address</p>
                  <p className="font-mono text-sm break-all">{mintedAddress}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href={`/list/${mintedAddress}`}>
                    <Button className="h-10 px-6 flex items-center gap-2">
                      <span>List for Sale</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleMintAnother}
                    className="h-10 px-6"
                  >
                    Mint Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Mint Form */
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Image URL */}
                <div className="space-y-2">
                  <label className="font-head text-sm font-medium">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://arweave.net/... or IPFS URL"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your NFT image (Arweave, IPFS, or any public URL)
                  </p>
                </div>

                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="border-2 border-border p-2 bg-accent">
                    <div className="aspect-square max-w-[200px] mx-auto bg-background border-2 border-border overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EInvalid URL%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <label className="font-head text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Awesome NFT"
                    className="w-full"
                  />
                </div>

                {/* Symbol */}
                <div className="space-y-2">
                  <label className="font-head text-sm font-medium">
                    Symbol <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="AWESOME"
                    maxLength={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Short ticker symbol (max 10 characters)
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="font-head text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your NFT..."
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 p-3 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-accent p-4 border-2 border-border">
                  <h4 className="font-head text-sm font-bold mb-2">ℹ️ Minting Info</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Minting creates an NFT on Solana (costs ~0.01 SOL)</li>
                    <li>• Make sure you have enough SOL for transaction fees</li>
                    <li>• For devnet testing, get free SOL from faucet.solana.com</li>
                    <li>• 5% royalty is set on secondary sales</li>
                  </ul>
                </div>

                {/* Mint Button */}
                <Button
                  onClick={handleMint}
                  disabled={loading || !formData.name || !formData.symbol || !formData.imageUrl}
                  className="w-full h-12 text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Minting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Mint NFT</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Need an image? Try{" "}
              <a
                href="https://www.nft-generator.art/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NFT Generator
              </a>
              {" "}or upload to{" "}
              <a
                href="https://nft.storage/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NFT.Storage
              </a>
              {" "}for free IPFS hosting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
