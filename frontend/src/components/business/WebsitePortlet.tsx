"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Circle,
  Monitor,
  AlertTriangle,
} from "lucide-react";

interface WebsitePortletProps {
  url: string;
  businessName: string;
}

type ScreenshotState = "loading" | "ready" | "site-down" | "error";

export default function WebsitePortlet({ url, businessName }: WebsitePortletProps) {
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [state, setState] = useState<ScreenshotState>("loading");

  let domain = "";
  try {
    domain = new URL(finalUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = finalUrl;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // ── 1. Verificar si el sitio está activo (server-side, sin CORS) ──
        const checkRes = await fetch(
          `/api/check-url?url=${encodeURIComponent(finalUrl)}`
        );
        const checkJson = await checkRes.json();

        if (cancelled) return;

        if (!checkJson.reachable) {
          setState("site-down");
          return;
        }

        // ── 2. Pedir screenshot solo si el sitio respondió OK ──
        const apiUrl =
          `https://api.microlink.io/?url=${encodeURIComponent(finalUrl)}` +
          `&screenshot=true&meta=false` +
          `&viewport.width=1280&viewport.height=800` +
          `&waitUntil=networkidle2`;  // espera que JS termine de renderizar

        const mlRes = await fetch(apiUrl);
        const mlJson = await mlRes.json();

        if (cancelled) return;

        if (mlJson.status === "success" && mlJson.data?.screenshot?.url) {
          setScreenshotUrl(mlJson.data.screenshot.url);
          setState("ready");
        } else {
          setState("site-down");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [finalUrl]);

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
          <div className="flex items-center gap-1.5 shrink-0">
            <Circle className="w-3 h-3 fill-red-500/70 text-red-500/70" />
            <Circle className="w-3 h-3 fill-amber-500/70 text-amber-500/70" />
            <Circle className="w-3 h-3 fill-emerald-500/70 text-emerald-500/70" />
          </div>

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

          <RefreshCw
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              state === "loading" ? "text-primary animate-spin" : "text-slate-600"
            }`}
          />
        </div>

        {/* ── Viewport ── */}
        <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">

          {/* Cargando */}
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-full h-full animate-pulse bg-slate-800/40" />
              <div className="absolute flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-700/80 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-slate-500 animate-pulse" />
                </div>
                <p className="text-slate-500 text-xs font-mono">Verificando sitio…</p>
              </div>
            </div>
          )}

          {/* Screenshot real */}
          {state === "ready" && screenshotUrl && (
            <>
              <img
                src={screenshotUrl}
                alt={`Preview de ${businessName}`}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
            </>
          )}

          {/* Sitio no disponible */}
          {(state === "site-down" || state === "error") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-900/80 backdrop-blur-sm px-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl scale-150" />
                <div className="relative w-16 h-16 rounded-3xl bg-slate-800 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">{businessName}</p>
                <p className="text-slate-400 text-sm font-mono mb-3">{domain}</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-amber-400/80 border border-amber-500/20 bg-amber-500/5 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Sitio temporalmente no disponible
                </span>
              </div>
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Intentar visitar de todas formas
              </a>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
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
                  Sitio Oficial
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono truncate">{domain}</p>
            </div>
          </div>

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
