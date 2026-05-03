import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SolanaWalletProvider } from "@/components/wallet-provider";
import { Navbar } from "@/components/ui/navbar";
// Analytics/SpeedInsights temporarily disabled — ERR_BLOCKED_BY_CLIENT noise
// was polluting the console during wallet connection debugging.
// TODO: re-enable after wallet flow is confirmed working.
// import { Analytics } from "@vercel/analytics/react";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://blockflip.io";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    "pt-BR": "BlockFlip — Compra Imóvel em Leilão. Reforma. Vende com Ágio. On-chain.",
    "en-US": "BlockFlip — Buy Auction Property. Renovate. Sell at Premium. On-chain.",
    "es-ES": "BlockFlip — Compra Inmueble en Subasta. Reforma. Vende con Prima. On-chain.",
  };

  const descriptions: Record<string, string> = {
    "pt-BR":
      "BlockFlip tokeniza o ciclo completo de property flipping: arremate judicial → reforma ágil → venda premium. ROI de 20-30% em até 6 meses. Investimento fracionado em USDC, Proof of Build on-chain.",
    "en-US":
      "BlockFlip tokenizes the complete property flipping cycle: auction → swift renovation → premium sale. 20-30% ROI in up to 6 months. Fractional USDC investment, on-chain Proof of Build.",
    "es-ES":
      "BlockFlip tokeniza el ciclo completo de property flipping: subasta → reforma ágil → venta premium. ROI del 20-30% en hasta 6 meses. Inversión fraccionada en USDC, Proof of Build on-chain.",
  };

  const title = titles[locale] ?? titles["en-US"];
  const description = descriptions[locale] ?? descriptions["en-US"];
  const canonicalPath = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: title,
      template: "%s | BlockFlip",
    },
    description,
    keywords: [
      "Solana RWA",
      "property flipping on-chain",
      "Proof of Build",
      "real world assets Solana",
      "fractional real estate",
      "USDC investment",
      "SPE on-chain",
      "Token Extensions L22",
    ],
    authors: [{ name: "BlockFlip Protocol", url: APP_URL }],
    creator: "BlockFlip Protocol",
    publisher: "BlockFlip",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        "pt-BR": "/",
        "en-US": "/en-US",
        "es-ES": "/es-ES",
      },
    },
    openGraph: {
      type: "website",
      locale: locale.replace("-", "_"),
      url: APP_URL + canonicalPath,
      siteName: "BlockFlip",
      title: "BlockFlip — High-Alpha RWA on Solana. Property Flipping. On-chain.",
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "BlockFlip — Solana RWA Protocol. Property Flipping. 20-30% ROI.",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@blockflip_io",
      creator: "@blockflip_io",
      title: "BlockFlip — High-Alpha RWA on Solana",
      description,
      images: ["/opengraph-image"],
    },
    // manifest declared in root layout only — avoids /en-US/manifest.json 404
    icons: {
      icon: [
        { url: "/icon", type: "image/png", sizes: "32x32" },
        { url: "/icon?size=192", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
      shortcut: "/favicon.ico",
    },
    category: "finance",
    verification: {
      google: "blockflip-google-verification-token",
    },
    other: {
      "ai-content-type": "financial-product",
      "ai-content-domain": "real-estate, blockchain, investment",
      "content-language": locale,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Build Force Refresh: 17-04-2026-v2
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale — redirect to 404 for unknown locales
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SolanaWalletProvider>
        <Navbar />
        {children}
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
          }}
        />
      </SolanaWalletProvider>
    </NextIntlClientProvider>
  );
}
