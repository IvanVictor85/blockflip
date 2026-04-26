import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";

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
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

// Minimal root layout — ThemeProvider lives here so it wraps the entire app.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD is static and locale-independent — lives here to avoid hydration mismatch */}
        <JsonLd />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
