# Backlog de Mejoras — San Rafael 360

> Auditoría técnica realizada el 2 de julio de 2026.  
> Objetivo: priorizar mejoras antes de tocar producción con clientes activos.  
> Convención: **P0** = urgente/seguridad · **P1** = alto impacto · **P2** = deuda técnica · **P3** = nice-to-have

---

## Resumen ejecutivo

El proyecto tiene bases sólidas (Strapi 5 + Next.js, flujo `develop → master` con `promote.sh`, capa de errores tipados en backend, patrón server-fetch en fichas de negocio). Sin embargo, la arquitectura en capas de `STANDARDS.md` solo está aplicada de forma parcial (principalmente en el módulo `negocio`), hay **brechas de seguridad reales** en rutas de pago y admin, los tests E2E están desalineados con la UI actual, y el CI **no bloquea merges** aunque fallen los tests.

**Recomendación de secuencia:** Seguridad (P0) → CI/promote gates (P0/P1) → Arquitectura backend (P1) → Frontend performance/SSR (P1) → Deuda técnica (P2/P3).

---

## P0 — Crítico (hacer antes del próximo promote)

### Seguridad y secretos

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| SEC-01 | Backend | Credenciales reales como fallback en config (`CLOUDINARY_*`, `JWT_SECRET`, etc.) | `backend/config/plugins.ts`, `admin.ts`, `server.ts` | Eliminar todos los fallbacks; fail-fast si falta env. **Rotar credenciales expuestas.** | S |
| SEC-02 | Backend | `POST /pagos/simulate-success` público activa premium sin guard de producción | `backend/src/api/pago/` | Deshabilitar en prod o exigir admin + flag `modo_prueba` | S |
| SEC-03 | Backend | Webhook Mercado Pago sin verificación de firma ni idempotencia | `backend/src/api/pago/` | Validar HMAC/signature MP; deduplicar por `paymentId` | M |
| SEC-04 | Backend | Rutas admin de pagos/vigencia sin check de rol admin | `backend/src/api/negocio/routes/portal-actions.ts`, `controllers/negocio.ts` | Middleware `requireAdmin` compartido en todas las rutas admin | M |
| SEC-05 | Backend | `POST /negocios/register-cloudinary` público escribe en DB | `backend/src/api/negocio/routes/media-restorer.ts` | Exigir auth owner/admin o token firmado | M |
| SEC-06 | Backend | `POST /negocios/:id/stats` anónimo permite inflar métricas | `backend/src/api/negocio/routes/custom-negocio.ts` | Rate-limit + validación; mover lógica a service | S |
| SEC-07 | Tests | Credenciales de producción hardcodeadas en specs y scripts | `frontend/tests/global-setup.ts`, `backend/scripts/` | Rotar passwords; usar GitHub Secrets; limpiar del repo | S |
| SEC-08 | Frontend | `NEXTAUTH_SECRET` con fallback hardcodeado | `frontend/src/lib/auth.ts` | Throw al iniciar si falta secret fuera de test | S |
| SEC-09 | Frontend | `STRAPI_API_TOKEN` referenciado en componente client | `frontend/src/components/portal/PortalStats.tsx` | Proxy via Route Handler `/api/portal/stats` | M |

### CI / Despliegue

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| CI-01 | CI | `continue-on-error: true` en Playwright — CI nunca falla | `.github/workflows/playwright.yml` | Eliminar `continue-on-error`; arreglar specs rotos | M |
| CI-02 | Deploy | `promote.sh` no ejecuta tests ni build antes de push a `master` | `promote.sh` | Gate: `npm run test:fast && npm run build:all` + confirmación | S |
| CI-03 | CI | Push a `master` (prod) sin workflow de verificación | `.github/workflows/` | Añadir job smoke en push a `master` | M |

---

## P1 — Alto impacto

