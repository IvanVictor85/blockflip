'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSelect = (next: Locale) => {
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        aria-label="Switch language"
      >
        <span>{localeFlags[locale]}</span>
        <span className="hidden sm:inline font-medium">{localeNames[locale]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                loc === locale
                  ? 'bg-[#14F195]/10 text-[#14F195]'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <span>{localeFlags[loc]}</span>
              <span className="font-medium">{localeNames[loc]}</span>
              {loc === locale && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#14F195]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
