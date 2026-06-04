# 💾 Session Restore — San Rafael 360
*Última actualización: 2026-06-04 (Diego & Antigravity)*

---

## 🟢 Estado General
El portal se encuentra **estable en producción** (`sanrafael360.vercel.app`) y el entorno de desarrollo local con Strapi backend corriendo sobre la base de datos SQLite local (`scratch/data.db`) está validado y operativo en el puerto `1337`.

---

## ✅ Completado Hoy (4 de Junio de 2026)

### 📲 1. Redirecciones y Métricas de la App (Fase 1.1)
- **Archivo:** `frontend/next.config.ts`
- **Cambio:** Agregados redireccionamientos temporales (307) para `/descargar` y `/app` hacia la ficha oficial en Google Play Store (`id=com.sanrafael360.www.twa`). Probado en local con éxito.

### 🎨 2. Smart App Banner Móvil (Fase 1.2)
- **Nuevo Componente:** [SmartAppBanner.tsx](file:///Users/diego/Documents/GitHub/sanrafael360/frontend/src/components/layout/SmartAppBanner.tsx)
- **Integración:** Agregado de forma global en [layout.tsx](file:///Users/diego/Documents/GitHub/sanrafael360/frontend/src/app/layout.tsx).
- **Lógica premium:**
  - Posicionamiento `fixed top-0` (no invasivo para el bottom y sus botones de navegación).
  - Ocultamiento automático si el usuario navega desde dentro de la App (modo `standalone`).
  - Persistencia del descarte con el botón `X` en `localStorage` (`sr360_app_banner_dismissed`).

### ⚙️ 3. Fix de Colisión Navbar / MasterBar
- **Archivos:** [Navbar.tsx](file:///Users/diego/Documents/GitHub/sanrafael360/frontend/src/components/layout/Navbar.tsx), [MasterBar.tsx](file:///Users/diego/Documents/GitHub/sanrafael360/frontend/src/components/layout/MasterBar.tsx), [layout.tsx](file:///Users/diego/Documents/GitHub/sanrafael360/frontend/src/app/layout.tsx).
- **Fix:** Evita que el `MasterBar` (barra de administración) y el `Navbar` se superpongan cuando el banner se oculta o se abre. 
- **Mecanismo:** El `MasterBar` inyecta dinámicamente la variable CSS `--master-bar-height` (40px si está visible / 0px si no). La Navbar calcula su posición superior mediante `top: calc(var(--app-banner-height) + var(--master-bar-height))` y el `app-container` utiliza `pt-[var(--app-banner-height)]` para desplazar el layout.

### 📝 4. Documentación y Estrategia de Marketing (Obsidian)
- **Nuevos Archivos:**
  - [campanas_turistas_b1.md](file:///Users/diego/Documents/GitHub/sanrafael360/docs/marketing/campanas_turistas_b1.md): Estrategia de seguridad y captación de turistas.
  - [plan_meta_ads_turistas.md](file:///Users/diego/Documents/GitHub/sanrafael360/docs/marketing/plan_meta_ads_turistas.md): Plan de inversión mínima, segmentaciones, exclusión de locales y biblioteca de copys.
- **Redes:** Publicado el post orgánico de lanzamiento del calco con código QR (`calco.jpeg`) adaptado con copys transparentes y directos para Facebook.

### 📊 5. Pauta Paga Activa en Meta Ads Manager
- **Campaña:** Creada y publicada la campaña de tráfico del calco orientada a turistas de Buenos Aires, Córdoba y Rosario, excluyendo San Rafael.
- **Estado actual:** **Procesando / En revisión** en la plataforma de Meta Ads. Método de pago cargado exitosamente.

---

## ⏳ Pendiente para la Próxima Sesión

### 1. Monitoreo de Meta Ads
- Controlar que la campaña pase de *En revisión* a **Activa** en el Ads Manager.
- Monitorear el costo por clic (CPC) y las primeras métricas de visitas a la web desde la campaña.

### 2. ASO en Google Play Store
- Esperar que Google apruebe la revisión de los nuevos textos optimizados de la ficha de la Play Store.

---

## 🔑 Datos Clave
- **Play Store Package ID:** `com.sanrafael360.www.twa`
- **URL Play Store:** `https://play.google.com/store/apps/details?id=com.sanrafael360.www.twa`
- **Servidor Strapi Local:** `http://localhost:1337` (SQLite: `scratch/data.db`)
- **Servidor Frontend Local:** `http://localhost:3000`
