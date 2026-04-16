// Supported locales and default locale for BlockFlip
export const locales = ['pt-BR', 'en-US', 'es-ES'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português',
  'en-US': 'English',
  'es-ES': 'Español',
};

export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
};
