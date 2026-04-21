'use client';

import { useState } from 'react';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { InvestmentModal } from '@/components/investment-modal';
import { Asset, AssetStatus } from '@/types';
import { formatCurrency, formatBRL, formatPercentage } from '@/data/mock-assets';
import { getSolanaExplorerUrl } from '@/lib/security';

interface AssetCardProps {
  asset: Asset;
  onSelect?: (asset: Asset) => void;
}

const statusConfig: Record<AssetStatus, {
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  arremate:   { color: 'text-blue-400',    bgColor: 'bg-blue-400/10 border-blue-400/30',    borderColor: 'border-l-blue-500' },
  em_reforma: { color: 'text-amber-400',   bgColor: 'bg-amber-400/10 border-amber-400/30',  borderColor: 'border-l-amber-400' },
  venda:      { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/30', borderColor: 'border-l-emerald-500' },
};

// Maps stable asset IDs to camelCase keys in the 'assetNames' message namespace.
const ASSET_NAME_KEY: Record<string, string> = {
  'asset-001': 'asset001',
  'asset-002': 'asset002',
  'asset-003': 'asset003',
  'asset-004': 'asset004',
};

export function AssetCard({ asset, onSelect }: AssetCardProps) {
  const t = useTranslations('assetCard');
  const tStatus = useTranslations('status');
  const tNames = useTranslations('assetNames');
  const [investOpen, setInvestOpen] = useState(false);

  const nameKey = ASSET_NAME_KEY[asset.id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayTitle = nameKey ? (tNames as any)(nameKey) as string : asset.title;

  const status = statusConfig[asset.status];
  const fundingProgress = (asset.fundingRaised / asset.fundingGoal) * 100;
  const isFundingClosed = asset.fundingRaised >= asset.fundingGoal;

  const getVerificationTooltip = () => {
    switch (asset.verificationStatus) {
      case 'verified': return t('verifiedTooltip');
      case 'pending':  return t('pendingTooltip');
      default:         return t('unverifiedTooltip');
    }
  };

  const verificationDot =
    asset.verificationStatus === 'verified' ? 'bg-[#14F195]' :
    asset.verificationStatus === 'pending'  ? 'bg-amber-400' : 'bg-gray-400';

  return (
    <Card className={`group overflow-hidden bg-card border border-border border-l-4 ${status.borderColor} ${isFundingClosed ? 'border-l-gray-600' : ''} hover:border-[#14F195]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#14F195]/5`}>

      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-secondary to-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Imagem do Imóvel</span>
        </div>

        {/* Status badge — bottom-left overlay */}
        <div className="absolute bottom-3 left-3">
          <Badge className={`${isFundingClosed ? 'bg-gray-700/80 text-gray-400 border-gray-600' : `${status.bgColor} ${status.color}`} border font-medium backdrop-blur-sm`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
            {isFundingClosed ? 'Captação Encerrada' : tStatus(asset.status)}
          </Badge>
        </div>

        {/* ROI — top-right, prominent */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-right">
          <div className="text-2xl font-extrabold text-[#14F195] leading-none tracking-tight">
            {formatPercentage(asset.estimatedROI)}
          </div>
          <div className="text-[10px] text-[#14F195]/70 uppercase tracking-widest mt-0.5">ROI est.</div>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg group-hover:text-[#14F195] transition-colors">
                {displayTitle}
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`w-2 h-2 rounded-full ${verificationDot} cursor-help`} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{getVerificationTooltip()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {asset.location}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Financial Snapshot */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/50">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">{t('acquisition')}</span>
            <span className="font-semibold text-sm">{formatCurrency(asset.acquisitionPrice)}</span>
            <span className="text-[10px] text-muted-foreground/60 block">{formatBRL(asset.acquisitionPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">{t('targetSale')}</span>
            <span className="font-semibold text-sm text-[#14F195]">{formatCurrency(asset.targetSalePrice)}</span>
            <span className="text-[10px] text-muted-foreground/60 block">{formatBRL(asset.targetSalePrice)}</span>
          </div>
        </div>

        {/* Funding Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t('funding')}</span>
          </div>
          <Progress value={fundingProgress} className="h-3 bg-secondary" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold">{fundingProgress.toFixed(0)}% {t('funded')}</span>
            <span className="text-xs font-mono text-[#14F195]">{formatCurrency(asset.fundingRaised)}</span>
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] text-muted-foreground/60">{formatBRL(asset.fundingRaised)} / {formatBRL(asset.fundingGoal)}</span>
          </div>
        </div>

        {/* Cycle */}
        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('cycle')}</span>
          </div>
          <span className="font-medium">{asset.currentDay} / {asset.cycleDays} {t('days')}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1 border-border hover:border-[#14F195]/30 hover:bg-[#14F195]/5"
            onClick={() => onSelect?.(asset)}
          >
            {t('viewDetails')}
          </Button>

          {!isFundingClosed ? (
            <Button
              className="flex-1 bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold"
              onClick={() => setInvestOpen(true)}
            >
              {t('invest')}
            </Button>
          ) : (
            <Button className="flex-1 bg-secondary border border-border text-muted-foreground cursor-default" disabled>
              {t('fundingClosed')}
            </Button>
          )}
        </div>

        {/* Smart Contract — icon link only */}
        <div className="flex justify-center">
          <button
            onClick={() => window.open(getSolanaExplorerUrl(asset.smartContractAddress), '_blank')}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-[#14F195] transition-colors py-1"
            title={t('viewContract')}
          >
            <ExternalLink className="w-3 h-3" />
            Smart Contract
          </button>
        </div>
      </CardFooter>

      <InvestmentModal asset={asset} open={investOpen} onOpenChange={setInvestOpen} />
    </Card>
  );
}
