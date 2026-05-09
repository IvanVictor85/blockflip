import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

// next-intl locale routing — runs on every request via Next.js 16 proxy
const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  // Bypass i18n for pitch demo URL (secret demo link)
  if (request.nextUrl.pathname === '/pitch-demo-x7k2m9') {
    return;
  }

  const response = intlMiddleware(request);

  // OWASP: Security Misconfiguration — Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // OWASP: Cryptographic Failures — HSTS (production only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // OWASP: Injection — Content Security Policy
  // unsafe-eval required by Solana wallet adapters (borsh/BN.js)
  // unsafe-inline retained for legacy wallet extension script injection
  // va.vercel-scripts.com + vitals.vercel-insights.com required by Vercel Analytics/SpeedInsights
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      // https: covers fonts.gstatic.com, fonts.googleapis.com and any CDN
      // the wallet adapter's DM Sans @import may resolve from (avoids whack-a-mole)
      "font-src 'self' data: https:",
      // Solana RPCs (http + wss), wallets, Cloudinary uploads, Vercel Analytics
      "connect-src 'self'" +
        " https://api.mainnet-beta.solana.com wss://api.mainnet-beta.solana.com" +
        " https://api.devnet.solana.com wss://api.devnet.solana.com" +
        " https://rpc.ankr.com" +
        " https://explorer.solana.com" +
        " https://phantom.app https://api.phantom.app https://cdn.phantom.app" +
        " https://solflare.com https://api.solflare.com" +
        " https://api.backpack.exchange" +
        " https://api.cloudinary.com" +
        " https://res.cloudinary.com" +
        " https://vitals.vercel-insights.com https://*.vercel-insights.com" +
        " chrome-extension: moz-extension:",
      // manifest-src: explicit to avoid default-src 'self' blocking the absolute URL
      "manifest-src 'self' https://blockflip.vercel.app",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

export const config = {
  // Exclude: API routes, Next.js internals, and any static file with an extension
  // (images, fonts, manifests, robots.txt, etc.) so next-intl never intercepts them.
  matcher: '/((?!api|_next|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|json|txt|xml|woff|woff2|ttf|eot)$).*)',
};
