import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},   // Silencia la advertencia, pero el build usa webpack (requerido por next-pwa)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sanrafael360-production.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/negocios",
        destination: "/",
        permanent: true,
      },
      {
        source: "/descargar",
        destination: "https://play.google.com/store/apps/details?id=com.sanrafael360.www.twa",
        permanent: false,
      },
      {
        source: "/app",
        destination: "https://play.google.com/store/apps/details?id=com.sanrafael360.www.twa",
        permanent: false,
      },
      {
        // URL malformada detectada en GSC el 15/06/2026 — link copiado incorrectamente
        // en WhatsApp/redes con el & pegado al dominio → redirect permanente a home
        source: "/&",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache páginas Next.js
        urlPattern: /^https:\/\/www\.sanrafael360\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Cache API de Strapi (Network First para datos frescos)
        urlPattern: /^https:\/\/sanrafael360-production\.up\.railway\.app\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
        },
      },
      {
        // Cache imágenes (Cache First para eficiencia)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Cache fuentes Google
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts-cache",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);
