'use client';

import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

export function Footer() {
  const t = useTranslations('footer');

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
            <a href="#" className="hover:text-foreground transition-colors">{t('docs')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('whitepaper')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('faq')}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t('contact')}</a>
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
            <svg className="h-4" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H0V69.3817C0.00236798 68.1569 0.485953 66.9823 1.34403 66.1217C2.20211 65.261 3.3619 64.7681 4.57102 64.7559H79.9845C80.5068 64.7557 81.024 64.6571 81.5064 64.4652C81.9889 64.2734 82.4272 63.992 82.7967 63.6374L95.9179 50.4106L100.48 55.0249V69.3817Z" fill="url(#paint0_linear_bf)"/>
              <path d="M100.48 17.6142V32.5682L95.9179 37.1526L82.7967 23.9278C82.4272 23.5733 81.9889 23.2919 81.5064 23.1001C81.024 22.9083 80.5068 22.8097 79.9845 22.8095H4.57102C3.3619 22.7972 2.20211 22.3044 1.34403 21.4437C0.485953 20.5831 0.00236798 19.4085 0 18.1837V0H80.9743C81.5055 -0.000354102 82.0312 0.106038 82.5185 0.312241C83.0058 0.518443 83.4444 0.820099 83.8068 1.19846L100.48 18.6183V17.6142Z" fill="#14F195"/>
              <defs>
                <linearGradient id="paint0_linear_bf" x1="0" y1="71.7056" x2="100.48" y2="71.7056" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9945FF"/>
                  <stop offset="1" stopColor="#14F195"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold">Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
