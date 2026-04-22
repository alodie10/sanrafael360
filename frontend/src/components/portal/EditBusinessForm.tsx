"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Globe, 
  Facebook, 
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  CalendarDays,
  MapPin,
  Search,
  Video,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStrapiMedia } from "@/lib/strapi";
import ScheduleEditor from "./ScheduleEditor";
import { toast } from "sonner";
import AddressAutocomplete from "./AddressAutocomplete";
import GoogleMap from "@/components/common/GoogleMap";

interface EditBusinessFormProps {
  negocio: any;
  session: any;
}

export default function EditBusinessForm({ negocio, session }: EditBusinessFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncUsed, setSyncUsed] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    schedules: number;
    telefono?: string;
    direccion?: string;
    website?: string;
  } | null>(null);
  const syncAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const sessionKey = `places_sync_used_${negocio.documentId || negocio.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setSyncUsed(true);
    }
  }, [negocio.documentId, negocio.id]);

  // Form State
  const [nombre, setNombre] = useState(negocio.nombre || "");
  const [direccion, setDireccion] = useState(negocio.direccion || "");
  const [latitud, setLatitud] = useState(negocio.latitud || null);
  const [longitud, setLongitud] = useState(negocio.longitud || null);
  const [descripcion, setDescripcion] = useState(negocio.descripcion || "");
  const [facebook, setFacebook] = useState(negocio.facebook || "");
  const [instagram, setInstagram] = useState(negocio.instagram || "");
  const [website, setWebsite] = useState(negocio.website || "");
  const [telefono, setTelefono] = useState(negocio.telefono || "");
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp || "");
  const [reservaHabilitada, setReservaHabilitada] = useState(negocio.reserva_habilitada ?? true);
  
  // Normalize legacy lowercase price_range from DB to match new Capitalized enum
  const normalizePriceRange = (val?: string) => {
    if (!val) return "Moderado";
    const map: Record<string, string> = {
      'economico': 'Economico',
      'moderado': 'Moderado',
      'medio-alto': 'Medio-Alto',
      'alto': 'Alto'
    };
    return map[val.toLowerCase()] || "Moderado";
  };
  const [priceRange, setPriceRange] = useState(normalizePriceRange(negocio.price_range));
  
  const [schedules, setSchedules] = useState(negocio.schedules || []);
  
  // Files State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // Gallery handled as a mix of existing (IDs) and new (Files)
  const [existingGallery, setExistingGallery] = useState(negocio.galeria || []);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  
  // Previews
  const [logoPreview, setLogoPreview] = useState(negocio.logo?.url ? getStrapiMedia(negocio.logo.url) : null);
  const [coverPreview, setCoverPreview] = useState(negocio.imagen_portada?.url ? getStrapiMedia(negocio.imagen_portada.url) : null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'logo') {
      const file = files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === 'cover') {
      const file = files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else if (type === 'gallery') {
      const MAX_GALLERY = 20;
      const availableSlots = MAX_GALLERY - existingGallery.length - newGalleryFiles.length;
      if (availableSlots <= 0) return;
      const selection = Array.from(files).slice(0, availableSlots);
      setNewGalleryFiles(prev => [...prev, ...selection]);
    }
  };

  const removeExistingPhoto = (id: number) => {
    setExistingGallery((prev: any[]) => prev.filter(f => f.id !== id));
  };

  const removeNewPhoto = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onAddressSelect = (formattedAddress: string, lat: number, lng: number) => {
    setDireccion(formattedAddress);
    setLatitud(lat);
    setLongitud(lng);
    toast.success("Dirección validada correctamente");
  };

  const cancelSync = useCallback(() => {
    if (syncAbortRef.current) {
      syncAbortRef.current.abort();
    }
  }, []);

  const handleGoogleSync = async () => {
    if (!nombre) {
      toast.error("Por favor, ingresa el nombre del negocio para buscar en Google.");
      return;
    }

    // Check if sync was already used in this session for this business
    const sessionKey = `places_sync_used_${negocio.documentId || negocio.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      toast.info("Ya has importado datos en esta sesión. Por favor, revisa y guarda los cambios.");
      return;
    }

    const controller = new AbortController();
    syncAbortRef.current = controller;
    setIsSyncing(true);

    const loadingToast = toast.loading(
      "Importando datos desde Google Places... Esto puede tardar unos segundos.",
      { duration: Infinity }
    );
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const res = await fetch(`${strapiUrl}/api/discovery/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`
        },
        body: JSON.stringify({ name: nombre }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "No se pudo sincronizar.");
      }

      const { data } = result;

      // Actualizar sitio web si viene y el campo está vacío
      if (data.website && !website) {
        setWebsite(data.website);
      }
      
      // Actualizar teléfono si viene y el campo está vacío
      if (data.telefono && !telefono) {
        setTelefono(data.telefono);
      }
      
      // Actualizar dirección si viene y el campo está vacío (solo texto, el usuario debe validar en el mapa)
      if (data.direccion && !direccion) {
        setDireccion(data.direccion);
      }

      setSyncSummary({
        schedules: data.schedules?.length || 0,
        telefono: data.telefono,
        direccion: data.direccion,
        website: data.website
      });

      // Verificar horarios
      if (!data.schedules || data.schedules.length === 0) {
        toast.warning(
          "Importación completada, pero Google no tenía horarios. Revisa la ficha resumen.",
          { id: loadingToast, duration: 5000 }
        );
      } else {
        setSchedules(data.schedules);
        toast.success(
          "Datos importados exitosamente. Revisa la ficha resumen debajo.",
          { id: loadingToast, duration: 4000 }
        );
      }
      
      // Mark as used for this session
      sessionStorage.setItem(sessionKey, "true");
      setSyncUsed(true);

    } catch (err: any) {
      clearTimeout(timeoutId);
      const isCancelled = err.name === 'AbortError';
      const errorMsg = isCancelled
        ? "Importación cancelada."
        : `Error al importar: ${err.message}`;
      toast[isCancelled ? 'info' : 'error'](errorMsg, { id: loadingToast, duration: 4000 });
    } finally {
      setIsSyncing(false);
      syncAbortRef.current = null;
    }
  };

  const handleSave = async () => {
    // Validación de horarios (Hito 2 Stabilization)
    const invalidSchedules = schedules.some((s: any) => !s.is_closed && (!s.opening_time || !s.closing_time));
    if (invalidSchedules) {
      toast.error("Por favor, completa las horas de apertura y cierre para todos los días abiertos.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const targetUrl = `${strapiUrl}/api/negocios/${negocio.documentId || negocio.id}/portal-update`;
      
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        nombre,
        direccion,
        latitud,
        longitud,
        descripcion,
        telefono,
        whatsapp,
        facebook,
        instagram,
        website,
        reserva_habilitada: reservaHabilitada,
        price_range: priceRange,
        schedules: schedules.map((s: any) => ({
          id: s.id, // Keep ID for updates if it exists
          day: s.day,
          opening_time: s.opening_time,
          closing_time: s.closing_time,
          is_closed: s.is_closed
        })),
        galeria: existingGallery.map((f: any) => f.id) // Send existing IDs to keep
      }));

      if (logoFile) formData.append("logo", logoFile);
      if (coverFile) formData.append("imagen_portada", coverFile);
      newGalleryFiles.forEach(file => {
        formData.append("galeria", file);
      });

      const res = await fetch(targetUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.jwt}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Error al guardar los cambios");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/portal");
        router.refresh();
      }, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
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
          <p className="text-slate-400">Gestiona la información pública de <strong className="text-white">{negocio.nombre}</strong></p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Identidad y Ubicación */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
               <MapPin className="w-6 h-6 text-blue-400" />
               Identidad y Ubicación
            </h2>
            <div className="flex flex-col gap-8 mb-6">
              {/* Nombre Comercial - Ancho Completo */}
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
                
                {/* Resumen de Importación */}
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
                    <p className="text-xs text-blue-400 mt-4 italic flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Los datos encontrados han sido rellenados automáticamente en las cajas vacías. Revisa y corrige si es necesario antes de guardar.
                    </p>
                  </div>
                )}
              </div>

              {/* Dirección y Mapa - Configuración Vertical */}
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
                      <GoogleMap 
                        lat={latitud} 
                        lng={longitud} 
                        title={nombre}
                      />
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
              </div>
            </div>
          </div>

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

          {/* Horarios y Precios (Hito 2) */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-1 gap-10">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    Horarios de Atención
                  </h3>
                  <div className="flex items-center gap-2">
                  </div>
                </div>
                
                <ScheduleEditor 
                  schedules={schedules} 
                  onChange={setSchedules} 
                />
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">$$</div>
                  Nivel de Precios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Economico", "Moderado", "Medio-Alto", "Alto"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setPriceRange(range)}
                      type="button"
                      className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all border ${priceRange === range 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Galería (4 Fotos) */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
               <ImageIcon className="w-6 h-6 text-blue-400" />
               Galería de Multimedia
            </h2>
            <p className="text-sm text-slate-400 mb-6 font-medium">Sube hasta <strong className="text-white">20 fotos o videos</strong> para destacar tu comercio en la plataforma.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {/* Existing Photos */}
              {existingGallery.map((photo: any) => {
                const isVideo = photo.mime?.startsWith('video/') || photo.ext?.match(/\.(mp4|mov|webm)$/i);
                return (
                  <div key={`existing-${photo.id}`} className="relative group aspect-square rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
                    {isVideo ? (
                      <video src={getStrapiMedia(photo.url)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                    ) : (
                      <img src={getStrapiMedia(photo.url)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                    )}
                    {isVideo && (
                      <div className="absolute top-2 left-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                        <Video className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* New Files (Mixed) */}
              {newGalleryFiles.map((file, i) => {
                const isVideo = file.type.startsWith('video/');
                return (
                  <div key={`new-${i}`} className="relative group aspect-square rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
                    {isVideo ? (
                      <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                    )}
                    {isVideo && (
                      <div className="absolute top-2 left-2 p-1.5 bg-blue-600/60 backdrop-blur-md rounded-lg border border-white/10">
                        <Video className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* Empty Slots (Dynamic calculation) */}
              {Array.from({ length: Math.max(0, 5 - (existingGallery.length + newGalleryFiles.length) % 5) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                  <Upload className="w-6 h-6 text-white/5" />
                </div>
              ))}
            </div>

            <div className="relative">
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*"
                onChange={(e) => handleFileChange(e, 'gallery')}
                className="hidden" 
                id="gallery-upload"
              />
              <label 
                htmlFor="gallery-upload"
                className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-2 border-blue-600/30 rounded-2xl font-bold cursor-pointer transition-all border-dashed"
              >
                <Upload className="w-5 h-5" />
                {(existingGallery.length + newGalleryFiles.length) > 0 ? "Añadir más multimedia" : "Subir fotos o videos"}
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest font-black">Máximo 20 elementos | Límite 50MB recomendado</p>
          </div>
        </div>

        {/* Sidebar / Identity Column */}
        <div className="space-y-8">
          
          {/* Logo y Portada */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-6">Identidad Visual</h2>
            
            <div className="space-y-8">
              {/* Logo */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Logo del Negocio</label>
                <div className="group relative w-24 h-24 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden shadow-xl">
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" alt="Logo preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl font-bold">
                       {negocio.nombre.charAt(0)}
                    </div>
                  )}
                  <input type="file" className="hidden" id="logo-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                  <label htmlFor="logo-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </label>
                </div>
              </div>

              {/* Portada */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Imagen de Portada</label>
                <div className="group relative w-full aspect-video rounded-2xl bg-slate-800 border border-white/10 overflow-hidden shadow-xl">
                  {coverPreview ? (
                    <img src={coverPreview} className="w-full h-full object-cover" alt="Cover preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <ImageIcon className="w-8 h-8 text-slate-700" />
                    </div>
                  )}
                  <input type="file" className="hidden" id="cover-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                  <label htmlFor="cover-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Upload className="w-8 h-8 text-white" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-blue-400" /> Reservas
            </h2>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-white/5 rounded-2xl">
              <span className="text-sm font-medium text-white">Habilitar reservas</span>
              <button 
                type="button"
                onClick={() => setReservaHabilitada(!reservaHabilitada)}
                className={`w-12 h-6 rounded-full transition-colors relative ${reservaHabilitada ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reservaHabilitada ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
              * Si tu negocio acepta reservas directas, activa esta opción para que se muestre el botón en tu perfil.
            </p>
          </div>

          {/* Ayuda */}
          <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
             <h3 className="text-sm font-bold text-blue-400 mb-2">Centro de Ayuda</h3>
             <p className="text-xs text-slate-400 leading-relaxed mb-4">
               Si necesitas cambiar la categoría o tienes problemas técnicos, nuestro equipo está para ayudarte.
             </p>
             <Link href="/portal/soporte" className="text-xs font-bold text-white hover:underline underline-offset-4">
               Ir a Soporte →
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
