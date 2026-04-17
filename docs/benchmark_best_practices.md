# Benchmarking de Directorios de Ciudades y Clasificados
## Reporte de Mejores Prácticas para San Rafael 360

Este documento resume las mejores prácticas, características innovadoras y estrategias de diseño extraídas de los principales portales de ciudades y clasificados a nivel mundial (Yelp, Time Out, Patch, NYC.com, Visit London, Gumtree). El objetivo es potenciar la **arquitectura moderna y robusta (Node.js/Next.js/Strapi)** que ya tiene **San Rafael 360**.

---

## 1. Experiencia de Búsqueda y Descubrimiento

### El Modelo de "Búsqueda Híbrida"
Los sitios líderes no dependen solo de una barra de búsqueda. Combinan:
*   **Búsqueda de Intención Alta:** El clásico "¿Qué buscas?" y "¿Dónde?" (ej. Yelp).
*   **Descubrimiento Pasivo:** Barras de categorías visuales (iconos), colecciones curadas ("Lo mejor de la semana") y carruseles de trending topics (ej. Time Out).
*   **Localización Instantánea:** Pedir el código postal o zona al inicio para filtrar automáticamente noticias, eventos y clasificados relevantes al micro-barrio (ej. Patch.com).

> [!TIP]
> **Propuesta para SR360:** Implementar un selector de "Zonas de San Rafael" (Centro, Valle Grande, Los Reyunos, Rama Caída) que persista en la sesión del usuario para mostrar contenido hiper-local.

---

## 2. Integración de Directorio y Clasificados

La clave es que no se sientan como secciones separadas, sino como un ecosistema unificado:

*   **Jerarquía de Navegación:** Los clasificados deben estar al mismo nivel que el directorio de negocios en el menú principal.
*   **Diferenciación Visual:**
    *   **Perfiles de Negocios:** Ricos en media, datos editoriales, menús, botones de reserva y "Verificado".
    *   **Clasificados de Comunidad:** Formatos más ligeros, centrados en el usuario (C2C o B2C pequeño), con etiquetas de "Oferta", "Servicio" o "Empleo".
*   **Entrecruzamiento de Contenido:** En la página de un barrio (ej. Valle Grande), mostrar las cabañas (directorio) y debajo los clasificados de esa zona (ej. "Venta de leña" o "Excursiones privadas").

---

## 3. Ficha de Negocio "Premium" (Single Listing)

Para lograr una experiencia de usuario de alto nivel:

*   **Deep Links de Acción (CTAs):** No solo mostrar el teléfono. Botones directos a "Reservar por WhatsApp", "Ver Menú", "Cómo llegar (Google Maps/Waze)" y "Comprar Tickets".
*   **Social Proof Contextual:** "Visto por 50 personas hoy" o etiquetas como "Favorito de los locales".
*   **Galerías Dinámicas:** Grillas de fotos que se expanden (Lightbox) sin recargar la página y soporte para videos cortos (estilo Reels).
*   **Sección de Atributos:** Iconos claros para servicios (WiFi, Pet Friendly, Estacionamiento, Medios de Pago).

---

## 4. Clasificados: Motor de Participación

Inspirado en Patch.com y Gumtree, proponemos estas categorías para San Rafael:

1.  **Mercado Local:** Compra/venta de artículos entre vecinos.
2.  **Servicios Profesionales:** Gasistas, electricistas, profesores, guías de turismo.
3.  **Bolsa de Trabajo:** Ofertas laborales específicas de San Rafael.
4.  **Avisos Comunitarios:** Mascotas perdidas, eventos de barrio, avisos municipales.

> [!IMPORTANT]
> **Monetización:** Implementar un sistema de "Promoción de Aviso" (Boost) sencillo donde el usuario pueda destacar su aviso por un período de tiempo.

---

## 5. Estética y Diseño (Look & Feel) Premium con Next.js

Aprovechando la flexibilidad total que nos da Next.js:

*   **Tipografía Moderna:** Uso de fuentes como *Inter*, *Outfit* o *Roboto* con jerarquías claras (grandes encabezados, mucho espacio en blanco).
*   **Glassmorphism y Sombras Suaves:** Tarjetas con bordes redondeados, fondos semi-transparentes sobre fotos atractivas.
*   **Dark Mode Nativo:** Una versión oscura bien pulida, ideal para la sección de "Vida nocturna" y "Gastronomía".
*   **Micro-interacciones:** Hovers sutiles en las tarjetas, transiciones suaves al cambiar de categoría y esqueletos de carga (Skeleton Screens) para una sensación de velocidad instantánea.

---

## 6. Checklist de Funcionalidades Propuestas

- [ ] **Modo Mapa Interactivo:** Una vista de mapa que se actualiza en tiempo real al moverlo (estilo Airbnb).
- [ ] **Sistema de Reseñas Multimedia:** Permitir que los usuarios suban fotos con su reseña.
- [ ] **Calendario de Eventos Centralizado:** Sincronizado con el directorio (ej. qué banda toca en qué bar).
- [ ] **Panel de Usuario (Dashboard):** Espacio donde el vecino o dueño de negocio gestiona sus avisos y favoritos.
- [ ] **SEO Local Optimizado:** Esquemas de datos (JSON-LD) para que Google muestre las cabañas y eventos directamente en los resultados de búsqueda.

---
*Este documento es una base para la actualización del Plan de Desarrollo General.*
