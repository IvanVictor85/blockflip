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
} from 'lucide-react';
import { getExplorerTxUrl, openExternalUrl } from '@/lib/solana';
import { isAllowedImageUrl } from '@/lib/security';
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
  roi: { conservador: number; base: number; otimista: number };
  operator: string;
  createdAt: string;
  sig?: string;
}

// ─── Read localStorage once on mount ─────────────────────────────────────────

function readAllPools(): OperatorPool[] {
  try { return JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]'); }
  catch { return []; }
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
    roi: p.roi,
    operator: p.operator,
    createdAt: p.createdAt,
    sig: p.sig,
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

function OperatorPoolCard({ pool }: { pool: DisplayPool }) {
  const t = useTranslations('dashboard');
  const [imgError, setImgError] = useState(false);
  // Pools saved after depositSkinInGame are in Funding state; before = Pending
  const statusKey: keyof typeof poolStatusConfig = 'funding';
  const cfg = poolStatusConfig[statusKey];
  const createdDate = new Date(pool.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

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
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${cfg.color}`}>
              {t(cfg.labelKey)}
            </span>
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
              <p className="text-xs text-muted-foreground">Skin-in-Game</p>
              <p className="font-semibold mt-0.5 text-[#14F195]">
                {pool.skinInGame > 0
                  ? `${usd(pool.skinInGame)} (${((pool.skinInGame / pool.fundingGoal) * 100).toFixed(1)}%)`
                  : '—'}
              </p>
            </div>
          </div>

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
          location: local?.location ?? '',
          imageUrl: p.imageUrl ?? local?.imageUrl ?? '',
          cycleDays: local?.cycleDays ?? null,
          fundingGoal: p.targetCapital,
          skinInGame: p.skinInGame,
          roi: {
            conservador: p.roiConservative,
            base: p.roiBase,
            otimista: p.roiOptimistic,
          },
          operator: p.specialist.walletAddress ?? wallet,
          createdAt: p.createdAt,
          sig: local?.sig,
        };
      });

      // Include localStorage-only pools (created before DB migration)
      const dbPdas = new Set(dbMapped.map((p) => p.poolStatePda));
      const localOnly = localPools.filter((p) => !dbPdas.has(p.poolStatePda));

      return [...dbMapped, ...localOnly];
    } catch { return []; }
  }, [publicKey, dbPools]);

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
                <OperatorPoolCard key={pool.poolId} pool={pool} />
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
