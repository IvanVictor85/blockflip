'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
  Building2, DollarSign, Calendar, TrendingUp,
  Wallet, Loader2, CheckCircle2, ExternalLink,
  AlertCircle, ArrowRight, ShieldCheck, Lock, Unlock, Zap, Images,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBlockFlip } from '@/hooks/useBlockFlip';
import { POOL_SEED, PROGRAM_ID } from '@/anchor/setup';
import { getExplorerTxUrl, openExternalUrl } from '@/lib/solana';
import { createPoolAction, addPoolImagesAction } from '@/actions/pool';
import { uploadMultiple } from '@/lib/cloudinary';
import { ImageUploader } from '@/components/image-uploader';

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
  const t = useTranslations('specialist');
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
          {[t('successStep1'), t('successStep2')].map((label, i) => {
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
                <p className="font-semibold">{t('successPoolCreated', { poolId: result.poolId })}</p>
                <p className="text-xs text-muted-foreground">{t('successPoolStatus')}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('successLabelPoolId')}</span>
                <span className="font-mono font-medium">#{result.poolId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('successLabelPoolPda')}</span>
                <span className="font-mono text-[#14F195]">
                  {result.poolStatePda.slice(0, 8)}…{result.poolStatePda.slice(-6)}
                </span>
              </div>
            </div>
            <button
              onClick={() => openExternalUrl(getExplorerTxUrl(result.sig))}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#14F195] transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {t('successViewTx')}
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
                <p className="font-semibold text-[#14F195]">{t('successActivated')}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('successActivatedDesc', { poolId: result.poolId })}
                </p>
              </div>
              <Button
                className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold"
                onClick={onGoToDashboard}
              >
                {t('successGoToDashboard')} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                {t('successStep2Title')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('successStep2Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  {t('successWarning')}
                </p>
              </div>

              {result.preInfra ? (
                /* Infra pre-gerada — campos já preenchidos */
                <div className="rounded-lg bg-[#14F195]/5 border border-[#14F195]/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#14F195] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('successInfraReady')}
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
                      {t('successNoInfraWarning')}
                    </p>
                  </div>
                  <Field id="operatorAta" label={t('successFieldAta')}
                    hint={t('successFieldAtaHint')}>
                    <Input id="operatorAta" value={operatorAta}
                      onChange={(e) => setOperatorAta(e.target.value)}
                      placeholder={t('successFieldAtaPlaceholder')} className="font-mono text-xs"
                      disabled={skinStep === 'loading'} />
                  </Field>
                  <Field id="poolVault" label={t('successFieldVault')}
                    hint={t('successFieldVaultHint')}>
                    <Input id="poolVault" value={poolVault}
                      onChange={(e) => setPoolVault(e.target.value)}
                      placeholder={t('successFieldVaultPlaceholder')} className="font-mono text-xs"
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
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('successSigningDeposit')}</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" />{t('successDepositBtn')}</>
                )}
              </Button>

              <button onClick={onGoToDashboard}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
                {t('successDoLater')}
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Unauthorized gate ────────────────────────────────────────────────────────

function UnauthorizedGate() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center pt-16">
      <div className="max-w-sm w-full mx-auto px-4 text-center flex flex-col items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Lock className="h-9 w-9 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-red-500">Unauthorized Access</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            This wallet is not registered as a BlockFlip Specialist on-chain.
            Contact the protocol authority to request authorization.
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpecialistPage() {
  const t = useTranslations('specialist');
  const router = useRouter();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { createPool, depositSkinInGame, authorizeSpecialist, program, protocolStatePda, deriveSpecialistRegistryPda } = useBlockFlip();

  // SECURITY: Verify on-chain authorization before rendering specialist functionality.
  // null = checking | true = authorized | false = unauthorized
  const [isAuthorized, setIsAuthorized]   = useState<boolean | null>(null);
  const [isAuthority, setIsAuthority]     = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [rpcDown, setRpcDown]             = useState(false);

  useEffect(() => {
    if (!program || !publicKey) { setIsAuthorized(null); setIsAuthority(false); return; }

    const registryPda = deriveSpecialistRegistryPda(publicKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountApi = program.account as any;
    const walletStr  = publicKey.toBase58();

    // Distinguish network failure from "account not found"
    const isNetworkErr = (e: unknown) =>
      e instanceof TypeError && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'));

    Promise.all([
      accountApi.specialistRegistry.fetch(registryPda)
        .then(() => 'registered' as const)
        .catch((e: unknown) => isNetworkErr(e) ? 'rpc_down' as const : 'not_found' as const),

      accountApi.protocolState.fetch(protocolStatePda)
        .then((s: { authority: { toBase58: () => string } }) => s.authority.toBase58() === walletStr)
        .catch((e: unknown) => { console.warn('[BlockFlip] protocolState fetch failed:', e); return 'rpc_down' as const; }),
    ]).then(([registryResult, authorityResult]) => {
      const networkDown = registryResult === 'rpc_down' || authorityResult === 'rpc_down';

      if (networkDown) {
        // RPC unreachable — can't verify on-chain. Allow access with a warning.
        // The contract will still reject unauthorized wallets on tx submission.
        setRpcDown(true);
        setIsAuthorized(true);
        setIsAuthority(false);
        return;
      }

      setRpcDown(false);
      setIsAuthorized(registryResult === 'registered');
      setIsAuthority(authorityResult === true);
    });
  }, [program, publicKey, deriveSpecialistRegistryPda, protocolStatePda]);

  const handleSelfAuthorize = async () => {
    if (!publicKey) return;
    setIsRegistering(true);
    try {
      await authorizeSpecialist(publicKey.toBase58());
      setIsAuthorized(true);
      toast.success('Carteira autorizada como Especialista!');
    } catch (err) {
      toast.error('Falha na autorização', { description: (err as Error).message?.slice(0, 120) });
    } finally {
      setIsRegistering(false);
    }
  };

  // Off-chain metadata
  const [name, setName]               = useState('');
  const [location, setLocation]       = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles]   = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  // Operation type
  const [operationType, setOperationType] = useState<'AUCTION' | 'DIRECT_PURCHASE'>('DIRECT_PURCHASE');

  // Cost breakdown — targetCapital is derived, not entered directly
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [renovationCost, setRenovationCost]   = useState('');
  const [legalCost, setLegalCost]             = useState('');

  // On-chain params
  const [maxInvestment, setMaxInvestment]     = useState('');
  const [cycleDays, setCycleDays]             = useState('120');
  const [targetSalePrice, setTargetSalePrice] = useState('');
  const [acceptedMint, setAcceptedMint]       = useState('');

  // Pre-generated infra (mint + ATA + vault created BEFORE pool, so mints match)
  const [preInfra, setPreInfra]     = useState<PreInfra | null>(null);
  const [isGenInfra, setIsGenInfra] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult]       = useState<PoolResult | null>(null);

  // ─── Derived values ──────────────────────────────────────────────────────
  // targetCapital = sum of cost breakdown (specialist cannot enter it directly)
  const calculatedTargetCapital =
    (parseFloat(acquisitionCost) || 0) +
    (parseFloat(renovationCost)  || 0) +
    (parseFloat(legalCost)       || 0);

  const sale   = parseFloat(targetSalePrice) || 0;
  const hasROI = calculatedTargetCapital > 0 && sale > 0;
  const roiBase        = hasROI ? ((sale - calculatedTargetCapital) / calculatedTargetCapital) * 100 : 0;
  const roiConservador = hasROI ? ((sale * 0.88 - calculatedTargetCapital) / calculatedTargetCapital) * 100 : 0;
  const roiOtimista    = hasROI ? ((sale * 1.10 - calculatedTargetCapital) / calculatedTargetCapital) * 100 : 0;

  // ─── Generate test infrastructure BEFORE pool creation ──────────────────
  // Creates mint + ATA (5000 tokens) + vault for the NEXT pool PDA.
  // Stores addresses and auto-fills acceptedMint so they match on-chain.
  const handleGenerateTestInfra = useCallback(async () => {
    if (!publicKey || !program) { toast.error(t('toastConnectFirst')); return; }
    setIsGenInfra(true);
    const toastId = toast.loading(t('toastGeneratingInfra'));
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
        // Mint the full token supply = funding goal (1 token = 1 USDC).
        // Operator holds 100%; deposits ≥5% as skin-in-game, sells the rest to investors.
        // Falls back to a small amount if the form isn't filled yet.
        createMintToInstruction(mintKeypair.publicKey, walletAta, publicKey,
          calculatedTargetCapital > 0 ? Math.ceil(calculatedTargetCapital) : 10_000),
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
        toast.info(t('toastAlreadyProcessed'), { duration: 4_000 });
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

      const mintedAmount = calculatedTargetCapital > 0 ? Math.ceil(calculatedTargetCapital) : 10_000;
      const sigTokens    = Math.round(mintedAmount * 0.05);
      toast.success(t('toastInfraCreated'), {
        id: toastId,
        description: `Pool #${nextPoolId} · Supply: ${mintedAmount.toLocaleString('pt-BR')} tokens · 1 token = 1 USDC · SiG mínimo: ${sigTokens.toLocaleString('pt-BR')} tokens (5%)`,
        duration: 10_000,
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? '';
      toast.error(t('toastInfraFailed'), { id: toastId, description: msg.slice(0, 120) });
    } finally {
      setIsGenInfra(false);
    }
  }, [publicKey, program, protocolStatePda, connection, sendTransaction, calculatedTargetCapital, t]);

  // ─── Create pool ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      toast.error(t('toastWalletNotConnected')); return;
    }
    const goalNum = calculatedTargetCapital;
    const maxNum  = parseFloat(maxInvestment);
    if (!name.trim())                          { toast.error(t('toastNameRequired')); return; }
    if (!(parseFloat(acquisitionCost) > 0))    { toast.error(t('toastInvalidGoal')); return; }
    if (goalNum <= 0)                          { toast.error(t('toastInvalidGoal')); return; }
    if (isNaN(maxNum) || maxNum <= 0)          { toast.error(t('toastInvalidMax')); return; }
    if (maxNum > goalNum)                      { toast.error(t('toastMaxExceedsGoal')); return; }
    if (!acceptedMint.trim())                  { toast.error(t('toastMintRequired')); return; }

    setIsLoading(true);

    // ── Step 0: Upload images to Cloudinary (before the on-chain tx) ──────────
    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      const uploadToastId = toast.loading(`Enviando ${imageFiles.length} foto(s)…`);
      try {
        uploadedUrls = await uploadMultiple(imageFiles, (done, total) => {
          setUploadProgress({ done, total });
        });
        toast.dismiss(uploadToastId);
        setUploadProgress(null);
      } catch (uploadErr) {
        toast.error('Falha no upload das fotos', {
          id: uploadToastId,
          description: (uploadErr as Error).message,
        });
        setIsLoading(false);
        setUploadProgress(null);
        return;
      }
    }

    const toastId = toast.loading(t('toastAwaitingSignature'), {
      description: 'Phantom · Backpack · Solflare',
    });

    try {
      const { sig, poolId, poolStatePda } = await createPool(
        Math.round(goalNum), Math.round(maxNum), acceptedMint.trim()
      );

      const primaryImageUrl = uploadedUrls[0] ?? '';
      const cycleInt = parseInt(cycleDays) || 120;

      // Persist off-chain metadata to localStorage (legacy + offline support)
      const metadata = {
        poolId, poolStatePda: poolStatePda.toString(),
        name: name.trim(), location: location.trim(),
        description: description.trim(),
        imageUrl: primaryImageUrl,
        imageUrls: uploadedUrls,
        cycleDays: cycleInt,
        operationType,
        acquisitionCost: parseFloat(acquisitionCost) || 0,
        renovationCost:  parseFloat(renovationCost)  || 0,
        legalCost:       parseFloat(legalCost)        || 0,
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

      // Persist to Neon (non-blocking — on-chain tx already confirmed)
      const poolPdaStr = poolStatePda.toString();
      createPoolAction({
        poolPda:          poolPdaStr,
        mintAddress:      preInfra?.mint ?? acceptedMint.trim(),
        name:             name.trim(),
        description:      description.trim(),
        imageUrl:         primaryImageUrl,
        location:         location.trim(),
        cycleDays:        cycleInt,
        operationType,
        acquisitionCost:  parseFloat(acquisitionCost) || 0,
        renovationCost:   parseFloat(renovationCost)  || 0,
        legalCost:        parseFloat(legalCost)        || 0,
        targetCapital:    goalNum,
        roiConservative:  +roiConservador.toFixed(1),
        roiBase:          +roiBase.toFixed(1),
        roiOptimistic:    +roiOtimista.toFixed(1),
        specialistWallet: publicKey.toString(),
      }).then((res) => {
        if (!res.success) { console.error('[BlockFlip] DB save failed:', res.error); return; }
        // Save all images to PoolImage table after pool is created in DB
        if (uploadedUrls.length > 0) {
          addPoolImagesAction(poolPdaStr, uploadedUrls).then((imgRes) => {
            if (!imgRes.success) console.error('[BlockFlip] Image save failed:', imgRes.error);
          });
        }
      });

      toast.dismiss(toastId);
      toast.success(`Pool #${poolId} → ${t('successStep2')}`, { duration: 8_000 });

      setResult({ sig, poolId, poolStatePda: poolStatePda.toString(), preInfra: preInfra ?? undefined });
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error(t('toastPoolFailed'), { description: (err as Error)?.message?.slice(0, 120) });
    } finally {
      setIsLoading(false);
    }
  }, [
    connected, publicKey, createPool, preInfra,
    name, location, description, imageFiles,
    operationType, acquisitionCost, renovationCost, legalCost,
    calculatedTargetCapital, maxInvestment, cycleDays, targetSalePrice, acceptedMint,
    roiBase, roiConservador, roiOtimista, t,
  ]);

  // ─── Skin-in-Game deposit ────────────────────────────────────────────────
  const handleSkinInGame = useCallback(async (ata: string, vault: string) => {
    if (!result) return;
    const toastId = toast.loading(t('toastDepositSigning'));
    try {
      const sig = await depositSkinInGame(result.poolId, ata, vault);
      toast.dismiss(toastId);
      toast.success(t('toastPoolActivated'), {
        description: `Pool #${result.poolId} → Funding`,
        action: { label: 'Explorer', onClick: () => window.open(getExplorerTxUrl(sig), '_blank') },
        duration: 10_000,
      });
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error(t('toastDepositFailed'), { description: (err as Error)?.message?.slice(0, 120) });
      throw err;
    }
  }, [result, depositSkinInGame, t]);

  // ─── Authorization gate ──────────────────────────────────────────────────
  // Show loading state while checking; block UI if not authorized
  if (connected && isAuthorized === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#14F195]" />
      </main>
    );
  }
  if (connected && isAuthorized === false) {
    // Protocol authority can self-authorize with one click
    if (isAuthority) {
      return (
        <main className="min-h-screen bg-background flex items-center justify-center pt-16">
          <div className="max-w-sm w-full mx-auto px-4 text-center flex flex-col items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Unlock className="h-9 w-9 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-400">Autorização Pendente</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Você é a <span className="text-amber-400 font-medium">authority</span> do protocolo.
                Sua carteira ainda não foi registrada como Especialista on-chain.
                Clique para se auto-autorizar.
              </p>
            </div>
            <Button
              onClick={handleSelfAuthorize}
              disabled={isRegistering}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {isRegistering
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assinando…</>
                : <><ShieldCheck className="h-4 w-4 mr-2" />Registrar como Especialista</>
              }
            </Button>
            <p className="text-xs text-muted-foreground">
              Carteira: {publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-8)}
            </p>
          </div>
        </main>
      );
    }
    return <UnauthorizedGate />;
  }

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
              <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('pageSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30">
              <ShieldCheck className="h-3 w-3 mr-1" />{t('badgeAccess')}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">Solana Devnet</Badge>
          </div>
        </div>

        {/* Wallet banner */}
        {!connected ? (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{t('walletNotConnected')}</p>
              <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>{t('walletNotConnectedDesc')}</p>
            </div>
            <WalletMultiButton style={{ background: '#14F195', color: '#000', borderRadius: '8px', fontWeight: 'bold', height: '36px', padding: '0 14px', fontSize: '12px' }} />
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2.5 p-3 rounded-xl bg-[#14F195]/5 border border-[#14F195]/20">
            <Wallet className="h-4 w-4 text-[#14F195] shrink-0" />
            <span className="text-xs text-muted-foreground">{t('walletConnectedLabel')}:</span>
            <span className="text-xs font-mono text-[#14F195] truncate">
              {publicKey?.toString().slice(0, 10)}…{publicKey?.toString().slice(-6)}
            </span>
          </div>
        )}

        {/* RPC offline banner */}
        {rpcDown && (
          <div className="mb-2 flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-300 leading-relaxed">
              <span className="font-semibold">Devnet inacessível</span> — verificação de autorização ignorada.
              Transações on-chain também podem falhar até o RPC voltar.
              Tente mudar o RPC em <span className="font-mono">NEXT_PUBLIC_SOLANA_RPC_URL</span> para um endpoint mais estável (ex: Helius, QuickNode).
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Seção 1: O Ativo */}
          <Card>
            <SectionHeader step={1} icon={Building2} title={t('s1Title')}
              description={t('s1Desc')} />
            <CardContent className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="name" label={t('fieldName')}>
                  <Input id="name" placeholder={t('fieldNamePlaceholder')}
                    value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                </Field>
                <Field id="location" label={t('fieldLocation')}>
                  <Input id="location" placeholder={t('fieldLocationPlaceholder')}
                    value={location} onChange={(e) => setLocation(e.target.value)} disabled={isLoading} />
                </Field>
              </div>
              <Field id="description" label={t('fieldDescription')}>
                <textarea id="description" rows={3}
                  placeholder={t('fieldDescriptionPlaceholder')}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none" />
              </Field>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Images className="h-4 w-4 text-[#14F195]" />
                  Fotos do Imóvel
                  <span className="text-xs text-muted-foreground font-normal">(opcional · até 8 fotos)</span>
                </label>
                <ImageUploader
                  onChange={setImageFiles}
                  uploading={isLoading && uploadProgress !== null}
                  uploadProgress={uploadProgress}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Estrutura Financeira */}
          <Card>
            <SectionHeader step={2} icon={DollarSign} title={t('s2Title')}
              description={t('s2Desc')} />
            <CardContent className="flex flex-col gap-4">

              {/* Operation Type */}
              <div className="flex gap-2">
                {(['DIRECT_PURCHASE', 'AUCTION'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOperationType(type)}
                    disabled={isLoading}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      operationType === type
                        ? 'bg-[#14F195] text-black border-[#14F195]'
                        : 'bg-background border-border text-muted-foreground hover:border-[#14F195]/40'
                    }`}
                  >
                    {type === 'DIRECT_PURCHASE' ? '🤝 Compra Direta' : '🔨 Arremate (Leilão)'}
                  </button>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-xl border border-dashed border-border p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Detalhamento de Custos
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field id="acquisitionCost"
                    label={operationType === 'AUCTION' ? 'Teto do Arremate' : 'Valor de Compra'}
                    hint={operationType === 'AUCTION' ? 'Lance máximo aceitável' : 'Valor negociado com o vendedor'}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                      <Input id="acquisitionCost" type="number" min="1" step="any"
                        placeholder={operationType === 'AUCTION' ? '230000' : '200000'}
                        value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)}
                        className="pl-7" disabled={isLoading} />
                    </div>
                  </Field>
                  <Field id="renovationCost" label="Reforma (Capex)" hint="Custo estimado de obra">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                      <Input id="renovationCost" type="number" min="0" step="any" placeholder="30000"
                        value={renovationCost} onChange={(e) => setRenovationCost(e.target.value)}
                        className="pl-7" disabled={isLoading} />
                    </div>
                  </Field>
                  <Field id="legalCost" label="Docs / Taxas" hint="Documentação e custos legais">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                      <Input id="legalCost" type="number" min="0" step="any" placeholder="10000"
                        value={legalCost} onChange={(e) => setLegalCost(e.target.value)}
                        className="pl-7" disabled={isLoading} />
                    </div>
                  </Field>
                </div>
                {/* Calculated total + SiG indicator */}
                <div className="pt-1 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total a captar (calculado)</span>
                    <span className={`text-sm font-bold tabular-nums ${calculatedTargetCapital > 0 ? 'text-[#14F195]' : 'text-muted-foreground'}`}>
                      {calculatedTargetCapital > 0
                        ? `$${calculatedTargetCapital.toLocaleString('en-US')}`
                        : '—'}
                    </span>
                  </div>
                  {calculatedTargetCapital > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-[#14F195]/5 border border-[#14F195]/20 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#14F195] shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Skin-in-Game mínimo exigido <span className="text-[10px]">(5%)</span>
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#14F195] tabular-nums">
                        ${(calculatedTargetCapital * 0.05).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="maxInvestment" label={t('fieldMaxInvestment')}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                    <Input id="maxInvestment" type="number" min="1" step="any" placeholder="50000"
                      value={maxInvestment} onChange={(e) => setMaxInvestment(e.target.value)}
                      className="pl-7" disabled={isLoading} />
                  </div>
                </Field>
                <Field id="targetSalePrice" label={t('fieldTargetSalePrice')}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                    <Input id="targetSalePrice" type="number" min="1" step="any" placeholder="350000"
                      value={targetSalePrice} onChange={(e) => setTargetSalePrice(e.target.value)}
                      className="pl-7" disabled={isLoading} />
                  </div>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="cycleDays" label={t('fieldCycleDays')}>
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
                    <p className="text-sm font-semibold">{t('mintTitle')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('mintDesc')}
                    </p>
                  </div>
                </div>

                {preInfra ? (
                  <div className="rounded-lg bg-[#14F195]/10 border border-[#14F195]/30 p-3 space-y-1 text-xs font-mono">
                    <p className="text-[#14F195] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('mintCreated')}
                    </p>
                    <p className="text-muted-foreground break-all">Mint: {preInfra.mint}</p>
                  </div>
                ) : (
                  <Button type="button" onClick={handleGenerateTestInfra}
                    disabled={isGenInfra || !connected}
                    className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold">
                    {isGenInfra ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('mintGenerating')}</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />{t('mintGenerateBtn')}</>
                    )}
                  </Button>
                )}

                <Field id="acceptedMint" label={t('fieldMint')}
                  hint={preInfra ? t('fieldMintHintAuto') : t('fieldMintHintManual')}>
                  <Input id="acceptedMint" value={acceptedMint}
                    onChange={(e) => setAcceptedMint(e.target.value)}
                    disabled={isLoading} className="font-mono text-xs" />
                </Field>

                {/* Token ratio explanation */}
                {preInfra && calculatedTargetCapital > 0 && (
                  <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                    <p className="font-medium text-foreground">Modelo de tokens:</p>
                    <p>Supply total: <span className="font-mono text-foreground">{calculatedTargetCapital.toLocaleString('pt-BR')} tokens</span> = meta de captação em USDC</p>
                    <p>Ratio: <span className="font-mono text-foreground">1 token = 1 USDC</span></p>
                    <p>SiG mínimo (5%): <span className="font-mono text-foreground">{Math.round(calculatedTargetCapital * 0.05).toLocaleString('pt-BR')} tokens</span> depositados em carteira</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Tese de Investimento */}
          <Card>
            <SectionHeader step={3} icon={TrendingUp} title={t('s3Title')}
              description={t('s3Desc')} />
            <CardContent>
              {hasROI ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('roiConservative'), roi: roiConservador, note: t('roiNoteConservative'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' },
                    { label: t('roiBase'),         roi: roiBase,        note: t('roiNoteBase'),         color: 'text-emerald-700 dark:text-[#14F195]', bg: 'bg-emerald-50 border-emerald-200 dark:bg-[#14F195]/10 dark:border-[#14F195]/20' },
                    { label: t('roiOptimistic'),   roi: roiOtimista,    note: t('roiNoteOptimistic'),   color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' },
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
                  <p className="text-sm">{t('roiEmpty')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="pt-1">
            <Button type="submit" disabled={isLoading || !connected}
              className="w-full h-12 bg-[#14F195] text-black hover:bg-[#0ED47F] font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t('submitSigning')}</>
              ) : !connected ? (
                <><Wallet className="h-5 w-5 mr-2" />{t('submitConnectFirst')}</>
              ) : (
                <>{t('submitCreate')}<ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {t('submitDisclaimer')}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