### Arquitectura backend (STANDARDS.md §1)

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| BE-01 | Backend | Fat controllers con consultas directas a DB en 6+ módulos | `lead.ts`, `review.ts`, `feed.ts`, `negocio.ts`, `actividad.ts` | Extraer repositories por dominio; controllers solo orquestan | L |
| BE-02 | Backend | `asyncHandler` solo en módulo `negocio` | Todos los custom controllers | Envolver handlers custom; eliminar try/catch manuales | M |
| BE-03 | Backend | Solo existe 1 repository (`negocio`) | `backend/src/api/` | Crear repos para `pago`, `lead`, `user`, `review`, `daily-stat` | L |
| BE-04 | Backend | Validación middleware en 2 de ~20 rutas custom | `routes/*.ts` | Validators para pago, lead, discovery, admin ops | M |
| BE-05 | Backend | `lead.convert` crea usuarios/asigna ownership sin guard admin claro | `backend/src/api/lead/` | Admin-only + `LeadService.convertLead()` | M |
| BE-06 | Backend | Emails admin hardcodeados en código fuente | `backend/src/utils/constants.ts`, `frontend/src/lib/auth.ts` | Mover a `ADMIN_EMAILS` env var (backend ya lo soporta parcialmente) | S |
| BE-07 | Backend | APIs Strapi mezcladas (`documents`, `db.query`, `entityService`) | Varios controllers/services | Estandarizar en Document Service API vía repositories | L |
| BE-08 | Backend | `index.ts` bootstrap ~330 líneas con migraciones en cada startup | `backend/src/index.ts` | Mover migraciones a scripts one-shot; bootstrap mínimo | M |
| BE-09 | Backend | Algolia sincroniza 2–3 veces por publish (lifecycle + middleware + manual) | `lifecycles.ts`, `index.ts`, `negocio.ts` | Un solo path event-driven | M |
| BE-10 | Backend | Funciones >50 líneas (`updatePortal`, `getPortalStats`, `lead.convert`) | Services/controllers | Refactor en sub-servicios | M |

### Frontend (STANDARDS.md §1.2)

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| FE-01 | Frontend | Home page entera es `"use client"` (~470 líneas); fetch inicial en `useEffect` | `frontend/src/app/page.tsx` | Server Component + client leaves (filtros, grid) | L |
| FE-02 | Frontend | `fetchFromStrapi` fuerza `cache: 'no-store'` anulando `revalidate` | `frontend/src/lib/strapi.ts` | Respetar opciones del caller; default solo si no se especifica | S |
| FE-03 | Frontend | URL de Strapi duplicada inline en 30+ archivos | Todo `frontend/src/` | Centralizar en `getStrapiUrl()` desde `lib/strapi.ts` | M |
| FE-04 | Frontend | Sin `error.tsx`, `loading.tsx`, `not-found.tsx` en App Router | `frontend/src/app/` | Añadir boundaries globales y por segmento (`/portal`, `/negocios`) | M |
| FE-05 | Frontend | `ignoreBuildErrors: true` en Next config | `frontend/next.config.ts` | Habilitar typecheck en build; corregir errores incrementalmente | L |
| FE-06 | Frontend | 50+ usos de `as any`; tipos NextAuth incompletos | `types/next-auth.d.ts`, portal, auth | Completar augmentation; tipar respuestas Strapi con genéricos | L |
| FE-07 | Frontend | Portal: server fetch + re-fetch en client (waterfall) | `portal/page.tsx`, `PortalStats.tsx`, `ActivityLogView.tsx` | Fetch inicial en server page; client solo para mutaciones | M |
| FE-08 | Frontend | Navbar client pesado re-fetch categorías en cada ruta | `Navbar.tsx`, `layout.tsx` | Fetch categorías una vez en layout server | M |
| FE-09 | Frontend | URL del sitio hardcodeada (`sanrafael360.com`) | `layout.tsx`, `sitemap.ts`, `robots.ts`, schema | Usar `NEXTAUTH_URL` o `NEXT_PUBLIC_SITE_URL` | S |
| FE-10 | Frontend | Google OAuth pasa `access_token` en query string | `frontend/src/lib/auth.ts` | Exchange server-side via POST/route handler | M |
| FE-11 | Frontend | Login tiene flujo credentials muerto (solo Google configurado) | `frontend/src/app/(auth)/login/page.tsx` | Eliminar UI muerta o añadir CredentialsProvider | S |
| FE-12 | Frontend | API layer fragmentada (raw fetch vs `fetchFromStrapi`) | 20+ componentes portal/admin | Crear `lib/api/` con métodos tipados | L |

