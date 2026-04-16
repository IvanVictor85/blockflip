"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error("[BlockFlip] Route error:", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t('somethingWentWrong')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{t('safeMessage')}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 font-mono">Ref: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-[#14F195] text-black hover:bg-[#0ED47F]">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('tryAgain')}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-border hover:border-[#14F195]/30"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('backHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
