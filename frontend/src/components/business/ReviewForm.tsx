
"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewFormProps {
  negocioId: string | number;
  onSuccess?: () => void;
}

export default function ReviewForm({ negocioId, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return (
      <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-8 text-center backdrop-blur-md">
        <p className="text-zinc-500 font-serif italic text-lg mb-4">
          Inicia sesión para compartir tu experiencia con este negocio
        </p>
        <a 
          href="/login" 
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-black font-bold rounded-full hover:scale-105 transition-all text-sm"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor, selecciona una calificación");
      return;
    }
    if (comment.length < 10) {
      toast.error("El comentario debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(`${strapiUrl}/api/resenas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`
        },
        body: JSON.stringify({
          data: {
            calificacion: rating,
            comentario: comment,
            negocio: negocioId,
            usuario: session.user.id
          }
        })
      });

      if (!res.ok) throw new Error("Error al publicar la reseña");

      toast.success("¡Gracias por tu opinión!");
      setComment("");
      setRating(0);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error(error);
      toast.error("No se pudo publicar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <h3 className="text-2xl font-serif italic text-white mb-6">Deja tu opinión</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tu Calificación</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-all hover:scale-110 active:scale-95"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hover || rating) >= star 
                      ? "fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,200,0,0.4)]" 
                      : "text-zinc-700 hover:text-zinc-500"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tu Comentario</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué tal fue tu experiencia? Cuéntanos detalles..."
            className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all min-h-[120px] resize-none placeholder:text-zinc-600"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3.5 bg-primary text-black font-bold rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publicar Reseña
            </>
          )}
        </button>
      </form>
    </div>
  );
}
