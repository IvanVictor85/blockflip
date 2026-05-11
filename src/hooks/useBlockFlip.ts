'use client';

import { useMemo, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN, Idl } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  PROGRAM_ID,
  BlockflipIDL,
  PROTOCOL_SEED,
  SPECIALIST_SEED,
  POOL_SEED,
  VAULT_SEED,
  POSITION_SEED,
  TOKEN_DECIMALS,
} from '@/anchor/setup';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProtocolStateData {
  authority: PublicKey;
  platformTreasury: PublicKey;
  poolCount: BN;
}

// ─── PDA helpers ──────────────────────────────────────────────────────────────

function poolIdToBuffer(poolId: number): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, BigInt(poolId), /* littleEndian */ true);
  return buf;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBlockFlip() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // Derive the singleton protocol PDA once
  const [protocolStatePda] = useMemo(
    () => PublicKey.findProgramAddressSync([PROTOCOL_SEED], PROGRAM_ID),
    []
  );

  // Build the Anchor Program — rebuilds only when wallet or connection changes
  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    return new Program(BlockflipIDL as Idl, provider);
  }, [connection, wallet]);

  // ── fetchProtocolState ─────────────────────────────────────────────────────

  const fetchProtocolState = useCallback(async (): Promise<ProtocolStateData> => {
    if (!program) throw new Error('Wallet not connected');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = await (program.account as any).protocolState.fetch(protocolStatePda);
    return state as ProtocolStateData;
  }, [program, protocolStatePda]);

  // ── authorizeSpecialist ────────────────────────────────────────────────────
  // Requires: connected wallet == protocol authority

  const authorizeSpecialist = useCallback(
    async (specialistPubkeyStr: string): Promise<string> => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      // SECURITY: Validate PublicKey format before use
      let specialistPubkey: PublicKey;
      try {
        specialistPubkey = new PublicKey(specialistPubkeyStr);
      } catch {
        throw new Error('Invalid specialist public key format');
      }

      const [specialistRegistry] = PublicKey.findProgramAddressSync(
        [SPECIALIST_SEED, specialistPubkey.toBuffer()],
        PROGRAM_ID
      );

      const sig = await program.methods
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .authorizeSpecialist(specialistPubkey as any)
        .accounts({
          protocolState: protocolStatePda,
          specialist: specialistPubkey,
          specialistRegistry,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      return sig;
    },
    [program, wallet, protocolStatePda]
  );

  // ── createPool ─────────────────────────────────────────────────────────────
  // Requires: connected wallet is an authorized specialist

  const createPool = useCallback(
    async (
      fundingGoal: number,
      maxInvestment: number,
      acceptedMintStr: string
    ): Promise<{ sig: string; poolStatePda: PublicKey; poolId: number }> => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      // Fetch current pool_count to derive the correct pool PDA
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proto = await (program.account as any).protocolState.fetch(protocolStatePda);
      const poolId: number = proto.poolCount.toNumber();

      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [POOL_SEED, poolIdToBuffer(poolId)],
        PROGRAM_ID
      );
      const [specialistRegistry] = PublicKey.findProgramAddressSync(
        [SPECIALIST_SEED, wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      // SECURITY: Validate mint address format before use
      let acceptedMint: PublicKey;
      try {
        acceptedMint = new PublicKey(acceptedMintStr);
      } catch {
        throw new Error('Invalid accepted mint address format');
      }

      let sig: string;
      try {
        sig = await program.methods
          .createPool(new BN(fundingGoal), new BN(maxInvestment))
          .accounts({
            protocolState: protocolStatePda,
            poolState: poolStatePda,
            specialistRegistry,
            acceptedMint,
            operator: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: 'confirmed' });
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? '';
        // "already processed" → the TX landed. Recover state from chain.
        if (!msg.includes('already been processed')) throw err;

        // poolCount was incremented on-chain — the created pool is at poolCount - 1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await (program.account as any).protocolState.fetch(protocolStatePda);
        const createdId: number = updated.poolCount.toNumber() - 1;
        const [recoveredPda] = PublicKey.findProgramAddressSync(
          [POOL_SEED, poolIdToBuffer(createdId)],
          PROGRAM_ID
        );
        // Try to extract signature from error message, fall back to empty string
        const match = msg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        return { sig: match ? match[0] : '', poolStatePda: recoveredPda, poolId: createdId };
      }

      return { sig, poolStatePda, poolId };
    },
    [program, wallet, protocolStatePda]
  );

  // ── initializePoolVault ────────────────────────────────────────────────────
  // SECURITY FIX: Initialize vault as PDA to prevent arbitrary vault injection
  // Must be called immediately after createPool

  const initializePoolVault = useCallback(
    async (poolStatePda: PublicKey, acceptedMintStr: string): Promise<string> => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      // SECURITY: Validate mint address format before use
      let acceptedMint: PublicKey;
      try {
        acceptedMint = new PublicKey(acceptedMintStr);
      } catch {
        throw new Error('Invalid accepted mint address format');
      }

      const [poolVaultPda] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolStatePda.toBuffer()],
        PROGRAM_ID
      );

      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');

      let sig: string;
      try {
        sig = await program.methods
          .initializePoolVault()
          .accounts({
            poolState: poolStatePda,
            acceptedMint,
            poolVault: poolVaultPda,
            operator: wallet.publicKey,
            rent: RENT_SYSVAR,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: 'confirmed' });
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? '';
        if (!msg.includes('already been processed')) throw err;
        const match = msg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        sig = match ? match[0] : '';
      }

      return sig;
    },
    [program, wallet]
  );

  // ── depositSkinInGame ──────────────────────────────────────────────────────
  // Operator deposits 5% skin-in-game → pool Pending → Funding

  const depositSkinInGame = useCallback(
    async (
      poolId: number,
      operatorTokenAccountStr: string
    ): Promise<string> => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [POOL_SEED, poolIdToBuffer(poolId)],
        PROGRAM_ID
      );
      const [investorPositionPda] = PublicKey.findProgramAddressSync(
        [POSITION_SEED, poolStatePda.toBuffer(), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );
      // SECURITY: Derive pool_vault as PDA to match Anchor constraint
      const [poolVaultPda] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolStatePda.toBuffer()],
        PROGRAM_ID
      );

      let sig: string;
      try {
        sig = await program.methods
          .depositSkinInGame()
          .accounts({
            poolState: poolStatePda,
            investorPosition: investorPositionPda,
            operatorTokenAccount: new PublicKey(operatorTokenAccountStr),
            poolVault: poolVaultPda,
            operator: wallet.publicKey,
          })
          .rpc({ commitment: 'confirmed' });
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? '';
        // TX landed but confirmation timed out — treat as success
        if (!msg.includes('already been processed')) throw err;
        const match = msg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        sig = match ? match[0] : '';
      }

      return sig;
    },
    [program, wallet]
  );

  // ── invest ─────────────────────────────────────────────────────────────────
  // Investor deposits capital → pool moves Funding → Active when cap reached

  const invest = useCallback(
    async (
      poolId: number,
      amount: number,
      investorTokenAccountStr: string
    ): Promise<string> => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [POOL_SEED, poolIdToBuffer(poolId)],
        PROGRAM_ID
      );
      const [investorPositionPda] = PublicKey.findProgramAddressSync(
        [POSITION_SEED, poolStatePda.toBuffer(), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );
      // SECURITY: Derive pool_vault as PDA to match Anchor constraint
      const [poolVaultPda] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, poolStatePda.toBuffer()],
        PROGRAM_ID
      );

      const sig = await program.methods
        .invest(new BN(Math.round(amount * 10 ** TOKEN_DECIMALS)))
        .accounts({
          poolState: poolStatePda,
          investorPosition: investorPositionPda,
          investorTokenAccount: new PublicKey(investorTokenAccountStr),
          poolVault: poolVaultPda,
          investor: wallet.publicKey,
        })
        .rpc({ commitment: 'confirmed' });

      return sig;
    },
    [program, wallet]
  );

  // ── Derived helpers ────────────────────────────────────────────────────────

  const derivePoolPda = useCallback(
    (poolId: number) =>
      PublicKey.findProgramAddressSync([POOL_SEED, poolIdToBuffer(poolId)], PROGRAM_ID)[0],
    []
  );

  const deriveSpecialistRegistryPda = useCallback(
    (pubkey: PublicKey) =>
      PublicKey.findProgramAddressSync([SPECIALIST_SEED, pubkey.toBuffer()], PROGRAM_ID)[0],
    []
  );

  // ── fetchPoolState ─────────────────────────────────────────────────────────
  // Fetch pool state from on-chain given the pool PDA
  const fetchPoolState = useCallback(
    async (poolPda: PublicKey) => {
      if (!program) throw new Error('Wallet not connected');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = await (program.account as any).poolState.fetch(poolPda);
      return state as { poolId: BN; skinInGameDeposited: BN };
    },
    [program]
  );

  // ── checkSkinInGameDeposited ───────────────────────────────────────────────
  // Check if operator already deposited skin-in-game by checking if investorPosition exists
  const checkSkinInGameDeposited = useCallback(
    async (poolStatePda: PublicKey, operatorPubkey: PublicKey): Promise<boolean> => {
      if (!program) {
        console.log('[checkSkinInGameDeposited] No program, returning false');
        return false;
      }
      try {
        const [investorPositionPda] = PublicKey.findProgramAddressSync(
          [POSITION_SEED, poolStatePda.toBuffer(), operatorPubkey.toBuffer()],
          PROGRAM_ID
        );
        console.log('[checkSkinInGameDeposited] Checking PDA:', investorPositionPda.toBase58());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const position = await (program.account as any).investorPosition.fetch(investorPositionPda);

        // If account exists on-chain, deposit was confirmed (even if amount is 0)
        // The 0x0 error "account already in use" proves the account exists
        const exists = position !== null;
        const amount = position?.amount?.toNumber() ?? 0;

        console.log('[checkSkinInGameDeposited] Position found:', {
          exists,
          amount,
          pdaExists: exists,
          position: position ? 'YES' : 'NO',
        });

        return exists;
      } catch (err) {
        console.error('[checkSkinInGameDeposited] Error fetching position:', err);
        console.error('[checkSkinInGameDeposited] Error message:', (err as Error)?.message);
        return false; // Account doesn't exist = not deposited
      }
    },
    [program]
  );

  return {
    program,
    wallet,
    protocolStatePda,
    fetchProtocolState,
    fetchPoolState,
    checkSkinInGameDeposited,
    authorizeSpecialist,
    createPool,
    initializePoolVault,
    depositSkinInGame,
    invest,
    derivePoolPda,
    deriveSpecialistRegistryPda,
  };
}