### Tests y calidad

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| QA-01 | Tests | Specs desalineados con UI actual (textos, selectores, redirects) | `frontend/tests/*.spec.ts`, `test_failures.txt` | Actualizar specs o añadir `data-testid` en componentes | M |
| QA-02 | Tests | Cero `data-testid` en componentes de producción | `frontend/src/` | Añadir en flujos críticos: nav, portal, claim, mapa | M |
| QA-03 | Tests | E2E en CI probablemente apunta a Strapi de producción | `.github/workflows/playwright.yml` | Entorno staging dedicado + secrets de test | M |
| QA-04 | Tests | Backend: solo tests de discovery; sin cobertura de pagos/claims/admin | `backend/tests/` | Vitest para services; Playwright integration para rutas críticas | L |
| QA-05 | CI | Sin lint, typecheck ni `test:unit` en CI | `.github/workflows/` | Jobs: `lint`, `test:fast`, `build:all` | M |

### Configuración y documentación

| ID | Área | Problema | Archivos clave | Acción propuesta | Esfuerzo |
|----|------|----------|----------------|------------------|----------|
| DOC-01 | Env | `.env.example` usa `NEXT_PUBLIC_STRAPI_API_URL`; código usa `NEXT_PUBLIC_STRAPI_URL` | `.env.example`, `README.md` | Unificar nombre en toda la documentación | S |
| DOC-02 | Env | `frontend/.env.example` no existe; `setup.ps1` lo referencia | `setup.ps1` | Crear `frontend/.env.example` con vars agrupadas | S |
| DOC-03 | Env | Variables faltantes en `.env.example` (Algolia, MP, Resend, Google OAuth, etc.) | `.env.example`, `backend/.env.example` | Documentar required/optional por paquete | M |
| DOC-04 | Env | Nombres Cloudinary distintos frontend vs backend | `cloudinary-sign/route.ts`, `plugins.ts` | Unificar o documentar ambos esquemas | S |
| DOC-05 | Docs | `testing_and_push.md` referencia Jest/Supertest; stack real es Vitest/Playwright | `docs/directives/testing_and_push.md` | Actualizar documentación | S |
| DOC-06 | Docs | README dice Next.js 15; `package.json` tiene Next 16.2.1 | `README.md` | Alinear versiones y paths de tests | S |

---

## P2 — Deuda técnica media

### Backend

| ID | Área | Problema | Acción propuesta | Esfuerzo |
|----|------|----------|------------------|----------|
| BE-11 | Resiliencia | `throw new Error()` genérico en services en vez de errores tipados | Usar `NotFoundError`, `ValidationError`, etc. | S |
| BE-12 | Resiliencia | `actividad` controller traga errores y devuelve `[]` | Propagar via `asyncHandler` + errorHandler | S |
| BE-13 | Arquitectura | Repository de negocio incluye lógica de email | Mover a `NotificationService` | S |
| BE-14 | Arquitectura | Lógica pesada en lifecycles (discovery, TripAdvisor, Algolia) | Lifecycles emiten eventos; services procesan async | M |
| BE-15 | Arquitectura | Fecha hardcodeada `2026-05-15` en backfill de stats | Usar fecha dinámica o eliminar endpoint debug | S |
| BE-16 | Logging | `console.log` disperso en vez de `strapi.log` | Logging estructurado con contexto | S |
| BE-17 | Seguridad | CORS sin wildcard para previews Vercel (CSP sí lo tiene) | Añadir `*.vercel.app` o lista env-driven | S |
| BE-18 | Seguridad | `createPreference` MP sin auth (spam vector) | Rate-limit + validación de negocio existente | S |
| BE-19 | Deploy | URLs de producción hardcodeadas en feed, emails, scripts | Usar `FRONTEND_URL` / `PUBLIC_URL` env | S |
| BE-20 | Deploy | Dockerfile instala Playwright+Chromium en imagen prod | Garantizar `GOOGLE_MAPS_API_KEY`; quitar Playwright de prod | M |

