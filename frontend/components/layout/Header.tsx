"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/retroui";
import { WalletSheet } from "@/components/wallet/WalletSheet";
import { truncateAddress } from "@/lib/constants";
import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/mint", label: "Mint" },
  { href: "/profile", label: "My NFTs" },
];

export function Header() {
  const pathname = usePathname();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <>
    <header className="sticky top-0 z-40 w-full pt-4 px-4">
      <div className="container mx-auto">
        <div className="bg-background border-2 border-border shadow-lg">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary border-2 border-border shadow-sm flex items-center justify-center">
                <span className="text-xl">🖼️</span>
              </div>
              <span className="font-head text-xl font-bold hidden sm:block">
                PIXELMART
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 font-head text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Wallet Button */}
            <div className="flex items-center gap-3">
              {connected && publicKey ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWalletSheetOpen(true)}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">{truncateAddress(publicKey.toString())}</span>
                </Button>
              ) : (
                <Button onClick={handleConnect} size="sm" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t-2 border-border">
              <div className="flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 font-head text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {connected && (
                  <button
                    onClick={() => {
                      setWalletSheetOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 font-head text-sm font-medium text-left hover:bg-accent flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Wallet Settings
                  </button>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>

    {/* Wallet Sheet */}
    <WalletSheet isOpen={walletSheetOpen} onClose={() => setWalletSheetOpen(false)} />
    </>
  );
}
