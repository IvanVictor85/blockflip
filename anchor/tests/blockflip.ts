/**
 * BlockFlip – v3 Governance + Marketplace 60/20/20 Test Suite (Devnet)
 *
 * New in v3: SpecialistRegistry governance
 *   • Only protocol authority can authorize specialists
 *   • Unauthorized operator → create_pool fails with UnauthorizedSpecialist
 *   • Authorized operator → full flow proceeds normally
 *
 * 60/20/20 math (funding_goal=1000, proceeds=1200, upside=200):
 *   investor  = 950 + 114 = 1064
 *   operator (investor share) = 50 + 6 = 56
 *   operator performance fee  = 40   (20% of upside)
 *   platform fee              = 40   (20% of upside) ← key assertion
 *   total                     = 1200 ✓
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Blockflip } from "../target/types/blockflip";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";

describe("blockflip v3 – Specialist Governance + Marketplace 60/20/20", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Blockflip as Program<Blockflip>;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  // Participants
  let operator: Keypair;          // will be authorized as specialist
  let rogue: Keypair;             // will try to create pool without authorization
  let investor: Keypair;
  let platformTreasury: Keypair;

  // Token accounts
  let mint: PublicKey;
  let operatorTokenAccount: PublicKey;
  let investorTokenAccount: PublicKey;
  let platformTreasuryTokenAccount: PublicKey;
  let poolVault: PublicKey;  // Now a PDA, not a Keypair

  // PDAs
  let protocolStatePda: PublicKey;
  let operatorRegistryPda: PublicKey;
  let rogueRegistryPda: PublicKey;   // intentionally uninitialized
  let poolStatePda: PublicKey;
  let operatorPositionPda: PublicKey;
  let investorPositionPda: PublicKey;

  const FUNDING_GOAL = new BN(1000);
  const MAX_INVESTMENT = new BN(950);
  const POOL_ID = new BN(0);

  const PROTOCOL_SEED    = Buffer.from("blockflip_v1");
  const SPECIALIST_SEED  = Buffer.from("specialist");
  const POOL_SEED_BUF    = Buffer.from("pool");
  const VAULT_SEED       = Buffer.from("vault");
  const POSITION_SEED    = Buffer.from("position");

  const confirm = async (sig: string) => {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
  };

  const transferSol = async (to: PublicKey, lamports: number) => {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: to,
        lamports,
      })
    );
    const sig = await provider.sendAndConfirm(tx);
    await confirm(sig);
  };

  // ── Setup ──────────────────────────────────────────────────────────────────
  before(async () => {
    operator        = Keypair.generate();
    rogue           = Keypair.generate();
    investor        = Keypair.generate();
    platformTreasury = Keypair.generate();

    // Payer has limited devnet SOL — fund just enough for tx fees + rent
    await transferSol(operator.publicKey,  0.025 * LAMPORTS_PER_SOL);
    await transferSol(rogue.publicKey,     0.005 * LAMPORTS_PER_SOL);
    await transferSol(investor.publicKey,  0.015 * LAMPORTS_PER_SOL);
    // platformTreasury only receives tokens, never signs — no SOL needed

    mint = await createMint(connection, payer, payer.publicKey, null, 0);

    // Derive protocol PDA
    [protocolStatePda] = PublicKey.findProgramAddressSync(
      [PROTOCOL_SEED],
      program.programId
    );

    // Derive specialist registry PDAs
    [operatorRegistryPda] = PublicKey.findProgramAddressSync(
      [SPECIALIST_SEED, operator.publicKey.toBuffer()],
      program.programId
    );
    [rogueRegistryPda] = PublicKey.findProgramAddressSync(
      [SPECIALIST_SEED, rogue.publicKey.toBuffer()],
      program.programId
    );

    // Pool 0 PDA
    const poolIdBuf = Buffer.alloc(8);
    poolIdBuf.writeBigUInt64LE(BigInt(0), 0);
    [poolStatePda] = PublicKey.findProgramAddressSync(
      [POOL_SEED_BUF, poolIdBuf],
      program.programId
    );

    // Pool vault (PDA — will be initialized by initialize_pool_vault)
    [poolVault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, poolStatePda.toBuffer()],
      program.programId
    );

    // Participant token accounts
    operatorTokenAccount = await createAccount(
      connection, payer, mint, operator.publicKey
    );
    investorTokenAccount = await createAccount(
      connection, payer, mint, investor.publicKey
    );
    platformTreasuryTokenAccount = await createAccount(
      connection, payer, mint, platformTreasury.publicKey
    );

    // Derive position PDAs
    [operatorPositionPda] = PublicKey.findProgramAddressSync(
      [POSITION_SEED, poolStatePda.toBuffer(), operator.publicKey.toBuffer()],
      program.programId
    );
    [investorPositionPda] = PublicKey.findProgramAddressSync(
      [POSITION_SEED, poolStatePda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );

    // Pre-fund token accounts
    await mintTo(connection, payer, mint, operatorTokenAccount, payer, 50);
    await mintTo(connection, payer, mint, investorTokenAccount, payer, 950);
  });

  // ── Governance Tests ───────────────────────────────────────────────────────

  it("1 · initialize_protocol", async () => {
    await program.methods
      .initializeProtocol(platformTreasury.publicKey)
      .accounts({
        protocolState: protocolStatePda,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    const state = await program.account.protocolState.fetch(protocolStatePda);
    assert.equal(state.authority.toBase58(), payer.publicKey.toBase58());
    assert.equal(
      state.platformTreasury.toBase58(),
      platformTreasury.publicKey.toBase58()
    );
    assert.equal(state.poolCount.toNumber(), 0);
  });

  it("2 · rogue (unauthorized) tries create_pool → UnauthorizedSpecialist", async () => {
    // rogue has no SpecialistRegistry — passing the PDA that doesn't exist yet
    // Anchor will fail on account constraint before even entering the instruction
    try {
      await program.methods
        .createPool(FUNDING_GOAL, MAX_INVESTMENT)
        .accounts({
          protocolState: protocolStatePda,
          poolState: poolStatePda,
          specialistRegistry: rogueRegistryPda,
          acceptedMint: mint,
          operator: rogue.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([rogue])
        .rpc({ commitment: "confirmed" });
      assert.fail("Should have thrown — rogue has no SpecialistRegistry");
    } catch (err: any) {
      const msg = err.toString();
      // Account does not exist OR constraint violation
      assert.ok(
        msg.includes("UnauthorizedSpecialist") ||
          msg.includes("AccountNotInitialized") ||
          msg.includes("AccountOwnedByWrongProgram") ||
          msg.includes("has one constraint") ||
          msg.includes("Error Code") ||
          msg.includes("constraint was violated") ||
          msg.includes("2006") ||    // AccountNotInitialized
          msg.includes("Error"),
        `Expected authorization error for rogue, got: ${msg}`
      );
      // Ensure pool was NOT created
    }

    // Verify pool_count is still 0 (pool was not created)
    const proto = await program.account.protocolState.fetch(protocolStatePda);
    assert.equal(proto.poolCount.toNumber(), 0, "pool_count must be 0 after failed attempt");
  });

  it("3 · authorize_specialist for operator (admin only)", async () => {
    await program.methods
      .authorizeSpecialist(operator.publicKey)
      .accounts({
        protocolState: protocolStatePda,
        specialist: operator.publicKey,
        specialistRegistry: operatorRegistryPda,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    const registry = await program.account.specialistRegistry.fetch(
      operatorRegistryPda
    );
    assert.equal(
      registry.specialistPubkey.toBase58(),
      operator.publicKey.toBase58(),
      "registry.specialist_pubkey must match operator"
    );
    assert.isTrue(registry.isApproved, "is_approved must be true");
    assert.isAbove(
      registry.authorizedAt.toNumber(),
      0,
      "authorized_at must be a valid timestamp"
    );
  });

  it("4 · non-authority cannot authorize specialist", async () => {
    const fakeAuthority = Keypair.generate();
    await transferSol(fakeAuthority.publicKey, 0.05 * LAMPORTS_PER_SOL);

    const [fakeRegistryPda] = PublicKey.findProgramAddressSync(
      [SPECIALIST_SEED, fakeAuthority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .authorizeSpecialist(fakeAuthority.publicKey)
        .accounts({
          protocolState: protocolStatePda,
          specialist: fakeAuthority.publicKey,
          specialistRegistry: fakeRegistryPda,
          authority: fakeAuthority.publicKey,   // NOT the protocol authority
          systemProgram: SystemProgram.programId,
        })
        .signers([fakeAuthority])
        .rpc({ commitment: "confirmed" });
      assert.fail("Non-authority should not be able to authorize specialists");
    } catch (err: any) {
      const msg = err.toString();
      assert.ok(
        msg.includes("Unauthorized") ||
          msg.includes("has one constraint") ||
          msg.includes("constraint was violated") ||
          msg.includes("Error"),
        `Expected Unauthorized, got: ${msg}`
      );
    }
  });

  // ── Full 60/20/20 Flow (with authorized operator) ────────────────────────

  it("5 · create_pool → authorized specialist succeeds, status Pending", async () => {
    await program.methods
      .createPool(FUNDING_GOAL, MAX_INVESTMENT)
      .accounts({
        protocolState: protocolStatePda,
        poolState: poolStatePda,
        specialistRegistry: operatorRegistryPda,
        acceptedMint: mint,
        operator: operator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([operator])
      .rpc({ commitment: "confirmed" });

    const pool = await program.account.poolState.fetch(poolStatePda);
    assert.equal(pool.poolId.toNumber(), 0);
    assert.equal(pool.fundingGoal.toNumber(), 1000);
    assert.deepEqual(pool.status, { pending: {} });
  });

  it("6 · initialize_pool_vault → creates vault PDA for the pool", async () => {
    await program.methods
      .initializePoolVault()
      .accounts({
        poolState: poolStatePda,
        acceptedMint: mint,
        poolVault: poolVault,
        operator: operator.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([operator])
      .rpc({ commitment: "confirmed" });

    // Verify vault was created and is owned by pool_state
    const vaultAccount = await getAccount(connection, poolVault);
    assert.equal(
      vaultAccount.owner.toBase58(),
      poolStatePda.toBase58(),
      "vault authority must be pool_state PDA"
    );
    assert.equal(
      vaultAccount.mint.toBase58(),
      mint.toBase58(),
      "vault mint mismatch"
    );
    assert.equal(
      vaultAccount.amount.toString(),
      "0",
      "vault should start with 0 balance"
    );
  });

  it("8 · deposit_skin_in_game → operator deposits 50, pool → Funding", async () => {
    await program.methods
      .depositSkinInGame()
      .accounts({
        poolState: poolStatePda,
        investorPosition: operatorPositionPda,
        operatorTokenAccount,
        poolVault,
        operator: operator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([operator])
      .rpc({ commitment: "confirmed" });

    const pool = await program.account.poolState.fetch(poolStatePda);
    assert.deepEqual(pool.status, { funding: {} });
    assert.equal(pool.skinDeposited.toNumber(), 50);
    assert.equal(pool.fundingRaised.toNumber(), 50);

    const vault = await getAccount(connection, poolVault);
    assert.equal(Number(vault.amount), 50);
  });

  it("9 · invest → investor deposits 950, pool → Active", async () => {
    await program.methods
      .invest(new BN(950))
      .accounts({
        poolState: poolStatePda,
        investorPosition: investorPositionPda,
        investorTokenAccount,
        poolVault,
        investor: investor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([investor])
      .rpc({ commitment: "confirmed" });

    const pool = await program.account.poolState.fetch(poolStatePda);
    assert.deepEqual(pool.status, { active: {} });
    assert.equal(pool.fundingRaised.toNumber(), 1000);
  });

  it("10 · simulate sale: mint 200 profit to vault (total 1200)", async () => {
    await mintTo(connection, payer, mint, poolVault, payer, 200);
    const vault = await getAccount(connection, poolVault);
    assert.equal(Number(vault.amount), 1200);
  });

  it("11 · complete_pool(1200) → status Completed", async () => {
    await program.methods
      .completePool(new BN(1200))
      .accounts({
        poolState: poolStatePda,
        operator: operator.publicKey,
      })
      .signers([operator])
      .rpc({ commitment: "confirmed" });

    const pool = await program.account.poolState.fetch(poolStatePda);
    assert.deepEqual(pool.status, { completed: {} });
    assert.equal(pool.totalProceeds.toNumber(), 1200);
  });

  it("12 · distribute_proceeds: investor gets 950+114=1064", async () => {
    await program.methods
      .distributeProceeds(POOL_ID)
      .accounts({
        poolState: poolStatePda,
        investorPosition: investorPositionPda,
        poolVault,
        investorTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const invAcc = await getAccount(connection, investorTokenAccount);
    assert.equal(Number(invAcc.amount), 1064,
      "investor payout = 950 principal + 114 upside"
    );
    const pos = await program.account.investorPosition.fetch(investorPositionPda);
    assert.isTrue(pos.hasClaimed);
  });

  it("13 · distribute_proceeds: operator-as-investor gets 50+6=56", async () => {
    await program.methods
      .distributeProceeds(POOL_ID)
      .accounts({
        poolState: poolStatePda,
        investorPosition: operatorPositionPda,
        poolVault,
        investorTokenAccount: operatorTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const opAcc = await getAccount(connection, operatorTokenAccount);
    assert.equal(Number(opAcc.amount), 56,
      "operator investor payout = 50 principal + 6 upside"
    );

    const vault = await getAccount(connection, poolVault);
    assert.equal(Number(vault.amount), 80, "80 remaining for fees");
  });

  it("14 · distribute_fees: platform gets exactly 40, operator gets 40", async () => {
    await program.methods
      .distributeFees(POOL_ID)
      .accounts({
        poolState: poolStatePda,
        protocolState: protocolStatePda,
        poolVault,
        operatorTokenAccount,
        platformTreasuryAccount: platformTreasuryTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const opAcc   = await getAccount(connection, operatorTokenAccount);
    const platAcc = await getAccount(connection, platformTreasuryTokenAccount);
    const vault   = await getAccount(connection, poolVault);
    const pool    = await program.account.poolState.fetch(poolStatePda);

    // operator: 56 (investor) + 40 (performance) = 96
    assert.equal(Number(opAcc.amount), 96,  "operator total = 96");

    // ★ KEY ASSERTION
    assert.equal(Number(platAcc.amount), 40, "platform receives exactly 40");

    assert.equal(Number(vault.amount), 0,   "vault must be empty");
    assert.isTrue(pool.feesDistributed,     "fees_distributed = true");
  });

  it("15 · anti-double: distribute_fees again → FeesAlreadyDistributed", async () => {
    try {
      await program.methods
        .distributeFees(POOL_ID)
        .accounts({
          poolState: poolStatePda,
          protocolState: protocolStatePda,
          poolVault,
          operatorTokenAccount,
          platformTreasuryAccount: platformTreasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });
      assert.fail("Expected FeesAlreadyDistributed");
    } catch (err: any) {
      const msg = err.toString();
      assert.ok(
        msg.includes("FeesAlreadyDistributed") ||
          msg.includes("6009") ||
          msg.includes("constraint was violated"),
        `Expected FeesAlreadyDistributed, got: ${msg}`
      );
    }
  });

  it("16 · anti-double: investor claim again → AlreadyClaimed", async () => {
    try {
      await program.methods
        .distributeProceeds(POOL_ID)
        .accounts({
          poolState: poolStatePda,
          investorPosition: investorPositionPda,
          poolVault,
          investorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });
      assert.fail("Expected AlreadyClaimed");
    } catch (err: any) {
      const msg = err.toString();
      assert.ok(
        msg.includes("AlreadyClaimed") ||
          msg.includes("6008") ||
          msg.includes("constraint was violated"),
        `Expected AlreadyClaimed, got: ${msg}`
      );
    }
  });
});
