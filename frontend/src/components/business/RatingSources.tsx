"use client";

import { Star, StarHalf, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Negocio } from "@/types/strapi";

interface RatingSourcesProps {
  negocio: Negocio;
  className?: string;
}

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const TripAdvisorLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-[#00af87]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-4c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm7 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-4c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm-3.5 6.5c-1.5 0-2.8-.8-3.5-2h7c-.7 1.2-2 2-3.5 2z"/>
  </svg>
);

const LocalLogo = () => (
  <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-[8px] font-black text-black shrink-0">
    360
  </div>
);

export default function RatingSources({ negocio, className }: RatingSourcesProps) {
  const renderStars = (rating: number, colorClass: string) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className={cn("w-3.5 h-3.5 fill-current", colorClass)} />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className={cn("w-3.5 h-3.5 fill-current", colorClass)} />);
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-white/10 fill-white/5" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const sources = [
    {
      id: "google",
      name: "Google",
      logo: <GoogleLogo />,
      rating: negocio.google_rating || 0,
      count: negocio.google_review_count || 0,
      url: negocio.google_maps_url,
      starColor: "text-amber-500",
    },
    {
      id: "tripadvisor",
      name: "TripAdvisor",
      logo: <TripAdvisorLogo />,
      rating: negocio.tripadvisor_rating || 0,
      count: negocio.tripadvisor_review_count || 0,
      url: negocio.tripadvisor_url,
      starColor: "text-[#00af87]",
    },
    {
      id: "local",
      name: "Reseñas Locales",
      logo: <LocalLogo />,
      rating: negocio.rating || 0,
      count: negocio.review_count || 0,
      url: "#reviews-section",
      starColor: "text-primary",
    }
  ].filter(s => s.count > 0 || s.rating > 0);

  if (sources.length === 0) return null;

  return (
    <div className={cn("bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl", className)}>
      <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Valoraciones</h4>
      
      <div className="space-y-3">
        {sources.map((src) => {
          const isAnchor = !!src.url;
          const Tag = isAnchor ? "a" : "div";
          const extraProps = isAnchor
            ? {
                href: src.url,
                target: src.url?.startsWith("#") ? undefined : "_blank",
                rel: src.url?.startsWith("#") ? undefined : "noopener noreferrer",
              }
            : {};

          return (
            <Tag
              key={src.id}
              {...extraProps}
              className={cn(
                "flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl transition-all duration-300",
                isAnchor && "hover:bg-white/5 hover:border-white/10 hover:scale-[1.01] cursor-pointer"
              )}
            >
              <div className="flex items-center gap-3">
                {src.logo}
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-white leading-tight">{src.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {renderStars(src.rating, src.starColor)}
                    <span className="text-[11px] font-medium text-slate-400">
                      ({src.rating.toFixed(1)}/5.0)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold font-mono">{src.count}</span>
                </div>
                {isAnchor && <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />}
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
