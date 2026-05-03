'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type Variant = 'symbol' | 'symbol-window' | 'horizontal';
type Theme = 'dark' | 'light';

interface LogoProps {
  variant?: Variant;
  theme?: Theme; // Se não especificar, detecta automaticamente
  height?: number;
  className?: string;
  priority?: boolean;
}

const ASPECT_RATIOS: Record<Variant, number> = {
  'symbol': 200 / 220,
  'symbol-window': 200 / 220,
  'horizontal': 420 / 140,
};

export function Logo({
  variant = 'horizontal',
  theme,
  height = 32,
  className = '',
  priority = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Se theme não foi especificado, usa o tema atual (dark/light)
  // Se foi especificado manualmente, usa o que foi passado
  const effectiveTheme = theme ?? (mounted ? (resolvedTheme as Theme) : 'dark');

  const file = `${variant}-${effectiveTheme}`;
  const ratio = ASPECT_RATIOS[variant];
  const width = Math.round(height * ratio);

  // Durante SSR ou antes de montar, renderiza versão dark como fallback
  if (!mounted && !theme) {
    const fallbackFile = `${variant}-dark`;
    const fallbackWidth = Math.round(height * ratio);

    return (
      <Image
        src={`/brand/${fallbackFile}.svg`}
        alt="BlockFlip"
        width={fallbackWidth}
        height={height}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src={`/brand/${file}.svg`}
      alt="BlockFlip"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
