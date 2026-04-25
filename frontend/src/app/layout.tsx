import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import MasterBar from "@/components/layout/MasterBar";
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

export const metadata: Metadata = {
  title: "San Rafael 360",
  description: "Directorio Oficial de San Rafael",
};

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
          <div className="app-container font-sans">
            <MasterBar />
            <Navbar />
            {children}
            <SpeedInsights />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
