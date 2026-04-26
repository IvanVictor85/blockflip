'use client';

import { ArrowRight, TrendingUp, Shield, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { defaultLocale } from '@/i18n/config';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const specialistHref = locale === defaultLocale ? '/specialist' : `/${locale}/specialist`;

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Subtle background — single green glow, no purple */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#14F195]/5 via-transparent to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-[#14F195]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge — credibility, not tech-stack marketing */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-xs text-[#14F195] font-medium tracking-wide">{t('badge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t('headline')}{' '}
            <span className="text-gradient-solana">{t('headlineAccent')}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('subheadline')}
          </p>

          {/* CTAs — max 2, clear hierarchy */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold text-base px-8 py-6 glow-solana"
              onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaPrimary')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link
              href={specialistHref}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:border-[#14F195]/40 hover:bg-[#14F195]/5 text-base font-medium px-8 py-6 transition-colors"
            >
              {t('ctaSecondary')}
            </Link>
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
