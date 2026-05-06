"use client";

import { ArrowLeft, Globe, Save, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface EditBusinessHeaderProps {
  nombre: string;
  slug: string;
  isSaving: boolean;
  success: boolean;
  error: string | null;
  onSave: () => void;
}

export default function EditBusinessHeader({ 
  nombre, 
  slug, 
  isSaving, 
  success, 
  error, 
  onSave 
}: EditBusinessHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link 
            href="/portal" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Portal
          </Link>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Editar Perfil</h1>
          <p className="text-slate-400">Gestiona la información pública de <strong className="text-white">{nombre}</strong></p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={`/negocios/${slug}`}
            target="_blank"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/5 text-slate-300 font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-sm group"
          >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Ver Perfil
          </Link>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-in zoom-in-95 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">¡Perfil actualizado con éxito! Redirigiendo...</p>
        </div>
      )}
    </>
  );
}
