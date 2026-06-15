"use client";

import { motion } from "framer-motion";
import { MapPin, CheckCircle2, Plus, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { STRAPI_URL } from "@/lib/strapi";

export default function ContactoClient() {
  const [hasMounted, setHasMounted] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    nombre_negocio: "",
    consulta: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const message = `Hola San Rafael 360,\n\nSoy *${formData.nombre_completo}* del negocio *${formData.nombre_negocio}*.\n\nConsulta: ${formData.consulta}`;
    const whatsappUrl = `https://wa.me/5491167059202?text=${encodeURIComponent(message)}`;
    
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setLoading(false);
      setSuccess(true);
    }, 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="min-h-screen pt-12 md:pt-32 pb-20 px-4 md:px-8 bg-slate-950 text-white selection:bg-primary/30">
      <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        
        {/* Left Side: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8 order-2 lg:order-1"
        >
          <div className="space-y-4">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Súmate a la plataforma</h2>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight leading-tight">
              Haz crecer tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 italic px-1 pb-1">Negocio</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Únete al directorio más completo de San Rafael. Aumenta tu visibilidad y llega a miles de turistas y residentes.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Presencia Digital</h3>
                <p className="text-slate-400 text-sm">Tu negocio visible 24/7 en el mapa interactivo.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">SEO Optimizado</h3>
                <p className="text-slate-400 text-sm">Aparece en las búsquedas de Google por categorías locales.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Gestión Simple</h3>
                <p className="text-slate-400 text-sm">Actualiza tus fotos, horarios y ofertas fácilmente.</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed hidden lg:block">
              ¿Tienes dudas o consultas específicas? Completa el formulario de la derecha y nuestro equipo te responderá por WhatsApp a la brevedad.
            </p>
            <div className="flex items-center gap-3 text-slate-300 pt-2">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span>San Rafael, Mendoza, Argentina</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden order-1 lg:order-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[100px] -z-10" />
          
          {success ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 py-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-serif font-bold text-white">¡Abriendo WhatsApp!</h2>
                <p className="text-slate-400 max-w-xs mx-auto">Te estamos redirigiendo a WhatsApp para continuar la conversación de forma personalizada.</p>
              </div>
              <button 
                onClick={() => setSuccess(false)}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Volver
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="lg:hidden mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Hablemos por WhatsApp</h2>
                <p className="text-sm text-slate-400">Déjanos tus datos básicos y te responderemos inmediatamente por WhatsApp.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  name="nombre_completo"
                  required
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez" 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nombre del Negocio</label>
                <input 
                  type="text" 
                  name="nombre_negocio"
                  required
                  value={formData.nombre_negocio}
                  onChange={handleChange}
                  placeholder="Ej: Cabañas El Sol" 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Consulta</label>
                <textarea 
                  name="consulta"
                  required
                  rows={4}
                  value={formData.consulta}
                  onChange={handleChange}
                  placeholder="¿En qué podemos ayudarte?..." 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                )}
                Abrir WhatsApp
              </button>
              <p className="text-center text-xs text-slate-500">Haz clic y envía tu consulta de forma directa.</p>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
