'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  CircleDot,
  Banknote,
  ChevronRight,
  Building2,
  ExternalLink,
  ShieldCheck,
  Gavel,
  Handshake,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getExplorerTxUrl, openExternalUrl } from '@/lib/solana';
import { isAllowedImageUrl } from '@/lib/security';
import { useBlockFlip } from '@/hooks/useBlockFlip';
import { getPoolsAction } from '@/actions/pool';
import { getInvestmentsAction } from '@/actions/investment';

// ─── Stored Investment (from localStorage) ───────────────────────────────────

interface StoredInvestment {
  id: string;
  poolId: number;
  assetId: string;
  investorWallet: string;
  amountUsdc: number;
  txSignature: string;
  timestamp: string;
  // Denormalized at write time by InvestmentModal — no JOIN needed
  poolName: string;
  poolLocation: string;
  poolImageUrl: string;
  targetRoi: number;
  cycleDays: number;
}

function readAllInvestments(): StoredInvestment[] {
  try { return JSON.parse(localStorage.getItem('blockflip_investments') ?? '[]'); }
  catch { return []; }
}

// ─── Unified investment display type (DB + localStorage merged) ───────────────

interface DisplayInvestment {
  id: string;
  txSignature: string;
  investorWallet: string;
  amountUsdc: number;
  timestamp: string;
  poolName: string;
  poolLocation: string;
  poolImageUrl: string;
  targetRoi: number;
  cycleDays: number | null;
  poolId: number | null; // on-chain pool ID (localStorage only)
}

// ─── Operator Pool (raw localStorage shape) ───────────────────────────────────

interface OperatorPool {
  poolId: number;
  poolStatePda: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  cycleDays: number;
  fundingGoal: number;
  targetSalePrice: number;
  roi: { conservador: number; base: number; otimista: number };
  operator: string;
  createdAt: string;
  sig?: string;
  sigDepositTx?: string | null; // set after skin-in-game deposit confirmed
  vault?: string | null;
  operatorAta?: string | null;
}

// ─── Unified display type (DB + localStorage merged) ─────────────────────────

interface DisplayPool {
  key: string;
  poolId: number | null;
  poolStatePda: string;
  name: string;
  location: string;
  imageUrl: string;
  cycleDays: number | null;
  fundingGoal: number;
  skinInGame: number;
  operationType?: 'AUCTION' | 'DIRECT_PURCHASE';
  acquisitionCost?: number | null;
  renovationCost?: number | null;
  legalCost?: number | null;
  roi: { conservador: number; base: number; otimista: number };
  operator: string;
  createdAt: string;
  sig?: string;
  sigDepositTx?: string; // set after skin-in-game deposit confirmed
  vault?: string;        // pool token vault — needed for SiG deposit
  operatorAta?: string;  // operator's ATA for the accepted mint
}

// ─── Read localStorage once on mount ─────────────────────────────────────────

function readAllPools(): OperatorPool[] {
  try { return JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]'); }
  catch { return []; }
}

function persistSigDeposit(poolStatePda: string, depositSig: string): void {
  try {
    const pools: OperatorPool[] = JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]');
    const updated = pools.map((p) =>
      p.poolStatePda === poolStatePda ? { ...p, sigDepositTx: depositSig } : p
    );
    localStorage.setItem('blockflip_pools', JSON.stringify(updated));
  } catch { /* non-fatal */ }
}

function localToDisplay(p: OperatorPool): DisplayPool {
  return {
    key: p.poolStatePda,
    poolId: p.poolId,
    poolStatePda: p.poolStatePda,
    name: p.name,
    location: p.location,
    imageUrl: p.imageUrl,
    cycleDays: p.cycleDays,
    fundingGoal: p.fundingGoal,
    skinInGame: 0, // localStorage doesn't store this — DB is authoritative
    operationType: (p as { operationType?: 'AUCTION' | 'DIRECT_PURCHASE' }).operationType,
    roi: p.roi,
    operator: p.operator,
    createdAt: p.createdAt,
    sig: p.sig,
    vault: p.vault ?? undefined,
    operatorAta: p.operatorAta ?? undefined,
    sigDepositTx: p.sigDepositTx ?? undefined,
  };
}

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

