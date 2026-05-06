"use client";

import { Globe, Phone, Facebook } from "lucide-react";

interface EditBusinessSocialProps {
  descripcion: string;
  setDescripcion: (val: string) => void;
  telefono: string;
  setTelefono: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
  facebook: string;
  setFacebook: (val: string) => void;
  instagram: string;
  setInstagram: (val: string) => void;
}

export default function EditBusinessSocial({
  descripcion,
  setDescripcion,
  telefono,
  setTelefono,
  whatsapp,
  setWhatsapp,
  website,
  setWebsite,
  facebook,
  setFacebook,
  instagram,
  setInstagram
}: EditBusinessSocialProps) {
  return (
    <div className="space-y-8">
      {/* Descripción */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm italic">Aa</div>
           Descripción del Negocio
        </h2>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Historia y Servicios</label>
          <textarea 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuéntanos más sobre tu negocio, tu historia y qué te hace único..."
            className="w-full h-48 px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
          />
        </div>
      </div>

      {/* Enlaces y Redes */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <Globe className="w-6 h-6 text-blue-400" />
           Enlaces y Contacto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Phone className="w-3 h-3 text-slate-400" /> Teléfono
            </label>
            <input 
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 260 412 3456"
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-heading">
               <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                 <Phone className="w-2.5 h-2.5 text-white" />
               </div> 
               WhatsApp
            </label>
            <input 
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej: 2604123456 (sin espacios)"
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Globe className="w-3 h-3 text-slate-400" /> Sitio Web
            </label>
            <input 
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.tuweb.com"
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Facebook className="w-3 h-3 text-slate-400" /> Facebook
            </label>
            <input 
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/tunegocio"
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-heading">
               <div className="w-4 h-4 rounded bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center">
                 <div className="w-2.5 h-2.5 border border-white rounded-full" />
               </div> 
               Instagram
            </label>
            <input 
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/tunegocio"
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
