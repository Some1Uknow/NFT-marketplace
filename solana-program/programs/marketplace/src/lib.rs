#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, CloseAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("DHpGDWHEo3ubcRBcuDBaMR3KDYGH1j9rcSsYxcMsqzA9");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize_marketplace(ctx: Context<InitializeMarketplace>, fee_percentage: u16) -> Result<()> {
        require!(fee_percentage <= 1000, ErrorCode::InvalidFeePercentage); // Max 10%
        
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.admin = ctx.accounts.admin.key();
        marketplace.fee_percentage = fee_percentage;
        marketplace.total_listings = 0;
        marketplace.bump = ctx.bumps.marketplace;
        
        msg!("Marketplace initialized with admin: {:?}, fee: {}bps", marketplace.admin, fee_percentage);
        Ok(())
    }

    pub fn update_fee(ctx: Context<UpdateMarketplace>, new_fee_percentage: u16) -> Result<()> {
        require!(new_fee_percentage <= 1000, ErrorCode::InvalidFeePercentage); // Max 10%
        
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.fee_percentage = new_fee_percentage;
        
        msg!("Marketplace fee updated to: {}bps", new_fee_percentage);
        Ok(())
    }

    pub fn update_listing_price(ctx: Context<UpdateListingPrice>, new_price: u64) -> Result<()> {
        require!(new_price > 0, ErrorCode::InvalidPrice);
        
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, ErrorCode::ListingNotActive);
        require!(listing.seller == ctx.accounts.seller.key(), ErrorCode::Unauthorized);
        
        let old_price = listing.price;
        listing.price = new_price;
        
        msg!("Listing price updated from {} to {}", old_price, new_price);
        Ok(())
    }

    pub fn list_nft(ctx: Context<ListNft>, price: u64) -> Result<()> {
        require!(price > 0, ErrorCode::InvalidPrice);
        
        let listing = &mut ctx.accounts.listing;
        
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.bump = ctx.bumps.listing;
        listing.is_active = true;
        
        // Update marketplace total_listings
        ctx.accounts.marketplace.total_listings = ctx.accounts.marketplace.total_listings
            .checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Transfer NFT from seller to marketplace escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, 1)?;
        
        msg!("NFT listed for sale: {:?} at price: {}", listing.nft_mint, price);
        Ok(())
    }

    pub fn buy_nft(ctx: Context<BuyNft>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        // Validation is now done in account constraints
        
        // Store values we need before borrowing marketplace mutably
        let price = listing.price;
        let nft_mint = listing.nft_mint;
        let seller_pubkey = listing.seller;
        
        // Calculate fee and seller amount
        let fee_amount = (price as u128)
            .checked_mul(ctx.accounts.marketplace.fee_percentage as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::ArithmeticOverflow)? as u64;
        
        let seller_amount = price
            .checked_sub(fee_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Store marketplace info before mutable borrow
        let marketplace_admin = ctx.accounts.marketplace.admin;
        let marketplace_bump = ctx.accounts.marketplace.bump;
        
        // Transfer payment to seller
        let seller_transfer = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &seller_pubkey,
            seller_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &seller_transfer,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Transfer fee to marketplace admin
        if fee_amount > 0 {
            let fee_transfer = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &marketplace_admin,
                fee_amount,
            );
            anchor_lang::solana_program::program::invoke(
                &fee_transfer,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts.admin.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
        
        // Transfer NFT from escrow to buyer
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.marketplace.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        let marketplace_seeds = &[
            b"marketplace",
            marketplace_admin.as_ref(),
            &[marketplace_bump],
        ];
        let signer_seeds = &[&marketplace_seeds[..]];
        token::transfer(cpi_ctx.with_signer(signer_seeds), 1)?;
        
        // Close escrow token account and return rent to seller
        let close_accounts = CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.seller.to_account_info(),
            authority: ctx.accounts.marketplace.to_account_info(),
        };
        let close_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            close_accounts,
        );
        token::close_account(close_ctx.with_signer(signer_seeds))?;
        
        // Update listing and marketplace
        listing.is_active = false;
        ctx.accounts.marketplace.total_listings = ctx.accounts.marketplace.total_listings
            .checked_sub(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("NFT purchased: {:?} for {}", nft_mint, price);
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        // Validation is now done in account constraints
        
        // Store values before mutable borrow
        let nft_mint = listing.nft_mint;
        let marketplace_admin = ctx.accounts.marketplace.admin;
        let marketplace_bump = ctx.accounts.marketplace.bump;
        
        // Transfer NFT back to seller
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.marketplace.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        let marketplace_seeds = &[
            b"marketplace",
            marketplace_admin.as_ref(),
            &[marketplace_bump],
        ];
        let signer_seeds = &[&marketplace_seeds[..]];
        token::transfer(cpi_ctx.with_signer(signer_seeds), 1)?;
        
        // Close escrow token account and return rent to seller
        let close_accounts = CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.seller.to_account_info(),
            authority: ctx.accounts.marketplace.to_account_info(),
        };
        let close_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            close_accounts,
        );
        token::close_account(close_ctx.with_signer(signer_seeds))?;
        
        // Update listing and marketplace
        listing.is_active = false;
        ctx.accounts.marketplace.total_listings = ctx.accounts.marketplace.total_listings
            .checked_sub(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("Listing cancelled for NFT: {:?}", nft_mint);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 2 + 8 + 1,
        seeds = [b"marketplace", admin.key().as_ref()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListNft<'info> {
    #[account(
        mut,
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8 + 1 + 1,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        init,
        payer = seller,
        token::mint = nft_mint,
        token::authority = marketplace,
        seeds = [b"escrow", nft_mint.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        constraint = seller_token_account.amount == 1 @ ErrorCode::InsufficientNftBalance,
        constraint = seller_token_account.mint == nft_mint.key() @ ErrorCode::InvalidNftMint,
        constraint = seller_token_account.owner == seller.key() @ ErrorCode::InvalidTokenOwner
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub nft_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyNft<'info> {
    #[account(
        mut,
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump = listing.bump,
        constraint = listing.is_active @ ErrorCode::ListingNotActive,
        constraint = listing.seller == seller.key() @ ErrorCode::InvalidSeller
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [b"escrow", nft_mint.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = seller.key() == listing.seller @ ErrorCode::InvalidSeller
    )]
    /// CHECK: Validated against listing.seller
    pub seller: AccountInfo<'info>,
    #[account(
        mut,
        constraint = admin.key() == marketplace.admin @ ErrorCode::InvalidAdmin
    )]
    /// CHECK: Validated against marketplace.admin
    pub admin: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    pub nft_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump = listing.bump,
        constraint = listing.is_active @ ErrorCode::ListingNotActive,
        constraint = listing.seller == seller.key() @ ErrorCode::Unauthorized
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [b"escrow", nft_mint.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = seller
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub nft_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct UpdateMarketplace<'info> {
    #[account(
        mut,
        seeds = [b"marketplace", admin.key().as_ref()],
        bump = marketplace.bump,
        has_one = admin @ ErrorCode::Unauthorized
    )]
    pub marketplace: Account<'info, Marketplace>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateListingPrice<'info> {
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    pub seller: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
}

#[account]
pub struct Marketplace {
    pub admin: Pubkey,
    pub fee_percentage: u16,
    pub total_listings: u64,
    pub bump: u8,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub bump: u8,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid price - must be greater than 0")]
    InvalidPrice,
    #[msg("Insufficient NFT balance")]
    InsufficientNftBalance,
    #[msg("Invalid NFT mint")]
    InvalidNftMint,
    #[msg("Invalid token owner")]
    InvalidTokenOwner,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Invalid fee percentage - must be <= 1000 (10%)")]
    InvalidFeePercentage,
    #[msg("Invalid seller account")]
    InvalidSeller,
    #[msg("Invalid admin account")]
    InvalidAdmin,
}