// ─── Formatters ───────────────────────────────────────────────────────────────

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);


// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  funding:   { labelKey: 'statusFunding',   color: 'bg-blue-500/10 text-blue-600   dark:text-blue-400  border-blue-500/20' },
  reforming: { labelKey: 'statusReforming', color: 'bg-amber-500/10 text-amber-600  dark:text-amber-400 border-amber-500/20' },
  selling:   { labelKey: 'statusSelling',   color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  completed: { labelKey: 'statusCompleted', color: 'bg-[#14F195]/10 text-emerald-700 dark:text-[#14F195] border-[#14F195]/20' },
} as const;

const txConfig = {
  deposit:    { labelKey: 'txTypeDeposit',    Icon: ArrowDownLeft, color: 'text-[#14F195]' },
  investment: { labelKey: 'txTypeInvestment', Icon: ArrowUpRight,  color: 'text-foreground' },
  yield:      { labelKey: 'txTypeYield',      Icon: TrendingUp,    color: 'text-[#14F195]' },
  withdrawal: { labelKey: 'txTypeWithdrawal', Icon: ArrowUpRight,  color: 'text-red-500' },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  subColor = 'text-muted-foreground',
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="h-9 w-9 rounded-xl bg-[#14F195]/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#14F195]" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

function InvestmentCard({ inv }: { inv: DisplayInvestment }) {
  const t = useTranslations('dashboard');
  const [imgError, setImgError] = useState(false);
  const investedAt = new Date(inv.timestamp).toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-36 sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-muted">
          {inv.poolImageUrl && isAllowedImageUrl(inv.poolImageUrl) && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={inv.poolImageUrl} alt={inv.poolName} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${statusConfig.funding.color}`}>
              {t(statusConfig.funding.labelKey)}
            </span>
          </div>
          {inv.poolId != null && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">
                Pool #{inv.poolId}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight">{inv.poolName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{inv.poolLocation}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {investedAt}
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/50 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('investedLabel')}</p>
              <p className="text-sm font-bold mt-0.5">{usd(inv.amountUsdc)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('roiTargetLabel')}</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{inv.targetRoi}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('cycle')}</p>
              <p className="text-sm font-bold mt-0.5">{inv.cycleDays != null ? `${inv.cycleDays} ${t('cycleUnit')}` : '—'}</p>
            </div>
          </div>

          {/* TX link */}
          <div className="flex items-center gap-3 pt-1 border-t border-border">
            <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">
              TX: {inv.txSignature.slice(0, 10)}…{inv.txSignature.slice(-6)}
            </span>
            <button
              onClick={() => openExternalUrl(getExplorerTxUrl(inv.txSignature))}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#14F195] transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TxRow {
  id: string;
  type: keyof typeof txConfig;
  description: string;
  txHash: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

function TransactionRow({ tx }: { tx: TxRow }) {
  const t = useTranslations('dashboard');
  const cfg = txConfig[tx.type];
  const isPositive = tx.amount > 0;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${cfg.color}`}>
            <cfg.Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{tx.description}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {tx.txHash.slice(0, 8)}…{tx.txHash.slice(-4)}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 hidden sm:table-cell">
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {t(cfg.labelKey)}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right">
        <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-[#14F195]' : 'text-foreground'}`}>
          {isPositive ? '+' : ''}{usd(tx.amount)} USDC
        </p>
      </td>
      <td className="py-3.5 px-4 text-right hidden md:table-cell">
        <p className="text-xs text-muted-foreground">
          {new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </td>
      <td className="py-3.5 px-4 hidden lg:table-cell">
        {tx.status === 'completed' ? (
          <span className="flex items-center gap-1 text-xs text-[#14F195]">
            <CheckCircle2 className="h-3 w-3" /> {t('txCompleted')}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <CircleDot className="h-3 w-3" /> {t('txPending')}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Empty / Not Connected ─────────────────────────────────────────────────────

function ConnectWalletGate() {
  const t = useTranslations('dashboard');
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-16">
      <div className="max-w-sm w-full mx-auto px-4 text-center flex flex-col items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-[#14F195]/10 flex items-center justify-center">
          <Wallet className="h-9 w-9 text-[#14F195]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('connectTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t('connectMessage')}
          </p>
        </div>
        <WalletMultiButton
          style={{
            background: '#14F195',
            color: '#000',
            borderRadius: '10px',
            fontWeight: 'bold',
            height: '44px',
            padding: '0 28px',
            fontSize: '14px',
          }}
        />
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          {t('connectBack')}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Operator pool card ───────────────────────────────────────────────────────

const poolStatusConfig = {
  funding:   { labelKey: 'statusFunding',   color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  pending:   { labelKey: 'txPending',       color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  active:    { labelKey: 'statusReforming', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  completed: { labelKey: 'statusCompleted', color: 'bg-[#14F195]/10 text-emerald-700 dark:text-[#14F195] border-[#14F195]/20' },
} as const;

function OperatorPoolCard({ pool, onSigDeposited }: { pool: DisplayPool; onSigDeposited?: () => void }) {
  const t = useTranslations('dashboard');
  const [imgError, setImgError] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const { depositSkinInGame } = useBlockFlip();

  const handleDepositSig = async () => {
    if (!pool.poolId || !pool.operatorAta || !pool.vault) return;
    setIsDepositing(true);
    const toastId = toast.loading(t('sigToastLoading'));

    const handleSuccess = (sig: string) => {
      persistSigDeposit(pool.poolStatePda, sig || 'recovered');
      toast.success(t('sigToastSuccess'), {
        id: toastId,
        description: t('sigToastSuccessDesc', { poolId: pool.poolId ?? '?' }),
        ...(sig ? { action: { label: 'Explorer', onClick: () => openExternalUrl(getExplorerTxUrl(sig)) } } : {}),
        duration: 8_000,
      });
      onSigDeposited?.();
    };

    try {
      const sig = await depositSkinInGame(pool.poolId, pool.operatorAta, pool.vault);
      handleSuccess(sig);
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? '';
      // 0x0 = System Program AccountAlreadyInUse — investorPosition PDA already
      // exists, meaning a previous SiG deposit was confirmed. Treat as success.
      if (msg.includes('custom program error: 0x0') || msg.includes('already been processed')) {
        const match = msg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
        handleSuccess(match ? match[0] : '');
        return;
      }
      toast.error(t('sigDepositTitle'), { id: toastId, description: msg.slice(0, 120) });
    } finally {
      setIsDepositing(false);
    }
  };

  // Hide button once SiG is confirmed (either via DB skinInGame or localStorage sigDepositTx)
  const needsSig = !pool.sigDepositTx && pool.skinInGame === 0
    && Boolean(pool.poolId) && Boolean(pool.vault) && Boolean(pool.operatorAta);
  const statusKey: keyof typeof poolStatusConfig = needsSig ? 'pending' : 'funding';
  const cfg = poolStatusConfig[statusKey];
  const createdDate = new Date(pool.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  const isAuction = pool.operationType === 'AUCTION';
  const opBadge = pool.operationType
    ? {
        label: isAuction ? t('opTypeAuction') : t('opTypeDirect'),
        Icon: isAuction ? Gavel : Handshake,
        cls: isAuction
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    : null;

  // DB skinInGame lags until an on-chain webhook updates it.
  // If the operator already deposited (sigDepositTx present), derive 5% from fundingGoal.
  const effectiveSkinInGame = pool.skinInGame > 0
    ? pool.skinInGame
    : pool.sigDepositTx
      ? Math.round(pool.fundingGoal * 0.05)
      : 0;

  const skinPct = effectiveSkinInGame > 0
    ? ((effectiveSkinInGame / pool.fundingGoal) * 100).toFixed(1)
    : null;

  const totalCost = (pool.acquisitionCost ?? 0) + (pool.renovationCost ?? 0) + (pool.legalCost ?? 0);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-36 sm:h-auto sm:w-40 shrink-0 overflow-hidden bg-muted">
          {pool.imageUrl && isAllowedImageUrl(pool.imageUrl) && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pool.imageUrl} alt={pool.name} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${cfg.color}`}>
              {t(cfg.labelKey)}
            </span>
            {opBadge && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${opBadge.cls}`}>
                <opBadge.Icon className="h-2.5 w-2.5" />
                {opBadge.label}
              </span>
            )}
          </div>
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">
              {pool.poolId != null ? `Pool #${pool.poolId}` : `${pool.poolStatePda.slice(0, 6)}…`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight">{pool.name}</h3>
              {pool.location && <p className="text-xs text-muted-foreground mt-0.5">{pool.location}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{createdDate}</span>
          </div>

          {/* ROI range */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/50 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('roiConservative')}</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.conservador}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('roiBase')}</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.base}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('roiOptimistic')}</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.otimista}%</p>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('fundingGoal')}</p>
              <p className="font-semibold mt-0.5">{usd(pool.fundingGoal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('cycle')}</p>
              <p className="font-semibold mt-0.5">{pool.cycleDays != null ? `${pool.cycleDays} ${t('cycleUnit')}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#14F195]" />
                {t('skinInGame')}
              </p>
              {skinPct ? (
                <div className="mt-0.5">
                  <p className="font-semibold text-[#14F195]">{usd(effectiveSkinInGame)}</p>
                  <p className="text-[10px] text-[#14F195]/70">{skinPct}{t('skinInGamePct')}</p>
                </div>
              ) : (
                <p className="font-semibold mt-0.5 text-muted-foreground/50">—</p>
              )}
            </div>
          </div>

          {/* Cost breakdown (only when DB has the data) */}
          {totalCost > 0 && (
            <div className="pt-1 border-t border-border space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('costBreakdown')}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(pool.acquisitionCost ?? 0) > 0 && (
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground">{isAuction ? t('costAuction') : t('costAcquisition')}</p>
                    <p className="font-semibold mt-0.5 tabular-nums">{usd(pool.acquisitionCost!)}</p>
                  </div>
                )}
                {(pool.renovationCost ?? 0) > 0 && (
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground">{t('costRenovation')}</p>
                    <p className="font-semibold mt-0.5 tabular-nums">{usd(pool.renovationCost!)}</p>
                  </div>
                )}
                {(pool.legalCost ?? 0) > 0 && (
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground">{t('costLegal')}</p>
                    <p className="font-semibold mt-0.5 tabular-nums">{usd(pool.legalCost!)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SiG deposit CTA — shown when pool is Pending and infra is available */}
          {needsSig && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t('sigDepositTitle')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t('sigDepositDesc')}</p>
                </div>
              </div>
              <button
                onClick={handleDepositSig}
                disabled={isDepositing}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-semibold text-xs px-3 py-2 transition-colors"
              >
                {isDepositing
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> {t('sigDepositSigning')}</>
                  : <><ShieldCheck className="h-3 w-3" /> {t('sigDepositBtn')}</>}
              </button>
            </div>
          )}

          {/* PDA + explorer link */}
          <div className="flex items-center gap-3 pt-1 border-t border-border">
            <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">
              PDA: {pool.poolStatePda.slice(0, 10)}…{pool.poolStatePda.slice(-6)}
            </span>
            {pool.sig && (
              <button
                onClick={() => openExternalUrl(getExplorerTxUrl(pool.sig!))}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#14F195] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Explorer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const t = useTranslations('dashboard');

  type DbPool = Extract<Awaited<ReturnType<typeof getPoolsAction>>, { success: true }>['data'][number];
  // DB pools fetched asynchronously
  const [dbPools, setDbPools] = useState<DbPool[]>([]);
  // Bumped after persistSigDeposit so the memo re-reads localStorage immediately
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    getPoolsAction().then((res) => {
      if (!res.success) return;
      setDbPools(res.data.filter((p) => p.specialist.walletAddress === wallet));
    });
  }, [publicKey]);

  // Merge DB + localStorage: DB is canonical, localStorage supplements missing fields.
  // Dedup by poolPda so pools saved to both sources appear only once.
  const operatorPools = useMemo<DisplayPool[]>(() => {
    if (!publicKey || typeof window === 'undefined') return [];
    try {
      const wallet = publicKey.toBase58();
      const localPools = readAllPools()
        .filter((p) => p.operator === wallet)
        .map(localToDisplay);

      const dbMapped: DisplayPool[] = dbPools.map((p) => {
        const local = localPools.find((lp) => lp.poolStatePda === p.poolPda);
        return {
          key: p.poolPda,
          poolId: local?.poolId ?? null,
          poolStatePda: p.poolPda,
          name: p.name,
          location: p.location ?? local?.location ?? '',
          imageUrl: p.imageUrl ?? local?.imageUrl ?? '',
          cycleDays: p.cycleDays ?? local?.cycleDays ?? null,
          fundingGoal: p.targetCapital,
          skinInGame: p.skinInGame,
          operationType: (p.operationType as 'AUCTION' | 'DIRECT_PURCHASE') ?? undefined,
          acquisitionCost: p.acquisitionCost,
          renovationCost: p.renovationCost,
          legalCost: p.legalCost,
          roi: {
            conservador: p.roiConservative,
            base: p.roiBase,
            otimista: p.roiOptimistic,
          },
          operator: p.specialist.walletAddress ?? wallet,
          createdAt: p.createdAt,
          sig: local?.sig,
          sigDepositTx: local?.sigDepositTx,
          vault: local?.vault,
          operatorAta: local?.operatorAta,
        };
      });

      // Include localStorage-only pools (created before DB migration)
      const dbPdas = new Set(dbMapped.map((p) => p.poolStatePda));
      const localOnly = localPools.filter((p) => !dbPdas.has(p.poolStatePda));

      return [...dbMapped, ...localOnly];
    } catch { return []; }
  }, [publicKey, dbPools, localVersion]);

  // DB investments fetched asynchronously
  type DbInvestment = Extract<Awaited<ReturnType<typeof getInvestmentsAction>>, { success: true }>['data'][number];
  const [dbInvestments, setDbInvestments] = useState<DbInvestment[]>([]);

  useEffect(() => {
    if (!publicKey) return;
    getInvestmentsAction(publicKey.toBase58()).then((res) => {
      if (res.success) setDbInvestments(res.data);
    });
  }, [publicKey]);

  // Merge DB + localStorage: DB wins, localStorage fills missing fields and covers pre-migration records
  const investorInvestments = useMemo<DisplayInvestment[]>(() => {
    if (!publicKey || typeof window === 'undefined') return [];
    try {
      const wallet = publicKey.toBase58();
      const local = readAllInvestments().filter((inv) => inv.investorWallet === wallet);

      const dbMapped: DisplayInvestment[] = dbInvestments.map((inv) => {
        const localMatch = local.find((l) => l.txSignature === inv.txHash);
        return {
          id:             inv.id,
          txSignature:    inv.txHash,
          investorWallet: wallet,
          amountUsdc:     inv.amount,
          timestamp:      inv.createdAt,
          poolName:       inv.pool.name,
          poolLocation:   inv.pool.location ?? localMatch?.poolLocation ?? '',
          poolImageUrl:   inv.pool.imageUrl ?? localMatch?.poolImageUrl ?? '',
          targetRoi:      inv.pool.roiBase,
          cycleDays:      inv.pool.cycleDays ?? localMatch?.cycleDays ?? null,
          poolId:         localMatch?.poolId ?? null,
        };
      });

      // Include localStorage-only records (pre-migration investments)
      const dbTxHashes = new Set(dbMapped.map((i) => i.txSignature));
      const localOnly: DisplayInvestment[] = local
        .filter((l) => !dbTxHashes.has(l.txSignature))
        .map((l) => ({
          id:             l.txSignature,
          txSignature:    l.txSignature,
          investorWallet: wallet,
          amountUsdc:     l.amountUsdc,
          timestamp:      l.timestamp,
          poolName:       l.poolName,
          poolLocation:   l.poolLocation,
          poolImageUrl:   l.poolImageUrl,
          targetRoi:      l.targetRoi,
          cycleDays:      l.cycleDays,
          poolId:         l.poolId,
        }));

      return [...dbMapped, ...localOnly];
    } catch { return []; }
  }, [publicKey, dbInvestments]);

  // Derived summary from real investments
  const totalInvested = investorInvestments.reduce((s, i) => s + i.amountUsdc, 0);
  const uniquePools = new Set(investorInvestments.map((i) => i.poolId)).size;

  // Convert investments to transaction rows (t available after useTranslations call above)
  const investmentTxRows: TxRow[] = investorInvestments.map((inv) => ({
    id: inv.id,
    type: 'investment',
    description: t('txDescription', { poolName: inv.poolName }),
    txHash: inv.txSignature,
    amount: -inv.amountUsdc,
    date: inv.timestamp,
    status: 'completed',
  }));

  if (!publicKey) return <ConnectWalletGate />;

  const walletShort = `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`;

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              {t('walletLabel')}: <span className="text-foreground">{walletShort}</span>
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Banknote className="h-4 w-4 text-[#14F195]" />
            {t('newInvestment')}
          </Link>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label={t('totalInvested')}
            value={usd(totalInvested)}
            sub={uniquePools > 0 ? t('inProperties', { count: uniquePools }) : t('noDeposit')}
            icon={Wallet}
          />
          <SummaryCard
            label={t('portfolioValue')}
            value={usd(totalInvested)}
            sub={totalInvested > 0 ? t('inFunding') : t('startInvesting')}
            icon={BarChart3}
          />
          <SummaryCard
            label={t('accumulatedYield')}
            value={usd(0)}
            sub={t('activeAssets', { count: investorInvestments.length })}
            icon={TrendingUp}
          />
        </div>

        {/* ── Portfolio ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">{t('myInvestments')}</h2>
            <span className="text-xs text-muted-foreground">
              {investorInvestments.length > 0
                ? t('investmentsCount', { count: investorInvestments.length })
                : t('noInvestments')}
            </span>
          </div>
          {investorInvestments.length > 0 ? (
            <div className="flex flex-col gap-4">
              {investorInvestments.map((inv) => (
                <InvestmentCard key={inv.id} inv={inv} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#14F195]/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-[#14F195]" />
              </div>
              <div>
                <p className="font-semibold">{t('emptyTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {t('emptyMessage')}
                </p>
              </div>
              <Link
                href="/#marketplace"
                className="inline-flex items-center gap-2 rounded-xl bg-[#14F195] text-black font-semibold px-5 py-2.5 text-sm hover:bg-[#0ED47F] transition-colors"
              >
                <Banknote className="h-4 w-4" />
                {t('exploreMarketplace')}
              </Link>
            </div>
          )}
        </section>

        {/* ── Transaction History ────────────────────────────────────── */}
        {investmentTxRows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{t('txHistory')}</h2>
              <span className="text-xs text-muted-foreground">{t('txCount', { count: investmentTxRows.length })}</span>
            </div>
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('colDescription')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      {t('colType')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('colValue')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      {t('colDate')}
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                      {t('colStatus')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {investmentTxRows.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Operator Pools ─────────────────────────────────────────── */}
        {operatorPools.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">{t('poolsOperated')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t('poolsOperatedSub')}</p>
              </div>
              <span className="text-xs text-muted-foreground">{t('poolsCount', { count: operatorPools.length })}</span>
            </div>
            <div className="flex flex-col gap-4">
              {operatorPools.map((pool) => (
                <OperatorPoolCard
                  key={pool.key}
                  pool={pool}
                  onSigDeposited={() => {
                    // Force memo to re-read localStorage (sigDepositTx now set)
                    setLocalVersion((v) => v + 1);
                    // Also re-fetch DB pools in case skinInGame was updated
                    if (!publicKey) return;
                    getPoolsAction().then((res) => {
                      if (res.success) setDbPools(res.data.filter((p) => p.specialist.walletAddress === publicKey.toBase58()));
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Footer note ────────────────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          {t('footerNote')}
        </p>

      </div>
    </main>
  );
}
