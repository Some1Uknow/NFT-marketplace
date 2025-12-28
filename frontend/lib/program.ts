import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { Marketplace } from "./marketplace";
import idl from "./marketplace.json";
import { PROGRAM_ID, PLACEHOLDER_IMAGE } from "./constants";

export type { Marketplace };

// Get the program instance
export function getProgram(provider: AnchorProvider): Program<Marketplace> {
  return new Program(idl as Marketplace, provider);
}

// Derive marketplace PDA
export function getMarketplacePDA(admin: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), admin.toBuffer()],
    PROGRAM_ID
  );
}

// Derive listing PDA
export function getListingPDA(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), nftMint.toBuffer()],
    PROGRAM_ID
  );
}

// Derive escrow token account PDA
export function getEscrowPDA(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), nftMint.toBuffer()],
    PROGRAM_ID
  );
}

// Initialize marketplace (one-time setup)
export async function initializeMarketplace(
  program: Program<Marketplace>,
  feePercentage: number = 200 // Default 2% fee (200 basis points)
): Promise<string> {
  const admin = program.provider.publicKey!;
  const [marketplacePDA] = getMarketplacePDA(admin);
  
  const tx = await program.methods
    .initializeMarketplace(feePercentage)
    .accountsPartial({
      marketplace: marketplacePDA,
      admin,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Find marketplace for a given listing (by finding admin from listing data)
export async function findMarketplaceForListing(
  program: Program<Marketplace>,
  nftMint: PublicKey
): Promise<{ marketplacePDA: PublicKey; admin: PublicKey; feePercent: number } | null> {
  try {
    // Fetch all marketplace accounts
    const marketplaces = await program.account.marketplace.all();
    if (marketplaces.length > 0) {
      const mp = marketplaces[0];
      const admin = mp.account.admin as PublicKey;
      const [marketplacePDA] = getMarketplacePDA(admin);
      return {
        marketplacePDA,
        admin,
        feePercent: mp.account.feePercentage as number,
      };
    }
    return null;
  } catch (error) {
    console.error("Error finding marketplace:", error);
    return null;
  }
}

// Get marketplace by admin
export async function getMarketplace(
  program: Program<Marketplace>,
  admin: PublicKey
): Promise<{ admin: PublicKey; feePercent: number; totalListings: number } | null> {
  try {
    const [marketplacePDA] = getMarketplacePDA(admin);
    const marketplace = await program.account.marketplace.fetch(marketplacePDA);
    return {
      admin: marketplace.admin as PublicKey,
      feePercent: marketplace.feePercentage as number,
      totalListings: (marketplace.totalListings as BN).toNumber(),
    };
  } catch (error) {
    // Try to find any marketplace
    try {
      const marketplaces = await program.account.marketplace.all();
      if (marketplaces.length > 0) {
        const mp = marketplaces[0].account;
        return {
          admin: mp.admin as PublicKey,
          feePercent: mp.feePercentage as number,
          totalListings: (mp.totalListings as BN).toNumber(),
        };
      }
    } catch (e) {
      console.error("Error fetching marketplaces:", e);
    }
    return null;
  }
}

// Listing account data type
export interface ListingAccount {
  seller: PublicKey;
  nftMint: PublicKey;
  price: BN;
  bump: number;
  isActive: boolean;
  feePercent?: number; // Added from marketplace for convenience
}

// Marketplace account data type
export interface MarketplaceAccount {
  admin: PublicKey;
  feePercentage: number;
  totalListings: BN;
  bump: number;
}

// NFT metadata type
export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family?: string;
  };
}

// Extended listing with metadata
export interface ListingWithMetadata {
  publicKey: PublicKey;
  account: ListingAccount;
  metadata?: NFTMetadata;
}

// Fetch all active listings
export async function fetchAllListings(
  program: Program<Marketplace>
): Promise<ListingWithMetadata[]> {
  try {
    const listings = await program.account.listing.all();
    
    // Get fee percent from marketplace
    let feePercent = 2; // Default fee
    try {
      const marketplaces = await program.account.marketplace.all();
      if (marketplaces.length > 0) {
        feePercent = marketplaces[0].account.feePercentage as number;
      }
    } catch {
      // Use default fee
    }
    
    return listings
      .filter((l) => l.account.isActive)
      .map((l) => ({
        publicKey: l.publicKey,
        account: {
          ...(l.account as unknown as ListingAccount),
          feePercent,
        },
      }));
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
}

// Fetch single listing
export async function fetchListing(
  program: Program<Marketplace>,
  nftMint: PublicKey
): Promise<ListingWithMetadata | null> {
  try {
    const [listingPDA] = getListingPDA(nftMint);
    const listing = await program.account.listing.fetch(listingPDA);
    
    // Get fee percent from marketplace
    let feePercent = 2; // Default fee
    try {
      const marketplaces = await program.account.marketplace.all();
      if (marketplaces.length > 0) {
        feePercent = marketplaces[0].account.feePercentage as number;
      }
    } catch {
      // Use default fee
    }
    
    return {
      publicKey: listingPDA,
      account: {
        ...(listing as unknown as ListingAccount),
        feePercent,
      },
    };
  } catch (error) {
    console.error("Error fetching listing:", error);
    return null;
  }
}

// List NFT for sale (auto-initializes marketplace if needed)
export async function listNft(
  program: Program<Marketplace>,
  nftMint: PublicKey,
  priceInLamports: number
): Promise<string> {
  const seller = program.provider.publicKey!;
  
  // Find or initialize the marketplace
  let mpInfo = await findMarketplaceForListing(program, nftMint);
  if (!mpInfo) {
    if (process.env.NODE_ENV === "development") {
      console.log("No marketplace found, initializing...");
    }
    try {
      await initializeMarketplace(program);
      // Fetch the newly created marketplace
      mpInfo = await findMarketplaceForListing(program, nftMint);
      if (!mpInfo) {
        throw new Error("Failed to initialize marketplace");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error initializing marketplace:", error);
      }
      throw new Error("Failed to initialize marketplace. Please try again.");
    }
  }
  
  // Get seller's token account
  const sellerTokenAccount = await getAssociatedTokenAddress(nftMint, seller);
  
  const tx = await program.methods
    .listNft(new BN(priceInLamports))
    .accountsPartial({
      marketplace: mpInfo.marketplacePDA,
      seller,
      sellerTokenAccount,
      nftMint,
    })
    .rpc();
  
  return tx;
}

// Buy NFT (simplified - auto-derives PDAs)
export async function buyNft(
  program: Program<Marketplace>,
  nftMint: PublicKey
): Promise<string> {
  const buyer = program.provider.publicKey!;
  
  // Get listing info
  const listing = await fetchListing(program, nftMint);
  if (!listing) {
    throw new Error("Listing not found");
  }
  
  // Find marketplace
  const mpInfo = await findMarketplaceForListing(program, nftMint);
  if (!mpInfo) {
    throw new Error("Marketplace not found");
  }
  
  const tx = await program.methods
    .buyNft()
    .accountsPartial({
      marketplace: mpInfo.marketplacePDA,
      buyer,
      seller: listing.account.seller,
      admin: mpInfo.admin,
      nftMint,
    })
    .rpc();
  
  return tx;
}

// Cancel listing (simplified - auto-derives PDAs)
export async function cancelListing(
  program: Program<Marketplace>,
  nftMint: PublicKey
): Promise<string> {
  const seller = program.provider.publicKey!;
  
  // Find marketplace
  const mpInfo = await findMarketplaceForListing(program, nftMint);
  if (!mpInfo) {
    throw new Error("Marketplace not found");
  }
  
  // Get seller's token account
  const sellerTokenAccount = await getAssociatedTokenAddress(nftMint, seller);
  
  const tx = await program.methods
    .cancelListing()
    .accountsPartial({
      marketplace: mpInfo.marketplacePDA,
      seller,
      sellerTokenAccount,
      nftMint,
    })
    .rpc();
  
  return tx;
}

// Update listing price
export async function updateListingPrice(
  program: Program<Marketplace>,
  nftMint: PublicKey,
  newPriceInLamports: number
): Promise<string> {
  const tx = await program.methods
    .updateListingPrice(new BN(newPriceInLamports))
    .accountsPartial({
      seller: program.provider.publicKey,
      nftMint,
    })
    .rpc();
  
  return tx;
}

// Metaplex metadata constants
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Derive Metaplex metadata PDA
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return pda;
}

// Fetch NFT metadata from on-chain using Metaplex standard
export async function fetchNFTMetadataFromChain(
  connection: Connection,
  mint: PublicKey
): Promise<NFTMetadata | undefined> {
  try {
    // Get metadata account PDA
    const metadataPDA = getMetadataPDA(mint);
    
    // Fetch the metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    
    if (!metadataAccount) {
      return undefined;
    }

    // Parse the metadata account data
    // Metaplex metadata layout: key(1) + update_authority(32) + mint(32) + name(36) + symbol(14) + uri(204) + ...
    const data = metadataAccount.data;
    
    // Skip key (1 byte)
    let offset = 1;
    
    // Skip update authority (32 bytes)
    offset += 32;
    
    // Skip mint (32 bytes)
    offset += 32;
    
    // Read name (4 bytes length + string)
    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const nameBytes = data.slice(offset, offset + nameLength);
    const name = nameBytes.toString('utf8').replace(/\0/g, '').trim();
    offset += 32; // Name field is padded to 32 bytes
    
    // Read symbol (4 bytes length + string)
    const symbolLength = data.readUInt32LE(offset);
    offset += 4;
    const symbolBytes = data.slice(offset, offset + symbolLength);
    const symbol = symbolBytes.toString('utf8').replace(/\0/g, '').trim();
    offset += 10; // Symbol field is padded to 10 bytes
    
    // Read URI (4 bytes length + string)
    const uriLength = data.readUInt32LE(offset);
    offset += 4;
    const uriBytes = data.slice(offset, offset + uriLength);
    const uri = uriBytes.toString('utf8').replace(/\0/g, '').trim();
    
    // If URI is a data URI, parse it directly
    if (uri.startsWith('data:application/json')) {
      try {
        const base64Data = uri.split(',')[1];
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        
        return {
          name: metadata.name || name,
          symbol: metadata.symbol || symbol,
          description: metadata.description || '',
          image: metadata.image || PLACEHOLDER_IMAGE,
          attributes: metadata.attributes || [],
          collection: metadata.collection,
        };
      } catch (err) {
        console.error('Error parsing data URI:', err);
      }
    } else if (uri.startsWith('http')) {
      // Try to fetch external metadata JSON
      try {
        const response = await fetch(uri);
        
        if (!response.ok) {
          console.error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        // Try to parse as JSON first (Irys returns application/octet-stream for JSON)
        const text = await response.text();
        
        try {
          const metadata = JSON.parse(text);
          
          // If it parses as JSON, it's metadata
          if (metadata && typeof metadata === 'object') {
            return {
              name: metadata.name || name,
              symbol: metadata.symbol || symbol,
              description: metadata.description || '',
              image: metadata.image || PLACEHOLDER_IMAGE,
              attributes: metadata.attributes || [],
              collection: metadata.collection,
            };
          }
        } catch (jsonErr) {
          // Not JSON, treat as direct image URL
          return {
            name,
            symbol,
            description: '',
            image: uri,
          };
        }
      } catch (err) {
        console.error('Error fetching external metadata:', err);
        // Fallback: assume URI is a direct image link
        return {
          name,
          symbol,
          description: '',
          image: uri,
        };
      }
    }
    
    // Fallback: return basic metadata from on-chain data
    return {
      name,
      symbol,
      description: '',
      image: PLACEHOLDER_IMAGE,
    };
  } catch (error) {
    console.error('Error fetching metadata from chain:', error);
    return undefined;
  }
}
