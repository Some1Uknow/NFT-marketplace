import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header, Footer } from "@/components/layout";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "PixelMart - NFT Marketplace on Solana",
  description: "Buy, sell, and discover unique digital collectibles on Solana. The retro-styled NFT marketplace.",
  keywords: ["NFT", "Solana", "marketplace", "digital art", "collectibles"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${archivoBlack.variable} ${space.variable} min-h-screen flex flex-col bg-muted/30`}>
        <Providers>
          <Header />
          <main className="flex-1 pt-4">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}