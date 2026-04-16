'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetCard } from '@/components/asset-card';
import { ProofOfBuild } from '@/components/proof-of-build';
import { PropertyDocuments } from '@/components/property-documents';
import { mockAssets } from '@/data/mock-assets';
import { Asset, AssetStatus } from '@/types';

type FilterStatus = AssetStatus | 'all';

export function AssetMarketplace() {
  const t = useTranslations('marketplace');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'proof' | 'documents'>('proof');

  const filteredAssets = filter === 'all'
    ? mockAssets
    : mockAssets.filter(asset => asset.status === filter);

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

  return (
    <section id="marketplace" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('assetCount', { count: filteredAssets.length })}
            </span>
          </div>
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onSelect={setSelectedAsset}
            />
          ))}
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

              {/* Modal Header with Tabs */}
              <div className="border-b border-border p-6 pb-0">
                <h3 className="text-xl font-semibold mb-4">{selectedAsset.title}</h3>
                <div className="flex gap-1">
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

              {/* Modal Content */}
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
