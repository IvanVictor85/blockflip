import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Default locale gets no prefix: blockflip.io/ (pt-BR), blockflip.io/en-US/, blockflip.io/es-ES/
  localePrefix: 'as-needed',
});
