"use client";

import { Globe, ExternalLink, ShieldCheck } from "lucide-react";

interface WebsitePortletProps {
  url: string;
  businessName: string;
}

export default function WebsitePortlet({ url, businessName }: WebsitePortletProps) {
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;

  let domain = "";
  try {
    domain = new URL(finalUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = finalUrl;
  }

  // Google's favicon CDN — works for virtually every domain, no proxy needed
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <div className="w-full mb-12">
      <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
        Sitio Web Oficial
        <div className="h-px flex-1 bg-white/5" />
      </h2>

      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-5 bg-slate-900/60 border border-white/8 rounded-3xl p-6 hover:border-primary/40 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
      >
        {/* Favicon con fallback al ícono Globe */}
        <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <img
            src={faviconUrl}
            alt={domain}
            className="w-10 h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const sibling = (e.target as HTMLImageElement).nextElementSibling;
              if (sibling) sibling.classList.remove("hidden");
            }}
          />
          <Globe className="w-8 h-8 text-primary hidden" />
        </div>

        {/* Info del dominio */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
              Sitio Oficial Verificado
            </span>
          </div>
          <p className="text-white font-bold text-lg leading-tight truncate">{businessName}</p>
          <p className="text-slate-500 text-sm font-mono truncate">{domain}</p>
        </div>

        {/* CTA que se activa al hover */}
        <div className="shrink-0 flex items-center gap-2 bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300">
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Visitar</span>
        </div>
      </a>
    </div>
  );
}
