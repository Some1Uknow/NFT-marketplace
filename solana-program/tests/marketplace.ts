import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAssociatedTokenAddress, createAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("NFT Marketplace", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Marketplace as Program<Marketplace>;
  const provider = anchor.getProvider();
  const connection = provider.connection;

  let marketplace: web3.PublicKey;
  let nftMint: web3.PublicKey;
  let sellerTokenAccount: web3.PublicKey;
  let buyerTokenAccount: web3.PublicKey;
  let escrowTokenAccount: web3.PublicKey;
  let listing: web3.PublicKey;

  const seller = web3.Keypair.generate();
  const buyer = web3.Keypair.generate();
  const price = new BN(1000000000); // 1 SOL

  before(async () => {
    // Airdrop SOL to seller and buyer
    const sellerAirdrop = await connection.requestAirdrop(seller.publicKey, 2 * web3.LAMPORTS_PER_SOL);
    const buyerAirdrop = await connection.requestAirdrop(buyer.publicKey, 2 * web3.LAMPORTS_PER_SOL);
    
    await Promise.all([
      connection.confirmTransaction(sellerAirdrop),
      connection.confirmTransaction(buyerAirdrop)
    ]);

    // Initialize marketplace
    [marketplace] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), provider.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeMarketplace(250) // 2.5% fee
      .accounts({
        admin: provider.publicKey,
      })
      .rpc();

    // Create NFT mint
    nftMint = await createMint(
      connection,
      seller,
      seller.publicKey,
      null,
      0
    );

    // Create token accounts
    sellerTokenAccount = await createAssociatedTokenAccount(
      connection,
      seller,
      nftMint,
      seller.publicKey
    );

    buyerTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      buyer.publicKey
    );

    [listing] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), nftMint.toBuffer()],
      program.programId
    );

    [escrowTokenAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), nftMint.toBuffer()],
      program.programId
    );

    // Mint NFT to seller
    await mintTo(
      connection,
      seller,
      nftMint,
      sellerTokenAccount,
      seller,
      1
    );
  });

  it("Initializes marketplace", async () => {
    const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
    expect(marketplaceAccount.admin.toString()).to.equal(provider.publicKey.toString());
    expect(marketplaceAccount.feePercentage).to.equal(250);
    expect(marketplaceAccount.totalListings.toString()).to.equal("0");
  });

  it("Lists NFT for sale", async () => {
    await program.methods
      .listNft(price)
      .accountsPartial({
        marketplace,
        seller: seller.publicKey,
        sellerTokenAccount,
        nftMint,
      })
      .signers([seller])
      .rpc();

    const listingAccount = await program.account.listing.fetch(listing);
    expect(listingAccount.seller.toString()).to.equal(seller.publicKey.toString());
    expect(listingAccount.nftMint.toString()).to.equal(nftMint.toString());
    expect(listingAccount.price.toString()).to.equal(price.toString());
    expect(listingAccount.isActive).to.be.true;

    const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
    expect(marketplaceAccount.totalListings.toString()).to.equal("1");
  });

  it("Buys NFT", async () => {
    // Note: Buyer ATA will be created automatically by init_if_needed

    await program.methods
      .buyNft()
      .accountsPartial({
        marketplace,
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        admin: provider.publicKey,
        nftMint,
      })
      .signers([buyer])
      .rpc();

    const listingAccount = await program.account.listing.fetch(listing);
    expect(listingAccount.isActive).to.be.false;

    const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
    expect(marketplaceAccount.totalListings.toString()).to.equal("0");

    // Check buyer received NFT
    const buyerTokenAccountInfo = await connection.getTokenAccountBalance(buyerTokenAccount);
    expect(buyerTokenAccountInfo.value.amount).to.equal("1");
  });

  it("Cancels listing", async () => {
    // Create new NFT for cancellation test
    const newNftMint = await createMint(
      connection,
      seller,
      seller.publicKey,
      null,
      0
    );

    const newSellerTokenAccount = await createAssociatedTokenAccount(
      connection,
      seller,
      newNftMint,
      seller.publicKey
    );

    await mintTo(
      connection,
      seller,
      newNftMint,
      newSellerTokenAccount,
      seller,
      1
    );

    const [newListing] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), newNftMint.toBuffer()],
      program.programId
    );

    const [newEscrowTokenAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), newNftMint.toBuffer()],
      program.programId
    );

    // List the new NFT
    await program.methods
      .listNft(price)
      .accountsPartial({
        marketplace,
        seller: seller.publicKey,
        sellerTokenAccount: newSellerTokenAccount,
        nftMint: newNftMint,
      })
      .signers([seller])
      .rpc();

    // Cancel the listing
    await program.methods
      .cancelListing()
      .accountsPartial({
        marketplace,
        seller: seller.publicKey,
        sellerTokenAccount: newSellerTokenAccount,
        nftMint: newNftMint,
      })
      .signers([seller])
      .rpc();

    const listingAccount = await program.account.listing.fetch(newListing);
    expect(listingAccount.isActive).to.be.false;

    // Check seller got NFT back
    const sellerTokenAccountInfo = await connection.getTokenAccountBalance(newSellerTokenAccount);
    expect(sellerTokenAccountInfo.value.amount).to.equal("1");
  });
});
