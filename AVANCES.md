# Avances — San Rafael 360

> Registro de trabajo completado. El backlog activo vive en [`backlog.md`](./backlog.md).  
> Auditoría inicial: 2 de julio de 2026 · Última actualización: 13 de julio de 2026

---

## Resumen

| Sprint | Tema | Estado |
|--------|------|--------|
| 0 | Cerrar ventanas (seguridad + CI básico) | ✅ Completado |
| Dev confiable | Búsqueda local en desarrollo | ✅ Completado |
| 1 | Blindar pagos y admin | ✅ Completado |
| 2 | CI confiable | ✅ Completado |
| 3 | Arquitectura backend | ✅ Completado |
| 4 | Frontend SSR y performance | ✅ Completado |
| 5 | Calidad sostenible (tipos + tests) | ✅ Completado |

**Siguiente foco recomendado:** FE-11 (login credentials), docs DOC-02..06, o BE residual. Ver [`backlog.md`](./backlog.md).

---

## Sprint 0 — "Cerrar ventanas" ✅

| ID | Descripción | Evidencia |
|----|-------------|-----------|
| SEC-01 | Eliminar fallbacks de credenciales; fail-fast | `backend/config/required-env.ts`, `plugins.ts`, `admin.ts` |
| SEC-02 | Bloquear `POST /pagos/simulate-success` en producción | `backend/src/api/pago/controllers/pago.ts` |
| SEC-07 | Credenciales de test vía env, no hardcodeadas | `frontend/tests/test-env.ts`, `global-setup.ts` |
| SEC-08 | `NEXTAUTH_SECRET` obligatorio fuera de test | `frontend/src/lib/auth.ts` |
| CI-01 | Quitar `continue-on-error` en Playwright | `.github/workflows/playwright.yml` |
| CI-02 | Gates en `promote.sh` (test:fast + build:all) | `promote.sh` |
| DOC-01 | Unificar `NEXT_PUBLIC_STRAPI_URL` en docs | `.env.example` |

---

## Dev confiable (jul 2026) ✅

- Home en `NODE_ENV=development` busca en Strapi local, no Algolia.
- Override: `NEXT_PUBLIC_USE_ALGOLIA_IN_DEV=true`.
- Archivos: `frontend/src/lib/search-config.ts`, `search-negocios.ts`.

---

## Sprint 1 — "Blindar pagos y admin" ✅

| ID | Descripción | Evidencia |
|----|-------------|-----------|
| SEC-03 | Webhook MP con firma + idempotencia | Middleware `global::mercadopago-webhook`, `pago.ts` service |
| SEC-04 | Rutas admin con `require-admin` | `portal-actions.ts`, `media-restorer.ts` |
| SEC-05 | `register-cloudinary` solo admin | `media-restorer.ts` |
| SEC-06 | Rate-limit en `POST /negocios/:id/stats` | `custom-negocio.ts`, `global::stats-rate-limit` |
| BE-05 | `lead.convert` admin-only + service | `custom-lead.ts`, `lead/services/lead.ts` |
| BE-06 | Emails admin vía `ADMIN_EMAILS` env | `backend/src/utils/admin-access.ts` |
| SEC-09 | Portal stats vía Route Handler | `PortalStats.tsx` → `/api/portal/stats` |
| FE-10 | Google OAuth sin token en query string | `auth.ts` → `exchangeGoogleAccessToken` server-side |

---

## Sprint 2 — "CI confiable" ✅

| ID | Descripción | Evidencia |
|----|-------------|-----------|
| QA-01 | Specs alineados con UI actual | `frontend/tests/*.spec.ts` |
| QA-02 | `data-testid` en flujos críticos | login, nav, portal, mapa, claim |
| QA-03 | E2E smoke en CI sin auth a prod | `.github/workflows/ci.yml`, `playwright.yml` |
| QA-05 | Workflow CI (lint + test:fast + build) | `.github/workflows/ci.yml` |
| CI-03 | Smoke en push a `master` | `.github/workflows/smoke-production.yml` |
| DOC-03 | Vars documentadas en `.env.example` | `.env.example`, `backend/.env.example` |

> **Nota DOC-02:** Las vars de frontend están en `.env.example` raíz. Falta archivo dedicado `frontend/.env.example` (ver backlog).

---

## Sprint 3 — "Arquitectura backend" ✅

### Completado

