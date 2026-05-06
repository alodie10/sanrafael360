"use client";

import { MapPin, Search, CheckCircle2, AlertCircle, X } from "lucide-react";
import AddressAutocomplete from "../AddressAutocomplete";
import GoogleMap from "@/components/common/GoogleMap";

interface EditBusinessIdentityProps {
  nombre: string;
  setNombre: (val: string) => void;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  onAddressSelect: (addr: string, lat: number, lng: number) => void;
  setLatitud: (val: number | null) => void;
  setLongitud: (val: number | null) => void;
  isSyncing: boolean;
  syncUsed: boolean;
  syncSummary: any;
  handleGoogleSync: () => void;
  cancelSync: () => void;
  isAdmin?: boolean;
  categoria?: string;
  setCategoria?: (val: string) => void;
  categories?: any[];
}

export default function EditBusinessIdentity({
  nombre,
  setNombre,
  direccion,
  latitud,
  longitud,
  onAddressSelect,
  setLatitud,
  setLongitud,
  isSyncing,
  syncUsed,
  syncSummary,
  handleGoogleSync,
  cancelSync,
  isAdmin,
  categoria,
  setCategoria,
  categories
}: EditBusinessIdentityProps) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <MapPin className="w-6 h-6 text-blue-400" />
        Identidad y Ubicación
      </h2>
      <div className="flex flex-col gap-8 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Comercial</label>
          <input 
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mi Negocio"
            className="w-full px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGoogleSync}
              disabled={isSyncing || syncUsed || !nombre}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              {syncUsed ? 'Datos Importados' : (isSyncing ? 'Importando...' : 'Importar datos de Places')}
            </button>
            {isSyncing && (
              <button
                type="button"
                onClick={cancelSync}
                className="flex items-center gap-1.5 px-3 py-2 ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all animate-in fade-in duration-200"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>
          
          {syncSummary && (
            <div className="mt-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ficha Resumen: Datos extraídos de Google
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1">Horarios</span>
                  <span className="text-white font-medium">{syncSummary.schedules > 0 ? `${syncSummary.schedules} turnos encontrados` : <span className="text-slate-500 italic">No encontrados</span>}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1">Teléfono Público</span>
                  <span className="text-white font-medium">{syncSummary.telefono || <span className="text-slate-500 italic">No encontrado</span>}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1">Sitio Web</span>
                  <span className="text-white font-medium">{syncSummary.website || <span className="text-slate-500 italic">No encontrado</span>}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1">Dirección Exacta</span>
                  <span className="text-white font-medium">{syncSummary.direccion || <span className="text-slate-500 italic">No encontrada</span>}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Dirección Exacta</label>
            <AddressAutocomplete 
              initialValue={direccion}
              onAddressSelect={onAddressSelect}
              className="text-lg"
            />
          </div>
          
          {latitud && longitud && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-blue-500/5">
              <div className="h-[400px] w-full relative">
                <GoogleMap lat={latitud} lng={longitud} title={nombre} />
              </div>
              <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between border-t border-white/5">
                <p className="text-xs text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Coordenadas Confirmadas: {latitud.toFixed(6)}, {longitud.toFixed(6)}
                </p>
                <button 
                  type="button"
                  onClick={() => { setLatitud(null); setLongitud(null); }}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-4 uppercase tracking-wider font-bold transition-colors"
                >
                  Limpiar Mapa
                </button>
              </div>
            </div>
          )}
          {isAdmin && categories && setCategoria && (
            <div className="space-y-2 pt-6 mt-6 border-t border-white/5">
              <label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Categoría del Negocio (Solo Master Admins)
              </label>
              <div className="relative">
                <select 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-800 border border-white/10 rounded-2xl text-white text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar Categoría...</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.documentId}>{cat.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 ml-1 italic">
                Cambiar la categoría moverá este negocio a la nueva sección del sitio público.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
