# Fix Log: San Rafael 360 — Business Detail Page

Este documento registra bugs encontrados en producción y sus causas raíz, para portabilidad del conocimiento.

---

## Fix #1 — Columna Principal en Negro (Issue: "Black Column")

**Fecha:** 2026-04-05  
**Archivo:** `frontend/src/app/negocios/[slug]/page.tsx`

### Síntoma
En páginas de negocios donde la descripción era nula o muy corta, el área izquierda (`lg:col-span-2`) del grid aparecía completamente negra/vacía mientras la sidebar derecha seguía mostrando contenido (mapa, horarios, booking).

### Causa Raíz
CSS Grid por defecto estira todas las celdas a la altura de la celda más alta (`align-items: stretch`). La columna principal tenía menos contenido que la sidebar → su bloque se estiraba hacia abajo mostrando el fondo oscuro del `<main>`.

En paralelo, el `dangerouslySetInnerHTML` con `|| "Sin descripción disponible."` renderizaba siempre texto plano aunque el campo en Strapi estuviera vacío — pero si `negocio.descripcion` era `""` (string vacío), el operador `||` igual lo substituía, lo cual **no** era problema real. El problema era puramente el CSS Grid stretch.

### Fix Aplicado
```diff
- <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
+ <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
```

`items-start` equivale a `align-items: start` → cada columna ocupa solo su altura natural, sin estirar hasta la celda más alta.

**Plus:** Si `negocio.descripcion` es nulo/vacío, se muestra un placeholder glassmorphic (badge 🏔️ + "Descripción próximamente") en lugar de texto plano hardcodeado.

---

## Fix #2 — BookingWidget con URL No Validada

**Fecha:** 2026-04-05  
**Archivo:** `frontend/src/components/business/BookingWidget.tsx`

### Síntoma
El widget "Agenda tu Cita" se mostraba con botón "Reservar Ahora" aunque `reservaUrl` contuviera un string malformado, o una URL que no respondía. Principio violado: **no agregar mecanismos vacíos a la página.**

### Causa Raíz
La guardia original era `if (!reservaUrl && !whatsapp) return null` — solo verificaba que los campos no estuvieran vacíos, pero no su validez sintáctica.

### Fix Aplicado
```ts
function isValidUrl(url?: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
```
Validación binaria estricta: URL malformada → tratada como ausente → widget no renderiza.

---

## Fix #3 — Sitio Web Duplicado en Sidebar

**Fecha:** 2026-04-05  
**Archivo:** `frontend/src/app/negocios/[slug]/page.tsx`

### Síntoma
Cuando un negocio tenía el campo `website` poblado, aparecían dos elementos:
1. `WebsitePortlet` (columna principal) — diseño premium con favicon y dominio.
2. Link "Visitar sitio oficial" (sidebar "Información Detallada") — diseño antiguo con ícono globo genérico.

### Causa Raíz
El link del sidebar fue creado en una versión anterior del layout y nunca fue removido al introducir `WebsitePortlet`.

### Fix Aplicado
Se eliminó el bloque `{negocio.website && (<a href={negocio.website}>Visitar sitio oficial</a>)}` del sidebar. El `WebsitePortlet` en la columna principal cubre la función con mejor UX.

---

## Fix Transversal — WebsitePortlet: Hidratación del Favicon

**Fecha:** 2026-04-05  
**Archivo:** `frontend/src/components/business/WebsitePortlet.tsx`

### Causa Raíz
El `onError` original manipulaba `e.target.style.display` y `nextElementSibling.classList` — manipulación directa del DOM que ocurre después de la hidratación de React. Esto puede causar un mismatch entre el árbol del servidor y el del cliente.

### Fix Aplicado
Reemplazado por `useState(false)` → `setFaviconFailed(true)` en `onError`. React gestiona el cambio de forma controlada, sin tocar el DOM directamente.
