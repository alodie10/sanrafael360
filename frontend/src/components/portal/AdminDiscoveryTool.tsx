"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Globe, Phone, Clock, Plus, Loader2, CheckCircle2, AlertCircle, Building2, Zap } from "lucide-react";
import { STRAPI_URL } from "@/lib/strapi";

interface DiscoveryData {
  place_id: string;
  nombre: string;
  website?: string;
  telefono?: string;
  direccion?: string;
  google_maps_url?: string;
  rating?: number;
  user_ratings_total?: number;
  photo_reference?: string;
  location?: { lat: number; lng: number };
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

  const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
        setResult(data.data);
      } else {
        setError(data.error || "No se pudo identificar el negocio. Prueba pegando el link directo de Maps.");
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
            horarios: result.schedules,
            // Guardamos el rating original de Google como referencia
            promedio_estrellas: result.rating || 0
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
    <div className="space-y-8 pb-20">
      {/* Search Bar / Link Ingest */}
      <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            <Zap className="w-3 h-3" /> Ingesta Inteligente
          </div>
          <h3 className="text-3xl font-serif font-bold text-white italic">Importar desde Google Maps</h3>
          <p className="text-zinc-500 text-sm max-w-lg mx-auto">
            Pega el <strong>link del negocio</strong> de Google Maps para una importación exacta, o escribe su nombre para buscarlo.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Pegar link de Maps o buscar nombre..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all text-sm"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-10 py-5 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analizar Link"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-400 animate-in fade-in zoom-in max-w-2xl mx-auto">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center gap-4 text-green-400 animate-in fade-in zoom-in max-w-2xl mx-auto">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">¡Negocio importado correctamente! Ya puedes vincularlo con un interesado.</p>
        </div>
      )}

      {/* Result Preview 2.0 */}
      {result && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Left Column: Visual Confirmation */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden">
              {/* Cover Photo */}
              <div className="relative h-64 w-full bg-zinc-900">
                {result.photo_reference ? (
                  <img 
                    src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${result.photo_reference}&key=${GOOGLE_KEY}`}
                    alt={result.nombre}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Building2 className="w-20 h-20 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(result.rating || 0) ? "text-primary" : "text-zinc-700"}>★</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      {result.rating} ({result.user_ratings_total} reseñas en Google)
                    </span>
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-white italic leading-tight">{result.nombre}</h2>
                </div>
              </div>

              {/* Map View */}
              <div className="p-8 space-y-8">
                <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_KEY}&q=${result.place_id ? `place_id:${result.place_id}` : encodeURIComponent(result.direccion || result.nombre || 'San Rafael Mendoza')}`}
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Dirección</p>
                    <p className="text-sm text-zinc-300 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" /> {result.direccion}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Teléfono</p>
                    <p className="text-sm text-zinc-300 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary shrink-0" /> {result.telefono || "No disponible"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sitio Web</p>
                    <p className="text-sm text-zinc-300 flex items-center gap-2 truncate">
                      <Globe className="w-4 h-4 text-primary shrink-0" /> {result.website ? result.website.replace(/https?:\/\//, '') : "No disponible"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ingest Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 space-y-8 h-fit sticky top-24">
              <div>
                <h4 className="text-xs font-serif font-bold text-white italic mb-4">Configuración de Ingesta</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Asignar Categoría</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.documentId}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-zinc-600">Estado</span>
                      <span className="text-green-500">Auto-Publicar</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-zinc-600">Reclamable</span>
                      <span className="text-primary">Habilitado</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-zinc-600">Horarios</span>
                      <span className="text-zinc-400">{result.schedules?.length || 0} períodos</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleImport}
                disabled={importing || !selectedCategory}
                className="w-full py-5 bg-primary text-black font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-primary/20 active:scale-95"
              >
                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Confirmar e Importar
              </button>
              
              <p className="text-[9px] text-zinc-600 text-center leading-relaxed italic">
                Toda la información verificada por Google Maps será volcada al perfil oficial de San Rafael 360.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !success && (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-24 text-center max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
            <Building2 className="w-10 h-10 text-zinc-700 opacity-30" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-zinc-500 italic">Listo para la exploración</h3>
          <p className="text-zinc-600 max-w-xs mx-auto mt-4 text-sm">
            Busca un negocio o pega su link de Google Maps para comenzar la ingesta.
          </p>
        </div>
      )}
    </div>
  );
}
