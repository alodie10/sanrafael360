# DISCOVERY ENGINE: Arquitectura del Scraper

El **Discovery Engine** es un servicio encargado de buscar de forma autónoma la presencia digital de los comercios para poblar la plataforma San Rafael 360 con links funcionales.

## Stack Técnico
- **Framework**: Playwright (Headless Browser)
- **Lenguaje**: TypeScript
- **Target**: Google Maps / Google Places

## Flujo de Trabajo
1.  **Entrada**: Nombre del negocio (ej: `La Delicia Boulevard`).
2.  **Búsqueda**: Ejecución de búsqueda `[Nombre] San Rafael Mendoza` en Google Maps.
3.  **Extracción de Metadata**:
    *   `website`: Identificación del link oficial del comercio.
    *   `reserva_url`: Detección de botones de "Cita" o "Reserva" del comercio.
    *   `google_maps_url`: URL persistente del perfil de Maps.
4.  **Validación**: Confirmación de accesibilidad de los links encontrados.
5.  **Persistencia**: Actualización en Strapi de los campos `reserva_url` y `website`.

## Selectores Resilientes (AI-Optimized)
Para evitar que cambios menores en el HTML de Google rompan el scraper, se utilizan:
- **Aria-Labels**: Búsqueda por etiquetas semánticas (`aria-label*="Sitio web"`, `aria-label*="Reserva"`).
- **Data Attributes**: Uso de `data-item-id="authority"` para el link web oficial.
- **Roles ARIA**: Uso de roles de navegación para encontrar botones de acción principales.

## Throttling y Control
- **Delay**: Retrasos aleatorios de 3s a 7s entre búsquedas para evitar bloqueos por IP.
- **Tasa de Éxito**: Monitoreo dinámico del porcentaje de éxito de la operación. Una tasa inferior al 70% dispara una alerta crítica.
