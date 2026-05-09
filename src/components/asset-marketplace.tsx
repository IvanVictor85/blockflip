'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetCard } from '@/components/asset-card';
import { ProofOfBuild } from '@/components/proof-of-build';
import { PropertyDocuments } from '@/components/property-documents';
import { mockAssets } from '@/data/mock-assets';
import { Asset, AssetStatus } from '@/types';
import { getPoolsAction } from '@/actions/pool';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── LocalStorage pool shape ──────────────────────────────────────────────────

interface StoredPool {
  poolId: number;
  poolStatePda: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  cycleDays: number;
  operationType?: 'AUCTION' | 'DIRECT_PURCHASE';
  acquisitionCost?: number;
  renovationCost?: number;
  legalCost?: number;
  fundingGoal: number;
  targetSalePrice: number;
  roi: { conservador: number; base: number; otimista: number };
  operator: string;
  createdAt: string;
  sig?: string;
  vault?: string | null;
  acceptedMint?: string | null;
  operatorAta?: string | null;
  sigDepositTx?: string | null;
  imageUrls?: string[];
}

const DEFAULT_PROPERTY_IMG =
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80';

function storedPoolToAsset(p: StoredPool): Asset {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(p.createdAt).getTime()) / 86_400_000
  );

  return {
    id: `pool-${p.poolId}`,
    title: p.name,
    location: p.location,
    imageUrl: p.imageUrl || DEFAULT_PROPERTY_IMG,
    // Pools in Funding state → arremate (first stage: acquired, raising capital)
    status: 'arremate' as AssetStatus,
    acquisitionPrice: p.acquisitionCost ?? Math.round(p.fundingGoal * 0.65),
    targetSalePrice: p.targetSalePrice || Math.round(p.fundingGoal * 1.3),
    estimatedROI: p.roi.base,
    cycleDays: p.cycleDays,
    currentDay: daysSinceCreation,
    fundingGoal: p.fundingGoal,
    // If SiG was deposited, operator put in ≥5% of fundingGoal on-chain
    fundingRaised: p.sigDepositTx ? Math.round(p.fundingGoal * 0.05) : 0,
    imageUrls: p.imageUrls ?? (p.imageUrl ? [p.imageUrl] : []),
    fundingCurrency: 'USDC',
    milestones: [],
    tokenSymbol: `BFLP-${String(p.poolId).padStart(3, '0')}`,
    totalTokens: p.fundingGoal,
    minInvestment: 100,
    smartContractAddress: p.poolStatePda,
    speAddress: p.poolStatePda,
    verificationStatus: 'pending',
    documents: [],
    // Real on-chain fields for invest wiring
    poolId: p.poolId,
    poolVault: p.vault ?? undefined,
    acceptedMint: p.acceptedMint ?? undefined,
    investorAta: p.operatorAta ?? undefined, // same wallet in demo
    // Cost breakdown (present for pools created after this feature)
    operationType: p.operationType,
    acquisitionCost: p.acquisitionCost,
    renovationCost: p.renovationCost,
    legalCost: p.legalCost,
  };
}

// ─── Read localStorage → Asset[] (pure function, called once on mount) ────────

function readRealPools(): Asset[] {
  // Parse pools — if this fails, nothing to show
  let stored: StoredPool[];
  try {
    stored = JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]');
  } catch {
    return [];
  }

  // Parse investments — isolated try so a failure here doesn't wipe pools
  const raisedByPool = new Map<number, number>();
  try {
    const investments: { poolId: number; amountUsdc: number }[] = JSON.parse(
      localStorage.getItem('blockflip_investments') ?? '[]'
    );
    for (const inv of investments) {
      if (typeof inv.poolId === 'number' && typeof inv.amountUsdc === 'number') {
        raisedByPool.set(inv.poolId, (raisedByPool.get(inv.poolId) ?? 0) + inv.amountUsdc);
      }
    }
  } catch { /* non-fatal — pools still render without investor totals */ }

  return stored.map((p) => {
    try {
      const asset = storedPoolToAsset(p);
      const investorRaised = raisedByPool.get(p.poolId) ?? 0;
      const sigRaised = p.sigDepositTx ? Math.round(p.fundingGoal * 0.05) : 0;
      return { ...asset, fundingRaised: sigRaised + investorRaised };
    } catch {
      return storedPoolToAsset(p); // fallback: render without updated fundingRaised
    }
  });
}

// ─── DB pool → Asset ──────────────────────────────────────────────────────────

type DbPool = Extract<Awaited<ReturnType<typeof getPoolsAction>>, { success: true }>['data'][number];