### Frontend

| ID | Área | Problema | Acción propuesta | Esfuerzo |
|----|------|----------|------------------|----------|
| FE-13 | Performance | Algolia pide 100 hits en cada cambio de filtro | Reducir `hitsPerPage`; prefetch inicial | S |
| FE-14 | Performance | `framer-motion` en 26 archivos (peso JS) | CSS transitions simples; dynamic import donde haga falta | M |
| FE-15 | Performance | `<img>` raw en hero/galería en vez de `next/image` | Migrar con `sizes` y `priority` para LCP | M |
| FE-16 | Performance | `console.log` debug en `strapi.ts` en cada import | Eliminar logs de producción | S |
| FE-17 | A11y | `maximumScale: 1, userScalable: false` bloquea zoom | Remover restricción de viewport | S |
| FE-18 | A11y | Formularios sin `<label htmlFor>` asociados | Labels visibles o `sr-only` | M |
| FE-19 | A11y | Botones icon-only sin `aria-label` en Navbar | Audit de controles interactivos | S |
| FE-20 | DevX | Override `?backend=` en localStorage funciona en prod | Gatear a `NODE_ENV === 'development'` | S |
| FE-21 | DevX | PWA cache hardcodea URL Railway en `next.config.ts` | Derivar de `NEXT_PUBLIC_STRAPI_URL` | S |
| FE-22 | Tipos | `schedules?: any[]`, `galeria_config?: Record<string, any>` | Definir interfaces de dominio | M |
| FE-23 | UX | Errores de auth (`token.error`) no se muestran en login | Redirect con error param + toast | S |
| FE-24 | UX | Portal muestra estado vacío cuando API falla (sin distinguir error) | UI de error vs vacío | S |

### Tests / CI

| ID | Área | Problema | Acción propuesta | Esfuerzo |
|----|------|----------|------------------|----------|
| QA-06 | Tests | `e2e/auditoria/integridad.spec.ts` fuera de `testDir` default | Mover bajo `tests/` o proyecto Playwright separado | S |
| QA-07 | Tests | `verification.config.ts` huérfano | Eliminar o documentar como manual-only | S |
| QA-08 | Tests | `discovery.spec.ts` backend hace llamadas reales a Google Maps | Mock HTTP; renombrar como integration | M |
| QA-09 | CI | Cache de npm apunta a `frontend/package-lock.json` inexistente | Usar root `package-lock.json` | S |
| CI-04 | Deploy | `promote.sh` no verifica deploy en Railway/Vercel post-push | Añadir check de deploy status (CLI o webhook) | M |
| CI-05 | Deploy | Sin procedimiento de rollback documentado | Documentar rollback + tags de release | S |

---

## P3 — Nice-to-have / backlog previo

Ítems que ya estaban en `docs/directives/backlog.md` o son mejoras de producto:

| ID | Estado | Descripción | Notas |
|----|--------|-------------|-------|
| PROD-01 | ✅ Hecho | Migración Google Places a `AutocompleteSuggestion` | Completado |
| PROD-02 | Pendiente | Soporte multi-categoría (Many-to-Many en Strapi) | Ver `docs/directives/plan_migracion_categorias.md` |
| PROD-03 | Pendiente | Catálogo Meta Commerce para ofertas activas | Endpoint `meta-offers` ya en prod; falta configurar en Meta |
| PROD-04 | Pendiente | Upgrade React 19 (Next 16 requiere React 19, instalado React 18) | Rama dedicada; breaking changes |
| PROD-05 | Pendiente | Warning preload de fuentes `.woff2` no usadas | Investigar `layout.tsx` / migrar a `next/font` |
| PROD-06 | Pendiente | Algolia `afterDelete` se dispara 4× en bulkDelete Strapi v5 | Filtrar por `documentId` o usar `afterBulkDelete` |
| STD-01 | Discutir | Conflicto Tailwind vs CSS Vanilla de `.cursorrules` | Decidir política: migrar a CSS modules o actualizar estándares |
| STD-02 | Discutir | `errorHandler` no mapea `AppError.code` a respuesta HTTP | Mejorar contrato de errores API |

