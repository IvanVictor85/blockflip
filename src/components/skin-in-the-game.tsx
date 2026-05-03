'use client';

import { Lock, Shield, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

export function SkinInTheGame() {
  const t = useTranslations('skinInTheGame');

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Lock className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card1Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card1Description')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Shield className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card2Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card2Description')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <CheckCircle2 className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card3Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card3Description')}</p>
          </div>
        </div>

        {/* Visualização da divisão de capital */}
        <div className="mt-12 p-8 rounded-2xl bg-card border border-border max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3 text-center">{t('split')}</p>
          <div className="flex h-12 rounded-lg overflow-hidden">
            <div className="flex-[5] bg-[#14F195] flex items-center justify-center">
              <span className="text-black text-sm font-bold">5% operador</span>
            </div>
            <div className="flex-[95] bg-secondary flex items-center justify-center border-l-2 border-background">
              <span className="text-sm font-medium">95% investidores</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {t('splitNote')}
          </p>
        </div>
      </div>
    </section>
  );
}
