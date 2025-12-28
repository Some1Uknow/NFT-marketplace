"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, Badge } from "@/components/retroui";
import { NFTCard, NFTGrid } from "@/components/nft";
import { useListings } from "@/hooks/useListings";
import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

type SortOption = "recent" | "price-low" | "price-high";

export default function ExplorePage() {
  const router = useRouter();
  const { listings, loading, error, refetch } = useListings();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((listing) => {
        const name = listing.metadata?.name?.toLowerCase() || "";
        const mint = listing.account.nftMint.toString().toLowerCase();
        return name.includes(query) || mint.includes(query);
      });
    }

    // Price range filter
    if (priceRange.min) {
      const minLamports = parseFloat(priceRange.min) * 1e9;
      result = result.filter((l) => l.account.price.toNumber() >= minLamports);
    }
    if (priceRange.max) {
      const maxLamports = parseFloat(priceRange.max) * 1e9;
      result = result.filter((l) => l.account.price.toNumber() <= maxLamports);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.account.price.toNumber() - b.account.price.toNumber());
        break;
      case "price-high":
        result.sort((a, b) => b.account.price.toNumber() - a.account.price.toNumber());
        break;
      case "recent":
      default:
        // Keep original order (newest first)
        break;
    }

    return result;
  }, [listings, searchQuery, sortBy, priceRange]);

  const handleBuy = (mintAddress: string) => {
    router.push(`/nft/${mintAddress}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || priceRange.min || priceRange.max || sortBy !== "recent";

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-10">
          <h1 className="font-head text-3xl md:text-4xl font-bold mb-3">
            Explore NFTs
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover unique digital collectibles listed on PixelMart
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="border-b-2 border-border sticky top-24 z-30 bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search NFTs"
              />
            </div>

            {/* Sort & Filter Buttons */}
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none px-4 py-2 pr-10 bg-background border-2 border-border cursor-pointer font-head text-sm"
                  aria-label="Sort NFTs by"
                  title="Sort NFTs"
                >
                  <option value="recent">Recently Listed</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 border-2 border-border bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Min Price (SOL)"
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  min="0"
                  step="0.1"
                />
                <Input
                  label="Max Price (SOL)"
                  type="number"
                  placeholder="1000"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-8">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {loading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-bold text-foreground">
                  {filteredListings.length}
                </span>{" "}
                {filteredListings.length === 1 ? "NFT" : "NFTs"} found
              </>
            )}
          </p>
          <Button variant="ghost" onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="font-head text-lg font-bold mb-2">
                Error Loading NFTs
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex justify-center">
                <Button onClick={refetch}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NFT Grid */}
        <NFTGrid
          loading={loading}
          isEmpty={!loading && filteredListings.length === 0}
          emptyMessage={
            hasActiveFilters
              ? "No NFTs match your filters. Try adjusting your search."
              : "No NFTs are currently listed. Check back later!"
          }
        >
          {filteredListings.map((listing) => (
            <NFTCard
              key={listing.publicKey.toString()}
              listing={listing}
              onBuy={() => handleBuy(listing.account.nftMint.toString())}
            />
          ))}
        </NFTGrid>
      </section>
    </div>
  );
}
