# Guía y Relevamiento San Rafael 360 - Transformación a Desarrollo a Medida

Entiendo perfectamente la frustración. El stack actual de WordPress con múltiples capas (Listeo, Elementor, WooCommerce, TranslatePress) genera un efecto "Frankenstein": el sitio se vuelve lento, difícil de mantener y cualquier personalización choca con las restricciones de los plugins o se rompe en actualizaciones futuras.

Para lograr una plataforma rápida, 100% controlable, estéticamente premium y versionada en GitHub, el paso lógico es abandonar los sistemas monolíticos empaquetados y transicionar hacia una **arquitectura moderna desacoplada (Headless)**.

A continuación, presento el documento de arquitectura y relevamiento como base para este nuevo desarrollo.

---

## 1. Relevamiento Funcional (Estado Actual y Necesidades)

Basado en nuestro trabajo previo sobre el directorio de San Rafael, estas son las entidades y funcionalidades "Core" que la plataforma realiza (y que debemos migrar y mejorar).

### Módulos y Funcionalidades Clave
1. **Directorio de Estructuras (Listings):**
   - Fichas completas de negocios: Hoteles, Cabañas, Gastronomía, Actividades, etc.
   - Datos integrados: Nombre, Dirección, Teléfono, WhatsApp, URL a redes (Instagram), Coordenadas GPS exactas.
   - Atributos dinámicos: Horarios de apertura, etiquetas (Ej: "Verificado").
2. **Gestión Multimedia e Imágenes:**
   - Logotipo del negocio.
   - Imagen de portada.
   - Galería de imágenes (actualmente automatizadas e iteradas para cargar en formato de grilla fotográfica).
3. **Exploración y Filtrado:**
   - Buscador por texto libre.
   - Filtrado y categorización en jerarquías (Categorías Principales y Subcategorías, ej. Alojamiento > Hoteles).
4. **Localización Espacial (Geolocalización):**
   - Renderizado de todos los negocios en un mapa interactivo global, y en mapas individuales por ficha de negocio.
5. **Manejo de Idiomas (i18n):**
   - Soporte multilingüe real y amigable (reemplazando al engorroso TranslatePress), donde las etiquetas (Horarios, Verificado, Búsqueda, etc.) puedan traducirse orgánicamente sin conflictos de UI.

---

## 2. Nueva Arquitectura Propuesta (Control 100% a Medida)

La arquitectura sugerida separa de forma rígida el **Frontend** (lo que ve el usuario) del **Backend** (dónde viven los datos). Ambos reposarán de manera limpia en tu repositorio de GitHub.

### 2.1. Frontend (Aplicación Cliente)
- **Framework Principal:** **Next.js** (basado en React). 
  - *¿Por qué?* Posee Renderizado del Lado del Servidor (SSR) lo cual es *vital* para el SEO (posicionamiento de los negocios en Google) pero brindando la velocidad vertiginosa de una SPA (Single Page Application).
- **Estilización (UI/Vistas):** **CSS de Vainilla + CSS Modules**. 
  - *¿Por qué?* Según tus indicaciones, no utilizaremos frameworks pesados como Elementor ni clases utilitarias agobiantes si no las solicitas. Crearemos un diseño premium y de alto impacto a través de CSS nativo.
- **Micro-interacciones y Animaciones:** CSS nativo suave y dinámico (efectos de 'glassmorphism', transiciones suaves de hover).
- **Mapas Interactivos:** Utilización directa por código de **Mapbox GL JS** o **Google Maps JavaScript API**. Sin envolturas de WordPress.

### 2.2. Backend y Base de Datos (Gestión de Información)
Al huir de la base de datos caótica de WordPress (`wp_posts`, `wp_postmeta`), diseñaremos una estructura relacional impecable y optimizada.

