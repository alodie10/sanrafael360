"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, User, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getStrapiUrl } from "@/lib/strapi";

interface Review {
  id: number;
  rating: number;
  comentario: string;
  createdAt: string;
  autor?: {
    username: string;
    email: string;
  };
}

export default function ReviewSection({ negocioId, ownerId, initialRating = 0, initialCount = 0 }: { negocioId: string, ownerId?: string, initialRating?: number, initialCount?: number }) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [showReconnect, setShowReconnect] = useState(false);

  // EFECTO DE DIAGNÓSTICO
  useEffect(() => {
    if (session) {
      console.log("🔍 [DIAGNÓSTICO SESIÓN FULL]:", session);
    }
  }, [session]);

  const fetchReviews = async () => {
    try {
      const strapiUrl = getStrapiUrl();
      const res = await fetch(`${strapiUrl}/api/reviews?filters[negocio][documentId][$eq]=${negocioId}&populate=autor&sort=createdAt:desc`, {
        cache: 'no-store'
      });
      const data = await res.json();
      setReviews(data.data || []);
    } catch (e) {
      console.error("Error fetching reviews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [negocioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const jwt = session?.jwt;
    const userId = session?.user?.id;
    const sessionError = session?.error;

    console.log("🚀 [INTENTO DE ENVÍO]:", { jwt: !!jwt, userId, status, sessionError });
    
    if (!jwt || !userId) {
      alert(`⚠️ ERROR DE SESIÓN:\nStatus: ${status}\nJWT: ${jwt ? 'OK' : 'MISSING'}\nUser: ${userId || 'MISSING'}\nError: ${sessionError || 'Ninguno reportado'}\n\nPor favor, hacé clic en el botón RECONECTAR que apareció abajo.`);
      setShowReconnect(true);
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const strapiUrl = getStrapiUrl();
      const res = await fetch(`${strapiUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            rating: newRating,
            comentario: newComment,
            negocio: negocioId,
            autor: userId
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ ERROR STRAPI:", errorData);
        alert(`Error de Strapi: ${errorData.error?.message || 'Error desconocido'}`);
        throw new Error(errorData.error?.message || "Error en API");
      }

      if (res.ok) {
        setNewComment("");
        setNewRating(5);
        fetchReviews(); // Recargar lista
      }
    } catch (e) {
      console.error("Error submitting review", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 pt-16 border-t border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2 italic">Opiniones de la Comunidad</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-5 h-5", s <= initialRating ? "fill-primary text-primary" : "text-white/10")} />
              ))}
            </div>
            <span className="text-sm text-zinc-400 font-medium">
              {initialCount > 0 ? `Basado en ${initialCount} opiniones` : "Sé el primero en opinar"}
            </span>
          </div>
        </div>

        {session ? (
           <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
             Logueado como {session.user?.name}
           </div>
        ) : (
           <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
             Iniciá sesión para dejar una reseña
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Formulario */}
        <div className="lg:col-span-1">
          {session ? (
            String(session.user?.id) === String(ownerId) ? (
              <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-10 text-center">
                <Settings className="w-12 h-12 text-primary mx-auto mb-4 animate-spin-slow" />
                <h3 className="text-white font-serif font-bold text-lg mb-2 italic">Eres el administrador</h3>
                <p className="text-zinc-500 text-sm">Gestionas este perfil, por lo que no puedes dejar reseñas sobre tu propio negocio. ¡Gracias por ser parte de San Rafael 360!</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/10 rounded-[2rem] p-8 sticky top-32"
              >
              <h3 className="text-xl font-serif font-bold text-white mb-6">Tu Calificación</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-center gap-2 p-4 bg-black/40 rounded-2xl border border-white/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        className={cn(
                          "w-8 h-8 transition-colors",
                          star <= (hoverRating || newRating) ? "fill-primary text-primary" : "text-white/10"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Contanos tu experiencia..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : (
                    <>
                      <Send className="w-4 h-4" />
                      Publicar Reseña
                    </>
                  )}
                </button>

                {showReconnect && (
                  <button
                    type="button"
                    onClick={() => {
                      const { signOut, signIn } = require("next-auth/react");
                      signOut({ redirect: false }).then(() => signIn("google"));
                    }}
                    className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl animate-bounce shadow-lg shadow-red-500/20"
                  >
                    🔄 Reconectar Sesión Ahora
                  </button>
                )}
              </form>
            </motion.div>
            )
          ) : (
            <div className="bg-zinc-900/30 border border-dashed border-white/10 rounded-[2rem] p-12 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-medium">Debes iniciar sesión con Google para calificar este negocio.</p>
            </div>
          )}
        </div>

        {/* Lista de Reseñas */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)
          ) : reviews.length > 0 ? (
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {review.autor?.username || "Usuario San Rafael"}
                        </h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                          {new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span className="text-xs font-black text-white">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">
                    "{review.comentario}"
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center">
              <p className="text-zinc-600 font-serif italic text-lg">Aún no hay opiniones. ¡Sé el primero en compartir tu experiencia!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
