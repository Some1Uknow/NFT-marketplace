"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button, Card, CardContent, Badge } from "@/components/retroui";
import { NFTCard, NFTGrid } from "@/components/nft";
import { useListings } from "@/hooks/useListings";
import { ArrowRight, Wallet, ShoppingBag, Tag, Zap } from "lucide-react";

export default function HomePage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { listings, loading } = useListings();

  // Get featured listings (first 4)
  const featuredListings = listings.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-2 border-border bg-foreground">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-6 py-16 md:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: CTA Content */}
            <div className="space-y-6">
              {/* Headline */}
              <h1 className="font-head text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-background">
                Collect & Trade
                <span className="block text-primary mt-2">Digital Art</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-background/70 max-w-lg leading-relaxed">
                The retro-styled NFT marketplace. Buy, sell, and discover 
                unique digital collectibles with low fees and instant transactions.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <Link href="/explore">
                  <Button size="lg" className="h-12 px-8 text-base flex items-center gap-2">
                    <span>Explore NFTs</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                {!connected && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base flex items-center gap-2"
                    onClick={() => setVisible(true)}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </Button>
                )}
              </div>

              {/* Powered by Solana */}
              <div className="pt-4">
                <Image
                  src="/solana.svg"
                  alt="Powered by Solana"
                  width={160}
                  height={28}
                  className="h-12 w-auto opacity-100"
                  priority
                />
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Decorative cards stack */}
                <div className="absolute -top-4 -left-4 w-48 h-48 bg-primary/20 border-2 border-primary/30 rotate-6" />
                <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-accent/20 border-2 border-accent/30 -rotate-6" />
                
                {/* Main illustration card */}
                <div className="relative bg-background border-4 border-border shadow-2xl p-6 z-10">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-border flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-8xl">🖼️</div>
                      <div className="space-y-1">
                        <p className="font-head font-bold text-lg">Pixel Art #001</p>
                        <p className="text-primary font-bold">2.5 SOL</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary border-2 border-border flex items-center justify-center text-sm">🎨</div>
                      <span className="text-sm font-medium">Artist</span>
                    </div>
                    <Badge variant="secondary" size="sm">On Sale</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard value="1,000+" label="NFTs Listed" />
            <StatsCard value="500+" label="Artists" />
            <StatsCard value="10K+" label="Transactions" />
            <StatsCard value="2.5%" label="Low Fees" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-2 border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Start trading NFTs in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StepCard
              number={1}
              icon={<Wallet className="w-7 h-7" />}
              title="Connect Wallet"
              description="Link your Phantom or Solflare wallet to get started"
            />
            <StepCard
              number={2}
              icon={<ShoppingBag className="w-7 h-7" />}
              title="Browse & Buy"
              description="Explore unique NFTs and purchase with one click"
            />
            <StepCard
              number={3}
              icon={<Tag className="w-7 h-7" />}
              title="List & Sell"
              description="List your NFTs for sale and earn SOL"
            />
          </div>
        </div>
      </section>

      {/* Featured NFTs */}
      <section className="border-b-2 border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-head text-3xl md:text-4xl font-bold mb-2">
                Featured NFTs
              </h2>
              <p className="text-muted-foreground text-lg">
                Discover the latest listings on PixelMart
              </p>
            </div>
            <Link href="/explore">
              <Button variant="outline" className="flex items-center gap-2 hidden sm:flex">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <NFTGrid loading />
          ) : featuredListings.length > 0 ? (
            <NFTGrid>
              {featuredListings.map((listing) => (
                <NFTCard
                  key={listing.publicKey.toString()}
                  listing={listing}
                  showBuyButton={false}
                />
              ))}
            </NFTGrid>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-12">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="font-head text-xl font-bold mb-2">
                  No NFTs Listed Yet
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Be the first to list an NFT on PixelMart! Connect your wallet and go to &quot;My NFTs&quot; to list your first NFT.
                </p>
                <Link href="/profile">
                  <Button className="h-10 px-6 text-sm flex items-center gap-2 mx-auto">
                    <Tag className="w-4 h-4" />
                    <span>List Your NFT</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/explore">
              <Button variant="outline" className="h-10 px-6 text-sm flex items-center gap-2">
                <span>View All NFTs</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-head text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Start Trading?
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Connect your wallet and join the PixelMart community today.
            </p>
            {connected ? (
              <Link href="/explore">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base flex items-center gap-2 mx-auto">
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base flex items-center gap-2 mx-auto"
                onClick={() => setVisible(true)}
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Stats Card Component
function StatsCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-5 border-2 border-border bg-background">
      <div className="font-head text-2xl md:text-3xl font-bold text-primary mb-1">
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}

// Step Card Component
function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-10 pb-6 px-5 text-center">
        {/* Step Number */}
        <div className="absolute top-3 left-3 w-7 h-7 bg-primary text-primary-foreground font-head font-bold text-xs flex items-center justify-center border-2 border-border">
          {number}
        </div>
        
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 bg-accent flex items-center justify-center border-2 border-border">
          {icon}
        </div>
        
        {/* Content */}
        <h3 className="font-head text-base font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}