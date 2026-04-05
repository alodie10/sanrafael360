# 💾 Session Restore — San Rafael 360
*Última actualización: 2026-04-05*

---

## 🟢 Estado General
La plataforma está **estable en producción** (`sanrafael360.vercel.app`). Esta sesión fue una jornada de QA + fixes.

---

## ✅ Completado Hoy

### Fix 1 — `bg-clip-text` clipping en /contacto
- **Archivo:** `frontend/src/app/contacto/page.tsx`
- **Fix:** `px-1 pb-1` en el `<span>` del gradiente "Negocio" para que la `o` cursiva no se recorte.

### Fix 2 — Columna principal en negro (Business Detail)
- **Archivo:** `frontend/src/app/negocios/[slug]/page.tsx`
- **Causa raíz:** CSS Grid `stretch` estiraba la columna izquierda hasta la altura del sidebar. Documentado en `/docs/fixes.md`.
- **Fix:** `items-start` en el grid + placeholder glassmorphic si no hay descripción.

### Fix 3 — WebsitePortlet rediseñado + hydration fix
- **Archivo:** `frontend/src/components/business/WebsitePortlet.tsx`
- **Fix:** Muestra favicon (Google Favicon API), nombre del negocio, dominio en monospace, badge "Verificado", CTA "Visitar" con hover. Favicon fallback via `useState` (no DOM manipulation).

### Fix 4 — BookingWidget: validación estricta de URL
- **Archivo:** `frontend/src/components/business/BookingWidget.tsx`
- **Fix:** `isValidUrl()` con `new URL()` — silencio visual si URL inválida o vacía.

### Fix 5 — Link "Sitio Web" duplicado en sidebar eliminado
- **Archivo:** `frontend/src/app/negocios/[slug]/page.tsx`
- **Fix:** Eliminado el `{negocio.website && <a>Visitar sitio oficial</a>}` del sidebar. Solo queda el `WebsitePortlet`.

### Fix 6 — Encoding "Sábado" en frontend
- **Archivo:** `frontend/src/app/negocios/[slug]/page.tsx`
- **Causa raíz:** Datos scrapeados con doble-encoding Latin-1→UTF-8 ya persistidos en Railway/Postgres.
- **Fix:** `sanitizeText()` con guard condicional — solo activa si detecta `Ã` o `Â`. Texto editado manualmente en Strapi pasa intacto.

### Fix 7 — Directiva "Sin ejecución local" en ARCH_MANIFEST
- **Archivo:** `.antigravity/ARCH_MANIFEST.md`
- **Fix:** Nueva sección "Regla de Entorno: Sin Ejecución Local (CRÍTICO)".

### Nuevos archivos creados
- `docs/fixes.md` — Causa raíz de los 3 bugs del Business Detail documentada.
- `frontend/tests/empty-state.spec.ts` — Suite Playwright de regresión (columna negra, booking inválido, hydration).

---

## ⏳ Pendiente para Mañana

### 1. Push pendiente
El fix del sanitizador (`sanitizeText` condicional) **no fue pusheado todavía**. Asegurarse de hacer push antes de hacer cualquier otra cosa.

### 2. Limpiar `reserva_url` de La Delicia Bulevard
El usuario lo hace manualmente desde Strapi Admin. El dominio `reservas.ladeliciabulevard.com.ar` no resuelve (ERR_NAME_NOT_RESOLVED). Una vez eliminado, el BookingWidget mostrará WhatsApp o se ocultará.

### 3. Categoría "Productos Gourmet" — 0 lugares
Aparece en el grid de la home con 0 negocios. Decisión pendiente: ¿poblar o esconder?

---

## 🔑 Datos Clave
- **Frontend:** https://sanrafael360.vercel.app (Vercel — deploy automático desde `main`)
- **Backend:** Railway — Strapi 5 + PostgreSQL
- **Strapi UUID:** `21e7e9d7-7e91-40d4-a449-43ee75cf60c5`
- **Regla crítica:** No corre nada localmente. Toda verificación contra producción.
