# Project Context: San Rafael 360 (Monorepo)

Este archivo proporciona el contexto crítico para que cualquier agente de IA (Gemini, Antigravity, etc.) pueda operar en este proyecto sin causar regresiones, especialmente en lo relativo a la comunicación entre Strapi y Next.js.

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
- **Directiva Node.js Path (CRÍTICO)**: El agente debe asegurar que Node, npm y npx estén en el PATH. 
  - **En Windows**: Se encuentran en `C:\Users\dialonso\node.js\`. Mapear `$env:PATH = 'C:\Users\dialonso\node.js;' + $env:PATH;`.
  - **En Mac (actual)**: Se encuentran en `/Users/diego/.nvm/versions/node/v20.20.2/bin`. Mapear `export PATH="/Users/diego/.nvm/versions/node/v20.20.2/bin:$PATH"`.
  - Si los comandos directos fallan, el agente debe buscar los binarios en rutas comunes y actualizar su contexto de ejecución.
- **Zero-Trust Verification (CRÍTICO)**: Railway utiliza Zero Downtime Deployments. **NUNCA** asumas que un push se aplicó solo porque la API `/api/categorias` responde (eso medirá el despliegue viejo). Antes de declarar un éxito al usuario, el agente DEBE confirmar que el despliegue finalizó de construir (vía Railway web o CLI si el servicio está enlazado correctamente) Y debe advertir claramente qué partes puede probar automatizadamente y cuáles requieren que el usuario inicie sesión (ej: Content Manager).

---

## 🧪 Testing — Verificación Progresiva (OBLIGATORIO)

El agente NUNCA lanza Playwright headed para verificar un cambio. Sigue la pirámide:

| Nivel | Herramienta | Cuándo | Tiempo |
|-------|-------------|--------|--------|
| 1 | Jest unit | Cambio en service/util | < 5 seg |
| 2 | Supertest | Cambio en endpoint | < 30 seg |
| 3 | Playwright headless | Flujo E2E completo | < 3 min |
| 4 | Playwright headed | Solo revisión final / demo | 5-15 min |

**Regla:** Usar siempre el nivel más bajo suficiente para el tipo de cambio.

### Playwright — Configuración Obligatoria
- `headless: true` siempre (salvo pedido explícito del usuario)
- `video: 'off'` y `trace: 'off'` en desarrollo
- Solo Chromium en desarrollo (no correr los 3 browsers)
- `actionTimeout: 5000` — si una acción tarda más de 5s, hay un problema
- Prohibido: `page.waitForTimeout(X)` — usar `waitForSelector` o `waitForResponse`

### Flujo de verificación por tipo de cambio:
- **Lógica de negocio** → `npm run test:unit` únicamente
- **Endpoint nuevo/modificado** → `npm run test:fast` (unit + integration)
- **Feature de UI completa** → `npm run test:all` (unit + integration + e2e headless)
- **Release / revisión humana** → `npm run test:e2e:headed` (solo cuando el usuario lo pide)
