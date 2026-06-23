"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, ShieldCheck } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/auth";

// Sub-components extracted for optimization
import EditBusinessHeader from "./edit-form/EditBusinessHeader";
import EditBusinessIdentity from "./edit-form/EditBusinessIdentity";
import EditBusinessSocial from "./edit-form/EditBusinessSocial";
import EditBusinessReservations from "./edit-form/EditBusinessReservations";
import EditBusinessAttributes from "./edit-form/EditBusinessAttributes";
import EditBusinessGallery from "./edit-form/EditBusinessGallery";
import EditBusinessVisualIdentity from "./edit-form/EditBusinessVisualIdentity";
import EditBusinessRatings from "./edit-form/EditBusinessRatings";
import EditBusinessPremium from "./edit-form/EditBusinessPremium";
import ScheduleEditor from "./ScheduleEditor";

interface EditBusinessFormProps {
  negocio: any;
  session: any;
}

export default function EditBusinessForm({ negocio, session }: EditBusinessFormProps) {
  const router = useRouter();
  
  // States
  const [nombre, setNombre] = useState(negocio.nombre || "");
  const [descripcion, setDescripcion] = useState(negocio.descripcion || "");
  const [direccion, setDireccion] = useState(negocio.direccion || "");
  const [latitud, setLatitud] = useState<number | null>(negocio.latitud || null);
  const [longitud, setLongitud] = useState<number | null>(negocio.longitud || null);
  const [telefono, setTelefono] = useState(negocio.telefono || "");
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp || "");
  const [website, setWebsite] = useState(negocio.website || "");
  const [facebook, setFacebook] = useState(negocio.facebook || "");
  const [instagram, setInstagram] = useState(negocio.instagram || "");
  const [priceRange, setPriceRange] = useState(negocio.price_range || "Moderado");
  const [reservaHabilitada, setReservaHabilitada] = useState(negocio.reserva_habilitada ?? false);
  const [reservaUrl, setReservaUrl] = useState(negocio.reserva_url || "");
  const [ctaHabilitado, setCtaHabilitado] = useState(negocio.cta_habilitado ?? (negocio.reserva_habilitada !== false));
  const [ctaTitulo, setCtaTitulo] = useState(negocio.cta_titulo || "");
  const [ctaTexto, setCtaTexto] = useState(negocio.cta_texto || "");
  const [ctaBotonTexto, setCtaBotonTexto] = useState(negocio.cta_boton_texto || "");
  const [ctaLink, setCtaLink] = useState(negocio.cta_link || negocio.reserva_url || "");
  const [ctaTagConfirmacion, setCtaTagConfirmacion] = useState(negocio.cta_tag_confirmacion ?? false);
  const [ctaTagSinComisiones, setCtaTagSinComisiones] = useState(negocio.cta_tag_sin_comisiones ?? false);
  const [schedules, setSchedules] = useState(negocio.schedules || []);
  const [categoria, setCategoria] = useState(negocio.categoria?.documentId || negocio.categoria?.id || "");
  const [categories, setCategories] = useState<any[]>([]);
  const [atributosSeleccionados, setAtributosSeleccionados] = useState<string[]>(negocio.atributos?.map((a: any) => a.documentId) || []);
  const [availableAtributos, setAvailableAtributos] = useState<any[]>([]);
  
  // Ratings & Discovery
  const [triggerDiscovery, setTriggerDiscovery] = useState(false);
  const [tripadvisorUrl, setTripadvisorUrl] = useState(negocio.tripadvisor_url || "");
  const [tripadvisorRating, setTripadvisorRating] = useState(negocio.tripadvisor_rating || 0);
  const [tripadvisorReviewCount, setTripadvisorReviewCount] = useState(negocio.tripadvisor_review_count || 0);

  // Premium
  const [isPremium, setIsPremium] = useState(negocio.is_premium || false);
  const [premiumValidUntil, setPremiumValidUntil] = useState(negocio.premium_valid_until ? negocio.premium_valid_until.split('T')[0] : "");

  // Files & Visual
  const [cropGravity, setCropGravity] = useState(negocio.crop_gravity || "g_auto");
  
  // Normalizar galeria_config (retrocompatibilidad: antes guardaba solo un string)
  const [galeriaConfig, setGaleriaConfig] = useState<Record<string, any>>(() => {
    const config = negocio.galeria_config || {};
    const normalized: Record<string, any> = {};
    Object.keys(config).forEach(key => {
      if (typeof config[key] === 'string') {
        normalized[key] = { cropGravity: config[key], isInternal: false };
      } else {
        normalized[key] = config[key];
      }
    });
    return normalized;
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState(negocio.galeria || []);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<number[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState(negocio.youtube_url || "");

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncUsed, setSyncUsed] = useState(false);
  const [syncSummary, setSyncSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || "");
  const syncAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isAdmin) {
      const fetchCategories = async () => {
        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
          const res = await fetch(`${strapiUrl}/api/categorias?sort=nombre:asc&pagination[pageSize]=100`);
          const data = await res.json();
          setCategories(data.data || []);
        } catch (e) {
          console.error("Error fetching categories:", e);
        }
      };
      fetchCategories();
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchAtributos = async () => {
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
        const res = await fetch(`${strapiUrl}/api/atributos?sort=nombre:asc&pagination[pageSize]=100`, {
          headers: { "Authorization": `Bearer ${session.jwt}` }
        });
        const data = await res.json();
        setAvailableAtributos(data.data || []);
      } catch (e) {
        console.error("Error fetching atributos:", e);
      }
    };
    fetchAtributos();
  }, []);

  // Corrige la orientación EXIF de una imagen usando un canvas y la comprime
  const fixImageOrientation = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Leer orientación EXIF
          const arrayBuffer = e.target?.result as ArrayBuffer;
          let orientation = 1;
          try {
            const view = new DataView(arrayBuffer);
            if (view.getUint16(0, false) === 0xFFD8) {
              let offset = 2;
              while (offset < view.byteLength) {
                const marker = view.getUint16(offset, false);
                offset += 2;
                if (marker === 0xFFE1) {
                  if (view.getUint32(offset += 2, false) === 0x45786966) {
                    const little = view.getUint16(offset += 6, false) === 0x4949;
                    offset += view.getUint32(offset + 4, little);
                    const tags = view.getUint16(offset, little);
                    offset += 2;
                    for (let i = 0; i < tags; i++) {
                      if (view.getUint16(offset + i * 12, little) === 0x0112) {
                        orientation = view.getUint16(offset + i * 12 + 8, little);
                        break;
                      }
                    }
                  }
                  break;
                } else if ((marker & 0xFF00) !== 0xFF00) break;
                else offset += view.getUint16(offset, false);
              }
            }
          } catch (_) { /* Si falla el EXIF, usamos orientación 1 */ }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const { width, height } = img;

          // Ajustar dimensiones del canvas según orientación
          if (orientation >= 5 && orientation <= 8) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          // Rotar según EXIF
          switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
            default: break;
          }
          ctx.drawImage(img, 0, 0);

          // Comprimir a JPEG para ahorrar tiempo de upload (máx 1600px ancho, calidad 85%)
          const MAX_W = 1600;
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d')!;
          const scale = Math.min(1, MAX_W / canvas.width);
          finalCanvas.width = Math.round(canvas.width * scale);
          finalCanvas.height = Math.round(canvas.height * scale);
          finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);

          finalCanvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            const corrected = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
            resolve(corrected);
          }, 'image/jpeg', 0.85);
        };
        img.src = URL.createObjectURL(file);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'logo') {
      const fixed = await fixImageOrientation(files[0]);
      setLogoFile(fixed);
    } else if (type === 'cover') {
      const fixed = await fixImageOrientation(files[0]);
      setCoverFile(fixed);
    } else if (type === 'gallery') {
      const fixed = await Promise.all(Array.from(files).map(f => fixImageOrientation(f)));
      setNewGalleryFiles((prev: File[]) => [...prev, ...fixed]);
    }
  };

  const removeExistingPhoto = (id: number) => {
    setExistingGallery((prev: any[]) => prev.filter((p: any) => p.id !== id));
    setRemovedGalleryIds((prev: number[]) => [...prev, id]);
  };

  const removeNewPhoto = (index: number) => {
    setNewGalleryFiles((prev: File[]) => prev.filter((_, i) => i !== index));
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
    if (!nombre) return toast.error("Ingresa el nombre del negocio primero");
    
    setIsSyncing(true);
    setSyncUsed(false);
    syncAbortRef.current = new AbortController();

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(`${strapiUrl}/api/discovery/google`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`
        },
        body: JSON.stringify({ name: nombre }),
        signal: syncAbortRef.current.signal
      });

      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        if (d.direccion) setDireccion(d.direccion);
        if (d.lat && d.lng) { setLatitud(d.lat); setLongitud(d.lng); }
        if (d.telefono) setTelefono(d.telefono);
        if (d.website) setWebsite(d.website);
        if (d.schedules && d.schedules.length > 0) setSchedules(d.schedules);
        
        setSyncSummary({
          direccion: d.direccion,
          telefono: d.telefono,
          website: d.website,
          schedules: d.schedules?.length || 0
        });
        
        setSyncUsed(true);
        toast.success("Datos importados de Google Maps con éxito");
      } else {
        toast.error(result.error || "No se encontraron datos precisos en Google Maps");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Sync error:", err);
        toast.error("Error al sincronizar con Google");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      const formData = new FormData();
      
      const payload = {
        nombre,
        descripcion,
        direccion,
        latitud,
        longitud,
        telefono,
        whatsapp,
        website,
        facebook,
        instagram,
        price_range: priceRange,
        reserva_habilitada: reservaHabilitada,
        reserva_url: reservaUrl,
        cta_habilitado: ctaHabilitado,
        cta_titulo: ctaTitulo,
        cta_texto: ctaTexto,
        cta_boton_texto: ctaBotonTexto,
        cta_link: ctaLink,
        cta_tag_confirmacion: ctaTagConfirmacion,
        cta_tag_sin_comisiones: ctaTagSinComisiones,
        schedules,
        categoria: isAdmin ? categoria : undefined,
        atributos: atributosSeleccionados,
        trigger_discovery: triggerDiscovery,
        tripadvisor_url: tripadvisorUrl,
        tripadvisor_rating: Number(tripadvisorRating) || 0,
        tripadvisor_review_count: Number(tripadvisorReviewCount) || 0,
        youtube_url: youtubeUrl,
        crop_gravity: cropGravity,
        galeria_config: galeriaConfig,
        is_premium: isAdmin ? isPremium : undefined,
        premium_valid_until: isAdmin ? (premiumValidUntil ? new Date(premiumValidUntil).toISOString() : null) : undefined,
        galeria: existingGallery.map((img: any) => img.id)
      };

      formData.append("data", JSON.stringify(payload));
      if (logoFile) formData.append("logo", logoFile);
      if (coverFile) formData.append("imagen_portada", coverFile);
      if (newGalleryFiles.length > 0) {
        newGalleryFiles.forEach(file => formData.append("galeria", file));
      }

      const res = await fetch(`${strapiUrl}/api/negocios/${negocio.documentId}/portal-update`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${session.jwt}` },
        body: formData
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("¡Perfil actualizado!");
        setTimeout(() => router.push("/portal"), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error?.message || "Error al guardar los cambios");
        toast.error("Error al guardar");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Error crítico de red");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <EditBusinessHeader 
        nombre={negocio.nombre}
        slug={negocio.slug}
        isSaving={isSaving}
        success={success}
        error={error}
        onSave={handleSave}
      />

      <div className="max-w-4xl mx-auto space-y-12">
        <EditBusinessIdentity 
          nombre={nombre}
          setNombre={setNombre}
          direccion={direccion}
          latitud={latitud}
          longitud={longitud}
          onAddressSelect={onAddressSelect}
          setLatitud={setLatitud}
          setLongitud={setLongitud}
          isSyncing={isSyncing}
          syncUsed={syncUsed}
          syncSummary={syncSummary}
          handleGoogleSync={handleGoogleSync}
          cancelSync={cancelSync}
          isAdmin={isAdmin}
          categoria={categoria}
          setCategoria={setCategoria}
          categories={categories}
        />

        <EditBusinessVisualIdentity 
          logo={negocio.logo}
          logoFile={logoFile}
          cover={negocio.imagen_portada}
          coverFile={coverFile}
          cropGravity={cropGravity}
          setLogoFile={setLogoFile}
          setCoverFile={setCoverFile}
          setCropGravity={setCropGravity}
          handleFileChange={handleFileChange}
        />

        <EditBusinessSocial 
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          telefono={telefono}
          setTelefono={setTelefono}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          website={website}
          setWebsite={setWebsite}
          facebook={facebook}
          setFacebook={setFacebook}
          instagram={instagram}
          setInstagram={setInstagram}
        />

        <EditBusinessGallery 
          existingGallery={existingGallery}
          newGalleryFiles={newGalleryFiles}
          removeExistingPhoto={removeExistingPhoto}
          removeNewPhoto={removeNewPhoto}
          handleFileChange={handleFileChange}
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          galeriaConfig={galeriaConfig}
          setGaleriaConfig={setGaleriaConfig}
        />

        <EditBusinessAttributes
          atributosSeleccionados={atributosSeleccionados}
          setAtributosSeleccionados={setAtributosSeleccionados}
          availableAtributos={availableAtributos}
          setAvailableAtributos={setAvailableAtributos}
          session={session}
        />

        <EditBusinessReservations 
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          ctaHabilitado={ctaHabilitado}
          setCtaHabilitado={setCtaHabilitado}
          ctaTitulo={ctaTitulo}
          setCtaTitulo={setCtaTitulo}
          ctaTexto={ctaTexto}
          setCtaTexto={setCtaTexto}
          ctaBotonTexto={ctaBotonTexto}
          setCtaBotonTexto={setCtaBotonTexto}
          ctaLink={ctaLink}
          setCtaLink={setCtaLink}
          ctaTagConfirmacion={ctaTagConfirmacion}
          setCtaTagConfirmacion={setCtaTagConfirmacion}
          ctaTagSinComisiones={ctaTagSinComisiones}
          setCtaTagSinComisiones={setCtaTagSinComisiones}
        />

        <EditBusinessRatings
          triggerDiscovery={triggerDiscovery}
          setTriggerDiscovery={setTriggerDiscovery}
          tripadvisorUrl={tripadvisorUrl}
          setTripadvisorUrl={setTripadvisorUrl}
          tripadvisorRating={tripadvisorRating}
          setTripadvisorRating={setTripadvisorRating}
          tripadvisorReviewCount={tripadvisorReviewCount}
          setTripadvisorReviewCount={setTripadvisorReviewCount}
        />

        {isAdmin && (
          <EditBusinessPremium
            isPremium={isPremium}
            setIsPremium={setIsPremium}
            premiumValidUntil={premiumValidUntil}
            setPremiumValidUntil={setPremiumValidUntil}
          />
        )}

        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <Clock className="w-6 h-6 text-blue-400" />
             Horarios de Atención
          </h2>
          <ScheduleEditor schedules={schedules} onChange={setSchedules} />
        </div>
      </div>
    </div>
  );
}
