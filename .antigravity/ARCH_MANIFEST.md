# Architecture Manifest: San Rafael 360

Este documento contiene los blueprints de la arquitectura actual del proyecto para asegurar la continuidad del contexto entre sesiones del agente.

## 🏗️ Estructura del Sistema

- **Frontend:** Next.js 16.2.1 (App Router)
  - **Hosting:** Vercel
  - **Estilo:** Tailwind CSS + Framer Motion (Premium UI)
  - **Comunicación:** REST API (client-side fetch con revalidación)

- **Backend:** Strapi v5.40.0 (Headless CMS)
  - **Hosting:** Railway (Producción)
  - **Base de Datos:** PostgreSQL (Railway) / SQLite (Local)
  - **Media:** Proveedor local (`/public/uploads`)

- **Media URL:** Procesada a través del helper `getStrapiMedia` para alternar entre local y producción.

## 🖼️ Estado de Media (Deuda Técnica)

Actualmente, el proyecto **no cuenta con assets reales** de producción:
- **Sin Logos:** Los comercios no tienen logos cargados en el backend.
- **Sin Galería:** Falta el set de fotos interactivo de cada negocio.
- **Sin Carátulas:** Las categorías no tienen imágenes de portada definidas.
- **Solución Temporal:** Se utilizan placeholders dinámicos y gradientes premium de Tailwind para mantener la estética "Pro Vibe".

## 📂 Organización de Archivos

- `./frontend/src/app`: Rutas y Layouts.
- `./frontend/src/components`: Componentes atómicos y de sección (Home, Layout).
- `./frontend/src/types`: Interfaces de TypeScript para modelos de Strapi.
- `./backend/src/api`: Definiciones de Content-Types y controladores de Strapi.

## 🛠 Sección: Protocolos de Salud del Sistema (Anti-Corruption)

Para evitar archivos en 0,0 y pérdidas de contexto al cambiar de máquina, el Agente debe seguir estas Reglas de Oro:

### Validación de Escritura Atómica:
- **Prohibido:** Enviar bloques de código que terminen en `// ... resto del código`.
- **Obligatorio:** Si un archivo es muy largo, el Agente debe proponer editarlo por secciones funcionales (ej: primero los Imports, luego el Componente, luego los Estilos) para no saturar el buffer y evitar el corte a mitad de camino.
- **Check de Cierre:** Al terminar de escribir, el Agente debe declarar: "Escritura finalizada: [Nombre del Archivo] - [Nro] líneas. Verificado contra truncamiento."

### Sincronización de Entorno (Vibe-Sync):
- Antes de cualquier cambio en `.env.example` o `docker-compose.yml`, el Agente debe verificar que las variables sean agnósticas (sin rutas `C:\` o `/Users/`).
- Si se detecta un cambio en la infraestructura (ej: se agrega una API Key nueva), el Agente debe solicitar inmediatamente actualizar el `SESSION_RESTORE.md` para que la otra PC se entere del cambio al hacer el pull.

### Recuperación de Errores (Self-Healing):
- Si una operación de escritura falla o se corta (archivo en 0 bytes), el Agente tiene prohibido seguir con el siguiente Micro-paso.
- **Acción:** Debe informar el fallo, proponer borrar el archivo corrupto y reintentar la escritura completa en el siguiente turno.

### Regla de Entorno: Sin Ejecución Local (CRÍTICO)
- **El usuario NO corre ningún servidor local.** El agente tiene **prohibido** proponer comandos como `npm run dev`, `npm start`, `npx playwright test` contra localhost, o cualquier comando que presuponga un servidor local en ejecución.
- **Toda verificación se realiza contra producción:** Frontend en `https://sanrafael360.vercel.app`, Backend en Railway.
- **Para tests E2E de Playwright**, siempre usar `PLAYWRIGHT_TEST_BASE_URL=https://sanrafael360.vercel.app` y confirmar que el `webServer` de la config no esté activo.
- **Para validación visual**, usar el `browser_subagent` apuntando a la URL de producción directamente.

---
*Ultima actualización: 2026-04-05*
