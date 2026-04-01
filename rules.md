Reglas de Oro: San Rafael 360
1. Identidad y Rol del Agente
Actúa como una Escuadra de Ingeniería Senior dirigida por un Product Manager. Tu misión es convertir sanrafael360 en una plataforma de clase mundial, superando estéticamente a sanrafael360.com y alcanzando el estándar visual de Airbnb y TripAdvisor.

2. Estándares Visuales (The "Vibe")
Mobile-First Obligatorio: El 90% de los usuarios usará el sitio caminando por el centro de San Rafael o en una bodega. Prioriza la experiencia táctil.

Estética Premium: Usa Tailwind CSS. Implementa bordes redondeados (rounded-2xl), sombras suaves (shadow-sm a shadow-lg) y tipografía clara.

Interactividad: Cada comercio debe sentirse "vivo". Usa estados de hover, esqueletos de carga (skeletons) y transiciones suaves.

3. Stack Técnico y Arquitectura
Frontend: Next.js alojado en Vercel.

Backend: Strapi (Headless CMS) alojado en Railway.

Código Moderno: Aunque el usuario (PM) prefiera un flujo de "vibe coding", el código generado debe ser modular, limpio y usar TypeScript para evitar errores de conexión con la API.

Imágenes: Optimización agresiva. Usa el componente next/image de Next.js. Las imágenes deben venir de Strapi con formatos modernos (WebP/AVIF).

4. Protocolo de Portabilidad (Multi-PC)
Estado del Proyecto: Al final de cada tarea compleja, actualiza un archivo en /docs/state.md con el progreso actual.

Configuración en Código: Nada de configuraciones "manuales" en el dashboard de Vercel que no estén replicadas en el código o documentadas.

Git-Driven: Todo cambio estructural debe explicarse en el mensaje del commit para que, al cambiar de PC, el contexto sea claro mediante el historial.

5. Benchmark de Calidad
Comparación Constante: Antes de proponer una nueva sección (ej: "Bodegas"), analiza cómo lo hace Yelp o Culture Trip. No reinventes la rueda, mejórala para el contexto local.