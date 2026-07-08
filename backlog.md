# Backlog — San Rafael 360

> Solo ítems **pendientes**. Lo completado está en [`AVANCES.md`](./AVANCES.md).  
> Convención: **P0** = urgente · **P1** = alto impacto · **P2** = deuda técnica · **P3** = nice-to-have  
> Esfuerzo: S = horas · M = 1–3 días · L = 1+ semana

---

## En curso — Sprint 3: Arquitectura backend

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| BE-01 | Fat controllers en `feed`, `discovery`, partes de `negocio` | Extraer repositories; controllers solo orquestan | L |
| BE-03 | Falta repo `daily-stat` | Crear repository por dominio | S |
| BE-04 | Validators solo en `lead`, `review` y `pago` | Añadir validators: `discovery`, admin ops | M |
| BE-07 | APIs mezcladas (`documents`, `db.query`, `entityService`) | Estandarizar Document Service vía repositories | L |
| BE-02 | `asyncHandler` no cubre todos los custom controllers | Extender a módulos restantes (`feed`, `discovery`, etc.) | M |

**Orden sugerido:** `feed`/`discovery` → `daily-stat` repo → BE-07 incremental en `negocio`.

---

## P1 — Alto impacto

### Frontend SSR y performance (Sprint 4)

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| FE-01 | Home entera es `"use client"` (~470 líneas) | Server Component + client leaves | L |
| FE-02 | `fetchFromStrapi` fuerza `cache: 'no-store'` | Respetar opciones del caller | S |
| FE-03 | URL Strapi duplicada en 30+ archivos | Centralizar en `getStrapiUrl()` | M |
| FE-04 | Sin `error.tsx`, `loading.tsx`, `not-found.tsx` | Boundaries globales y por segmento | M |
| FE-07 | Portal: server fetch + re-fetch client (waterfall) | Fetch inicial en server page | M |
| FE-08 | Navbar re-fetch categorías en cada ruta | Fetch una vez en layout server | M |

### Frontend — resto P1

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| FE-05 | `ignoreBuildErrors: true` en Next config | Habilitar typecheck; corregir incremental | L |
| FE-06 | 50+ `as any`; tipos NextAuth incompletos | Completar augmentation + genéricos Strapi | L |
| FE-09 | URL del sitio hardcodeada | Usar `NEXTAUTH_URL` o `NEXT_PUBLIC_SITE_URL` | S |
| FE-11 | Login con flujo credentials muerto | Eliminar UI muerta o añadir CredentialsProvider | S |
| FE-12 | API layer fragmentada | Crear `lib/api/` con métodos tipados | L |

### Backend — resto P1

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| BE-08 | `index.ts` bootstrap ~330 líneas con migraciones | Migraciones a scripts one-shot | M |
| BE-09 | Algolia sincroniza 2–3× por publish | Un solo path event-driven | M |
| BE-10 | Funciones >50 líneas (`updatePortal`, `getPortalStats`) | Refactor en sub-servicios | M |

### Tests y CI

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| QA-04 | Backend sin cobertura pagos/claims/admin | Vitest services + integration críticas | L |

### Documentación

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| DOC-02 | `frontend/.env.example` no existe | Crear archivo dedicado (vars ya en `.env.example` raíz) | S |
| DOC-04 | Nombres Cloudinary distintos FE vs BE | Unificar o documentar ambos esquemas | S |
| DOC-05 | `testing_and_push.md` referencia Jest/Supertest | Actualizar a Vitest/Playwright | S |
| DOC-06 | README dice Next 15; package.json tiene Next 16 | Alinear versiones y paths de tests | S |

---

## P2 — Deuda técnica

### Backend

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| BE-11 | `throw new Error()` genérico en services | Usar errores tipados (`NotFoundError`, etc.) | S |
| BE-13 | Repository negocio incluye lógica de email | Mover a `NotificationService` | S |
| BE-14 | Lógica pesada en lifecycles | Lifecycles emiten eventos; services async | M |
| BE-15 | Fecha hardcodeada `2026-05-15` en backfill stats | Fecha dinámica o eliminar endpoint debug | S |
| BE-16 | `console.log` disperso | `strapi.log` estructurado | S |
| BE-17 | CORS sin wildcard previews Vercel | Añadir `*.vercel.app` o lista env-driven | S |
| BE-18 | `createPreference` MP sin auth | Rate-limit + validar negocio existente | S |
| BE-19 | URLs prod hardcodeadas en feed, emails, scripts | `FRONTEND_URL` / `PUBLIC_URL` env | S |
| BE-20 | Dockerfile instala Playwright en imagen prod | Quitar Playwright de prod | M |