- **Base de Datos:** **PostgreSQL**. Fuerte, relacional y altamente estructurada para unir Negocios, Categorías y Multimedia.
- **Capa del Servidor / API:** **API Routes de Next.js** o **Node.js (Express)**. Construiremos nuestros propios "Endpoints" (ej. `/api/negocios/hoteles`) para servir *solo* los datos requeridos, minimizando el ancho de banda.
- **ORM (Mapeo de Datos):** **Prisma**. Te brinda código autocompletado para interactuar con tu base de datos y migraciones controladas en GitHub.
- **Gestión Multimedia:** Para el almacenamiento de fotos se sugiere un CDN en la nube (**Cloudinary** o un bucket **AWS S3**), para servir todas las imágenes con el mejor peso posible (WebP) y no saturar el servidor local.

### 2.3. Herramienta de Administración (CMS)
Como ya no tendremos el panel `/wp-admin` clásico de WordPress, propongo dos posibles caminos para que tú y tu equipo ingresen datos:

- **Opción A (Panel a Medida):** Desarrollamos un panel sencillo desde cero con Next.js que solo permita editar/crear listings, categorías y subir fotos. Control total, pero más tiempo de desarrollo.
- **Opción B (Headless CMS - Ej: Strapi / PayloadCMS):** Utilizamos una base de panel "libre" de código abierto que nos da un área de administración visual impecable, pero que solo funciona como "Base de Datos/API", de forma separada de cómo se muestra al usuario. Esto retiene el control absoluto del código visual, pero agiliza la entrada de datos.

---

## 3. Plan de Desarrollo y Etapas de Migración

1. **Fase 1: Configuración de Repositorios e Infraestructura Base.**
   - Creación y estructuración del proyecto en GitHub.
   - Modelado de las tablas en PostgreSQL.
2. **Fase 2: Motor de Backend y Base de datos.**
   - Desarrollo de la API de provisión de negocios y filtros.
   - Creación de un "Script Puente" que lea los excels o datos actuales de WordPress (`san_rafael_businesses.xlsx`) y los inyecte automáticamente en nuestra nueva base de datos limpia.
3. **Fase 3: Desarrollo Visual del Frontend (Next.js).**
   - Desarrollo del Sistema de Diseño (Variables CSS, Tipografías modernas).
   - Componentes principales (Tarjetas de negocios, Menú Superior, Grillas de Galerías, Modal de Mapas).
4. **Fase 4: Integración Multilingüe y Optimización.**
   - Inyección de librerías nativas de i18n para Next.js.
   - Pulido de rendimiento (con la meta de > 95 pts. en mediciones de calidad).

---

## Open Questions (Preguntas para orientar el diseño)

> [!IMPORTANT]
> **Decisiones Arquitectónicas Clave (Aprobadas y Definidas):**

1. **Administración de Datos:** **Opción B (Headless CMS - Ej: Strapi).** Utilizaremos un Headless CMS para tener un panel de administración robusto, visual e impecable para la carga de datos, mientras que el Frontend Next.js consumirá la API de Strapi para mantener un control del 100% sobre lo visual.
2. **Autogestión de Clientes:** **Sí, con funcionalidad "Toggle" (Encendido/Apagado).** Crearemos la arquitectura de base de datos y la capacidad para que los dueños reclamen su perfil, pero la implementaremos con un interruptor para que de entrada permanezca apagada hasta que consideres oportuno activarla.
3. **Plazos / Migración:** **Hosting Paralelo (Mismo Servidor).** Desarrollaremos y probaremos todo en un subdominio o directorio dentro de tu mismo hosting (ej. `v2.sanrafael360.com`). *Nota: Aseguraremos que tu plan de hosting actual soporte la ejecución de aplicaciones Node.js (Next.js y Strapi requerirán este entorno, a diferencia de PHP).*
4. **Script de Migración:** Utilizaremos el archivo `importar_listeo_geocodificado.csv` (que ya contiene datos y coordenadas corregidas) como la fuente de la verdad para inyectar la información en la nueva base de datos.


## Verification Plan

### Evaluación de Avance y Tests Visuales
- Una vez construido el prototipo, realizaremos despliegues atómicos utilizando Vercel/Render.
- Podrás ver una URL donde evaluaremos juntos si el diseño excede lo visual y respeta las microanimaciones en vivo antes de conectar la base de datos real.
- Analizaremos métricas de Lighthouse y PageSpeed midiendo explícitamente cuánto mejora vs Elementor.
