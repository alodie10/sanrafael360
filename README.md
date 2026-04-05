# San Rafael 360 - Plataforma Premium de Directorio

Este repositorio contiene la arquitectura completa de **San Rafael 360**, un ecosistema compuesto por un frontend en **Next.js** y un backend headless en **Strapi 5**. El proyecto está optimizado para despliegues modernos en **Vercel** y **Railway**.

---

## 🏔️ Soberanía del Proyecto
Toda la inteligencia de negocio, protocolos de decisión y arquitecturas están documentados en la carpeta [`/docs`](./docs):
- [Master Plan: Discovery & UX](./docs/master_plan.md)
- [Protocolo de Autonomía y DoD](./docs/protocolo_autonomia.md)
- [Arquitectura del Discovery engine](./docs/discovery_engine_arch.md)

---

## 🛠️ Tecnologías Principales
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Strapi 5 (Headless CMS), PostgreSQL (Railway).
- **Automation**: Playwright (E2E Testing & Discovery Scraper).
- **Media**: Cloudinary (Asset Persistence).

---

## 🧪 Testing y Calidad (Zero Regression)
Para asegurar que el sitio funcione perfectamente en condiciones de red móvil (4G), utilizamos **Playwright**.

### Ejecutar Tests Localmente
1. Instalar dependencias: `npm install`
2. Ejecutar suite de navegación: `npx playwright test`
3. Ejecutar test de descubrimiento (scraper): `npx playwright test backend/tests/discovery.spec.ts`

*Nota: Los tests están configurados para validar navegación, instanciación de mapas y visualización de portlets en dispositivos móviles.*

---

## 🚀 Despliegue desde Cero

### 1. Backend (Railway)
1. Crea un nuevo proyecto en Railway y conecta este repositorio.
2. Configura las variables de entorno (ver `.env.example`).
3. Railway detectará el `Dockerfile` o el `package.json` en `/backend` y realizará el despliegue automático.
4. Ejecuta `npm run build` para compilar los tipos de Strapi.

### 2. Frontend (Vercel)
1. Importa el repositorio en Vercel.
2. Selecciona el directorio raíz o `/frontend` como base.
3. Agrega las variables de entorno:
   - `NEXT_PUBLIC_STRAPI_API_URL`: URL de tu backend en Railway.
   - `STRAPI_API_TOKEN`: Token de API generado en el panel de Strapi.

---

## 🔐 Configuración de Entorno
Consulta el archivo [`.env.example`](./.env.example) en la raíz para conocer todas las llaves necesarias para levantar el proyecto en 5 minutos.

---

## ✉️ Contacto y Soporte
Desarrollado con el estándar de **Alta Autonomía** por el equipo de Antigravity.
Finalizado bajo el protocolo de **Cero Regresiones**.
