import { getCategorias } from "@/lib/categorias";
import { fetchFromStrapi } from "@/lib/strapi";
import { Negocio, Categoria } from "@/types/strapi";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

// ---------------------------------------------------------------------------
// Generador de contenido editorial por categoría
// Mejora SEO On-Page sin necesidad de una tabla en Strapi
// ---------------------------------------------------------------------------
function getCategoryContent(nombre: string): {
  intro: string;
  faqs: Array<{ q: string; a: string }>;
} {
  const n = nombre.toLowerCase();

  // --- Gastronomía / Restaurantes ---
  if (
    n.includes("gastronom") ||
    n.includes("restaurant") ||
    n.includes("bar") ||
    n.includes("cafe") ||
    n.includes("café")
  ) {
    return {
      intro: `San Rafael tiene una escena gastronómica rica y variada. Desde bodegas con restaurante hasta parrillas tradicionales y cafés en el centro, encontrás opciones para todos los gustos y presupuestos. Muchos locales trabajan con productos regionales: aceite de oliva, vinos de la zona y carnes patagónicas.`,
      faqs: [
        {
          q: `¿Cuáles son los mejores restaurantes en San Rafael?`,
          a: `San Rafael ofrece una amplia variedad gastronómica. Podés encontrar desde parrillas tradicionales con carnes de primera, hasta restaurantes de bodega con vista a los viñedos. Te recomendamos explorar el directorio completo de SR360 para ver opiniones, fotos y horarios actualizados.`,
        },
        {
          q: `¿Qué zonas de San Rafael tienen más restaurantes?`,
          a: `La mayor concentración gastronómica está en el centro de San Rafael (zona de la peatonal) y en las afueras, cerca de los distritos Cuadro Benegas y El Sosneado, donde abundan las bodegas con restaurante.`,
        },
        {
          q: `¿Cuánto cuesta comer en San Rafael?`,
          a: `Los precios varían. Encontrás opciones económicas (menús del día desde $5.000), locales intermedios y restaurantes premium en bodegas. El directorio SR360 incluye el rango de precios de cada lugar para que puedas comparar.`,
        },
      ],
    };
  }

  // --- Alojamiento / Hoteles / Cabañas ---
  if (
    n.includes("alojamiento") ||
    n.includes("hotel") ||
    n.includes("cabaña") ||
    n.includes("hosteria") ||
    n.includes("hostel")
  ) {
    return {
      intro: `San Rafael es el destino turístico más importante del sur mendocino. La oferta de alojamiento es variada: hoteles boutique en el centro, cabañas en plena naturaleza cerca del río Atuel, hosterías con encanto y hostels para viajeros. Hay opciones para todos los presupuestos.`,
      faqs: [
        {
          q: `¿Dónde conviene alojarse en San Rafael?`,
          a: `Depende de lo que buscás. Si querés estar cerca de los servicios, el centro es ideal. Si preferís naturaleza y tranquilidad, las cabañas cerca del río Atuel o del lago El Niñuil son una excelente opción. SR360 te permite filtrar por zona y ver fotos reales.`,
        },
        {
          q: `¿Cuándo es la temporada alta en San Rafael?`,
          a: `La temporada alta es en verano (diciembre-febrero) por el Atuel y el kayak, y en marzo durante la vendimia. En invierno también hay demanda por el Valle Grande. Se recomienda reservar con anticipación en esas épocas.`,
        },
        {
          q: `¿Hay alojamientos para mascotas en San Rafael?`,
          a: `Sí, varios alojamientos en San Rafael son pet-friendly. Podés filtrar por atributos en SR360 para encontrar opciones que acepten mascotas.`,
        },
      ],
    };
  }

  // --- Turismo / Aventura / Excursiones ---
  if (
    n.includes("turismo") ||
    n.includes("aventura") ||
    n.includes("actividad") ||
    n.includes("excursion") ||
    n.includes("excursión")
  ) {
    return {
      intro: `El departamento de San Rafael es uno de los destinos de turismo aventura más completos de Argentina. El Cañón del Atuel, el lago El Niñuil, las termas de Balde de la Orqueta y los cañones del río Diamante ofrecen kayak, trekking, rafting, mountain bike y más durante todo el año.`,
      faqs: [
        {
          q: `¿Qué actividades de turismo se pueden hacer en San Rafael?`,
          a: `San Rafael ofrece kayak y rafting en el río Atuel, trekking en el Cañón del Atuel, pesca deportiva, mountain bike, visitas a bodegas, vuelos en parapente y mucho más. Muchas agencias organizan excursiones de día completo.`,
        },
        {
          q: `¿En qué época del año se puede hacer kayak en el Atuel?`,
          a: `La temporada óptima para kayak y actividades acuáticas en el río Atuel es de octubre a marzo. En verano el caudal es mayor y las temperaturas son ideales para el agua.`,
        },
        {
          q: `¿Nécesito experiencia previa para las excursiones de aventura?`,
          a: `La mayoría de las agencias en SR360 ofrecen actividades para todos los niveles, desde excursiones familiares hasta circuitos para aventureros experimentados. Siempre consultá con la agencia antes de reservar.`,
        },
      ],
    };
  }

  // --- Bodegas / Vino ---
  if (n.includes("bodega") || n.includes("vino") || n.includes("enotur")) {
    return {
      intro: `San Rafael es una zona vitivinícola de clase mundial, parte de la Denominación de Origen Controlada de Mendoza. Las bodegas de la zona producen variedades como Malbec, Cabernet Sauvignon y Syrah de enorme reconocimiento internacional. Muchas ofrecen visitas guiadas, degustaciones y maridajes.`,
      faqs: [
        {
          q: `¿Qué bodegas se pueden visitar en San Rafael?`,
          a: `En San Rafael hay varias bodegas abiertas al turismo. Algunas están en el distrito Cuadro Benegas, a pocos minutos del centro. Muchas ofrecen degustaciones, recorridos por el viñedo y almuerzos con maridaje. Podés ver las opciones disponibles y leer opiniones en SR360.`,
        },
        {
          q: `¿Necesito reserva para visitar una bodega en San Rafael?`,
          a: `La mayoría de las bodegas requieren reserva previa, especialmente en temporada alta (marzo-vendimia y verano). Desde SR360 podés ver el teléfono y WhatsApp de cada bodega para coordinar tu visita.`,
        },
        {
          q: `¿Cuál es el mejor vino de San Rafael?`,
          a: `El Malbec de San Rafael es el más reconocido internacionalmente, con premios en concursos mundiales. También destacan el Cabernet Sauvignon y el Chenin Blanc como varietales emblemáticos de la zona.`,
        },
      ],
    };
  }

  // --- Servicios (genérico) ---
  return {
    intro: `En San Rafael encontrás una amplia oferta de ${nombre.toLowerCase()} para residentes y turistas. El directorio SR360 reúne las mejores opciones con opiniones reales, fotos, horarios actualizados y contacto directo.`,
    faqs: [
      {
        q: `¿Dónde encontrar ${nombre.toLowerCase()} en San Rafael?`,
        a: `Podés explorar todas las opciones de ${nombre.toLowerCase()} disponibles en San Rafael a través del directorio SR360. Cada ficha incluye teléfono, WhatsApp, ubicación en mapa y opiniones de otros usuarios.`,
      },
      {
        q: `¿Cómo contactar a un ${nombre.toLowerCase()} en San Rafael?`,
        a: `Desde cada ficha en SR360 podés llamar, enviar un WhatsApp o ver la ubicación en Google Maps directamente. No es necesario salir del directorio para hacer el primer contacto.`,
      },
    ],
  };
}

