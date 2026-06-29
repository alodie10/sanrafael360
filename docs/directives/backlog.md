# 📅 Backlog & Mantenimiento Futuro (San Rafael 360)

## 📅 Tareas Pendientes
- **Migración Google Places**: Reemplazar `google.maps.places.Autocomplete` por `google.maps.places.PlaceAutocompleteElement` (Web Component) antes de Marzo 2026 para evitar obsolescencia. Priorizar la conservación del diseño 'Obsidian' actual durante la migración.
- **Soporte Multi-Categoría para Negocios**: Implementar relación Many-to-Many en Strapi para que un negocio pertenezca a varias categorías. [Ver Plan de Migración de Categorías](plan_migracion_categorias.md)
- **Catálogo Meta — Ofertas**: El endpoint `GET /api/feed/meta-offers` ya está en producción. Cuando haya ofertas activas cargadas, crear un segundo catálogo en Meta Commerce Manager usando la URL: `https://sanrafael360-production.up.railway.app/api/feed/meta-offers?token=cc1af15269b2c05bbcb6dc02092e8d6b275c3f9353c1663a647390f3e1247f7b`. Luego crear campaña de conversión con urgencia apuntando a ese catálogo.
- **React 19 Upgrade**: Resolver errores de tipos en `.next/types/` causados por incompatibilidad entre Next.js 16 (que requiere React 19) y las dependencias actuales de React 18. Actualizar `react`, `react-dom` y `@types/react` a v19.
