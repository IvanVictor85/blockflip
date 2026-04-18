'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Navbar() {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo-blockflip.png"
              alt="BlockFlip"
              width={350}
              height={100}
              priority
              unoptimized
              className="h-28 w-auto object-contain py-1"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('marketplace')}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('howItWorks')}
            </a>
            <a href="#proof-of-build" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('proofOfBuild')}
            </a>
          </div>

          {/* Right side: Language Switcher + Wallet */}
          <div className="hidden md:flex items-center gap-3">
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
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-4">
              <a href="#marketplace" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                {t('marketplace')}
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                {t('howItWorks')}
              </a>
              <a href="#proof-of-build" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                {t('proofOfBuild')}
              </a>

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
