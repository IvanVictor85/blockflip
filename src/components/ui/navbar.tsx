'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { defaultLocale } from '@/i18n/config';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';
import { Logo } from '@/components/brand/logo';

// Dynamic import with ssr:false — prevents hydration mismatch caused by
// browser wallet extensions injecting state before React hydrates.
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function Navbar() {
  const t = useTranslations('nav');
  const { connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  // With localePrefix:'as-needed', the default locale has no prefix (→ "/").
  // Other locales get their prefix (→ "/en-US", "/es-ES").
  const homeBase = locale === defaultLocale ? '' : `/${locale}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="horizontal" height={45} priority />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href={`${homeBase}/#marketplace`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('marketplace')}
            </a>
            <a href={`${homeBase}/#how-it-works`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('howItWorks')}
            </a>
            <a href={`${homeBase}/#proof-of-build`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('proofOfBuild')}
            </a>
            {connected && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-[#14F195] hover:text-[#0ED47F] transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side: ModeToggle + Language + Wallet */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher />
            <WalletMultiButton
              style={{
                background: '#14F195',
                color: '#000',
                borderRadius: '8px',
                padding: '0 20px',
                fontWeight: 'bold',
                height: '40px',
                fontSize: '14px',
                textTransform: 'uppercase',
              }}
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ModeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground p-2"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border mt-1 pt-3">
            <div className="flex flex-col gap-3">
              <a href={`${homeBase}/#marketplace`} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setIsOpen(false)}>
                {t('marketplace')}
              </a>
              <a href={`${homeBase}/#how-it-works`} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setIsOpen(false)}>
                {t('howItWorks')}
              </a>
              <a href={`${homeBase}/#proof-of-build`} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setIsOpen(false)}>
                {t('proofOfBuild')}
              </a>
              {connected && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#14F195] py-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <LanguageSwitcher />
                <WalletMultiButton
                  style={{
                    background: '#14F195',
                    color: '#000',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    height: '2.25rem',
                    padding: '0 0.75rem',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
