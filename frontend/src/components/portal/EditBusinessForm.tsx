"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, ShieldCheck } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { getStrapiUrl } from "@/lib/strapi";
import { sortGaleriaByOrden, syncGaleriaOrden } from "@/lib/galeria-order";

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
import EditBusinessOffers from "./edit-form/EditBusinessOffers";
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
  const [existingGallery, setExistingGallery] = useState(() =>
    sortGaleriaByOrden(negocio.galeria || [], negocio.galeria_config)
  );
  const [removedGalleryIds, setRemovedGalleryIds] = useState<number[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState(negocio.youtube_url || "");
  // Videos subidos directo a Cloudinary (array de { url, publicId })
  const [cloudinaryVideos, setCloudinaryVideos] = useState<{ url: string; public_id: string }[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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
          const strapiUrl = getStrapiUrl();
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
        const strapiUrl = getStrapiUrl();
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
  const isHeicFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const type = (file.type || "").toLowerCase();
    return (
      type === "image/heic" ||
      type === "image/heif" ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    );
  };

  /** iPhone HEIC → JPEG (Chrome/Firefox no lo decodifican en canvas). */
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return new File([blob], file.name.replace(/\.[^.]+$/i, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const prepareImageFile = async (file: File): Promise<File | null> => {
    try {
      let working = file;
      if (isHeicFile(file)) {
        const toastId = toast.loading("Convirtiendo foto HEIC de iPhone…");
        try {
          working = await convertHeicToJpeg(file);
          toast.success("Foto convertida a JPEG", { id: toastId });
        } catch (err: any) {
          toast.error(
            "No se pudo leer el HEIC. En el iPhone: Compartir → Guardar como JPEG, o en Ajustes → Cámara → Formatos → Más compatible.",
            { id: toastId, duration: 8000 }
          );
          console.error("[HEIC convert]", err);
          return null;
        }
      }
      return await fixImageOrientation(working);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo procesar la imagen");
      return null;
    }
  };

  const fixImageOrientation = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => {
          // Formato no soportado por el navegador (p. ej. HEIC sin convertir)
          resolve(file);
        };
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

  // Sube un video directo a Cloudinary desde el browser (sin pasar por Railway)
  const uploadVideoToCloudinary = async (file: File): Promise<void> => {
    setUploadingVideo(true);
    const toastId = toast.loading(`Subiendo video... (puede tardar por el tamaño)`);
    try {
      // 1. Pedir firma al servidor Next.js
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "sanrafael360_galeria" }),
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        throw new Error(signData.error || "No se pudo autorizar la subida (sesión o Cloudinary en servidor)");
      }

      const { signature, timestamp, api_key, cloud_name, folder } = signData;
      if (!signature || !api_key || !cloud_name) {
        throw new Error("Respuesta de firma Cloudinary incompleta");
      }

      // 2. Subir directo a Cloudinary (/video/upload — no enviar resource_type en el body)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.secure_url) {
        throw new Error(uploadData.error?.message || "Error al subir el video a Cloudinary");
      }

      setCloudinaryVideos(prev => [...prev, { url: uploadData.secure_url, public_id: uploadData.public_id }]);
      toast.success("¡Video subido con éxito!", { id: toastId });
    } catch (err: any) {
      toast.error(`Error al subir el video: ${err.message}`, { id: toastId });
    } finally {
      setUploadingVideo(false);
    }
  };

  // Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'logo') {
      const fixed = await prepareImageFile(files[0]);
      if (fixed) setLogoFile(fixed);
    } else if (type === 'cover') {
      const fixed = await prepareImageFile(files[0]);
      if (fixed) setCoverFile(fixed);
    } else if (type === 'gallery') {
      const allFiles = Array.from(files);
      const videoFiles = allFiles.filter(f => f.type.startsWith('video/'));
      const imageFiles = allFiles.filter(f => !f.type.startsWith('video/'));

      // Videos → subida directa a Cloudinary (bypass Railway)
      for (const videoFile of videoFiles) {
        await uploadVideoToCloudinary(videoFile);
      }

      // Imágenes → HEIC→JPEG si hace falta, luego EXIF + compresión
      if (imageFiles.length > 0) {
        const prepared = await Promise.all(imageFiles.map((f) => prepareImageFile(f)));
        const fixed = prepared.filter((f): f is File => !!f);
        if (fixed.length > 0) {
          setNewGalleryFiles((prev: File[]) => [...prev, ...fixed]);
        }
      }
    }

    // Permite volver a elegir el mismo archivo
    e.target.value = "";
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
      const strapiUrl = getStrapiUrl();
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
      const strapiUrl = getStrapiUrl();
      const formData = new FormData();
      
      const moduloSlug = String(negocio.reserva_comercio?.slug || "").trim();
      const moduloPath = moduloSlug ? `/reservas/${moduloSlug}` : "";
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
        reserva_habilitada: moduloSlug ? true : reservaHabilitada,
        reserva_url: moduloSlug ? moduloPath : reservaUrl,
        cta_habilitado: moduloSlug ? true : ctaHabilitado,
        cta_titulo: moduloSlug ? (ctaTitulo || "Reserve su turno") : ctaTitulo,
        cta_texto: ctaTexto,
        cta_boton_texto: moduloSlug ? (ctaBotonTexto || "Reservar turno") : ctaBotonTexto,
        cta_link: moduloSlug ? moduloPath : ctaLink,
        cta_tag_confirmacion: moduloSlug ? true : ctaTagConfirmacion,
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
        galeria_config: syncGaleriaOrden(existingGallery, galeriaConfig),
        is_premium: isAdmin ? isPremium : undefined,
        premium_valid_until: isAdmin ? (premiumValidUntil ? new Date(premiumValidUntil).toISOString() : null) : undefined,
        galeria: existingGallery.map((img: any) => img.id),
        // URLs de videos subidos directo a Cloudinary (no pasan por Railway)
        cloudinary_videos_urls: cloudinaryVideos.map(v => v.url)
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
        <EditBusinessOffers negocioId={negocio.documentId} session={session} />

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
          setExistingGallery={setExistingGallery}
          newGalleryFiles={newGalleryFiles}
          cloudinaryVideos={cloudinaryVideos}
          uploadingVideo={uploadingVideo}
          removeExistingPhoto={removeExistingPhoto}
          removeNewPhoto={removeNewPhoto}
          removeCloudinaryVideo={(idx) => setCloudinaryVideos(prev => prev.filter((_, i) => i !== idx))}
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
          reservaModuloSlug={negocio.reserva_comercio?.slug}
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
