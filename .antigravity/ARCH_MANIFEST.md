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

## 🔗 Conectividad

- **API URL:** Definida por `NEXT_PUBLIC_STRAPI_URL`.
- **Media URL:** Procesada a través del helper `getStrapiMedia` para alternar entre local y producción.

## 📂 Organización de Archivos

- `./frontend/src/app`: Rutas y Layouts.
- `./frontend/src/components`: Componentes atómicos y de sección (Home, Layout).
- `./frontend/src/types`: Interfaces de TypeScript para modelos de Strapi.
- `./backend/src/api`: Definiciones de Content-Types y controladores de Strapi.

---
*Ultima actualización: 2026-04-01*
