# Project Context: San Rafael 360 (Monorepo)

Este archivo proporciona el contexto crítico para que cualquier agente de IA (Claude, Antigravity, etc.) pueda operar en este proyecto sin causar regresiones, especialmente en lo relativo a la comunicación entre Strapi y Next.js.

## 🏗️ Architecture Summary
- **Frontend**: Next.js (App Router) en Vercel.
- **Backend**: Strapi v5 (TypeScript) en Railway.
- **Database**: PostgreSQL (Railway).

## 🛠️ Build & Dev Commands
- **Root Build**: `npm run build:all` (para Railway/Vercel).
- **Backend Dev**: `cd backend && npm run dev`
- **Frontend Dev**: `cd frontend && npm run dev`
- **Setup Config**: `pwsh setup.ps1` (copia .env.example a .env local).

## 🛡️ Critical Security Rules (Anti-CORB/CORS)
- **ORB Protection**: `backend/config/middlewares.ts` DEBE tener `crossOriginResourcePolicy: 'cross-origin'` para permitir que Vercel sirva imágenes de Railway.
- **CSP Alignment**: Las directivas `connect-src`, `img-src` y `media-src` deben incluir siempre `*.vercel.app` y los dominios de Railway correspondientes.
- **URL Hardcoding**: `backend/config/server.ts` utiliza una URL fija para producción. Cualquier cambio de dominio debe actualizarse allí primero.

## 📋 Content Modeling (Strapi v5)
- **Document Service API**: Usa siempre el nuevo Document Service API de Strapi 5, evitando el antiguo Query Engine cuando sea posible.
- **Hero Home**: Es un `singleType`. Si devuelve 404, verifica en el Admin Panel que los permisos de `Public` tengan activado `find`.

## 🤖 Agent Autonomy & CLI Logs (Critical)
- **Mandatory Server Logs Access**: Un agente de IA **NUNCA** debe adivinar el motivo de un "Crash" o "502 Bad Gateway" (Especialmente en Railway).
- **Directiva de Login**: Si el agente no tiene acceso a los logs de Railway, su primer paso OBLIGATORIO debe ser ejecutar comando `railway login` en consola asíncrona para desencadenar el login en el navegador del usuario y obtener visión nativa mediante `railway logs`. No depender de tokens si estos fallan.
- **Troubleshooting First**: Siempre visualizar el build log o el deploy log antes de sugerir cambios en código para errores de infraestructura.

---
*Referencia de Identidad: Actúa como una Escuadra de Ingeniería Senior con foco en UX Premium.*
