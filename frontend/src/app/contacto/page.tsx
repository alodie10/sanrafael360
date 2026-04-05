"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Plus, CheckCircle2 } from "lucide-react";

export default function ContactoPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8 bg-slate-950 text-white selection:bg-primary/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Side: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Súmate a la plataforma</h2>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight leading-tight">
              Haz crecer tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 italic">Negocio</span>
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
             <div className="flex items-center gap-3 text-slate-300">
               <Mail className="w-5 h-5 text-primary" />
               <span>hola@sanrafael360.com</span>
             </div>
             <div className="flex items-center gap-3 text-slate-300">
               <Phone className="w-5 h-5 text-primary" />
               <span>+54 260 400-0000</span>
             </div>
             <div className="flex items-center gap-3 text-slate-300">
               <MapPin className="w-5 h-5 text-primary" />
               <span>San Rafael, Mendoza, Argentina</span>
             </div>
          </div>
        </motion.div>

        {/* Right Side: Form Mockup (UI only for now) */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[100px] -z-10" />
          
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nombre del Negocio</label>
              <input 
                type="text" 
                placeholder="Cabañas El Sol" 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
                <input 
                  type="email" 
                  placeholder="juan@email.com" 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Teléfono</label>
                <input 
                  type="tel" 
                  placeholder="+54 ..." 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Mensaje (Opcional)</label>
              <textarea 
                rows={4}
                placeholder="Cuéntanos sobre tu negocio..." 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
              />
            </div>

            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20">
              <Plus className="w-6 h-6" />
              Solicitar Alta en San Rafael 360
            </button>
            <p className="text-center text-xs text-slate-500">Nos contactaremos contigo en menos de 24hs.</p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
