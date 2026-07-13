import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import MasterBar from "@/components/layout/MasterBar";
import SmartAppBanner from "@/components/layout/SmartAppBanner";
import IOSInstallPrompt from "@/components/layout/IOSInstallPrompt";
import BottomNav from "@/components/layout/BottomNav";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FFBF00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "San Rafael 360 — Descubrí la ciudad",
    template: "%s | San Rafael 360",
  },
  description: "El directorio definitivo de negocios, restaurantes, hoteles y atracciones de San Rafael, Mendoza. Tu guía local completa.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SR360",
  },
  openGraph: {
    title: "San Rafael 360",
    description: "El directorio definitivo de San Rafael, Mendoza.",
    url: siteUrl,
    siteName: "San Rafael 360",
    locale: "es_AR",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
  },
};

import { FavoritesProvider } from "@/context/FavoritesContext";
import MetaPixel from "@/components/layout/MetaPixel";
import { Suspense } from "react";
import { getCategorias } from "@/lib/categorias";

// Schema.org WebSite — habilita el Sitelinks Searchbox de Google
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "San Rafael 360",
  url: siteUrl,
  logo: `${siteUrl}/icons/icon-192.png`,
  description:
    "El directorio definitivo de negocios, restaurantes, hoteles y atracciones de San Rafael, Mendoza.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categorias = await getCategorias();

  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Toaster richColors position="top-right" />
        <SessionProvider>
          <FavoritesProvider>
            <div className="app-container font-sans pt-[var(--app-banner-height,0px)]">
              <MasterBar />
              <Navbar categorias={categorias} />
              {children}
              <BottomNav />
              <SmartAppBanner />
              <IOSInstallPrompt />
              <SpeedInsights />
              <Suspense fallback={null}>
                <MetaPixel />
              </Suspense>
            </div>
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
