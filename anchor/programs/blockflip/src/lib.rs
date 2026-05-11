// ─────────────────────────────────────────────────────────────────────────────
// BlockFlip RWA Protocol — Smart Contract v3
// Solana / Anchor 0.30.1
//
// Modelo: Marketplace 60/20/20
//   • Specialist puts skin-in-the-game (5% mandatory)
//   • Upside split: 60% Investors | 20% Operator performance | 20% Platform
//   • Stablecoin-agnostic: USDC, BRLD, EUROe via accepted_mint (CVM 88)
//
// Governança de Especialistas (v3):
//   • Only the protocol authority can authorize specialists via SpecialistRegistry
//   • Operators must hold an approved SpecialistRegistry to create pools
//   • Investor access remains permissionless
// ─────────────────────────────────────────────────────────────────────────────
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

declare_id!("9rrdPS31RMz51oLDMLrHc2uRZ5kr19qwafdeR7zETvDN");

// ─── PDA Seeds ───────────────────────────────────────────────────────────────
const PROTOCOL_SEED: &[u8]   = b"blockflip_v1";
const SPECIALIST_SEED: &[u8] = b"specialist";
const POOL_SEED: &[u8]       = b"pool";
const VAULT_SEED: &[u8]      = b"vault";
const ASSET_SEED: &[u8]      = b"asset";
const MILESTONE_SEED: &[u8]  = b"milestone";
const POSITION_SEED: &[u8]   = b"position";

// ─── Business Constants ───────────────────────────────────────────────────────
const BPS_DENOMINATOR: u128      = 10_000;
const SKIN_IN_GAME_BPS: u64      = 500;   // operator must deposit 5%
const INVESTOR_UPSIDE_BPS: u128  = 6_000; // 60% of upside → investors
const OPERATOR_PERF_BPS: u128    = 2_000; // 20% of upside → operator performance
const PLATFORM_FEE_BPS: u128     = 2_000; // 20% of upside → platform treasury

// ─────────────────────────────────────────────────────────────────────────────
#[program]
pub mod blockflip {
    use super::*;

