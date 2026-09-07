# Instructivo Cursor — Asistente guía SR360 (web + Algolia)

## Cómo usar este doc
Spec **declarativa**. Diego dirige; pegá este archivo (o el prompt final) en Cursor e implementá **solo** lo declarado acá.

## Decisión de producto (ya tomada)
- Asistente **escrito** (no voz).
- Canal: **web** en sanrafael360.com (no WhatsApp / no línea nueva).
- Motor de fichas: **Algolia ya integrado** — reutilizar el índice/búsqueda existente; no scrapear ni inventar un catálogo paralelo.
- **Mantener la barra de search** actual. El asistente es capa extra, no la reemplaza.
- Sprint 1 (bot atención en otra línea WSP) = **backlog**; no implementar acá.
- Outbound mixto WSP+IG = no tocar.

---

## Objetivo
Un chat en el sitio donde el visitante escribe en lenguaje natural (“gomería cerca del centro”, “dónde comer cerca del dique”) y recibe **2–3 fichas reales** de SR360, con link a la ficha y CTAs de contacto si existen (WhatsApp / Instagram según datos del índice).

El asistente:
1. Entiende la necesidad (categoría, zona, ocasión).
2. Consulta **Algolia** (mismo universo que la search bar).
3. Devuelve resultados reales; **prioriza premium** sin ocultar free si no hay premium.
4. Si no hay match: lo dice y sugiere reformular / usar la search.
5. Si el usuario quiere **anunciar / destacar su negocio**: no hace el pitch largo; CTA corto hacia el canal comercial que Diego configure (texto/link).

---

## Qué NO implementar
- Voz / llamada.
- Nueva línea WhatsApp o bot de atención comercial (backlog).
- Bot “en nombre del comercio premium”.
- Quitar o esconder la barra de search.
- Inventar comercios, horarios “abierto ahora”, precios o distancias sin dato en Algolia/ficha.
- Reservas, pagos, stock.
- Cambiar el módulo de prospección WSP+IG.

---

## UX en el sitio

### Ubicación
- Widget de chat accesible en el sitio (flotante y/o página dedicada tipo `/asistente` o copy que Diego elija).
- No reemplazar el header search: search bar sigue igual.

### Comportamiento
- Idioma: **es-AR** (vos), mensajes cortos.
- Primera carga: una línea de ayuda (“Preguntame qué necesitás en San Rafael…”).
- Respuesta típica: 2–3 tarjetas/ítems con:
  - Nombre
  - Categoría / zona si hay
  - Link a ficha pública SR360
  - CTA WSP y/o IG **solo si** el hit de Algolia trae esos campos
- Si la query es vaga: una pregunta de clarificación (zona o tipo), no un volcado de 20 resultados.
- Comandos útiles: “otras opciones”, “más cerca de X”, “limpiar”.
- Estado de carga visible; error de red: mensaje amable + “probá la búsqueda de arriba”.

### Relación con la search bar
- Mismo índice Algolia (o el mismo helper/servicio que ya usa la search).
- Opcional (nice-to-have, no bloqueante): en el vacío de search o bajo resultados, link “¿Preferís preguntarle al asistente?” — **no** obligatorio en el MVP.

---

## Backend / lógica

### Patrón (MUST)
**Retrieve-then-generate:**
1. Parsear intención / filtros (categoría, zona, keywords) — reglas + LLM solo para extraer filtros y redactar.
2. Query a **Algolia** con esos filtros/texto.
3. Rankear: `premium` primero (si el índice tiene el atributo), luego relevancia Algolia.
4. Tomar top 2–3 hits **reales**.
5. Redactar respuesta citando solo esos hits (nombre + url + CTAs de los datos).

Nunca: “el LLM lista comercios de memoria”.

### Algolia
- Reutilizar credenciales/índice/config ya existentes en el proyecto.
- Respetar attributes for faceting/filtering que ya usen (categoría, zona, premium, etc.).
- Si falta un atributo necesario para premium o CTAs, **declararlo en README** y proponer el campo mínimo; no inventar datos en runtime.
- Campos mínimos deseables por hit: `objectID`/`id`, nombre, url/slug ficha, categoría, zona, flag premium, teléfono o wa, instagram_username (los que ya existan).

### Derivación comercial
- Detectar intención tipo “quiero anunciar / cargar mi negocio / ser premium”.
- Respuesta corta + `COPY_CTA_ANUNCIAR` (config editable).
- No mezclar modo guía con modo vendedor en el mismo hilo sin ese CTA explícito.

### Guardrails
- 0 resultados → texto honesto; sugerir otra zona/categoría o usar la search bar.
- No afirmar horarios/disponibilidad sin campo en el índice.
- Rate limit / límite de mensajes por sesión razonable para controlar costo.
- Si falla Algolia o el LLM: fallback sin alucinar.

---

## Config editable (sin redeploy de lógica)
- `COPY_INTRO`
- `COPY_NO_RESULTS`
- `COPY_CTA_ANUNCIAR`
- `MAX_RESULTS` (default 3)
- Flag `PREMIUM_FIRST` (default true)
- Opcional: allowlist de páginas donde se muestra el widget

---

## Analytics (mínimo)
- `guide_chat_opened`
- `guide_query`
- `guide_results_shown` (n, premium_n)
- `guide_no_results`
- `guide_cta_anunciar`
- `guide_error`

---

## Criterios de aceptación
1. Desde la web, el usuario puede abrir el chat y hacer una pregunta en lenguaje natural.
2. Las sugerencias son hits reales de Algolia (mismas fichas que podrían aparecer en search).
3. La barra de search sigue visible y funcionando como antes.
4. Premium sale antes que free a igualdad de match (si el índice expone el flag).
5. Sin resultados: no inventa; ofrece reformular o usar search.
6. “Quiero anunciar” → CTA comercial corto, no pitch largo.
7. es-AR; outbound WSP+IG intacto; sin WhatsApp bot de atención.
8. README ops: cómo editar copy, dónde está el widget, qué índice Algolia usa, cómo pausar el asistente.

---

## Orden de implementación sugerido
1. Servicio `recommendFichasViaAlgolia(query/filters)` reutilizando el client existente + tests de ranking premium.
2. UI chat (widget + estados vacío/carga/error/resultados).
3. Capa de diálogo (clarificar → buscar → redactar sobre hits).
4. Intención “anunciar” + copy config.
5. Analytics + README ops + flag pause.

---

## Prompt corto para pegar en Cursor

```
Implementá el asistente guía de SR360 según este instructivo (instructivo-sprint-asistente-guia-web.md):

- Chat ESCRITO en la web (sanrafael360.com). Sin voz. Sin nueva línea WhatsApp.
- Usar Algolia YA integrado; retrieve-then-generate; NUNCA inventar fichas.
- MANTENER la barra de search; el asistente no la reemplaza.
- 2–3 resultados, premium primero si el índice lo permite, links reales + CTAs solo si hay datos.
- Intención “anunciar/destacar” → CTA corto configurable, no pitch largo.
- No tocar outbound mixto WSP+IG ni el bot de atención WSP (backlog).
- Cumplir criterios de aceptación + README ops.

Diego dirige; implementá solo lo declarado en el instructivo.
```
