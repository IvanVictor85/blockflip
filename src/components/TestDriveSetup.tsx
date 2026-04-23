'use client';

/**
 * TestDriveSetup — Infraestrutura SPL automática para Devnet
 *
 * Em uma única transação:
 *  1. Cria um Token Mint novo (0 decimais, mint authority = carteira)
 *  2. Cria a ATA da carteira e minta 5.000 tokens falsos
 *  3. Cria o Pool Vault (conta SPL regular cujo owner = poolStatePda)
 *
 * Os endereços gerados ficam disponíveis em campos prontos para copiar,
 * preenchendo os inputs do painel de test-drive sem trabalho manual.
 */

import { useState, useCallback } from 'react';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ACCOUNT_SIZE,
  createInitializeMint2Instruction,
  createInitializeAccount3Instruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
} from '@solana/spl-token';
import { toast } from 'sonner';
import { POOL_SEED, PROGRAM_ID } from '@/anchor/setup';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetupResult {
  mint: string;
  walletTokenAccount: string;
  poolVault: string;
  poolId: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function poolIdToBuffer(poolId: number): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, BigInt(poolId), /* LE */ true);
  return buf;
}

// ─── CopyField ────────────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={value}
          className="flex-1 min-w-0 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs font-mono focus:outline-none cursor-text"
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={copy}
          className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          {copied ? '✓ Ok' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TestDriveSetupProps {
  onSetupComplete?: (result: SetupResult) => void;
}

export function TestDriveSetup({ onSetupComplete }: TestDriveSetupProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [poolIdInput, setPoolIdInput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  const handleCreate = useCallback(async () => {
    if (!publicKey) {
      toast.error('Carteira não conectada', {
        description: 'Conecte sua Phantom antes de criar a infraestrutura.',
      });
      return;
    }

    const poolId = parseInt(poolIdInput, 10);
    if (isNaN(poolId) || poolId < 0) {
      toast.error('Pool ID inválido');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Preparando transação…', {
      description: 'Criando Mint + ATA + Vault em uma transação',
    });

    try {
      // ── Keypairs ────────────────────────────────────────────────────────
      const mintKeypair  = Keypair.generate();
      const vaultKeypair = Keypair.generate();

      // Pool PDA → vault owner (off-curve, valid SPL token authority)
      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [POOL_SEED, poolIdToBuffer(poolId)],
        PROGRAM_ID
      );

      // ── Rent ────────────────────────────────────────────────────────────
      const [mintRent, accountRent] = await Promise.all([
        getMinimumBalanceForRentExemptMint(connection),
        getMinimumBalanceForRentExemptAccount(connection),
      ]);

      // ── ATA for connected wallet ─────────────────────────────────────────
      const walletAta = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        publicKey,
      );

      // ── Build transaction ───────────────────────────────────────────────
      const tx = new Transaction();

      // 1 · Create mint account + initialize (no rent sysvar — Instruction v2)
      tx.add(
        SystemProgram.createAccount({
          fromPubkey:       publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports:         mintRent,
          space:            MINT_SIZE,
          programId:        TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          0,          // 0 decimals — integers simulating USDC
          publicKey,  // mint authority = wallet
          null,       // no freeze authority
        ),
      );

      // 2 · Create ATA for wallet
      tx.add(
        createAssociatedTokenAccountInstruction(
          publicKey,              // payer
          walletAta,              // ATA address (derived)
          publicKey,              // owner
          mintKeypair.publicKey,  // mint
        ),
      );

      // 3 · Create pool vault (explicit keypair, owner = poolStatePda)
      //     PDAs are off-curve — must use createAccount + initialize, not ATA
      tx.add(
        SystemProgram.createAccount({
          fromPubkey:       publicKey,
          newAccountPubkey: vaultKeypair.publicKey,
          lamports:         accountRent,
          space:            ACCOUNT_SIZE,
          programId:        TOKEN_PROGRAM_ID,
        }),
        createInitializeAccount3Instruction(
          vaultKeypair.publicKey,   // account
          mintKeypair.publicKey,    // mint
          poolStatePda,             // owner = pool PDA
        ),
      );

      // 4 · Mint 5.000 tokens to wallet ATA
      tx.add(
        createMintToInstruction(
          mintKeypair.publicKey, // mint
          walletAta,             // destination
          publicKey,             // mint authority
          5_000,                 // amount (0 decimals = 5000 tokens exactly)
        ),
      );

      // ── Blockhash + fee payer ────────────────────────────────────────────
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      // ── Send — wallet signs, extra signers passed via options ────────────
      toast.loading('Aguardando assinatura na Phantom…', { id: toastId });
      const sig = await sendTransaction(tx, connection, {
        signers: [mintKeypair, vaultKeypair],
      });

      toast.loading('Confirmando na Devnet…', {
        id: toastId,
        description: `tx: ${sig.slice(0, 8)}…`,
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      // ── Done ─────────────────────────────────────────────────────────────
      const setupResult: SetupResult = {
        mint:               mintKeypair.publicKey.toBase58(),
        walletTokenAccount: walletAta.toBase58(),
        poolVault:          vaultKeypair.publicKey.toBase58(),
        poolId,
      };

      setResult(setupResult);
      onSetupComplete?.(setupResult);

      toast.success('Infraestrutura criada com sucesso!', {
        id: toastId,
        description: '5.000 tokens mintados · Vault pronto · Copie os endereços abaixo',
        duration: 8_000,
        action: {
          label: 'Explorer',
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
              '_blank'
            ),
        },
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Erro desconhecido';
      toast.error('Falha ao criar infraestrutura', {
        id: toastId,
        description: msg.length > 120 ? msg.slice(0, 120) + '…' : msg,
      });
      console.error('[TestDriveSetup]', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, connection, poolIdInput, onSetupComplete]);

  const isConnected = !!publicKey;

  return (
    <div className="rounded-xl border border-[#14F195]/25 bg-card p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            0 · Infraestrutura SPL — Devnet
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Cria Mint (0 dec) + ATA com 5.000 tokens + Pool Vault em uma única transação.
            Preenche automaticamente os inputs do painel abaixo.
          </p>
        </div>
        <span className="shrink-0 text-xs rounded-full bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 px-2 py-0.5 font-mono">
          devnet
        </span>
      </div>

      {/* Pool ID */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            Pool ID (para derivar vault owner)
          </label>
          <input
            type="number"
            min={0}
            value={poolIdInput}
            onChange={(e) => setPoolIdInput(e.target.value)}
            disabled={loading}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#14F195]"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-5">
          Use o valor atual de <strong>pool_count</strong> do Protocol State
        </p>
      </div>

      {/* CTA button */}
      <button
        onClick={handleCreate}
        disabled={loading || !isConnected}
        className="rounded-md bg-[#14F195] px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin select-none">⟳</span>
            Criando infraestrutura…
          </>
        ) : (
          '✦  Criar Infraestrutura Mágica (Devnet)'
        )}
      </button>

      {!isConnected && (
        <p className="text-xs text-amber-400 text-center">
          Conecte sua carteira para habilitar este painel
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3 border-t border-[#14F195]/20 pt-4 mt-1">
          <p className="text-xs font-semibold text-[#14F195]">
            ✓ Pronto — copie os endereços nos inputs do painel abaixo
          </p>
          <CopyField
            label="Mint Address (cole em &quot;Accepted Mint&quot;)"
            value={result.mint}
          />
          <CopyField
            label="Sua Token Account (cole em &quot;Operator Token Account&quot; e &quot;Investor Token Account&quot;)"
            value={result.walletTokenAccount}
          />
          <CopyField
            label={`Pool Vault (pool #${result.poolId} — cole em todos os &quot;Pool Vault&quot;)`}
            value={result.poolVault}
          />
        </div>
      )}
    </div>
  );
}
