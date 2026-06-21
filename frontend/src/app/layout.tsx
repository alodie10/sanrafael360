import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import MasterBar from "@/components/layout/MasterBar";
import SmartAppBanner from "@/components/layout/SmartAppBanner";
import BottomNav from "@/components/layout/BottomNav";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sanrafael360.com"),
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
    url: "https://www.sanrafael360.com",
    siteName: "San Rafael 360",
    locale: "es_AR",
    type: "website",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  },
};

import { FavoritesProvider } from "@/context/FavoritesContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}>
      <body>
        <Toaster richColors position="top-right" />
        <SessionProvider>
          <FavoritesProvider>
            <div className="app-container font-sans pt-[var(--app-banner-height,0px)]">
              <MasterBar />
              <Navbar />
              {children}
              <BottomNav />
              <SmartAppBanner />
              <SpeedInsights />
            </div>
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
