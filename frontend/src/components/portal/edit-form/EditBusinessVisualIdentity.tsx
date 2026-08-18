"use client";

import { Upload, X, ShieldCheck } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";

interface EditBusinessVisualIdentityProps {
  logo: any;
  logoFile: File | null;
  cover: any;
  coverFile: File | null;
  cropGravity: string;
  setLogoFile: (file: File | null) => void;
  setCoverFile: (file: File | null) => void;
  setCropGravity: (gravity: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => void;
}

export default function EditBusinessVisualIdentity({
  logo,
  logoFile,
  cover,
  coverFile,
  cropGravity,
  setLogoFile,
  setCoverFile,
  setCropGravity,
  handleFileChange
}: EditBusinessVisualIdentityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Logo */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <ShieldCheck className="w-6 h-6 text-blue-400" />
           Logo Oficial
        </h2>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-40 h-40 rounded-full bg-slate-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
            {(logoFile || logo) ? (
              <>
                <img 
                  src={logoFile ? URL.createObjectURL(logoFile) : getStrapiMedia(logo?.url) || undefined} 
                  className="w-full h-full object-contain p-2" 
                  alt="Logo preview" 
                />
                <button 
                  onClick={() => setLogoFile(null)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-8 h-8 text-white" />
                </button>
              </>
            ) : (
              <Upload className="w-10 h-10 text-white/5" />
            )}
          </div>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'logo')}
            className="hidden" 
            id="logo-upload"
          />
          <label 
            htmlFor="logo-upload"
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold cursor-pointer transition-all text-sm"
          >
            Subir Logo
          </label>
        </div>
      </div>

      {/* Portada */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <Upload className="w-6 h-6 text-blue-400" />
           Imagen de Portada
        </h2>
        <div className="flex flex-col gap-6">
          <div className="relative w-full aspect-video rounded-2xl bg-slate-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
            {(coverFile || cover) ? (
              <>
                <img 
                  src={coverFile ? URL.createObjectURL(coverFile) : getStrapiMedia(cover?.url) || undefined} 
                  className="w-full h-full object-cover" 
                  alt="Cover preview" 
                />
                <button 
                  onClick={() => setCoverFile(null)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-8 h-8 text-white" />
                </button>
              </>
            ) : (
              <Upload className="w-10 h-10 text-white/5" />
            )}
          </div>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'cover')}
            className="hidden" 
            id="cover-upload"
          />
          <label 
            htmlFor="cover-upload"
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold cursor-pointer transition-all text-sm text-center"
          >
            Subir Portada
          </label>
          <p className="text-xs text-slate-500 text-center">
            Ideal 1920×1080 (16:9). En el celular se muestra en 4:3.
          </p>

          <div className="mt-2 space-y-2">
            <label className="text-sm font-bold text-slate-300">Enfoque del recorte automático</label>
            <p className="text-xs text-slate-500 mb-2">Selecciona qué parte de la imagen priorizar cuando se adapta a pantallas grandes o móviles.</p>
            <select
              value={cropGravity}
              onChange={(e) => setCropGravity(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
            >
              <option value="g_auto">Automático Inteligente (Detecta rostros/objetos principales)</option>
              <option value="g_center">Centrado (Enfoca siempre el centro de la imagen)</option>
              <option value="g_north">Arriba (Enfoca la parte superior)</option>
              <option value="g_south">Abajo (Enfoca la parte inferior)</option>
              <option value="g_auto:subject">Sujeto Principal (Intenta detectar el objeto dominante)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