| Fase | Módulo | Entregables |
|------|--------|-------------|
| 3A | `lead` | `lead-repository`, `user-repository`, `LeadService.convertLead()`, `asyncHandler`, validator |
| 3B | `review` | `review-repository`, sync de rating, `asyncHandler` en create, `review-create-validator` |
| 3C | `actividad` | `actividad-repository`, service, `asyncHandler`, errores propagados (BE-12) |
| 3D | `pago` | `pago-repository`, service refactorizado, reutiliza `negocio-repository`, `NotFoundError` |
| 3E | `daily-stat` | `daily-stat-repository`, cableado en `negocio` service/controller e `index.ts` bootstrap |
| 3F | `feed` | `feed-repository`, `feed-service`, CSV utils, controller con `asyncHandler` |
| 3G | `discovery` | `discovery-sync` service, `parse-google-hours` util, validator, `asyncHandler` |
| 3H | Cierre Sprint 3 | `portal-admin` service, favorites vía repos, validators admin, `asyncHandler` gaps |

**Repositories:** `negocio`, `lead`, `user`, `review`, `actividad`, `pago`, `daily-stat`, `feed` (8 total).

### Nota BE-07 residual (Sprint 5 / P2)

Queda `db.query` en `negocio-repository.uploadFile` (plugin upload) y `media-restorer` (upload file). No bloquea cierre de Sprint 3.

**`asyncHandler` aplicado en:** todos los custom controllers excepto `find`/`findOne` core (requieren `super` directo).

---

## Sprint 4 — "Frontend SSR y performance" ✅

Promovido a prod 2026-07-13 (`develop` = `master` en `ddccaa9`).

| ID | Descripción | Evidencia |
|----|-------------|-----------|
| FE-01 | Home como Server Component + client leaf | `app/page.tsx`, `components/home/HomeClient.tsx` |
| FE-02 | `fetchFromStrapi` respeta `cache` / `next.revalidate` | `lib/strapi.ts` |
| FE-04 | Boundaries globales | `app/error.tsx`, `loading.tsx`, `not-found.tsx` |
| FE-07 | Portal sin waterfall inicial (stats, negocios, precios) | `lib/portal.ts`, `app/portal/page.tsx`, `PortalStats.tsx` |
| FE-08 | Categorías una vez en layout server | `lib/categorias.ts`, `app/layout.tsx`, `Navbar.tsx` |
| — | Next.js 16: `middleware.ts` → `proxy.ts` | `src/proxy.ts` |
| — | Resiliencia dev: `127.0.0.1`, fallback Algolia, favoritos sin 500 | `lib/strapi.ts`, `search-config.ts`, `api/favoritos/route.ts` |
| — | `getSiteUrl()` en metadata principal | `lib/site.ts`, `app/layout.tsx` |

### Residual P2 (no bloquea cierre)

- **FE-03** parcial: `getStrapiUrl()` existe; ~20 archivos aún con URL inline.
- **FE-09** parcial: sitemap, robots, schemas con URL hardcodeada.
- **FE-04** parcial: sin boundaries por segmento (`/portal`, `/categoria`).
- Build local: warnings en `/ofertas` y `sitemap.xml` sin Strapi levantado.

---

## Sprint 5 — "Calidad sostenible" ✅

| ID | Descripción | Estado |
|----|-------------|--------|
| FE-05 | Typecheck en build Next (`ignoreBuildErrors: false`) | ✅ |
| FE-06 | Augmentation NextAuth + 0 `as any` en frontend | ✅ |
| QA-04 | Tests backend pagos/claims/admin | ✅ 31 tests unitarios |

**Utilidades extraídas:** `pago-plan.ts`, `premium-vigencia.ts`, `claim-validation.ts`, `payment-success-handler.ts`, `categoria-utils.ts`

---

## Residual P2 post–Sprint 5 ✅ (2026-07-14)

| ID | Descripción | Estado |
|----|-------------|--------|
| FE-03 | `getStrapiUrl()` en ~19 call sites del frontend | ✅ |
| FE-09 | `getSiteUrl()` en sitemap, robots, schemas, contacto, privacidad | ✅ |
| FE-04 | `error.tsx` en `/portal` y `/categoria` | ✅ |
| FE-25 | `dynamic = "force-dynamic"` en ofertas y sitemap | ✅ |
| QA-08 | Discovery integration skip salvo `RUN_DISCOVERY_INTEGRATION=1` | ✅ |

---

| ID | Descripción |
|----|-------------|
| PROD-01 | Migración Google Places a `AutocompleteSuggestion` |

---

## Referencias

- Backlog activo: [`backlog.md`](./backlog.md)
- Estándares: [`STANDARDS.md`](./STANDARDS.md)
- Backlog histórico: [`docs/directives/backlog.md`](./docs/directives/backlog.md)
