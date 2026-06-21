import { fetchFromStrapi } from "@/lib/strapi";
import { Negocio, Categoria } from "@/types/strapi";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

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
      const allCatRes = await fetchFromStrapi(
        "categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100",
        options
      );
      categorias = allCatRes.data || [];

      // 2. Obtener negocios de esta categoría (paginando hasta traer todos)
      let page = 1;
      let pageCount = 1;

      do {
        const populate =
          "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug" +
          "&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo" +
          "&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url" +
          "&populate[owner][fields][0]=id";
        
        const negRes = await fetchFromStrapi(
          `negocios?filters[categoria][slug][$eq]=${slug}&${populate}&sort=nombre:asc&pagination[page]=${page}&pagination[pageSize]=100`,
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

  // To pass the correct selectedCategoryDocId to FilterBar, we need to find it in the list
  const selectedCategoryDocId = categoria?.documentId || null;

  return (
    <main className="min-h-screen bg-background pb-20">
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
          
          {categoria?.descripcion && (
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {categoria.descripcion}
            </p>
          )}
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
    </main>
  );
}