---

## Matriz de decisión sugerida

Para discutir juntos, propongo agrupar en **sprints de impacto**:

### Sprint 0 — "Cerrar ventanas" ✅ Validado localmente + prod
SEC-01, SEC-02, SEC-07, SEC-08, CI-01, CI-02, DOC-01

### Dev confiable (jul 2026)
- Home en `NODE_ENV=development` busca en **Strapi local**, no Algolia (`search-config.ts`, `search-negocios.ts`)
- Evita 404 ficticios (ej. `catemu` en Algolia pero no en SQLite local)
- Override: `NEXT_PUBLIC_USE_ALGOLIA_IN_DEV=true` para probar Algolia en local

### Sprint 1 — "Blindar pagos y admin" ✅ Completado (local)
SEC-03, SEC-04, SEC-05, SEC-06, BE-05, BE-06, SEC-09, FE-10

### Sprint 2 — "CI confiable" ✅ Completado
QA-01, QA-02, QA-03, QA-05, CI-03, DOC-02, DOC-03
- ✅ QA-02: `data-testid` en login, nav, portal, mapa, claim
- ✅ QA-01: specs alineados con UI actual (Bienvenido, Mi Propiedad, redirect admin)
- ✅ QA-05: workflow `ci.yml` (lint + test:fast + build + smoke E2E)
- ✅ CI-03: workflow `smoke-production.yml` en push a `master`
- ✅ QA-03: E2E smoke en CI sin auth; suite completa vía `workflow_dispatch`
- ✅ DOC-02: `frontend/.env.example`
- ✅ DOC-03: vars documentadas en `.env.example` y `backend/.env.example`

### Sprint 3 — "Arquitectura backend" 🔄 En progreso
BE-01, BE-02, BE-03, BE-04, BE-07 (incremental, módulo por módulo)
- ✅ **Fase 3A (lead):** `lead-repository`, `user-repository`, service refactorizado, `asyncHandler` en convert
- ✅ **Fase 3B (review):** `review-repository`, service con sync de rating, `asyncHandler` en create, validator
- ✅ **Fase 3C (actividad):** `actividad-repository`, service, `asyncHandler`, errores ya no se tragan (BE-12)
- ⏳ Pendiente: `pago` repository, `feed`/`discovery` controllers, BE-07 unificación Document Service

### Sprint 4 — "Frontend SSR y performance" (1–2 semanas)
FE-01, FE-02, FE-03, FE-07, FE-08, FE-04

### Sprint 5 — "Calidad sostenible" (ongoing)
FE-05, FE-06, QA-04, BE-08, BE-09

---

## Preguntas para discutir

1. **Seguridad primero:** ¿Rotamos credenciales expuestas esta semana antes de cualquier otro cambio?
2. **Promote script:** ¿Añadimos gates al script actual o migramos a PR `develop → master` con checks obligatorios en GitHub?
3. **Entorno de tests:** ¿Existe staging en Railway/Vercel o hay que crearlo para que E2E no toque prod?
4. **CSS:** ¿Mantenemos Tailwind (actual) y actualizamos `.cursorrules`, o hay intención real de migrar a CSS vanilla?
5. **React 19:** ¿Lo hacemos ahora (PROD-04) o después de cerrar P0/P1?
6. **Alcance de refactor backend:** ¿Atacamos todo el módulo `negocio` primero (ya tiene capas) o empezamos por `pago`/`lead` (mayor riesgo)?

---

## Referencias

- Constitución técnica: [`STANDARDS.md`](./STANDARDS.md)
- Backlog histórico: [`docs/directives/backlog.md`](./docs/directives/backlog.md)
- Protocolo de despliegue: [`docs/protocolo_autonomia.md`](./docs/protocolo_autonomia.md)
- Script de promote: [`promote.sh`](./promote.sh)

---

*Esfuerzo estimado: S = horas · M = 1–3 días · L = 1+ semana*
