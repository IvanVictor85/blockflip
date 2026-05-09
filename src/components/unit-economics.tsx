'use client';

import { Plus, Equal, TrendingUp, Users, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { mockUnitEconomics, formatCurrency } from '@/data/mock-assets';
import { BeforeAfterSlider } from '@/components/before-after-slider';

export function UnitEconomics() {
  const t = useTranslations('unitEconomics');
  const data = mockUnitEconomics;
  const roi = ((data.investorShare / data.totalCost) * 100).toFixed(1);

  return (
    <section id="how-it-works" className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Visual Formula */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 mb-16">
          {/* Step 1: Buy Low */}
          <div className="flex-1 max-w-xs w-full">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('step1Title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('step1Description')}
              </p>
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-2xl font-bold">{formatCurrency(data.acquisitionCost)}</span>
              </div>
            </div>
          </div>

          {/* Plus Sign */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#14F195]/10 text-[#14F195]">
            <Plus className="w-6 h-6" />
          </div>

          {/* Step 2: Reform (with Before/After Sliders) */}
          <div className="flex-1 max-w-2xl w-full">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="w-14 h-14 rounded-full bg-[#14F195]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#14F195]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-center">{t('step2Title')}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {t('step2Description')}
              </p>

              {/* Before/After Sliders - Interior & Exterior */}
              <div className="space-y-4 mb-4">
                {/* Interior (Kitchen) */}
                <div>
                  <BeforeAfterSlider
                    beforeImage="/images/flips/kitchen-before.png"
                    afterImage="/images/flips/kitchen-after.png"
                    beforeLabel={t('beforeLabel')}
                    afterLabel={t('afterLabel')}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-1.5">
                    {t('interiorTransform')}
                  </p>
                </div>

                {/* Exterior (Facade) */}
                <div>
                  <BeforeAfterSlider
                    beforeImage="/images/flips/exterior-before.png"
                    afterImage="/images/flips/exterior-after.png"
                    beforeLabel={t('beforeLabel')}
                    afterLabel={t('afterLabel')}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-1.5">
                    {t('exteriorTransform')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary text-center">
                <span className="text-2xl font-bold">{formatCurrency(data.reformCost + data.operationalCost)}</span>
              </div>
            </div>
          </div>

          {/* Equals Sign */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#14F195]/10 text-[#14F195]">
            <Equal className="w-6 h-6" />
          </div>

          {/* Step 3: Sell Premium */}
          <div className="flex-1 max-w-xs w-full">
            <div className="p-6 rounded-2xl bg-card border border-[#14F195]/30 text-center glow-solana">
              <div className="w-14 h-14 rounded-full bg-[#14F195]/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-[#14F195]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('step3Title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('step3Description')}
              </p>
              <div className="p-3 rounded-lg bg-[#14F195]/10">
                <span className="text-2xl font-bold text-[#14F195]">{formatCurrency(data.targetSalePrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Breakdown */}
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h4 className="font-semibold text-lg mb-6 text-center">{t('profitTitle')}</h4>

            <div className="space-y-4">
              {/* Gross Profit */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">{t('grossProfit')}</span>
                <span className="font-semibold">{formatCurrency(data.grossProfit)}</span>
              </div>

              {/* Net Profit */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">{t('netProfit')}</span>
                <span className="font-semibold">{formatCurrency(data.netProfit)}</span>
              </div>

              {/* Distribution — 60/20/20 Model */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                {/* Investors: 60% */}
                <div className="p-3 rounded-xl bg-[#14F195]/5 border border-[#14F195]/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="w-4 h-4 text-[#14F195]" />
                    <span className="text-xs text-muted-foreground">{t('investorShare')}</span>
                  </div>
                  <span className="text-lg font-bold text-[#14F195]">{formatCurrency(data.investorShare)}</span>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">60%</p>
                </div>

                {/* Operator: 20% */}
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-muted-foreground">{t('operatorShare')}</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(data.operatorShare)}</span>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">20% + 5% vault</p>
                </div>

                {/* Protocol: 20% */}
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-xs text-muted-foreground">{t('protocolFee')}</span>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(data.protocolFee)}</span>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">20%</p>
                </div>
              </div>

              {/* ROI Highlight */}
              <div className="flex items-center justify-center p-4 rounded-xl bg-[#14F195]/10 border border-[#14F195]/30 mt-4">
                <TrendingUp className="w-5 h-5 text-[#14F195] mr-2" />
                <span className="font-semibold">
                  {t('roiPrefix')} <span className="text-[#14F195]">~{roi}%</span> {t('roiSuffix')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
