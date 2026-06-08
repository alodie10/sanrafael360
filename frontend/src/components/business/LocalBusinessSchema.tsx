import { Negocio } from "@/types/strapi";

// --- Mapeos ---

const DAY_MAP: Record<string, string> = {
  Lunes: "Monday",
  Martes: "Tuesday",
  "Miércoles": "Wednesday",
  Jueves: "Thursday",
  Viernes: "Friday",
  "Sábado": "Saturday",
  Domingo: "Sunday",
};

const PRICE_RANGE_MAP: Record<string, string> = {
  Economico: "$",
  Moderado: "$$",
  "Medio-Alto": "$$$",
  Alto: "$$$$",
};

/**
 * Determina el @type de Schema.org según la categoría del negocio.
 * Ver: https://schema.org/LocalBusiness
 */
function getSchemaType(categoriaNombre?: string): string {
  const nombre = (categoriaNombre || "").toLowerCase();
  if (
    nombre.includes("gastronom") ||
    nombre.includes("restaurant") ||
    nombre.includes("bar") ||
    nombre.includes("cafe") ||
    nombre.includes("café")
  )
    return "Restaurant";
  if (
    nombre.includes("alojamiento") ||
    nombre.includes("hotel") ||
    nombre.includes("cabaña") ||
    nombre.includes("hosteria") ||
    nombre.includes("hostel")
  )
    return "Hotel";
  if (
    nombre.includes("turismo") ||
    nombre.includes("aventura") ||
    nombre.includes("actividad") ||
    nombre.includes("excursion")
  )
    return "TouristAttraction";
  if (nombre.includes("bodega") || nombre.includes("vino"))
    return "Winery";
  if (nombre.includes("salud") || nombre.includes("clinica") || nombre.includes("médico"))
    return "MedicalBusiness";
  if (nombre.includes("educac") || nombre.includes("escuela") || nombre.includes("academia"))
    return "EducationalOrganization";
  return "LocalBusiness";
}

/**
 * Limpia texto: elimina tags HTML y markdown básico.
 */
function cleanText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_~`>]/g, "")
    .trim()
    .substring(0, 500);
}

/**
 * Formatea tiempo "HH:MM:SS.000" → "HH:MM"
 */
function formatTime(time?: string): string | undefined {
  if (!time) return undefined;
  const parts = time.split(":");
  if (parts.length < 2) return undefined;
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

interface LocalBusinessSchemaProps {
  negocio: Negocio;
}

/**
 * Componente server-side — renderiza el JSON-LD Schema.org correcto para una ficha de negocio.
 * Se incluye directamente en el <head> vía el layout de /negocios/[slug].
 *
 * Soporta los tipos: Restaurant, Hotel, TouristAttraction, Winery, LocalBusiness.
 * Ver RF-14 del ERS.
 */
export function LocalBusinessSchema({ negocio }: LocalBusinessSchemaProps) {
  const schemaType = getSchemaType(negocio.categoria?.nombre);
  // Fallback defensivo: si slug es undefined (campo no solicitado a Strapi), usar documentId
  const slugOrId = negocio.slug || negocio.documentId;
  const canonicalUrl = `https://www.sanrafael360.com/negocios/${slugOrId}`;
  const imageUrl =
    negocio.imagen_portada?.url ||
    negocio.logo?.url ||
    "https://www.sanrafael360.com/og-default.jpg";

  // openingHoursSpecification — formato correcto Schema.org
  const openingHours =
    negocio.schedules
      ?.filter((s) => !s.is_closed && s.opening_time && s.closing_time)
      .map((s) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_MAP[s.day] ? `https://schema.org/${DAY_MAP[s.day]}` : s.day,
        opens: formatTime(s.opening_time),
        closes: formatTime(s.closing_time),
      }))
      .filter((s) => s.opens && s.closes) || [];

  // sameAs — redes sociales y sitio web del negocio
  const sameAs = [
    negocio.instagram
      ? `https://instagram.com/${negocio.instagram.replace(/^@/, "")}`
      : null,
    negocio.facebook || null,
    negocio.website || null,
    negocio.google_maps_url || null,
  ].filter(Boolean);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: negocio.nombre,
    description: cleanText(negocio.descripcion),
    url: canonicalUrl,
    image: imageUrl,
    telephone: negocio.telefono || negocio.whatsapp || undefined,
    email: negocio.email || undefined,
    address: negocio.direccion
      ? {
          "@type": "PostalAddress",
          streetAddress: negocio.direccion,
          addressLocality: "San Rafael",
          addressRegion: "Mendoza",
          addressCountry: "AR",
          postalCode: "5600",
        }
      : undefined,
    geo:
      negocio.latitud && negocio.longitud
        ? {
            "@type": "GeoCoordinates",
            latitude: negocio.latitud,
            longitude: negocio.longitud,
          }
        : undefined,
    priceRange: negocio.price_range
      ? PRICE_RANGE_MAP[negocio.price_range] || negocio.price_range
      : undefined,
    aggregateRating:
      negocio.rating && negocio.review_count && negocio.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: negocio.rating.toFixed(1),
            reviewCount: negocio.review_count,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    openingHoursSpecification: openingHours.length > 0 ? openingHours : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  // Campos específicos por tipo
  if (schemaType === "Restaurant" && negocio.categoria?.nombre) {
    schema.servesCuisine = negocio.categoria.nombre;
  }

  // Limpiar campos undefined para un JSON limpio
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
