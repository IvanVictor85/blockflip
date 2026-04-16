import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// next-intl: points to the server request config
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // ─── Compressão e modo estrito ───────────────────────────────
  compress: true,
  reactStrictMode: true,

  // ─── Remoção de console.log em produção ─────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ─── Otimização de pacotes externos ─────────────────────────
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-toast",
      "next-intl",
    ],
  },

  // ─── Otimização de imagens ───────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ipfs.io",
        pathname: "/**",
      },
    ],
  },

  // ─── Headers de cache (reforço — vercel.json é a camada primária) ─
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },

  // ─── Redirects canônicos ─────────────────────────────────────
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(withBundleAnalyzer(nextConfig));
