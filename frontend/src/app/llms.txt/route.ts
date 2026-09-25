import { getCategorias } from "@/lib/categorias";
import { categoriaHref, isPlaceholderCategoriaSlug } from "@/lib/categoria-slug";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = getSiteUrl();
  const categorias = await getCategorias();
  const categoryLines = categorias
    .filter((categoria) => categoria.slug && categoria.nombre && !isPlaceholderCategoriaSlug(categoria.slug))
    .map((categoria) => `- [${categoria.nombre} en San Rafael](${site}${categoriaHref(categoria.slug)}): listado de ${categoria.nombre} en San Rafael, Mendoza.`);

  const body = `# San Rafael 360

> Directorio local de negocios, restaurantes, hoteles, bodegas y atracciones de San Rafael, Mendoza, Argentina.

San Rafael 360 publica fichas con nombre, rubro, dirección, teléfono, horarios y ubicación cuando el comercio los cargó. La URL canónica de cada ficha es ${site}/negocios/{slug}. El listado completo de URLs indexables está en ${site}/sitemap.xml.

## Páginas
- [Inicio](${site}/): directorio de San Rafael.
- [Ofertas](${site}/ofertas): promociones vigentes.
- [Contacto](${site}/contacto): contacto de San Rafael 360.

## Categorías
${categoryLines.join("\n")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
