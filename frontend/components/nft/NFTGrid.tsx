"use client";

import { NFTCardSkeleton } from "@/components/retroui";

export interface NFTGridProps {
  children?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function NFTGrid({
  children,
  loading = false,
  emptyMessage = "No NFTs found",
  isEmpty = false,
}: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border">
        <div className="text-5xl mb-4">🖼️</div>
        <h3 className="font-head text-xl font-bold mb-2">No NFTs Found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  );
}