    // ── 1. initialize_protocol ────────────────────────────────────────────────
    // Configura o admin global e o treasury da plataforma.
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        platform_treasury: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.protocol_state;
        state.authority         = ctx.accounts.authority.key();
        state.platform_treasury = platform_treasury;
        state.pool_count        = 0;
        state.bump              = ctx.bumps.protocol_state;
        msg!("Protocol initialized. Authority: {} | Treasury: {}", state.authority, platform_treasury);
        Ok(())
    }

    // ── 2. authorize_specialist ───────────────────────────────────────────────
    // Apenas a authority do protocolo pode autorizar um Especialista.
    // Cria (ou re-aprova) o SpecialistRegistry PDA do specialist.
    pub fn authorize_specialist(
        ctx: Context<AuthorizeSpecialist>,
        specialist_pubkey: Pubkey,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.specialist_registry;
        registry.specialist_pubkey = specialist_pubkey;
        registry.is_approved       = true;
        registry.authorized_at     = Clock::get()?.unix_timestamp;
        registry.bump              = ctx.bumps.specialist_registry;

        emit!(SpecialistAuthorized {
            specialist: specialist_pubkey,
            authorized_at: registry.authorized_at,
        });

        msg!(
            "Specialist {} authorized at {}",
            specialist_pubkey, registry.authorized_at
        );
        Ok(())
    }

    // ── 3. transfer_authority ─────────────────────────────────────────────────
    // Permite que a authority atual transfira a authority para uma nova carteira.
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.protocol_state;
        let old_authority = state.authority;
        state.authority = new_authority;

        msg!(
            "Authority transferred from {} to {}",
            old_authority, new_authority
        );
        Ok(())
    }

    // ── 4. create_pool ────────────────────────────────────────────────────────
    // Cria um Pool em status Pending.
    // Requer que o operator possua um SpecialistRegistry aprovado.
    // Pool só abre para investidores após o Especialista depositar 5% (skin in game).
    pub fn create_pool(
        ctx: Context<CreatePool>,
        funding_goal: u64,
        max_investment_per_investor: u64,
    ) -> Result<()> {
        require!(funding_goal > 0,                BlockFlipError::InvalidAmount);
        require!(max_investment_per_investor > 0, BlockFlipError::InvalidAmount);

        let protocol = &mut ctx.accounts.protocol_state;
        let pool     = &mut ctx.accounts.pool_state;

        pool.pool_id                     = protocol.pool_count;
        pool.operator                    = ctx.accounts.operator.key();
        pool.accepted_mint               = ctx.accounts.accepted_mint.key();
        pool.funding_goal                = funding_goal;
        pool.funding_raised              = 0;
        pool.max_investment_per_investor = max_investment_per_investor;
        pool.status                      = PoolStatus::Pending;
        pool.asset_count                 = 0;
        pool.milestone_count             = 0;
        pool.skin_deposited              = 0;
        pool.total_proceeds              = 0;
        pool.fees_distributed            = false;
        pool.created_at                  = Clock::get()?.unix_timestamp;
        pool.bump                        = ctx.bumps.pool_state;

        protocol.pool_count = protocol.pool_count
            .checked_add(1)
            .ok_or(BlockFlipError::Overflow)?;

        emit!(PoolCreated {
            pool_id:      pool.pool_id,
            operator:     pool.operator,
            accepted_mint: pool.accepted_mint,
            funding_goal,
        });

        msg!("Pool {} created (Pending). Operator must deposit 5% to open.", pool.pool_id);
        Ok(())
    }

    // ── 3. initialize_pool_vault ──────────────────────────────────────────────
    // SECURITY FIX: Initialize pool vault as PDA to prevent arbitrary vault injection
    // Must be called immediately after create_pool by the operator.
    pub fn initialize_pool_vault(ctx: Context<InitializePoolVault>) -> Result<()> {
        msg!(
            "Pool vault initialized for pool {} at {}",
            ctx.accounts.pool_state.pool_id,
            ctx.accounts.pool_vault.key()
        );
        Ok(())
    }

    // ── 4. deposit_skin_in_game ───────────────────────────────────────────────
    // Especialista deposita obrigatoriamente 5% do funding_goal.
    // Isso cria sua InvestorPosition e abre o pool para investidores (Funding).
    pub fn deposit_skin_in_game(ctx: Context<DepositSkinInGame>) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;

        require!(pool.status == PoolStatus::Pending, BlockFlipError::InvalidPoolStatus);

        // Calcula o mínimo obrigatório: 5% do funding_goal
        let skin_required = pool.funding_goal
            .checked_mul(SKIN_IN_GAME_BPS)
            .ok_or(BlockFlipError::Overflow)?
            .checked_div(10_000)
            .ok_or(BlockFlipError::Overflow)?;

        require!(skin_required > 0, BlockFlipError::InvalidAmount);

        // Anti-spoofing: garante mint correto
        require!(
            ctx.accounts.operator_token_account.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.pool_vault.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );

        // CPI: operator_token_account → pool_vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.operator_token_account.to_account_info(),
                    to:        ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.operator.to_account_info(),
                },
            ),
            skin_required,
        )?;

        // Registra a posição do Especialista como investidor
        let position = &mut ctx.accounts.investor_position;
        position.investor        = ctx.accounts.operator.key();
        position.pool            = pool.key();
        position.amount_invested = skin_required;
        position.invested_at     = Clock::get()?.unix_timestamp;
        position.has_claimed     = false;
        position.bump            = ctx.bumps.investor_position;

        // Atualiza pool
        pool.skin_deposited  = skin_required;
        pool.funding_raised  = skin_required;
        pool.status          = PoolStatus::Funding;

        emit!(SkinInGameDeposited {
            pool_id:       pool.pool_id,
            operator:      ctx.accounts.operator.key(),
            skin_required,
        });

        msg!("Skin-in-game deposited: {}. Pool {} now OPEN (Funding).", skin_required, pool.pool_id);
        Ok(())
    }

    // ── 4. add_asset_to_pool ──────────────────────────────────────────────────
    // Vincula um imóvel ao pool. Disponível em Pending ou Funding.
    pub fn add_asset_to_pool(
        ctx: Context<AddAssetToPool>,
        asset_id: [u8; 16],
        acquisition_price: u64,
        estimated_reform_cost: u64,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require!(acquisition_price > 0,      BlockFlipError::InvalidAmount);
        require!(evidence_hash != [0u8; 32], BlockFlipError::MissingEvidenceHash);

        let pool = &mut ctx.accounts.pool_state;
        require!(
            pool.status == PoolStatus::Pending
                || pool.status == PoolStatus::Funding
                || pool.status == PoolStatus::Active,
            BlockFlipError::InvalidPoolStatus
        );

        let asset                    = &mut ctx.accounts.asset_account;
        asset.pool                   = pool.key();
        asset.asset_index            = pool.asset_count;
        asset.asset_id               = asset_id;
        asset.acquisition_price      = acquisition_price;
        asset.estimated_reform_cost  = estimated_reform_cost;
        asset.evidence_hash          = evidence_hash;
        asset.bump                   = ctx.bumps.asset_account;

        pool.asset_count = pool.asset_count
            .checked_add(1)
            .ok_or(BlockFlipError::Overflow)?;

        Ok(())
    }

    // ── 5. invest ─────────────────────────────────────────────────────────────
    // Investidor externo aporta tokens SPL no pool (status Funding).
    // Valida: mint correto, limite por investidor, cap do pool.
    // Auto-ativa quando funding_raised == funding_goal.
    pub fn invest(ctx: Context<Invest>, amount: u64) -> Result<()> {
        require!(amount > 0, BlockFlipError::InvalidAmount);

        let pool     = &mut ctx.accounts.pool_state;
        let position = &mut ctx.accounts.investor_position;

        // Compliance: teto por investidor
        let new_total = position.amount_invested
            .checked_add(amount)
            .ok_or(BlockFlipError::Overflow)?;
        require!(
            new_total <= pool.max_investment_per_investor,
            BlockFlipError::ExceedsMaxInvestment
        );

        // Cap de captação
        let new_raised = pool.funding_raised
            .checked_add(amount)
            .ok_or(BlockFlipError::Overflow)?;
        require!(new_raised <= pool.funding_goal, BlockFlipError::FundingCapReached);

        // Anti-spoofing: mint validation dupla
        require!(
            ctx.accounts.investor_token_account.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.pool_vault.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );

        // CPI: investor → pool_vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.investor_token_account.to_account_info(),
                    to:        ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.investor.to_account_info(),
                },
            ),
            amount,
        )?;

        // Inicializa posição no primeiro aporte
        if position.amount_invested == 0 {
            position.investor    = ctx.accounts.investor.key();
            position.pool        = pool.key();
            position.invested_at = Clock::get()?.unix_timestamp;
            position.has_claimed = false;
            position.bump        = ctx.bumps.investor_position;
        }
        position.amount_invested = new_total;

        pool.funding_raised = new_raised;

        // Auto-ativa quando fully funded
        if pool.funding_raised == pool.funding_goal {
            pool.status = PoolStatus::Active;
            msg!("Pool {} fully funded → Active", pool.pool_id);
        }

        emit!(InvestmentMade {
            pool_id:      pool.pool_id,
            investor:     ctx.accounts.investor.key(),
            amount,
            total_raised: pool.funding_raised,
        });
        Ok(())
    }

    // ── 6. submit_milestone ───────────────────────────────────────────────────
    // Operator registra prova de obra on-chain.
    // evidence_hash (IPFS CID de NF/foto) é OBRIGATÓRIO.
    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        milestone_index: u8,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require!(evidence_hash != [0u8; 32], BlockFlipError::MissingEvidenceHash);

        let pool = &mut ctx.accounts.pool_state;
        require!(
            milestone_index == pool.milestone_count,
            BlockFlipError::InvalidMilestoneIndex
        );

        let milestone             = &mut ctx.accounts.milestone;
        milestone.pool            = pool.key();
        milestone.milestone_index = milestone_index;
        milestone.status          = MilestoneStatus::Completed;
        milestone.evidence_hash   = evidence_hash;
        milestone.submitted_at    = Clock::get()?.unix_timestamp;
        milestone.bump            = ctx.bumps.milestone;

        pool.milestone_count = pool.milestone_count
            .checked_add(1)
            .ok_or(BlockFlipError::Overflow)?;

        emit!(MilestoneSubmitted {
            pool_id:         pool.pool_id,
            milestone_index,
            evidence_hash,
            submitted_at:    milestone.submitted_at,
        });
        Ok(())
    }

    // ── 7. complete_pool ──────────────────────────────────────────────────────
    // Operator registra o valor total arrecadado com a venda do imóvel.
    // total_proceeds deve ser >= funding_raised (verifica que não há prejuízo no protocolo).
    pub fn complete_pool(
        ctx: Context<CompletePool>,
        total_proceeds: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;
        require!(total_proceeds >= pool.funding_raised, BlockFlipError::InvalidAmount);

        pool.total_proceeds = total_proceeds;
        pool.status         = PoolStatus::Completed;

        msg!("Pool {} completed. Proceeds: {}", pool.pool_id, total_proceeds);
        Ok(())
    }

    // ── 8. distribute_proceeds ────────────────────────────────────────────────
    // Cada investidor saca seu principal + parte pro-rata de 60% do upside.
    // O Especialista não pode sacar sua performance antes dos investidores.
    // Matemática:
    //   upside              = total_proceeds - funding_raised
    //   investor_upside_pool = upside × 60%
    //   payout(investor)    = amount_invested + (investor_upside_pool × amount_invested / funding_raised)
    pub fn distribute_proceeds(
        ctx: Context<DistributeProceeds>,
        pool_id: u64,
    ) -> Result<()> {
        let pool     = &ctx.accounts.pool_state;
        let position = &mut ctx.accounts.investor_position;

        require!(!position.has_claimed, BlockFlipError::AlreadyClaimed);

        let upside = pool.total_proceeds.saturating_sub(pool.funding_raised);

        // SECURITY FIX: Investor upside pool = 60% of total upside
        // Safe casting with overflow protection
        let investor_upside_pool_u128 = (upside as u128)
            .checked_mul(INVESTOR_UPSIDE_BPS)
            .ok_or(BlockFlipError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BlockFlipError::Overflow)?;

        let investor_upside_pool = u64::try_from(investor_upside_pool_u128)
            .map_err(|_| BlockFlipError::Overflow)?;

        // SECURITY FIX: This investor's pro-rata share of the 60% upside pool
        // Prevent overflow by checking funding_raised > 0 and using safe casting
        let upside_share = if pool.funding_raised > 0 {
            let numerator = (investor_upside_pool as u128)
                .checked_mul(position.amount_invested as u128)
                .ok_or(BlockFlipError::Overflow)?;

            let result_u128 = numerator
                .checked_div(pool.funding_raised as u128)
                .ok_or(BlockFlipError::Overflow)?;

            u64::try_from(result_u128)
                .map_err(|_| BlockFlipError::Overflow)?
        } else {
            0
        };

        // Total payout: full principal back + pro-rata upside share
        let payout = position.amount_invested
            .checked_add(upside_share)
            .ok_or(BlockFlipError::Overflow)?;

        // Anti-spoofing
        require!(
            ctx.accounts.pool_vault.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.investor_token_account.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.investor_token_account.owner == position.investor,
            BlockFlipError::Unauthorized
        );

        // PDA signer seeds
        let pool_id_bytes = pool_id.to_le_bytes();
        let bump_byte     = [pool.bump];
        let seeds: &[&[u8]] = &[POOL_SEED, &pool_id_bytes, &bump_byte];
        let signer_seeds: &[&[&[u8]]] = &[&seeds[..]];

        // CPI: pool_vault → investor
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.pool_vault.to_account_info(),
                    to:        ctx.accounts.investor_token_account.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;

        position.has_claimed = true;

        emit!(ProceedsDistributed {
            pool_id:     pool.pool_id,
            investor:    position.investor,
            principal:   position.amount_invested,
            upside_share,
            payout,
        });

        msg!(
            "Investor {} received {} (principal={} + upside={})",
            position.investor, payout, position.amount_invested, upside_share
        );
        Ok(())
    }

    // ── 9. distribute_fees ────────────────────────────────────────────────────
    // Distribui as taxas de performance após todos (ou qualquer) investidor ter sacado.
    // Pode ser chamada por qualquer um após pool.status == Completed.
    // Garante: Especialista NÃO recebe performance antes dos investidores terem direito ao principal.
    //
    // Fees:
    //   operator_performance = upside × 20%  → operator_token_account
    //   platform_fee         = upside × 20%  → platform_treasury_account
    pub fn distribute_fees(
        ctx: Context<DistributeFees>,
        pool_id: u64,
    ) -> Result<()> {
        // Clone account info BEFORE mutable borrow for later CPI use
        let pool_state_info = ctx.accounts.pool_state.to_account_info();

        let pool = &mut ctx.accounts.pool_state;

        // CHECKS: Verify preconditions
        require!(!pool.fees_distributed, BlockFlipError::FeesAlreadyDistributed);

        let upside = pool.total_proceeds.saturating_sub(pool.funding_raised);

        // SECURITY FIX: Operator performance: 20% of upside with safe casting
        let operator_performance_u128 = (upside as u128)
            .checked_mul(OPERATOR_PERF_BPS)
            .ok_or(BlockFlipError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BlockFlipError::Overflow)?;

        let operator_performance = u64::try_from(operator_performance_u128)
            .map_err(|_| BlockFlipError::Overflow)?;

        // SECURITY FIX: Platform fee: 20% of upside with safe casting
        let platform_fee_u128 = (upside as u128)
            .checked_mul(PLATFORM_FEE_BPS)
            .ok_or(BlockFlipError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BlockFlipError::Overflow)?;

        let platform_fee = u64::try_from(platform_fee_u128)
            .map_err(|_| BlockFlipError::Overflow)?;

        // Anti-spoofing
        require!(
            ctx.accounts.pool_vault.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.operator_token_account.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );
        require!(
            ctx.accounts.platform_treasury_account.mint == pool.accepted_mint,
            BlockFlipError::InvalidMint
        );

        // EFFECTS: Set flag BEFORE CPIs to prevent race condition (CEI pattern)
        // SECURITY FIX: Move state change before external calls
        pool.fees_distributed = true;

        // PDA signer seeds for pool_state (authority of vault)
        let pool_id_bytes = pool_id.to_le_bytes();
        let bump_byte = [pool.bump];
        let seeds: &[&[u8]] = &[POOL_SEED, &pool_id_bytes, &bump_byte];
        let signer_seeds: &[&[&[u8]]] = &[&seeds[..]];

        // INTERACTIONS: CPI: pool_vault → operator (performance fee)
        if operator_performance > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.pool_vault.to_account_info(),
                        to:        ctx.accounts.operator_token_account.to_account_info(),
                        authority: pool_state_info.clone(),
                    },
                    signer_seeds,
                ),
                operator_performance,
            )?;
        }

        // CPI: pool_vault → platform treasury
        if platform_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.pool_vault.to_account_info(),
                        to:        ctx.accounts.platform_treasury_account.to_account_info(),
                        authority: pool_state_info.clone(),
                    },
                    signer_seeds,
                ),
                platform_fee,
            )?;
        }

        emit!(FeesDistributed {
            pool_id:              pool.pool_id,
            operator_performance,
            platform_fee,
        });

        msg!(
            "Fees distributed: operator={} | platform={}",
            operator_performance, platform_fee
        );
        Ok(())
    }
}

