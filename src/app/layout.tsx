import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Root-level metadata — ensures manifest link is present for all routes,
// including the root path before the locale middleware resolves.
export const metadata: Metadata = {
  manifest: "/manifest.json",
};

// Viewport must stay in root layout for correct mobile rendering
export const viewport: Viewport = {
  themeColor: "#14F195",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Minimal root layout — all locale-specific content lives in [locale]/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* JSON-LD is static and locale-independent — lives here to avoid hydration mismatch */}
        <JsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
