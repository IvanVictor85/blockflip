'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  Keypair, PublicKey, SystemProgram, Transaction,
} from '@solana/web3.js';
import {
  MINT_SIZE, TOKEN_PROGRAM_ID, ACCOUNT_SIZE,
  createInitializeMint2Instruction, createInitializeAccount3Instruction,
  getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction, getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
} from '@solana/spl-token';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  Building2, DollarSign, Calendar, TrendingUp,
  Wallet, Loader2, CheckCircle2, ExternalLink,
  AlertCircle, ArrowRight, ShieldCheck, Lock, Unlock, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBlockFlip } from '@/hooks/useBlockFlip';
import { POOL_SEED, PROGRAM_ID } from '@/anchor/setup';
import { getExplorerTxUrl } from '@/lib/solana';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreInfra {
  mint: string;
  ata: string;
  vault: string;
}

interface PoolResult {
  sig: string;
  poolId: number;
  poolStatePda: string;
  preInfra?: PreInfra; // pre-generated before pool creation — mint matches acceptedMint
}

type SkinStep = 'idle' | 'loading' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function poolIdToBuffer(poolId: number): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, BigInt(poolId), true);
  return buf;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  id, label, hint, children,
}: {
  id?: string; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description, step }: {
  icon: React.ElementType; title: string; description: string; step: number;
}) {
  return (
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2.5">
        <span className="h-6 w-6 rounded-full bg-[#14F195]/15 border border-[#14F195]/30 flex items-center justify-center text-[11px] font-bold text-[#14F195]">
          {step}
        </span>
        <Icon className="h-4 w-4 text-[#14F195]" />
        {title}
      </CardTitle>
      <CardDescription className="text-xs pl-9">{description}</CardDescription>
    </CardHeader>
  );
}

// ─── Success / Skin-in-Game screen ────────────────────────────────────────────