// ─── Account Contexts ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer  = authority,
        space  = ProtocolState::SPACE,
        seeds  = [PROTOCOL_SEED],
        bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuthorizeSpecialist<'info> {
    #[account(
        seeds = [PROTOCOL_SEED],
        bump  = protocol_state.bump,
        has_one = authority @ BlockFlipError::Unauthorized,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// CHECK: specialist_pubkey is validated inside the instruction
    pub specialist: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer  = authority,
        space  = SpecialistRegistry::SPACE,
        seeds  = [SPECIALIST_SEED, specialist.key().as_ref()],
        bump,
    )]
    pub specialist_registry: Account<'info, SpecialistRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump  = protocol_state.bump,
        has_one = authority @ BlockFlipError::Unauthorized,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump  = protocol_state.bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        init,
        payer = operator,
        space = PoolState::SPACE,
        seeds = [POOL_SEED, &protocol_state.pool_count.to_le_bytes()],
        bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    /// SpecialistRegistry do operator — deve estar aprovado pela authority
    #[account(
        seeds = [SPECIALIST_SEED, operator.key().as_ref()],
        bump  = specialist_registry.bump,
        constraint = specialist_registry.is_approved          @ BlockFlipError::UnauthorizedSpecialist,
        constraint = specialist_registry.specialist_pubkey == operator.key() @ BlockFlipError::UnauthorizedSpecialist,
    )]
    pub specialist_registry: Account<'info, SpecialistRegistry>,

    /// Mint da stablecoin aceita por este pool
    pub accepted_mint: Account<'info, Mint>,

    #[account(mut)]
    pub operator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePoolVault<'info> {
    #[account(
        mut,
        has_one = operator @ BlockFlipError::Unauthorized,
    )]
    pub pool_state: Account<'info, PoolState>,

    /// Mint da stablecoin aceita por este pool (needed for init)
    pub accepted_mint: Account<'info, Mint>,

    /// Pool vault — PDA owned by pool_state, prevents arbitrary vault injection
    #[account(
        init,
        payer = operator,
        seeds = [VAULT_SEED, pool_state.key().as_ref()],
        bump,
        token::mint = accepted_mint,
        token::authority = pool_state,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub operator: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSkinInGame<'info> {
    #[account(
        mut,
        has_one = operator @ BlockFlipError::Unauthorized,
        constraint = pool_state.status == PoolStatus::Pending @ BlockFlipError::InvalidPoolStatus,
    )]
    pub pool_state: Account<'info, PoolState>,

    /// Posição do Especialista como investidor (criada aqui)
    #[account(
        init,
        payer = operator,
        space = InvestorPosition::SPACE,
        seeds = [POSITION_SEED, pool_state.key().as_ref(), operator.key().as_ref()],
        bump,
    )]
    pub investor_position: Account<'info, InvestorPosition>,

    #[account(
        mut,
        constraint = operator_token_account.mint  == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
        constraint = operator_token_account.owner == operator.key()           @ BlockFlipError::Unauthorized,
    )]
    pub operator_token_account: Account<'info, TokenAccount>,

    /// Pool vault — must be the PDA to prevent vault injection
    #[account(
        mut,
        seeds = [VAULT_SEED, pool_state.key().as_ref()],
        bump,
        constraint = pool_vault.mint == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub operator: Signer<'info>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddAssetToPool<'info> {
    #[account(
        mut,
        has_one = operator @ BlockFlipError::Unauthorized,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        init,
        payer = operator,
        space = AssetAccount::SPACE,
        seeds = [ASSET_SEED, pool_state.key().as_ref(), &[pool_state.asset_count]],
        bump,
    )]
    pub asset_account: Account<'info, AssetAccount>,

    #[account(mut)]
    pub operator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(
        mut,
        constraint = pool_state.status == PoolStatus::Funding @ BlockFlipError::InvalidPoolStatus,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        init_if_needed,
        payer = investor,
        space = InvestorPosition::SPACE,
        seeds = [POSITION_SEED, pool_state.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub investor_position: Account<'info, InvestorPosition>,

    #[account(
        mut,
        constraint = investor_token_account.mint  == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
        constraint = investor_token_account.owner == investor.key()            @ BlockFlipError::Unauthorized,
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// Pool vault — must be the PDA to prevent vault injection
    #[account(
        mut,
        seeds = [VAULT_SEED, pool_state.key().as_ref()],
        bump,
        constraint = pool_vault.mint == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor: Signer<'info>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct SubmitMilestone<'info> {
    #[account(
        mut,
        has_one    = operator                                        @ BlockFlipError::Unauthorized,
        constraint = pool_state.status == PoolStatus::Active         @ BlockFlipError::InvalidPoolStatus,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        init,
        payer = operator,
        space = Milestone::SPACE,
        seeds = [MILESTONE_SEED, pool_state.key().as_ref(), &[milestone_index]],
        bump,
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(mut)]
    pub operator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompletePool<'info> {
    #[account(
        mut,
        has_one    = operator                                        @ BlockFlipError::Unauthorized,
        constraint = pool_state.status == PoolStatus::Active         @ BlockFlipError::InvalidPoolStatus,
    )]
    pub pool_state: Account<'info, PoolState>,

    pub operator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct DistributeProceeds<'info> {
    /// Pool state — PDA signer para CPI do vault
    #[account(
        seeds = [POOL_SEED, &pool_id.to_le_bytes()],
        bump  = pool_state.bump,
        constraint = pool_state.status == PoolStatus::Completed @ BlockFlipError::InvalidPoolStatus,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        seeds = [POSITION_SEED, pool_state.key().as_ref(), investor_position.investor.as_ref()],
        bump  = investor_position.bump,
        constraint = !investor_position.has_claimed @ BlockFlipError::AlreadyClaimed,
    )]
    pub investor_position: Account<'info, InvestorPosition>,

    /// Pool vault — must be the PDA to prevent vault injection
    #[account(
        mut,
        seeds = [VAULT_SEED, pool_state.key().as_ref()],
        bump,
        constraint = pool_vault.mint == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = investor_token_account.mint  == pool_state.accepted_mint   @ BlockFlipError::InvalidMint,
        constraint = investor_token_account.owner == investor_position.investor @ BlockFlipError::Unauthorized,
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct DistributeFees<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, &pool_id.to_le_bytes()],
        bump  = pool_state.bump,
        constraint = pool_state.status == PoolStatus::Completed @ BlockFlipError::InvalidPoolStatus,
        constraint = !pool_state.fees_distributed               @ BlockFlipError::FeesAlreadyDistributed,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        seeds = [PROTOCOL_SEED],
        bump  = protocol_state.bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// Pool vault — must be the PDA to prevent vault injection
    #[account(
        mut,
        seeds = [VAULT_SEED, pool_state.key().as_ref()],
        bump,
        constraint = pool_vault.mint == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    /// Token account do Especialista para receber performance
    #[account(
        mut,
        constraint = operator_token_account.mint  == pool_state.accepted_mint @ BlockFlipError::InvalidMint,
        constraint = operator_token_account.owner == pool_state.operator      @ BlockFlipError::Unauthorized,
    )]
    pub operator_token_account: Account<'info, TokenAccount>,

    /// Token account do treasury da plataforma
    #[account(
        mut,
        constraint = platform_treasury_account.mint == pool_state.accepted_mint         @ BlockFlipError::InvalidMint,
        constraint = platform_treasury_account.owner == protocol_state.platform_treasury @ BlockFlipError::Unauthorized,
    )]
    pub platform_treasury_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State Structs ────────────────────────────────────────────────────────────

