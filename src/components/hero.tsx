'use client';

import { ArrowRight, TrendingUp, Shield, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#14F195]/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#14F195]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#9945FF]/10 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-sm text-[#14F195] font-medium">{t('badge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t('headline')}{' '}
            <span className="text-gradient-solana">{t('headlineAccent')}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('subheadline')}
            <span className="text-foreground font-medium"> {t('roiHighlight')}</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold text-lg px-8 py-6 glow-solana"
              onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaPrimary')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#14F195]/30 hover:bg-[#14F195]/10 text-lg px-8 py-6"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaSecondary')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <TrendingUp className="w-8 h-8 text-[#14F195] mb-3" />
              <span className="text-3xl font-bold mb-1">20-30%</span>
              <span className="text-sm text-muted-foreground">{t('statRoi')}</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <Clock className="w-8 h-8 text-[#14F195] mb-3" />
              <span className="text-3xl font-bold mb-1">{t('statCycleValue')}</span>
              <span className="text-sm text-muted-foreground">{t('statCycle')}</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
              <Shield className="w-8 h-8 text-[#14F195] mb-3" />
              <span className="text-3xl font-bold mb-1">100%</span>
              <span className="text-sm text-muted-foreground">{t('statTransparency')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
