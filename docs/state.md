# San Rafael 360 - Estado del Proyecto

**Última actualización:** 2026-07-08 (prod desplegada)

## Estado en producción
- Push a `master` realizado manualmente por Diego.
- Build en producción (Railway + Vercel) compiló correctamente.
- Commits desplegados: `7dbdfd8` (Sprint 3 pago-repository) + `a3822df` (docs de estado y regla push manual).

## Sprint 3 — punto de corte
**Completado y en prod:** repositories de `lead`, `review`, `actividad`, `pago` + capas `asyncHandler`/validators donde aplica.

**Pendiente para próxima sesión:**
1. `daily-stat` repository
2. Refactor `feed` / `discovery` (fat controllers)
3. `asyncHandler` en métodos admin portal restantes
4. BE-07 incremental en `negocio` (favorites, `db.query`)

## Verificación ejecutada hoy
- `npm run build:all` ejecutado en la raíz del monorepo.
- Resultado: `OK` con exit code `0`.
- Backend Strapi: build completo y compilación TypeScript exitosa.
- Frontend Next.js: build de producción exitoso.

## Advertencias observadas
- Strapi emitió un `EPERM` al intentar abrir `~/Library/Preferences/com.strapi/config.json` dentro del sandbox, pero el build continuó y terminó correctamente.
- Next.js mostró warnings de `Dynamic server usage` en `/ofertas` y `sitemap.xml` durante la generación estática. No rompieron el build porque esas rutas quedaron como dinámicas (`ƒ`), pero conviene revisarlas si se quiere reducir ruido en build o ajustar la estrategia de render.
- Se detectaron vulnerabilidades reportadas por `npm audit` durante `npm install`:
  - backend/root install: `24 vulnerabilities (7 low, 9 moderate, 8 high)`
  - frontend install: `13 vulnerabilities (9 moderate, 4 high)`
  No bloquearon el build, pero quedan como deuda técnica separada.
- Next.js mantiene el warning de deprecación de `middleware` hacia `proxy`.

## Smoke manual sugerido (opcional)
Validar en runtime: `/ofertas`, `/sitemap.xml`, portal de negocio, flujo de pago (si pagos habilitados).

## Siguiente sesión de desarrollo
1. Arrancar con `daily-stat` repository (P0 del cierre parcial Sprint 3).
2. Continuar feed/discovery + `asyncHandler` gaps.
3. Al cerrar: `npm run test:fast` + `build:all` + actualizar `AVANCES.md`/`backlog.md`.

---
*Este estado resume lo verificado localmente y deja una continuidad directa para la próxima sesión.*