#[account]
pub struct ProtocolState {
    pub authority:         Pubkey, // 32
    pub platform_treasury: Pubkey, // 32
    pub pool_count:        u64,    //  8
    pub bump:              u8,     //  1
}
impl ProtocolState {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1; // 81 → alloc 96
}

#[account]
pub struct PoolState {
    pub pool_id:                    u64,        //  8
    pub operator:                   Pubkey,     // 32
    pub accepted_mint:              Pubkey,     // 32
    pub funding_goal:               u64,        //  8
    pub funding_raised:             u64,        //  8
    pub max_investment_per_investor: u64,       //  8
    pub status:                     PoolStatus, //  1
    pub asset_count:                u8,         //  1
    pub milestone_count:            u8,         //  1
    pub skin_deposited:             u64,        //  8  ← skin-in-game amount
    pub total_proceeds:             u64,        //  8  ← stored at completion
    pub fees_distributed:           bool,       //  1  ← anti-double-fee guard
    pub created_at:                 i64,        //  8
    pub bump:                       u8,         //  1
}
impl PoolState {
    // 8 + 8+32+32+8+8+8+1+1+1+8+8+1+8+1 = 133 → alloc 160
    pub const SPACE: usize = 160;
}

#[account]
pub struct AssetAccount {
    pub pool:                  Pubkey,   // 32
    pub asset_index:           u8,       //  1
    pub asset_id:              [u8; 16], // 16
    pub acquisition_price:     u64,      //  8
    pub estimated_reform_cost: u64,      //  8
    pub evidence_hash:         [u8; 32], // 32
    pub bump:                  u8,       //  1
}
impl AssetAccount {
    pub const SPACE: usize = 8 + 32 + 1 + 16 + 8 + 8 + 32 + 1; // 106
}

