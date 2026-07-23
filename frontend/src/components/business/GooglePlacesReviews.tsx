"use client";

import { Star, StarHalf, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CachedGoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

interface GooglePlacesReviewsProps {
  reviews?: CachedGoogleReview[] | null;
  className?: string;
}

export default function GooglePlacesReviews({ reviews, className }: GooglePlacesReviewsProps) {
  const list = Array.isArray(reviews) ? reviews : [];
  if (list.length === 0) return null;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />);
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-white/10 fill-white/5" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <h3 className="text-2xl font-serif font-bold text-white italic">
          Reseñas destacadas de <span className="text-primary">Google</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((rev, idx) => (
          <a
            key={`${rev.author_name}-${idx}`}
            href={rev.author_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-white/15 rounded-3xl p-5 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute right-4 top-4 text-white/[0.02] group-hover:text-white/[0.04] transition-colors pointer-events-none">
              <Quote className="w-12 h-12 rotate-180" />
            </div>

            <div className="flex items-center gap-3 mb-3">
              {rev.profile_photo_url ? (
                <img
                  src={rev.profile_photo_url}
                  alt={rev.author_name}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-white/55">{rev.author_name.charAt(0)}</span>
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate leading-tight group-hover:text-primary transition-colors">
                  {rev.author_name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(rev.rating)}
                  <span className="text-[10px] text-slate-500 font-medium">
                    {rev.relative_time_description}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-3">
              {rev.text || "Sin comentario de texto."}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
