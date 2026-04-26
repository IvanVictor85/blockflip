'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
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
import {
  mockSummary,
  mockPortfolio,
  mockTransactions,
  type PortfolioProperty,
  type Transaction,
} from '@/data/dashboard';
import { getExplorerTxUrl } from '@/lib/solana';

// ─── Operator Pool (from localStorage) ───────────────────────────────────────

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

// ─── Read localStorage once on mount (pure fn, called inside useCallback) ─────

function readAllPools(): OperatorPool[] {
  try { return JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]'); }
  catch { return []; }
}

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

// ─── Formatters ───────────────────────────────────────────────────────────────

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  funding:   { label: 'Captando',  color: 'bg-blue-500/10 text-blue-600   dark:text-blue-400  border-blue-500/20' },
  reforming: { label: 'Em Obra',   color: 'bg-amber-500/10 text-amber-600  dark:text-amber-400 border-amber-500/20' },
  selling:   { label: 'À Venda',   color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  completed: { label: 'Concluído', color: 'bg-[#14F195]/10 text-emerald-700 dark:text-[#14F195] border-[#14F195]/20' },
} as const;

const txConfig = {
  deposit:    { label: 'Depósito',    Icon: ArrowDownLeft,  color: 'text-[#14F195]' },
  investment: { label: 'Investimento',Icon: ArrowUpRight,   color: 'text-foreground' },
  yield:      { label: 'Rendimento',  Icon: TrendingUp,     color: 'text-[#14F195]' },
  withdrawal: { label: 'Saque',       Icon: ArrowUpRight,   color: 'text-red-500' },
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

function PropertyCard({ p }: { p: PortfolioProperty }) {
  const cfg = statusConfig[p.status];
  const gain = p.currentValue - p.invested;
  const gainPct = (gain / p.invested) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Property image */}
        <div className="relative h-40 sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.location}</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground shrink-0">{p.tokenSymbol}</span>
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-2">
            {p.status !== 'completed' && p.status === 'funding' && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Captação</span>
                  <span className="font-medium">{p.fundingProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${p.fundingProgress}%` }} />
                </div>
              </div>
            )}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso da Obra</span>
                <span className="font-medium">{p.projectProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-[#14F195] transition-all" style={{ width: `${p.projectProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Investido</p>
              <p className="text-sm font-semibold mt-0.5">{usd(p.invested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Atual</p>
              <p className={`text-sm font-semibold mt-0.5 ${gain >= 0 ? 'text-[#14F195]' : 'text-red-500'}`}>
                {usd(p.currentValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {p.status === 'completed' ? 'ROI Realizado' : 'ROI Alvo'}
              </p>
              <p className={`text-sm font-semibold mt-0.5 ${gain >= 0 ? 'text-[#14F195]' : 'text-muted-foreground'}`}>
                {pct(p.status === 'completed' ? gainPct : p.targetRoi)}
              </p>
            </div>
          </div>

          {/* Footer */}
          {p.daysRemaining && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{p.daysRemaining} dias restantes</span>
            </div>
          )}
          {p.completedAt && (
            <div className="flex items-center gap-1.5 text-xs text-[#14F195]">
              <CheckCircle2 className="h-3 w-3" />
              <span>Concluído em {fmtDate(p.completedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
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
          {cfg.label}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right">
        <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-[#14F195]' : 'text-foreground'}`}>
          {isPositive ? '+' : ''}{usd(tx.amount)} USDC
        </p>
      </td>
      <td className="py-3.5 px-4 text-right hidden md:table-cell">
        <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
      </td>
      <td className="py-3.5 px-4 hidden lg:table-cell">
        {tx.status === 'completed' ? (
          <span className="flex items-center gap-1 text-xs text-[#14F195]">
            <CheckCircle2 className="h-3 w-3" /> Concluída
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <CircleDot className="h-3 w-3" /> Pendente
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Empty / Not Connected ─────────────────────────────────────────────────────

function ConnectWalletGate() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-16">
      <div className="max-w-sm w-full mx-auto px-4 text-center flex flex-col items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-[#14F195]/10 flex items-center justify-center">
          <Wallet className="h-9 w-9 text-[#14F195]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Acesse seu Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Conecte sua carteira Solana para visualizar seu portfólio de investimentos, rendimentos acumulados e histórico de movimentações.
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
          Voltar ao Marketplace
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Operator pool card ───────────────────────────────────────────────────────

const poolStatusConfig = {
  funding:   { label: 'Captando',  color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  pending:   { label: 'Pendente',  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  active:    { label: 'Em Obra',   color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  completed: { label: 'Concluído', color: 'bg-[#14F195]/10 text-emerald-700 dark:text-[#14F195] border-[#14F195]/20' },
} as const;

function OperatorPoolCard({ pool }: { pool: OperatorPool }) {
  // Pools saved after depositSkinInGame are in Funding state; before = Pending
  const statusKey: keyof typeof poolStatusConfig = 'funding';
  const cfg = poolStatusConfig[statusKey];
  const createdDate = new Date(pool.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-36 sm:h-auto sm:w-40 shrink-0 overflow-hidden bg-muted">
          {pool.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pool.imageUrl} alt={pool.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">
              Pool #{pool.poolId}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight">{pool.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{pool.location}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{createdDate}</span>
          </div>

          {/* ROI range */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/50 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conservador</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.conservador}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Base</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.base}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Otimista</p>
              <p className="text-sm font-bold text-[#14F195] mt-0.5">+{pool.roi.otimista}%</p>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Meta de Captação</p>
              <p className="font-semibold mt-0.5">{usd(pool.fundingGoal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ciclo</p>
              <p className="font-semibold mt-0.5">{pool.cycleDays} dias</p>
            </div>
          </div>

          {/* PDA + explorer link */}
          <div className="flex items-center gap-3 pt-1 border-t border-border">
            <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">
              PDA: {pool.poolStatePda.slice(0, 10)}…{pool.poolStatePda.slice(-6)}
            </span>
            {pool.sig && (
              <button
                onClick={() => window.open(getExplorerTxUrl(pool.sig!), '_blank')}
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

  // useMemo: recomputes only when publicKey changes. No useEffect needed.
  // Dashboard only renders its content after wallet connects (publicKey is always
  // null on SSR), so there is no hydration mismatch for this derived value.
  const operatorPools = useMemo<OperatorPool[]>(() => {
    if (!publicKey || typeof window === 'undefined') return [];
    try {
      return readAllPools().filter((p) => p.operator === publicKey.toBase58());
    } catch { return []; }
  }, [publicKey]);

  if (!publicKey) return <ConnectWalletGate />;

  const walletShort = `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`;

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meu Portfólio</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              Carteira: <span className="text-foreground">{walletShort}</span>
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Banknote className="h-4 w-4 text-[#14F195]" />
            Investir em Novos Imóveis
          </Link>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Investido"
            value={usd(mockSummary.totalInvested)}
            sub="Em 3 propriedades"
            icon={Wallet}
          />
          <SummaryCard
            label="Valor do Portfólio"
            value={usd(mockSummary.portfolioValue)}
            sub={`${pct(mockSummary.yieldPct)} vs. investido`}
            subColor="text-[#14F195]"
            icon={BarChart3}
          />
          <SummaryCard
            label="Rendimento Acumulado"
            value={usd(mockSummary.totalYield)}
            sub={`${mockSummary.activeDeals} ativo${mockSummary.activeDeals > 1 ? 's' : ''} · ${mockSummary.completedDeals} concluído`}
            subColor="text-[#14F195]"
            icon={TrendingUp}
          />
        </div>

        {/* ── Performance Bar ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Performance Geral</p>
            <span className="text-sm font-bold text-[#14F195]">{pct(mockSummary.yieldPct)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#14F195] to-[#0ED47F] transition-all duration-700"
              style={{ width: `${Math.min(mockSummary.yieldPct * 3, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>Meta: 30% a.a.</span>
          </div>
        </div>

        {/* ── Portfolio ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Meus Investimentos</h2>
            <span className="text-xs text-muted-foreground">{mockPortfolio.length} propriedades</span>
          </div>
          <div className="flex flex-col gap-4">
            {mockPortfolio.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* ── Transaction History ────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Histórico de Movimentações</h2>
            <span className="text-xs text-muted-foreground">{mockTransactions.length} transações</span>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Descrição
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                    Tipo
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Valor
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Data
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Operator Pools ─────────────────────────────────────────── */}
        {operatorPools.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Pools que Opero</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ativos criados e gerenciados pela sua carteira</p>
              </div>
              <span className="text-xs text-muted-foreground">{operatorPools.length} pool{operatorPools.length > 1 ? 's' : ''}</span>
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
          Dados em tempo real via Solana Devnet · Valores em USDC (simulação) ·{' '}
          <span className="text-[#14F195]">BlockFlip Protocol v3</span>
        </p>

      </div>
    </main>
  );
}
