# 🚀 Bienvenido al Proyecto San Rafael 360

¡Hola! Si estás leyendo esto, es porque te estás uniendo al desarrollo junto a Diego. Aquí tienes un resumen del estado actual del proyecto para que tú y tu propia instancia de **Antigravity** (o cualquier otra IA) puedan arrancar con todo el contexto necesario.

## 📌 ¿Qué es San Rafael 360?
Es un portal web (directorio comercial) y pasarela de pagos diseñado para negocios locales. Permite a los usuarios descubrir comercios, y a los dueños reclamar/administrar sus perfiles, gestionar suscripciones y sincronizar información directamente con Google Maps.

## 🏗️ Stack Tecnológico
- **Frontend:** React / Next.js (carpeta `frontend/`) enfocado en diseño "Mobile-First".
- **Backend:** Strapi (Headless CMS) (carpeta `backend/`) con base de datos PostgreSQL/SQLite.
- **Integraciones Clave:** API de Google Maps (Extracción de metadatos vía CID, horarios, OAuth) y automatización de pagos.

## ✅ Hitos Recientes Completados
1. **Onboarding de Negocios:** Flujo automatizado de registro, herramienta de "Descubrimiento" (importación de negocios vía URL) y envío de correos de bienvenida automáticos.
2. **Sincronización Avanzada con Google:** Solución a problemas de horarios (`BusinessHours`) y corrección de bloqueos de autenticación OAuth (errores 403).
3. **Pasarela de Pagos Dinámica:** Automatización de planes de suscripción configurables directamente desde el panel de administrador de Strapi.
4. **Exportación CRM:** Generación de archivos Excel para exportar la base de datos de comercios hacia sistemas CRM externos.
5. **Estabilización e Infraestructura:** Separación de tests (unitarios vs integración), resolución de errores 500 en la API tras hacer rollbacks de fases, y optimización de componentes de la UI como `BusinessHero`, `BusinessSidebar` y `WebsitePortlet`.

## 🤖 Contexto para la Inteligencia Artificial (Antigravity)
Dado que el repositorio tiene la carpeta `.antigravity/` (donde se guardan ciertos Knowledge Items) y archivos de directivas, tu asistente de IA será muy inteligente desde el día 1. 

**Tips para interactuar con la IA en este proyecto:**
- **Conocimiento centralizado:** Ya existen archivos como `rules.md`, `STANDARDS.md`, `CLAUDE.md`, y `.cursorrules`. Estos le dan a la IA el conocimiento sobre cómo estructurar el código en este proyecto.
- **Pide contexto de errores pasados:** Si te encuentras con problemas en la sincronización de Pettra o errores de React en la renderización, la IA puede buscar en el historial o inferirlo rápidamente porque son áreas recién estabilizadas.
- **Revisión de arquitectura:** Si necesitas modificar el flujo de autenticación o los modelos de datos de Strapi, pídele a la IA que revise cómo están estructurados actualmente en `backend/src/api/` antes de que haga cambios.

¡Mucho éxito con el desarrollo! Pueden consultar este archivo en cualquier momento para recordar de dónde vienen.
