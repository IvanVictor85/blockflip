'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageCircle, X, Send, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// Official Solana logo mark SVG (gradient parallelograms)
function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397 312" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sol-a" x1="360.879" y1="-3.3" x2="141.213" y2="314.458" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00FFA3"/>
          <stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol-b" x1="264.829" y1="-51.6" x2="45.163" y2="266.158" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00FFA3"/>
          <stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol-c" x1="312.548" y1="-27.5" x2="92.882" y2="290.258" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00FFA3"/>
          <stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
      </defs>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-a)"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-b)"/>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-c)"/>
    </svg>
  );
}

interface ComingSoonModalProps {
  title: string;
  onClose: () => void;
}

function ComingSoonModal({ title, onClose }: ComingSoonModalProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">Em breve disponível. Seja o primeiro a saber.</p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-[#14F195]" />
            <p className="text-sm font-medium">Email registrado! Avisaremos quando estiver disponível.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/30"
            />
            <Button type="submit" className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold">
              <Send className="w-4 h-4 mr-2" />
              Notifique-me
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Footer() {
  const t = useTranslations('footer');
  const [modal, setModal] = useState<string | null>(null);

  const openModal = (title: string) => setModal(title);
  const closeModal = () => setModal(null);

  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Image
              src="/logo-blockflip.png"
              alt="BlockFlip"
              width={350}
              height={100}
              unoptimized
              className="h-28 w-auto object-contain"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => openModal('Docs')} className="hover:text-foreground transition-colors">{t('docs')}</button>
            <button onClick={() => openModal('Whitepaper')} className="hover:text-foreground transition-colors">{t('whitepaper')}</button>
            <button onClick={() => openModal('FAQ')} className="hover:text-foreground transition-colors">{t('faq')}</button>
            <button onClick={() => openModal('Contato')} className="hover:text-foreground transition-colors">{t('contact')}</button>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <XIcon className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <GitHubIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('copyright')}</p>
          <div className="flex items-center gap-2">
            <span>{t('poweredBy')}</span>
            <SolanaLogo className="h-5 w-auto" />
            <span className="font-semibold">Solana</span>
          </div>
        </div>
      </div>

      {modal && <ComingSoonModal title={modal} onClose={closeModal} />}
    </footer>
  );
}