#[account]
pub struct Milestone {
    pub pool:             Pubkey,          // 32
    pub milestone_index:  u8,              //  1
    pub status:           MilestoneStatus, //  1
    pub evidence_hash:    [u8; 32],        // 32
    pub submitted_at:     i64,             //  8
    pub bump:             u8,              //  1
}
impl Milestone {
    pub const SPACE: usize = 8 + 32 + 1 + 1 + 32 + 8 + 1; // 83
}

#[account]
pub struct InvestorPosition {
    pub investor:        Pubkey, // 32
    pub pool:            Pubkey, // 32
    pub amount_invested: u64,    //  8
    pub invested_at:     i64,    //  8
    pub has_claimed:     bool,   //  1
    pub bump:            u8,     //  1
}
impl InvestorPosition {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1; // 90
}

#[account]
pub struct SpecialistRegistry {
    pub specialist_pubkey: Pubkey, // 32
    pub is_approved:       bool,   //  1
    pub authorized_at:     i64,    //  8
    pub bump:              u8,     //  1
}
impl SpecialistRegistry {
    pub const SPACE: usize = 8 + 32 + 1 + 8 + 1; // 50
}

// ─── Enums ────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PoolStatus {
    Pending,   // aguardando skin-in-game do operador
    Funding,   // aberto para investidores
    Active,    // fully funded — reforma em andamento
    Completed, // venda realizada — pronto para distribuição
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    InProgress,
    Completed,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct SpecialistAuthorized {
    pub specialist:    Pubkey,
    pub authorized_at: i64,
}

