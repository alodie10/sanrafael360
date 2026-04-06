"use client";

import { useState } from "react";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Circle,
  Monitor,
} from "lucide-react";

interface WebsitePortletProps {
  url: string;
  businessName: string;
}

export default function WebsitePortlet({ url, businessName }: WebsitePortletProps) {
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [screenshotLoaded, setScreenshotLoaded] = useState(false);
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  let domain = "";
  try {
    domain = new URL(finalUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = finalUrl;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // Microlink API: screenshot gratuito del sitio real
  const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(
    finalUrl
  )}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&viewport.width=1280&viewport.height=800`;

  return (
    <div className="w-full mb-12">
      {/* Título de sección */}
      <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
        <Monitor className="w-6 h-6 text-primary" />
        Sitio Web Oficial
        <div className="h-px flex-1 bg-white/5" />
      </h2>

      {/* Browser Window Card */}
      <div className="group rounded-3xl overflow-hidden border border-white/8 bg-slate-900/60 shadow-2xl backdrop-blur-sm hover:border-primary/30 transition-all duration-500">

        {/* ── Browser Chrome Bar ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-950/80 border-b border-white/6">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Circle className="w-3 h-3 fill-red-500/70 text-red-500/70" />
            <Circle className="w-3 h-3 fill-amber-500/70 text-amber-500/70" />
            <Circle className="w-3 h-3 fill-emerald-500/70 text-emerald-500/70" />
          </div>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-2 bg-slate-800/60 border border-white/6 rounded-lg px-3 py-1.5 min-w-0">
            {faviconFailed ? (
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <img
                src={faviconUrl}
                alt={domain}
                className="w-3.5 h-3.5 object-contain shrink-0"
                onError={() => setFaviconFailed(true)}
              />
            )}
            <span className="text-slate-400 text-xs font-mono truncate">{finalUrl}</span>
          </div>

          {/* Refresh icon */}
          <RefreshCw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        </div>

        {/* ── Screenshot Viewport ── */}
        <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">

          {/* Skeleton mientras carga */}
          {!screenshotLoaded && !screenshotFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="w-full h-full animate-pulse bg-slate-800/50" />
              <div className="absolute flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-700/80 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-slate-500 animate-pulse" />
                </div>
                <p className="text-slate-500 text-xs font-mono">Cargando preview…</p>
              </div>
            </div>
          )}

          {/* Fallback si Microlink falla */}
          {screenshotFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center">
                {faviconFailed ? (
                  <Globe className="w-8 h-8 text-primary/60" />
                ) : (
                  <img
                    src={faviconUrl}
                    alt={domain}
                    className="w-10 h-10 object-contain"
                    onError={() => setFaviconFailed(true)}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{businessName}</p>
                <p className="text-slate-500 text-sm font-mono mt-1">{domain}</p>
                <p className="text-slate-600 text-xs mt-3">
                  Preview no disponible — visita el sitio directamente
                </p>
              </div>
            </div>
          )}

          {/* Screenshot real */}
          <img
            src={screenshotUrl}
            alt={`Preview de ${businessName}`}
            className={`w-full h-full object-cover object-top transition-opacity duration-700 ${
              screenshotLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setScreenshotLoaded(true)}
            onError={() => setScreenshotFailed(true)}
          />

          {/* Overlay: gradiente inferior + badge verificado */}
          {screenshotLoaded && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          )}
        </div>

        {/* ── Footer con CTA ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            {/* Favicon / icono */}
            <div className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {faviconFailed ? (
                <Globe className="w-4 h-4 text-primary" />
              ) : (
                <img
                  src={faviconUrl}
                  alt={domain}
                  className="w-6 h-6 object-contain"
                  onError={() => setFaviconFailed(true)}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                  Sitio Oficial Verificado
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono truncate">{domain}</p>
            </div>
          </div>

          {/* Botón visitar */}
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-primary/25 group/btn"
          >
            <ExternalLink className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
            <span>Visitar sitio</span>
          </a>
        </div>
      </div>
    </div>
  );
}
