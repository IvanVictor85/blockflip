'use client';

import { useState } from 'react';
import { MapPin, Calendar, TrendingUp, ArrowRight, Shield, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { InvestmentModal } from '@/components/investment-modal';
import { Asset, AssetStatus } from '@/types';
import { formatCurrency, formatPercentage } from '@/data/mock-assets';
import { getSolanaExplorerUrl } from '@/lib/security';

interface AssetCardProps {
  asset: Asset;
  onSelect?: (asset: Asset) => void;
}

const statusColors: Record<AssetStatus, { color: string; bgColor: string }> = {
  arremate: { color: 'text-amber-400', bgColor: 'bg-amber-400/10 border-amber-400/30' },
  em_reforma: { color: 'text-[#14F195]', bgColor: 'bg-[#14F195]/10 border-[#14F195]/30' },
  venda: { color: 'text-blue-400', bgColor: 'bg-blue-400/10 border-blue-400/30' },
};

// Maps stable asset IDs to camelCase keys in the 'assetNames' message namespace.
// Avoids modifying the Asset type or mock data while enabling full i18n.
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

  const status = statusColors[asset.status];
  const fundingProgress = (asset.fundingRaised / asset.fundingGoal) * 100;
  const isFundingClosed = asset.fundingRaised >= asset.fundingGoal;

  const getVerificationIcon = () => {
    switch (asset.verificationStatus) {
      case 'verified': return <Shield className="w-4 h-4 text-[#14F195]" />;
      case 'pending':  return <Shield className="w-4 h-4 text-amber-400" />;
      default:         return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getVerificationTooltip = () => {
    switch (asset.verificationStatus) {
      case 'verified': return t('verifiedTooltip');
      case 'pending':  return t('pendingTooltip');
      default:         return t('unverifiedTooltip');
    }
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-[#14F195]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#14F195]/5">
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-secondary to-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Imagem do Imóvel</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${status.bgColor} ${status.color} border font-medium`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
            {tStatus(asset.status)}
          </Badge>
        </div>

        {/* ROI Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 font-bold">
            <TrendingUp className="w-3 h-3 mr-1" />
            {formatPercentage(asset.estimatedROI)} ROI
          </Badge>
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
                    <div className="cursor-help">{getVerificationIcon()}</div>
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
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-secondary/50">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('acquisition')}</span>
            <span className="font-semibold">{formatCurrency(asset.acquisitionPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('targetSale')}</span>
            <span className="font-semibold text-[#14F195]">{formatCurrency(asset.targetSalePrice)}</span>
          </div>
        </div>

        {/* Funding Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t('funding')}</span>
            <span className="font-medium">
              {formatCurrency(asset.fundingRaised)} / {formatCurrency(asset.fundingGoal)}
            </span>
          </div>
          <Progress value={fundingProgress} className="h-2 bg-secondary" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{fundingProgress.toFixed(0)}% {t('funded')}</span>
            <span className="text-[#14F195]">{asset.fundingCurrency}</span>
          </div>
        </div>

        {/* Cycle Progress */}
        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('cycle')}</span>
          </div>
          <span className="font-medium">
            {asset.currentDay} / {asset.cycleDays} {t('days')}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 space-y-2">
        {!isFundingClosed ? (
          <Button
            className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold group/btn"
            onClick={() => setInvestOpen(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('invest')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        ) : (
          <Button
            className="w-full bg-secondary border border-border text-muted-foreground cursor-default"
            disabled
          >
            {t('fundingClosed')}
          </Button>
        )}

        <Button
          className="w-full bg-secondary hover:bg-[#14F195]/10 border border-transparent hover:border-[#14F195]/30 text-foreground group/btn"
          onClick={() => onSelect?.(asset)}
        >
          {t('viewDetails')}
          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-[#14F195]/30 hover:bg-[#14F195]/5 hover:border-[#14F195]/50 text-muted-foreground hover:text-[#14F195]"
          onClick={() => window.open(getSolanaExplorerUrl(asset.smartContractAddress), '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1.5" />
          {t('viewContract')}
        </Button>
      </CardFooter>

      <InvestmentModal asset={asset} open={investOpen} onOpenChange={setInvestOpen} />
    </Card>
  );
}
