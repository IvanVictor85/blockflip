'use client';

import { CheckCircle2, Circle, Clock, ExternalLink, FileImage, FileVideo, FileText, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Asset, BuildMilestone } from '@/types';
import { formatCurrency, formatPercentage } from '@/data/mock-assets';

interface ProofOfBuildProps {
  asset: Asset;
}

const statusIcons = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
};

const evidenceIcons = {
  photo: FileImage,
  video: FileVideo,
  document: FileText,
};

export function ProofOfBuild({ asset }: ProofOfBuildProps) {
  const t = useTranslations('proofOfBuild');
  const completedMilestones = asset.milestones.filter(m => m.status === 'completed').length;
  const progress = (completedMilestones / asset.milestones.length) * 100;

  return (
    <div id="proof-of-build">
      {/* Header */}
      <div className="mb-8">
        <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
          {t('badge')}
        </Badge>
        <h3 className="text-2xl font-bold mb-2">{asset.title}</h3>
        <p className="text-muted-foreground">{asset.location}</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <span className="text-sm text-muted-foreground block mb-1">{t('progressLabel')}</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[#14F195]">{progress.toFixed(0)}%</span>
            <span className="text-sm text-muted-foreground mb-1">
              ({t('completedMilestones', { completed: completedMilestones, total: asset.milestones.length })})
            </span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <span className="text-sm text-muted-foreground block mb-1">Ciclo</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{asset.currentDay}</span>
            <span className="text-sm text-muted-foreground mb-1">/ {asset.cycleDays}d</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <span className="text-sm text-muted-foreground block mb-1">{t('projectedROI')}</span>
          <span className="text-2xl font-bold text-[#14F195]">{formatPercentage(asset.estimatedROI)}</span>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8 p-4 rounded-xl bg-secondary/50 border border-border">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {t('financialSummary')}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('acquisitionCost')}</span>
            <span className="font-semibold">{formatCurrency(asset.acquisitionPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('reformCost')}</span>
            <span className="font-semibold">{formatCurrency(asset.fundingGoal)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('targetSale')}</span>
            <span className="font-semibold text-[#14F195]">{formatCurrency(asset.targetSalePrice)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('projectedROI')}</span>
            <span className="font-semibold text-[#14F195]">{formatPercentage(asset.estimatedROI)}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="space-y-0">
          {asset.milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              isLast={index === asset.milestones.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Token Info */}
      <div className="mt-8 p-4 rounded-xl bg-[#14F195]/5 border border-[#14F195]/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm text-muted-foreground block mb-1">Token</span>
            <span className="font-mono font-bold text-[#14F195]">{asset.tokenSymbol}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground block mb-1">Supply</span>
            <span className="font-semibold">{asset.totalTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground block mb-1">Min.</span>
            <span className="font-semibold">{formatCurrency(asset.minInvestment)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneItem({ milestone, isLast }: { milestone: BuildMilestone; isLast: boolean }) {
  const t = useTranslations('proofOfBuild');
  const StatusIcon = statusIcons[milestone.status];
  const EvidenceIcon = milestone.evidenceType ? evidenceIcons[milestone.evidenceType] : null;

  const statusColors = {
    completed:   'text-[#14F195] bg-[#14F195]/10',
    in_progress: 'text-amber-400 bg-amber-400/10',
    pending:     'text-muted-foreground bg-secondary',
  };

  const lineColors = {
    completed:   'bg-[#14F195]',
    in_progress: 'bg-gradient-to-b from-amber-400 to-muted',
    pending:     'bg-muted',
  };

  return (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <div className={`absolute left-5 top-10 w-0.5 h-[calc(100%-2rem)] ${lineColors[milestone.status]}`} />
      )}

      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${statusColors[milestone.status]}`}>
        <StatusIcon className="w-5 h-5" />
      </div>

      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h5 className="font-semibold flex items-center gap-2">
              {milestone.title}
              {milestone.status === 'completed' && (
                <Badge variant="outline" className="text-xs bg-[#14F195]/10 text-[#14F195] border-[#14F195]/30">
                  {t('completed')}
                </Badge>
              )}
              {milestone.status === 'in_progress' && (
                <Badge variant="outline" className="text-xs bg-amber-400/10 text-amber-400 border-amber-400/30">
                  {t('inProgress')}
                </Badge>
              )}
            </h5>
            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
            {milestone.completedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(milestone.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {milestone.evidenceHash ? (
            <Button variant="outline" size="sm" className="border-[#14F195]/30 hover:bg-[#14F195]/10 text-sm">
              {EvidenceIcon && <EvidenceIcon className="w-4 h-4 mr-2" />}
              {t('viewEvidence')}
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          ) : milestone.status !== 'pending' ? (
            <Button variant="outline" size="sm" className="border-border text-muted-foreground text-sm" disabled>
              <Clock className="w-4 h-4 mr-2" />
              {t('inProgress')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="border-border text-muted-foreground text-sm" disabled>
              <Lock className="w-4 h-4 mr-2" />
              {t('pending')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