function SuccessScreen({
  result, onSkinInGame, onGoToDashboard,
}: {
  result: PoolResult;
  onSkinInGame: (ata: string, vault: string) => Promise<void>;
  onGoToDashboard: () => void;
}) {
  const [skinStep, setSkinStep] = useState<SkinStep>('idle');
  // Pre-fill from pre-generated infra if available
  const [operatorAta, setOperatorAta] = useState(result.preInfra?.ata ?? '');
  const [poolVault, setPoolVault]     = useState(result.preInfra?.vault ?? '');

  const ready = operatorAta.trim().length > 30 && poolVault.trim().length > 30;

  const handleSkin = async () => {
    setSkinStep('loading');
    try {
      await onSkinInGame(operatorAta.trim(), poolVault.trim());
      setSkinStep('done');
    } catch {
      setSkinStep('idle');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 flex flex-col gap-6">

        {/* Step tracker */}
        <div className="flex items-center gap-0">
          {['Pool Criada', 'Garantia'].map((label, i) => {
            const done = i === 0 || skinStep === 'done';
            const active = i === 1 && skinStep !== 'done';
            return (
              <div key={label} className="flex items-center gap-0 flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    done ? 'border-[#14F195] bg-[#14F195] text-black'
                    : active ? 'border-[#14F195] bg-background text-[#14F195]'
                    : 'border-border bg-muted text-muted-foreground'
                  }`}>
                    {done && i === 0 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
                </div>
                {i === 0 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-colors ${skinStep === 'done' ? 'bg-[#14F195]' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Passo 1: Pool criada */}
        <Card className="border-[#14F195]/30">
          <CardContent className="pt-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-[#14F195]" />
              </div>
              <div>
                <p className="font-semibold">Pool #{result.poolId} criada on-chain</p>
                <p className="text-xs text-muted-foreground">Status: Pending — aguardando Skin-in-Game</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pool ID</span>
                <span className="font-mono font-medium">#{result.poolId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pool PDA</span>
                <span className="font-mono text-[#14F195]">
                  {result.poolStatePda.slice(0, 8)}…{result.poolStatePda.slice(-6)}
                </span>
              </div>
            </div>
            <button
              onClick={() => window.open(getExplorerTxUrl(result.sig), '_blank')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#14F195] transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Ver transação no Solana Explorer
            </button>
          </CardContent>
        </Card>

        {/* Passo 2: Skin-in-Game */}
        {skinStep === 'done' ? (
          <Card className="border-[#14F195]/30">
            <CardContent className="pt-5 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 flex items-center justify-center">
                <Unlock className="h-6 w-6 text-[#14F195]" />
              </div>
              <div>
                <p className="font-semibold text-[#14F195]">Pool ativada para investidores!</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Garantia depositada. Pool #{result.poolId} mudou de <strong>Pending → Funding</strong>.
                </p>
              </div>
              <Button
                className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold"
                onClick={onGoToDashboard}
              >
                Ver no Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Passo 2 — Depositar Garantia (Skin-in-Game)
              </CardTitle>
              <CardDescription className="text-xs">
                O contrato exige ≥5% do capital do operador para ativar o pool.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  Sem este depósito o pool permanece <strong>Pending</strong> e nenhum investidor consegue aportar.
                </p>
              </div>

              {result.preInfra ? (
                /* Infra pre-gerada — campos já preenchidos */
                <div className="rounded-lg bg-[#14F195]/5 border border-[#14F195]/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#14F195] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Infraestrutura de tokens pronta (criada antes do pool)
                  </p>
                  <div className="space-y-1 text-xs font-mono text-muted-foreground break-all">
                    <p><span className="text-foreground font-medium">ATA:</span> {result.preInfra.ata.slice(0, 12)}…{result.preInfra.ata.slice(-8)}</p>
                    <p><span className="text-foreground font-medium">Vault:</span> {result.preInfra.vault.slice(0, 12)}…{result.preInfra.vault.slice(-8)}</p>
                  </div>
                </div>
              ) : (
                /* Sem infra pré-gerada — campos manuais */
                <>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                      A infra de tokens não foi pré-gerada. Cole os endereços do{' '}
                      <strong>TestDrive Setup</strong> (usando o mint que foi configurado no pool).
                    </p>
                  </div>
                  <Field id="operatorAta" label="Sua Conta de Token (ATA)"
                    hint="ATA criada para o mesmo mint usado como acceptedMint do pool.">
                    <Input id="operatorAta" value={operatorAta}
                      onChange={(e) => setOperatorAta(e.target.value)}
                      placeholder="Endereço da sua ATA" className="font-mono text-xs"
                      disabled={skinStep === 'loading'} />
                  </Field>
                  <Field id="poolVault" label="Vault do Pool"
                    hint="Conta token com owner = poolStatePda deste pool.">
                    <Input id="poolVault" value={poolVault}
                      onChange={(e) => setPoolVault(e.target.value)}
                      placeholder="Endereço do Pool Vault" className="font-mono text-xs"
                      disabled={skinStep === 'loading'} />
                  </Field>
                </>
              )}

              <Button
                onClick={handleSkin}
                disabled={skinStep === 'loading' || !ready}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
              >
                {skinStep === 'loading' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assinando Garantia...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" />Depositar Garantia e Ativar Pool</>
                )}
              </Button>

              <button onClick={onGoToDashboard}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
                Fazer depois — ir ao Dashboard
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpecialistPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { createPool, depositSkinInGame, program, protocolStatePda } = useBlockFlip();

  // Off-chain metadata
  const [name, setName]             = useState('');
  const [location, setLocation]     = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl]     = useState('');

  // On-chain params
  const [fundingGoal, setFundingGoal]       = useState('');
  const [maxInvestment, setMaxInvestment]   = useState('');
  const [cycleDays, setCycleDays]           = useState('');
  const [targetSalePrice, setTargetSalePrice] = useState('');
  const [acceptedMint, setAcceptedMint]     = useState('');

  // Pre-generated infra (mint + ATA + vault created BEFORE pool, so mints match)
  const [preInfra, setPreInfra]     = useState<PreInfra | null>(null);
  const [isGenInfra, setIsGenInfra] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult]       = useState<PoolResult | null>(null);

  // ─── Derived ROI ────────────────────────────────────────────────────────
  const goal = parseFloat(fundingGoal) || 0;
  const sale = parseFloat(targetSalePrice) || 0;
  const hasROI = goal > 0 && sale > 0;
  const roiBase        = hasROI ? ((sale - goal) / goal) * 100 : 0;
  const roiConservador = hasROI ? ((sale * 0.88 - goal) / goal) * 100 : 0;
  const roiOtimista    = hasROI ? ((sale * 1.10 - goal) / goal) * 100 : 0;

  // ─── Generate test infrastructure BEFORE pool creation ──────────────────
  // Creates mint + ATA (5000 tokens) + vault for the NEXT pool PDA.
  // Stores addresses and auto-fills acceptedMint so they match on-chain.
  const handleGenerateTestInfra = useCallback(async () => {
    if (!publicKey || !program) { toast.error('Conecte a wallet primeiro'); return; }
    setIsGenInfra(true);
    const toastId = toast.loading('Buscando pool count e criando tokens…');
    try {
      // Fetch current pool_count → next pool ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proto = await (program.account as any).protocolState.fetch(protocolStatePda);
      const nextPoolId: number = proto.poolCount.toNumber();

      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [POOL_SEED, poolIdToBuffer(nextPoolId)], PROGRAM_ID
      );

      const mintKeypair  = Keypair.generate();
      const vaultKeypair = Keypair.generate();
      const walletAta    = getAssociatedTokenAddressSync(mintKeypair.publicKey, publicKey);

      const [mintRent, accountRent] = await Promise.all([
        getMinimumBalanceForRentExemptMint(connection),
        getMinimumBalanceForRentExemptAccount(connection),
      ]);

      const tx = new Transaction();
      tx.add(
        SystemProgram.createAccount({ fromPubkey: publicKey, newAccountPubkey: mintKeypair.publicKey, lamports: mintRent, space: MINT_SIZE, programId: TOKEN_PROGRAM_ID }),
        createInitializeMint2Instruction(mintKeypair.publicKey, 0, publicKey, null),
        // Idempotent: won't fail if ATA already exists (safe on retry)
        createAssociatedTokenAccountIdempotentInstruction(publicKey, walletAta, publicKey, mintKeypair.publicKey),
        SystemProgram.createAccount({ fromPubkey: publicKey, newAccountPubkey: vaultKeypair.publicKey, lamports: accountRent, space: ACCOUNT_SIZE, programId: TOKEN_PROGRAM_ID }),
        createInitializeAccount3Instruction(vaultKeypair.publicKey, mintKeypair.publicKey, poolStatePda),
        // Mint enough to cover skin-in-game (5% of funding_goal) + buffer.
        // Use the current form value; default to 10M if not set.
        createMintToInstruction(mintKeypair.publicKey, walletAta, publicKey,
          Math.max(10_000_000, Math.ceil((parseFloat(fundingGoal) || 0) * 0.06))),
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      let sig: string;
      try {
        sig = await sendTransaction(tx, connection, { signers: [mintKeypair, vaultKeypair] });
      } catch (sendErr: unknown) {
        const sendMsg = (sendErr as Error)?.message ?? '';
        // "already processed" means the tx landed on-chain — treat as success
        if (!sendMsg.includes('already been processed')) throw sendErr;
        // Recover signature from the error message if possible, else use empty string
        const match = sendMsg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        sig = match ? match[0] : '';
        toast.dismiss(toastId);
        toast.info('Transação já processada on-chain — usando resultado anterior.', { duration: 4_000 });
      }

      if (sig) {
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      }

      const infra: PreInfra = {
        mint:  mintKeypair.publicKey.toBase58(),
        ata:   walletAta.toBase58(),
        vault: vaultKeypair.publicKey.toBase58(),
      };
      setPreInfra(infra);
      setAcceptedMint(infra.mint); // auto-fill so pool uses the same mint

      const mintedAmount = Math.max(10_000_000, Math.ceil((parseFloat(fundingGoal) || 0) * 0.06));
      toast.success('Token de teste criado! Mint preenchido automaticamente.', {
        id: toastId,
        description: `${mintedAmount.toLocaleString('pt-BR')} tokens mintados para Pool PDA #${nextPoolId}`,
        duration: 8_000,
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Erro desconhecido';
      toast.error('Falha ao gerar infraestrutura', { id: toastId, description: msg.slice(0, 120) });
    } finally {
      setIsGenInfra(false);
    }
  }, [publicKey, program, protocolStatePda, connection, sendTransaction, fundingGoal]);

  // ─── Create pool ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      toast.error('Wallet não conectada'); return;
    }
    const goalNum = parseFloat(fundingGoal);
    const maxNum  = parseFloat(maxInvestment);
    if (!name.trim())                     { toast.error('Nome do imóvel obrigatório'); return; }
    if (isNaN(goalNum) || goalNum <= 0)   { toast.error('Meta de captação inválida'); return; }
    if (isNaN(maxNum) || maxNum <= 0)     { toast.error('Investimento máximo inválido'); return; }
    if (maxNum > goalNum)                 { toast.error('Investimento máximo não pode superar a meta'); return; }
    if (!acceptedMint.trim())             { toast.error('Clique em "Gerar Token de Teste" ou cole o mint'); return; }

    setIsLoading(true);
    const toastId = toast.loading('Aguardando assinatura na wallet…', {
      description: 'Phantom · Backpack · Solflare',
    });

    try {
      const { sig, poolId, poolStatePda } = await createPool(
        Math.round(goalNum), Math.round(maxNum), acceptedMint.trim()
      );

      // Persist off-chain metadata
      const metadata = {
        poolId, poolStatePda: poolStatePda.toString(),
        name: name.trim(), location: location.trim(),
        description: description.trim(), imageUrl: imageUrl.trim(),
        cycleDays: parseInt(cycleDays) || 120,
        fundingGoal: goalNum, targetSalePrice: parseFloat(targetSalePrice) || 0,
        roi: { conservador: +roiConservador.toFixed(1), base: +roiBase.toFixed(1), otimista: +roiOtimista.toFixed(1) },
        operator: publicKey.toString(), createdAt: new Date().toISOString(), sig,
        vault: preInfra?.vault ?? null,
        acceptedMint: preInfra?.mint ?? null,
        operatorAta: preInfra?.ata ?? null,
      };
      const existing: unknown[] = JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]');
      existing.push(metadata);
      localStorage.setItem('blockflip_pools', JSON.stringify(existing));

      toast.dismiss(toastId);
      toast.success(`Pool #${poolId} criada! Deposite a garantia para ativá-la.`, { duration: 8_000 });

      setResult({ sig, poolId, poolStatePda: poolStatePda.toString(), preInfra: preInfra ?? undefined });
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error('Falha ao criar pool', { description: (err as Error)?.message?.slice(0, 120) });
    } finally {
      setIsLoading(false);
    }
  }, [
    connected, publicKey, createPool, preInfra,
    name, location, description, imageUrl,
    fundingGoal, maxInvestment, cycleDays, targetSalePrice, acceptedMint,
    roiBase, roiConservador, roiOtimista,
  ]);

  // ─── Skin-in-Game deposit ────────────────────────────────────────────────
  const handleSkinInGame = useCallback(async (ata: string, vault: string) => {
    if (!result) return;
    const toastId = toast.loading('Assinando depósito de garantia…');
    try {
      const sig = await depositSkinInGame(result.poolId, ata, vault);
      toast.dismiss(toastId);
      toast.success('Pool ativada com sucesso! Liberada para investidores.', {
        description: `Pool #${result.poolId} → Funding`,
        action: { label: 'Explorer', onClick: () => window.open(getExplorerTxUrl(sig), '_blank') },
        duration: 10_000,
      });
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error('Falha no depósito de garantia', { description: (err as Error)?.message?.slice(0, 120) });
      throw err;
    }
  }, [result, depositSkinInGame]);

  // ─── Render success flow ─────────────────────────────────────────────────
  if (result) {
    return (
      <SuccessScreen
        result={result}
        onSkinInGame={handleSkinInGame}
        onGoToDashboard={() => router.push('/dashboard')}
      />
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-xl bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#14F195]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Painel do Especialista</h1>
              <p className="text-sm text-muted-foreground">Nova Captação</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30">
              <ShieldCheck className="h-3 w-3 mr-1" />Acesso Restrito
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">Solana Devnet</Badge>
          </div>
        </div>

        {/* Wallet banner */}
        {!connected ? (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Wallet não conectada</p>
              <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>Apenas especialistas autorizados podem criar pools on-chain.</p>
            </div>
            <WalletMultiButton style={{ background: '#14F195', color: '#000', borderRadius: '8px', fontWeight: 'bold', height: '36px', padding: '0 14px', fontSize: '12px' }} />
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2.5 p-3 rounded-xl bg-[#14F195]/5 border border-[#14F195]/20">
            <Wallet className="h-4 w-4 text-[#14F195] shrink-0" />
            <span className="text-xs text-muted-foreground">Especialista:</span>
            <span className="text-xs font-mono text-[#14F195] truncate">
              {publicKey?.toString().slice(0, 10)}…{publicKey?.toString().slice(-6)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Seção 1: O Ativo */}
          <Card>
            <SectionHeader step={1} icon={Building2} title="O Ativo"
              description="Metadados off-chain exibidos na Vitrine de Oportunidades." />
            <CardContent className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="name" label="Nome do Imóvel *">
                  <Input id="name" placeholder="Loft Alto de Pinheiros"
                    value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                </Field>
                <Field id="location" label="Localização">
                  <Input id="location" placeholder="Pinheiros, São Paulo — SP"
                    value={location} onChange={(e) => setLocation(e.target.value)} disabled={isLoading} />
                </Field>
              </div>
              <Field id="description" label="Descrição">
                <textarea id="description" rows={3}
                  placeholder="Tese de valorização, diferenciais do ativo, estratégia de saída..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none" />
              </Field>
              <Field id="imageUrl" label="URL da Foto">
                <Input id="imageUrl" type="url" placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isLoading} />
              </Field>
            </CardContent>
          </Card>

          {/* Seção 2: Estrutura Financeira */}
          <Card>
            <SectionHeader step={2} icon={DollarSign} title="Estrutura Financeira"
              description="Parâmetros gravados on-chain via instrução create_pool do programa Anchor." />
            <CardContent className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="fundingGoal" label="Meta de Captação (USDC) *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                    <Input id="fundingGoal" type="number" min="1" step="any" placeholder="450000"
                      value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)}
                      className="pl-7" disabled={isLoading} />
                  </div>
                </Field>
                <Field id="maxInvestment" label="Máx. por Investidor (USDC) *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                    <Input id="maxInvestment" type="number" min="1" step="any" placeholder="50000"
                      value={maxInvestment} onChange={(e) => setMaxInvestment(e.target.value)}
                      className="pl-7" disabled={isLoading} />
                  </div>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="targetSalePrice" label="Preço Alvo de Venda (USDC)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                    <Input id="targetSalePrice" type="number" min="1" step="any" placeholder="580000"
                      value={targetSalePrice} onChange={(e) => setTargetSalePrice(e.target.value)}
                      className="pl-7" disabled={isLoading} />
                  </div>
                </Field>
                <Field id="cycleDays" label="Prazo da Obra (dias)">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="cycleDays" type="number" min="30" max="365" step="any" placeholder="120"
                      value={cycleDays} onChange={(e) => setCycleDays(e.target.value)}
                      className="pl-9" disabled={isLoading} />
                  </div>
                </Field>
              </div>

              {/* Token de Teste — deve ser criado ANTES do pool */}
              <div className="rounded-xl border border-dashed border-[#14F195]/40 bg-[#14F195]/3 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-[#14F195] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Token Aceito (Mint)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Crie o token de teste <strong>antes</strong> do pool — isso garante que o mint do ATA,
                      vault e pool sejam idênticos. O campo abaixo é preenchido automaticamente.
                    </p>
                  </div>
                </div>

                {preInfra ? (
                  <div className="rounded-lg bg-[#14F195]/10 border border-[#14F195]/30 p-3 space-y-1 text-xs font-mono">
                    <p className="text-[#14F195] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Infraestrutura criada com sucesso
                    </p>
                    <p className="text-muted-foreground break-all">Mint: {preInfra.mint}</p>
                  </div>
                ) : (
                  <Button type="button" onClick={handleGenerateTestInfra}
                    disabled={isGenInfra || !connected}
                    className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold">
                    {isGenInfra ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando Mint + ATA + Vault…</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />Gerar Token de Teste (Devnet)</>
                    )}
                  </Button>
                )}

                <Field id="acceptedMint" label="Mint Address *"
                  hint={preInfra ? 'Preenchido automaticamente pelo token gerado acima.' : 'Clique em "Gerar Token de Teste" ou cole um mint existente.'}>
                  <Input id="acceptedMint" value={acceptedMint}
                    onChange={(e) => setAcceptedMint(e.target.value)}
                    disabled={isLoading} className="font-mono text-xs" />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Tese de Investimento */}
          <Card>
            <SectionHeader step={3} icon={TrendingUp} title="Tese de Investimento"
              description="Simulações de ROI calculadas em tempo real. Preencha Meta e Preço Alvo para ativar." />
            <CardContent>
              {hasROI ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Conservador', roi: roiConservador, note: 'Venda a −12%', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' },
                    { label: 'Base',        roi: roiBase,        note: 'Preço alvo',   color: 'text-emerald-700 dark:text-[#14F195]', bg: 'bg-emerald-50 border-emerald-200 dark:bg-[#14F195]/10 dark:border-[#14F195]/20' },
                    { label: 'Otimista',    roi: roiOtimista,    note: 'Venda a +10%', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">{s.label}</p>
                      <p className={`text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>
                        {s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{s.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-9 w-9 opacity-20" />
                  <p className="text-sm">Preencha <span className="font-medium">Meta de Captação</span> e{' '}
                    <span className="font-medium">Preço Alvo de Venda</span> para ver as simulações.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="pt-1">
            <Button type="submit" disabled={isLoading || !connected}
              className="w-full h-12 bg-[#14F195] text-black hover:bg-[#0ED47F] font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Assinando Transação...</>
              ) : !connected ? (
                <><Wallet className="h-5 w-5 mr-2" />Conecte a Wallet para Submeter</>
              ) : (
                <>Criar Pool On-Chain<ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              A transação será assinada pela sua wallet e confirmada na Solana em ≈400ms.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
