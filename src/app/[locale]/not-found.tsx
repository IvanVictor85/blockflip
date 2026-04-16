"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-[#14F195]/10 border border-[#14F195]/20">
            <Search className="w-10 h-10 text-[#14F195]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t('notFound')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{t('notFoundMessage')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/#marketplace"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold text-sm transition-colors"
          >
            {t('viewMarketplace')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border hover:border-[#14F195]/30 text-foreground text-sm transition-colors"
          >
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
