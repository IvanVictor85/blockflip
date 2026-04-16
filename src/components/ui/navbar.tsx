'use client';

import { useState } from 'react';
import { Menu, X, Wallet, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Navbar() {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const walletAddress = publicKey?.toString() ?? null;
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  const handleConnect = () => {
    console.log('[BlockFlip] Connect button clicked — opening wallet modal');
    setVisible(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch {
      // ignore
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#14F195] flex items-center justify-center">
              <span className="text-black font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold">
              Block<span className="text-[#14F195]">Flip</span>
            </span>
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

            {connected && shortAddress ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20">
                  <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                  <span className="text-sm font-mono text-[#14F195]">{shortAddress}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 px-2"
                  title={t('disconnectWallet')}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {t('connectWallet')}
              </Button>
            )}
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
                {connected && shortAddress ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[#14F195]">{shortAddress}</span>
                    <Button variant="ghost" size="sm" onClick={handleDisconnect} className="px-2">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnect}
                    className="bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold"
                    size="sm"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {t('connectWallet')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
