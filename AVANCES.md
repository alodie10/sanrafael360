# Avances — San Rafael 360

> Registro de trabajo completado. El backlog activo vive en [`backlog.md`](./backlog.md).  
> Auditoría inicial: 2 de julio de 2026 · Última actualización: 8 de julio de 2026

---

## Resumen

| Sprint | Tema | Estado |
|--------|------|--------|
| 0 | Cerrar ventanas (seguridad + CI básico) | ✅ Completado |
| Dev confiable | Búsqueda local en desarrollo | ✅ Completado |
| 1 | Blindar pagos y admin | ✅ Completado |
| 2 | CI confiable | ✅ Completado |
| 3 | Arquitectura backend | 🔄 En progreso (4 de 6 módulos) |
| 4 | Frontend SSR y performance | ⏳ Pendiente |
| 5 | Calidad sostenible | ⏳ Pendiente |

**Siguiente foco recomendado:** cerrar Sprint 3 (`pago` repository + `feed`/`discovery`) y luego Sprint 4 (SSR home/portal).

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

## Sprint 3 — "Arquitectura backend" 🔄

### Completado

| Fase | Módulo | Entregables |
|------|--------|-------------|
| 3A | `lead` | `lead-repository`, `user-repository`, `LeadService.convertLead()`, `asyncHandler`, validator |
| 3B | `review` | `review-repository`, sync de rating, `asyncHandler` en create, `review-create-validator` |
| 3C | `actividad` | `actividad-repository`, service, `asyncHandler`, errores propagados (BE-12) |
| 3D | `pago` | `pago-repository`, service refactorizado, reutiliza `negocio-repository`, `NotFoundError` |

**Repositories existentes:** `negocio`, `lead`, `user`, `review`, `actividad`, `pago` (6 total).

**`asyncHandler` aplicado en:** `negocio`, `lead`, `review`, `actividad`, `pago`, `oauth`.

### Pendiente (ver backlog)

- Repository `daily-stat`
- Refactor `feed` / `discovery` controllers
- BE-07: unificar Document Service API (aún hay `db.query` en `negocio`)
- Validators para rutas `pago`, `discovery`, ops admin restantes

---

## Producto / histórico ✅

| ID | Descripción |
|----|-------------|
| PROD-01 | Migración Google Places a `AutocompleteSuggestion` |

---

## Referencias

- Backlog activo: [`backlog.md`](./backlog.md)
- Estándares: [`STANDARDS.md`](./STANDARDS.md)
- Backlog histórico: [`docs/directives/backlog.md`](./docs/directives/backlog.md)
