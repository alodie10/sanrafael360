# Components Map: San Rafael 360

Inventario de componentes de UI creados para evitar duplicidad de lógica.

## 🏙️ UI Components (Frontend)

- **Layout:**
  - `Navbar.tsx`: Barra de navegación fija con scroll logic, logo premium y enlaces dinámicos.
  - `HeroCarousel.tsx`: Carrusel de imágenes de fondo para la sección Hero.
- **Home:**
  - `BusinessGrid.tsx`: Contenedor principal para la galería de comercios. Implementa animaciones escalonadas (*staggered animations*).
  - `BusinessCard.tsx`: Ficha individual del negocio. Estética Airbnb, efectos de zoom, hover y badges premium.
  - `BusinessCardSkeleton.tsx`: Placeholder animado (pulse) para estados de carga de la galería.

## 🛠️ Utilidades y Types

- **Lib:**
  - `utils.ts`: Helper `cn` para concatenación de clases Tailwind dinámica.
  - `strapi.ts`: Librería de fetch para Strapi y helper de media URL.
- **Types:**
  - `strapi.ts`: Interfaces de TypeScript para `Negocio`, `Categoria`, `Media`, etc.

## 📦 Pendientes (Futuros Componentes)

- **Categorías:** Transformar el grid actual de categorías en componentes `CategoryCard` premium.
- **Filtros:** Barra de búsqueda avanzada y selector de categorías.
- **Detalle de Comercio:** Página individual para visualización completa del negocio.

---
*Ultima actualización: 2026-04-01*
