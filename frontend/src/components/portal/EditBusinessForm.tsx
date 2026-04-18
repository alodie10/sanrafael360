"use client";

import { useState, useRef } from "react";
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
  Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStrapiMedia } from "@/lib/strapi";
import ScheduleEditor from "./ScheduleEditor";

interface EditBusinessFormProps {
  negocio: any;
  session: any;
}

export default function EditBusinessForm({ negocio, session }: EditBusinessFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [nombre, setNombre] = useState(negocio.nombre || "");
  const [direccion, setDireccion] = useState(negocio.direccion || "");
  const [latitud, setLatitud] = useState(negocio.latitud || null);
  const [longitud, setLongitud] = useState(negocio.longitud || null);
  const [descripcion, setDescripcion] = useState(negocio.descripcion || "");
  const [facebook, setFacebook] = useState(negocio.facebook || "");
  const [instagram, setInstagram] = useState(negocio.instagram || "");
  const [website, setWebsite] = useState(negocio.website || "");
  const [reservaHabilitada, setReservaHabilitada] = useState(negocio.reserva_habilitada ?? true);
  const [priceRange, setPriceRange] = useState(negocio.price_range || "Moderado");
  const [schedules, setSchedules] = useState(negocio.schedules || []);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
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
      const availableSlots = 4 - existingGallery.length - newGalleryFiles.length;
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

  const handleGeocode = async () => {
    if (!direccion) return;
    setIsGeocoding(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion + ", San Rafael, Mendoza")}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK") {
        const { lat, lng } = data.results[0].geometry.location;
        setLatitud(lat);
        setLongitud(lng);
        alert(`Ubicación validada con éxito: ${lat}, ${lng}`);
      } else {
        throw new Error("No pudimos encontrar esa dirección en el mapa.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGeocoding(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Comercial</label>
                <input 
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Dirección</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Av. Mitre 123"
                    className="flex-1 px-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white"
                  />
                  <button 
                    onClick={handleGeocode}
                    disabled={isGeocoding || !direccion}
                    type="button"
                    className="px-4 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-2xl border border-blue-500/30 transition-all flex items-center gap-2"
                  >
                    {isGeocoding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="hidden md:inline text-xs font-bold uppercase">Validar</span>
                  </button>
                </div>
                {latitud && (
                  <p className="text-[10px] text-green-500 mt-1 ml-1 font-bold">✓ Ubicación válida ({latitud.toFixed(4)}, {longitud.toFixed(4)})</p>
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
              <div className="space-y-2">
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
              <ScheduleEditor 
                schedules={schedules} 
                onChange={setSchedules} 
              />

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">$$</div>
                  Nivel de Precios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Económico", "Moderado", "Pro", "Premium"].map((range) => (
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
               Galería de Fotos
            </h2>
            <p className="text-sm text-slate-400 mb-6">Sube hasta 4 fotos para mostrar en la galería principal (reemplazará las actuales).</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Existing Photos */}
              {existingGallery.map((photo: any) => (
                <div key={`existing-${photo.id}`} className="relative group aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <img src={getStrapiMedia(photo.url)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                  <button 
                    onClick={() => removeExistingPhoto(photo.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* New Photos */}
              {newGalleryFiles.map((file, i) => (
                <div key={`new-${i}`} className="relative group aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => removeNewPhoto(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: 4 - existingGallery.length - newGalleryFiles.length }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                  <ImageIcon className="w-6 h-6 text-white/10" />
                </div>
              ))}
            </div>

            <div className="relative">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'gallery')}
                className="hidden" 
                id="gallery-upload"
              />
              <label 
                htmlFor="gallery-upload"
                className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold cursor-pointer transition-all border-dashed"
              >
                <Upload className="w-5 h-5 text-blue-400" />
                {(existingGallery.length + newGalleryFiles.length) > 0 ? "Añadir más fotos" : "Seleccionar hasta 4 fotos"}
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest font-bold">Máximo 10MB en total</p>
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
