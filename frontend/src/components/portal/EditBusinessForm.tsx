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
  CalendarDays
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStrapiMedia } from "@/lib/strapi";

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
  const [descripcion, setDescripcion] = useState(negocio.descripcion || "");
  const [facebook, setFacebook] = useState(negocio.facebook || "");
  const [website, setWebsite] = useState(negocio.website || "");
  const [reservaHabilitada, setReservaHabilitada] = useState(negocio.reserva_habilitada ?? true);
  
  // Files State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  
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
      const newFiles = Array.from(files).slice(0, 4); // Limit to 4
      setGalleryFiles(newFiles);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const targetUrl = `${strapiUrl}/api/negocios/${negocio.documentId || negocio.id}/portal-update`;
      
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        descripcion,
        facebook,
        website,
        reserva_habilitada: reservaHabilitada
      }));

      if (logoFile) formData.append("logo", logoFile);
      if (coverFile) formData.append("imagen_portada", coverFile);
      galleryFiles.forEach(file => {
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
              <p className="text-xs text-slate-500 mt-2 ml-1 italic">* Nota: Por ahora solo se soporta texto plano. Próximamente habilitaremos editor visual.</p>
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
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                  {galleryFiles[i] ? (
                    <img src={URL.createObjectURL(galleryFiles[i])} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white/10" />
                  )}
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
                {galleryFiles.length > 0 ? "Reemplazar Selección" : "Seleccionar hasta 4 fotos"}
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
             <h3 className="text-sm font-bold text-blue-400 mb-2">¿Necesitas cambiar el nombre?</h3>
             <p className="text-xs text-slate-400 leading-relaxed mb-4">
               El nombre y la categoría están protegidos. Si necesitas modificarlos, contacta al equipo de San Rafael 360.
             </p>
             <button className="text-xs font-bold text-white hover:underline underline-offset-4">
               Enviar consulta →
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
