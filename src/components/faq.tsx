'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

const FAQ_KEYS = ['receive', 'risk', 'crypto', 'documents', 'fees'] as const;

export function FAQ() {
  const t = useTranslations('faq');

  return (
    <section className="py-20" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h2>
        </div>
        <div className="space-y-2">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group rounded-xl bg-card border border-border overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">{t(`q.${key}.q`)}</span>
                <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {t(`q.${key}.a`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