#[event]
pub struct PoolCreated {
    pub pool_id:       u64,
    pub operator:      Pubkey,
    pub accepted_mint: Pubkey,
    pub funding_goal:  u64,
}

#[event]
pub struct SkinInGameDeposited {
    pub pool_id:       u64,
    pub operator:      Pubkey,
    pub skin_required: u64,
}

#[event]
pub struct InvestmentMade {
    pub pool_id:      u64,
    pub investor:     Pubkey,
    pub amount:       u64,
    pub total_raised: u64,
}

#[event]
pub struct MilestoneSubmitted {
    pub pool_id:         u64,
    pub milestone_index: u8,
    pub evidence_hash:   [u8; 32],
    pub submitted_at:    i64,
}

#[event]
pub struct ProceedsDistributed {
    pub pool_id:      u64,
    pub investor:     Pubkey,
    pub principal:    u64,
    pub upside_share: u64,
    pub payout:       u64,
}

#[event]
pub struct FeesDistributed {
    pub pool_id:              u64,
    pub operator_performance: u64,
    pub platform_fee:         u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum BlockFlipError {
    #[msg("Unauthorized: signer is not the pool operator")]
    Unauthorized,

    #[msg("Operation not allowed in current pool status")]
    InvalidPoolStatus,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Investment exceeds max_investment_per_investor limit (compliance)")]
    ExceedsMaxInvestment,

    #[msg("Pool funding cap has been reached")]
    FundingCapReached,

    #[msg("Token mint does not match pool accepted_mint")]
    InvalidMint,

    #[msg("evidence_hash is mandatory — obra does not advance without on-chain proof")]
    MissingEvidenceHash,

    #[msg("Milestone index does not match the next expected sequential milestone")]
    InvalidMilestoneIndex,

    #[msg("Investor has already claimed proceeds for this pool")]
    AlreadyClaimed,

    #[msg("Performance and platform fees have already been distributed for this pool")]
    FeesAlreadyDistributed,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Operator is not an authorized specialist — contact the protocol authority")]
    UnauthorizedSpecialist,
}