// Helper para verificar si un negocio tiene Premium activo y vigente
const isPremiumActive = (negocio: Negocio): boolean => {
  if (!negocio?.is_premium) return false;
  if (!negocio.premium_valid_until) return true; // Sin vencimiento = activo
  return new Date(negocio.premium_valid_until) > new Date();
};

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let categoria: Categoria | null = null;
  let negocios: Negocio[] = [];
  let categorias: any[] = [];

  try {
    const strapiToken = process.env.STRAPI_API_TOKEN;
    const options = strapiToken
      ? { headers: { Authorization: `Bearer ${strapiToken}` } }
      : {};

    // 1. Obtener la categoría
    const catRes = await fetchFromStrapi(
      `categorias?filters[slug][$eq]=${slug}&fields[0]=nombre&fields[1]=descripcion&fields[2]=documentId`,
      options
    );
    categoria = catRes.data?.[0] || null;

    if (categoria) {
      // 1.5 Obtener todas las categorías para el FilterBar
      categorias = await getCategorias(options);

      // 2. Obtener negocios de esta categoría (paginando hasta traer todos)
      let page = 1;
      let pageCount = 1;

      do {
        const populate =
          "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug" +
          "&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo" +
          "&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url" +
          "&populate[owner][fields][0]=id";
        
        const filters = `filters[$or][0][categoria][slug][$eq]=${slug}&filters[$or][1][categoria][parent][slug][$eq]=${slug}`;
        const negRes = await fetchFromStrapi(
          `negocios?${filters}&${populate}&sort=nombre:asc&pagination[page]=${page}&pagination[pageSize]=100`,
          options
        );
        
        if (negRes.data) {
          negocios = [...negocios, ...negRes.data];
        }
        pageCount = negRes.meta?.pagination?.pageCount || 1;
        page++;
      } while (page <= pageCount);

      // Ordenar los negocios (Premium primero)
      if (negocios.length > 0) {
        negocios.sort((a, b) => {
          if (!a || !b) return 0;
          const isAPremium = isPremiumActive(a);
          const isBPremium = isPremiumActive(b);

          if (isAPremium && !isBPremium) return -1;
          if (!isAPremium && isBPremium) return 1;

          // Desempate alfabético por defecto (seguro contra null)
          const nombreA = a.nombre || "";
          const nombreB = b.nombre || "";
          return nombreA.localeCompare(nombreB);
        });
      }
    }

  } catch (error: any) {
    // Si el error es de Next.js (notFound/redirect), lo relanzamos
    if (error?.digest?.startsWith('NEXT_NOT_FOUND')) throw error;
    console.error("Error cargando categoría:", error);
  }

  // Si no encontró categoría, llamamos a notFound fuera del catch (por seguridad)
  if (!categoria) {
    notFound();
  }

  const { intro, faqs } = getCategoryContent(categoria.nombre);

  const selectedCategoryDocId = categoria?.documentId || null;

  // FAQ Schema.org
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HEADER DE CATEGORÍA */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 px-4 text-center border-b border-white/5 bg-slate-900/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {categoria?.nombre} en <span className="text-primary italic">San Rafael</span>
          </h1>
          
          {/* Texto editorial generado — aporta contenido textual relevante a Google */}
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        </div>
      </section>

      {/* BARRA DE FILTROS (STICKY) */}
      <div className="sticky-filter-bar scroll-mt-36 z-20">
        {/* @ts-ignore */}
        <FilterBar 
          categorias={categorias} 
          selectedCategoryDocId={selectedCategoryDocId} 
        />
      </div>

      {/* RESULTADOS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Explorá {negocios.length} opciones
          </h2>
        </div>
        
        <BusinessGrid 
          negocios={negocios} 
          loading={false} 
        />
      </div>

      {/* FAQ SECTION — visible para usuarios y crawlers */}
      {faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-12 border-t border-white/5">
          <h2 className="text-2xl font-bold text-white mb-8">
            Preguntas frecuentes sobre {categoria.nombre} en San Rafael
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-slate-800/50 border border-white/10 rounded-xl p-5 cursor-pointer"
              >
                <summary className="text-white font-semibold list-none flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="text-primary text-xl flex-shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="text-slate-400 mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