function dbPoolToAsset(p: DbPool, local: StoredPool | undefined, investorRaised: number): Asset {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(p.createdAt).getTime()) / 86_400_000
  );
  const sigRaised = local?.sigDepositTx ? Math.round(p.targetCapital * 0.05) : 0;
  const images = p.imageUrls && p.imageUrls.length > 0
    ? p.imageUrls
    : local?.imageUrl ? [local.imageUrl] : [];

  return {
    id: `pool-db-${p.poolPda}`,
    title: p.name,
    location: p.location ?? local?.location ?? '',
    imageUrl: images[0] ?? DEFAULT_PROPERTY_IMG,
    imageUrls: images,
    status: 'arremate' as AssetStatus,
    acquisitionPrice: p.acquisitionCost ?? Math.round(p.targetCapital * 0.65),
    targetSalePrice: local?.targetSalePrice ?? Math.round(p.targetCapital * 1.3),
    estimatedROI: p.roiBase,
    cycleDays: p.cycleDays ?? local?.cycleDays ?? 120,
    currentDay: daysSinceCreation,
    fundingGoal: p.targetCapital,
    fundingRaised: p.raisedCapital > 0 ? p.raisedCapital : sigRaised + investorRaised,
    fundingCurrency: 'USDC',
    milestones: [],
    tokenSymbol: `BFLP-${p.poolPda.slice(0, 4).toUpperCase()}`,
    totalTokens: p.targetCapital,
    minInvestment: 100,
    smartContractAddress: p.poolPda,
    speAddress: p.poolPda,
    verificationStatus: 'pending',
    documents: [],
    operationType: p.operationType === 'AUCTION' ? 'AUCTION' : 'DIRECT_PURCHASE',
    acquisitionCost: p.acquisitionCost ?? undefined,
    renovationCost: p.renovationCost ?? undefined,
    legalCost: p.legalCost ?? undefined,
    // On-chain wiring from localStorage
    poolId: local?.poolId,
    poolVault: local?.vault ?? undefined,
    acceptedMint: local?.acceptedMint ?? undefined,
    investorAta: local?.operatorAta ?? undefined,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = AssetStatus | 'all';

// ─── Component ────────────────────────────────────────────────────────────────

export function AssetMarketplace() {
  const t = useTranslations('marketplace');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'proof' | 'documents'>('proof');
  const [realAssets, setRealAssets] = useState<Asset[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build investment totals from localStorage
    const raisedByPool = new Map<number, number>();
    try {
      const investments: { poolId: number; amountUsdc: number }[] = JSON.parse(
        localStorage.getItem('blockflip_investments') ?? '[]'
      );
      for (const inv of investments) {
        if (typeof inv.poolId === 'number' && typeof inv.amountUsdc === 'number') {
          raisedByPool.set(inv.poolId, (raisedByPool.get(inv.poolId) ?? 0) + inv.amountUsdc);
        }
      }
    } catch { /* non-fatal */ }

    // Index localStorage pools by poolPda for supplemental fields
    const localByPda = new Map<string, StoredPool>();
    try {
      const stored: StoredPool[] = JSON.parse(localStorage.getItem('blockflip_pools') ?? '[]');
      for (const p of stored) localByPda.set(p.poolStatePda, p);
    } catch { /* non-fatal */ }

    // Fetch from DB — authoritative source
    getPoolsAction().then((res) => {
      if (!res.success) {
        // DB unavailable: fall back to localStorage-only pools
        setRealAssets(readRealPools());
        return;
      }
      const dbAssets = res.data.map((p) => {
        const local = localByPda.get(p.poolPda);
        const investorRaised = local?.poolId != null ? (raisedByPool.get(local.poolId) ?? 0) : 0;
        return dbPoolToAsset(p, local, investorRaised);
      });
      // Merge: DB pools by pda, then any localStorage-only pools not yet in DB
      const dbPdas = new Set(res.data.map((p) => p.poolPda));
      const localOnly = readRealPools().filter((a) => {
        const pda = a.smartContractAddress ?? '';
        return !dbPdas.has(pda);
      });
      setRealAssets([...dbAssets, ...localOnly]);
    });
  }, []);

  // Real pools first, then mocks — deduplicate by id
  const allAssets: Asset[] = [
    ...realAssets,
    ...mockAssets.filter((m) => !realAssets.some((r) => r.id === m.id)),
  ];

  const filteredAssets =
    filter === 'all' ? allAssets : allAssets.filter((a) => a.status === filter);

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: t('filterAll') },
    { value: 'arremate', label: t('filterArremate') },
    { value: 'em_reforma', label: t('filterReforma') },
    { value: 'venda', label: t('filterVenda') },
  ];

  const handleCloseProof = () => {
    setSelectedAsset(null);
    setActiveTab('proof');
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 350; // Width of one card + gap
    const newPosition = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  return (
    <section id="marketplace" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
            {realAssets.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#14F195] text-black text-[10px] font-bold">
                {realAssets.length} on-chain
              </span>
            )}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option.value)}
                className={
                  filter === option.value
                    ? 'bg-[#14F195] text-black hover:bg-[#0ED47F]'
                    : 'border-border hover:border-[#14F195]/30 hover:bg-[#14F195]/5'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {t('assetCount', { count: filteredAssets.length })}
          </span>
        </div>

        {/* Horizontal Carousel with Navigation Arrows */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCarousel('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#14F195]/10 hover:border-[#14F195]/30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCarousel('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#14F195]/10 hover:border-[#14F195]/30"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            suppressHydrationWarning
          >
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start">
                <AssetCard asset={asset} onSelect={setSelectedAsset} />
              </div>
            ))}
          </div>
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('emptyFilter')}</p>
          </div>
        )}

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border">
              <button
                onClick={handleCloseProof}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="border-b border-border p-6 pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">{selectedAsset.title}</h3>
                  {selectedAsset.poolId !== undefined && (
                    <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 text-xs">
                      On-chain · Pool #{selectedAsset.poolId}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 mt-4">
                  <button
                    onClick={() => setActiveTab('proof')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                      activeTab === 'proof'
                        ? 'bg-[#14F195]/10 text-[#14F195] border-b-2 border-[#14F195]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    Proof of Build
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                      activeTab === 'documents'
                        ? 'bg-[#14F195]/10 text-[#14F195] border-b-2 border-[#14F195]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {t('documentsTab')} ({selectedAsset.documents.length})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'proof' && <ProofOfBuild asset={selectedAsset} />}
                {activeTab === 'documents' && (
                  <PropertyDocuments
                    documents={selectedAsset.documents}
                    assetTitle={selectedAsset.title}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
