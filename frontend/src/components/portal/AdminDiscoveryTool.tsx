"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Globe, Phone, Clock, Plus, Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { STRAPI_URL } from "@/lib/strapi";

interface DiscoveryData {
  nombre?: string;
  website?: string;
  telefono?: string;
  direccion?: string;
  google_maps_url?: string;
  schedules?: any[];
}

export default function AdminDiscoveryTool({ jwt }: { jwt: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryData | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/categorias?sort=nombre:asc`);
      const data = await res.json();
      setCategories(data.data || []);
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSuccess(false);

    try {
      const res = await fetch(`${STRAPI_URL}/api/discovery/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ name: searchTerm })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult({
          nombre: searchTerm,
          ...data.data
        });
      } else {
        setError(data.error || "No se encontró el negocio en Google Maps.");
      }
    } catch (err) {
      setError("Error de conexión con el servicio de Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!result || !selectedCategory) return;
    setImporting(true);
    setError(null);

    try {
      const res = await fetch(`${STRAPI_URL}/api/negocios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            nombre: result.nombre,
            descripcion: `Negocio importado desde Google Maps. Ubicado en ${result.direccion}.`,
            direccion: result.direccion,
            telefono: result.telefono,
            sitio_web: result.website,
            google_maps_url: result.google_maps_url,
            categoria: selectedCategory,
            reclamable: true,
            estado: "publicado",
            horarios: result.schedules
          }
        })
      });

      if (!res.ok) throw new Error("Error al crear el negocio en la base de datos.");
      
      setSuccess(true);
      setResult(null);
      setSearchTerm("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8">
        <h3 className="text-xl font-serif font-bold text-white mb-6 italic">Buscar en Google Maps</h3>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: Cabañas del Sol, Restaurante El Mirador..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Descubrir"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-400 animate-in fade-in zoom-in">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center gap-4 text-green-400 animate-in fade-in zoom-in">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">¡Negocio importado correctamente! Ya está disponible para ser reclamado.</p>
        </div>
      )}

      {/* Result Preview */}
      {result && (
        <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            <div className="flex-1 space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Resultado Encontrado</h4>
                <h2 className="text-4xl font-serif font-bold text-white italic leading-tight">{result.nombre}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <MapPin className="w-5 h-5 text-zinc-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Dirección</p>
                    <p className="text-sm text-zinc-300">{result.direccion || "No disponible"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <Phone className="w-5 h-5 text-zinc-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Teléfono</p>
                    <p className="text-sm text-zinc-300">{result.telefono || "No disponible"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <Globe className="w-5 h-5 text-zinc-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sitio Web</p>
                    <p className="text-sm text-zinc-300 truncate max-w-[200px]">{result.website || "No disponible"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <Clock className="w-5 h-5 text-zinc-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Horarios</p>
                    <p className="text-sm text-zinc-300">{result.schedules?.length || 0} días configurados</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 space-y-6 bg-white/5 p-8 rounded-[2rem] border border-white/10 h-fit sticky top-24">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Categoría</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.documentId}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleImport}
                disabled={importing || !selectedCategory}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/10"
              >
                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Importar Negocio
              </button>
              
              <p className="text-[9px] text-zinc-500 text-center leading-relaxed">
                Al importar, el negocio se publicará automáticamente marcado como <strong>reclamable</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !success && (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-24 text-center">
          <Building2 className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-30" />
          <h3 className="text-2xl font-serif font-bold text-zinc-600 italic">Comienza tu búsqueda</h3>
          <p className="text-zinc-600 max-w-xs mx-auto mt-2">Busca un negocio por su nombre para traer toda su información desde Google Maps.</p>
        </div>
      )}
    </div>
  );
}
