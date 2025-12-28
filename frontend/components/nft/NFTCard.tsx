"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, Badge, Button } from "@/components/retroui";
import { formatSol, PLACEHOLDER_IMAGE, truncateAddress } from "@/lib/constants";
import { ListingWithMetadata } from "@/lib/program";

interface NFTCardProps {
  listing: ListingWithMetadata;
  showBuyButton?: boolean;
  onBuy?: () => void;
}

export function NFTCard({ listing, showBuyButton = true, onBuy }: NFTCardProps) {
  const { account, metadata } = listing;
  const mintAddress = account.nftMint.toString();
  
  return (
    <Card hover className="overflow-hidden group">
      <Link href={`/nft/${mintAddress}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={metadata?.image || PLACEHOLDER_IMAGE}
            alt={metadata?.name || "NFT"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {account.isActive && (
            <Badge className="absolute top-2 right-2" variant="success">
              Listed
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="space-y-3">
        {/* Collection & Name */}
        <div>
          {metadata?.collection?.name && (
            <p className="text-xs text-muted-foreground truncate">
              {metadata.collection.name}
            </p>
          )}
          <Link href={`/nft/${mintAddress}`}>
            <h3 className="font-head font-bold truncate hover:text-primary transition-colors">
              {metadata?.name || `NFT #${mintAddress.slice(0, 6)}`}
            </h3>
          </Link>
        </div>

        {/* Seller */}
        <p className="text-xs text-muted-foreground">
          Seller: {truncateAddress(account.seller.toString())}
        </p>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-border">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-head font-bold text-lg">
              {formatSol(account.price.toNumber())} SOL
            </p>
          </div>
          {showBuyButton && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onBuy?.();
              }}
            >
              Buy Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
