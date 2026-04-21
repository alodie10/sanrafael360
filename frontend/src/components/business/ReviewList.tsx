
"use client";

import { Star, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: number;
  attributes?: { // Compatibility for Strapi formats
    calificacion: number;
    comentario: string;
    createdAt: string;
    usuario?: {
      data?: {
        attributes: {
          username: string;
        }
      }
    };
  };
  calificacion?: number;
  comentario?: string;
  createdAt?: string;
  usuario?: {
    username: string;
  };
}

interface ReviewListProps {
  reviews: any[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-zinc-950/20 border border-white/5 rounded-[2.5rem] p-12 text-center">
        <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
        <p className="text-zinc-500 font-serif italic text-xl">Nadie ha opinado todavía. ¡Sé el primero!</p>
      </div>
    );
  }

  // Normalize data (handling Strapi document format)
  const normalizedReviews = reviews.map(r => {
    if (r.attributes) {
        return {
          id: r.id,
          calificacion: r.attributes.calificacion,
          comentario: r.attributes.comentario,
          createdAt: r.attributes.createdAt,
          username: r.attributes.usuario?.data?.attributes?.username || "Usuario anónimo"
        };
    }
    return {
      id: r.id,
      calificacion: r.calificacion,
      comentario: r.comentario,
      createdAt: r.createdAt,
      username: r.usuario?.username || "Usuario anónimo"
    };
  });

  return (
    <div className="space-y-6">
      {normalizedReviews.map((review) => (
        <div 
          key={review.id} 
          className="bg-zinc-950/40 border border-white/5 p-6 rounded-[2rem] hover:border-primary/10 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/20 transition-colors">
                <User className="w-5 h-5 text-zinc-400 group-hover:text-primary/70 transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">{review.username}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= review.calificacion 
                      ? "fill-primary text-primary" 
                      : "text-zinc-700"
                  )}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed italic">
            "{review.comentario}"
          </p>
        </div>
      ))}
    </div>
  );
}