### Frontend

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| FE-13 | Algolia pide 100 hits por filtro | Reducir `hitsPerPage`; prefetch inicial | S |
| FE-14 | `framer-motion` en 26 archivos | CSS transitions; dynamic import | M |
| FE-15 | `<img>` raw en hero/galería | Migrar a `next/image` con `sizes`/`priority` | M |
| FE-16 | `console.log` debug en `strapi.ts` | Eliminar logs de producción | S |
| FE-17 | `maximumScale: 1` bloquea zoom | Remover restricción viewport | S |
| FE-18 | Formularios sin `<label htmlFor>` | Labels visibles o `sr-only` | M |
| FE-19 | Botones icon-only sin `aria-label` | Audit controles interactivos | S |
| FE-20 | Override `?backend=` funciona en prod | Gatear a `NODE_ENV === 'development'` | S |
| FE-21 | PWA cache hardcodea URL Railway | Derivar de `NEXT_PUBLIC_STRAPI_URL` | S |
| FE-22 | `schedules?: any[]`, `galeria_config?: any` | Interfaces de dominio | M |
| FE-23 | Errores auth no se muestran en login | Redirect con error param + toast | S |
| FE-24 | Portal no distingue error vs vacío | UI de error dedicada | S |

### Tests / CI / Deploy

| ID | Problema | Acción | Esfuerzo |
|----|----------|--------|----------|
| QA-06 | `e2e/auditoria/` fuera de `testDir` default | Mover bajo `tests/` o proyecto separado | S |
| QA-07 | `verification.config.ts` huérfano | Eliminar o documentar manual-only | S |
| QA-08 | `discovery.spec.ts` llama Google Maps real | Mock HTTP; renombrar integration | M |
| QA-09 | Cache npm apunta a `frontend/package-lock.json` inexistente | Usar root `package-lock.json` | S |
| CI-04 | `promote.sh` no verifica deploy post-push | Check deploy status Railway/Vercel | M |
| CI-05 | Sin procedimiento rollback documentado | Documentar rollback + tags release | S |

---

## P3 — Nice-to-have

| ID | Descripción | Notas |
|----|-------------|-------|
| PROD-02 | Soporte multi-categoría (M2M Strapi) | Ver `docs/directives/plan_migracion_categorias.md` |
| PROD-03 | Catálogo Meta Commerce | Endpoint `meta-offers` en prod; falta config Meta |
| PROD-04 | Upgrade React 19 | Next 16 + React 18; rama dedicada |
| PROD-05 | Warning preload fuentes `.woff2` | Investigar `layout.tsx` / `next/font` |
| PROD-06 | Algolia `afterDelete` 4× en bulkDelete | Filtrar por `documentId` o `afterBulkDelete` |
| STD-01 | Conflicto Tailwind vs CSS Vanilla `.cursorrules` | Decidir política |
| STD-02 | `errorHandler` no mapea `AppError.code` a HTTP | Mejorar contrato errores API |

---

## Secuencia recomendada

```
Sprint 3 (en curso)  →  Sprint 4 (SSR)  →  Sprint 5 (tipos + tests backend)
         ↓
    commit cambios locales (lead/review/actividad repos)
```

### Próximo paso concreto

1. **Commitear** el trabajo local de Sprint 3 (repositories `lead`, `review`, `actividad`, `user`).
2. **Refactor `feed`/`discovery`**: repositories + `asyncHandler`.
3. **Paralelo opcional:** FE-02 + FE-09 (quick wins frontend, 1–2 h).

---

## Referencias

- Avances completados: [`AVANCES.md`](./AVANCES.md)
- Estándares: [`STANDARDS.md`](./STANDARDS.md)
- Protocolo deploy: [`docs/protocolo_autonomia.md`](./docs/protocolo_autonomia.md)
- Promote: [`promote.sh`](./promote.sh)
