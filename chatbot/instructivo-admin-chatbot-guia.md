# Instructivo Cursor — Módulo Admin: Chatbot guía SR360

## Rol
Spec **declarativa**. Diego dirige; Cursor implementa en el **panel de control existente** (mismo patrón de auth/layout/navegación que los otros módulos). No inventar un admin aparte ni tocar outbound WSP+IG.

## Objetivo
Un módulo en el panel para **operar y realimentar** el asistente guía web:
1. Ver queries que dieron **0 resultados** (misses).
2. Desde ahí (o en una pestaña de diccionario) **agregar/editar** expansiones intención → términos/categorías Algolia.
3. Opcional: empujar o documentar synonyms hacia Algolia si el proyecto ya lo permite por API; si no, al menos el mapa local que usa el bot.
4. Pausar el chatbot / editar copy corto (intro, no results, CTA anunciar) sin redeploy de lógica.

---

## Dónde vive
- Nueva entrada en el menú del panel, p.ej. **“Chatbot”** o **“Asistente guía”**.
- Misma autenticación y roles que el resto del panel (solo usuarios admin / staff que ya entran).
- Rutas bajo el mismo prefijo admin que los otros módulos.

---

## Pantallas / pestañas

### A) Misses (“Sin resultado”)
Lista de eventos `guide_no_results` (o equivalente ya logueado).

**Columnas mínimas:**
- Fecha/hora (timezone America/Argentina/Mendoza o la del panel)
- `raw_query` (lo que escribió el visitante)
- `expanded_queries` (lo que se intentó)
- `categories_tried` (si hubo)
- Contador / veces (si se agrupa por query normalizada)
- Estado: `pendiente` | `resuelto` | `ignorado`

**Acciones por fila:**
- **Crear expansión** → abre formulario prellenado con la `raw_query` como clave sugerida.
- Marcar **ignorado** (ruido, typos absurdos, pruebas).
- Marcar **resuelto** (cuando ya hay expansión y se verificó).

**Filtros:** rango de fechas, solo pendientes, búsqueda de texto.

**Agrupar (recomendado):** mismas queries normalizadas (minúsculas, sin “necesito/busco/quiero”) en una sola fila con `count`.

### B) Diccionario / expansiones
CRUD del mapa intención → Algolia.

**Campos por entrada:**
- `key` — intención (ej. `medico`)
- `aliases` — variantes del usuario (`médico`, `necesito médico`, `doctor`) opcionales
- `queries` — términos de búsqueda Algolia (`hospital`, `clinica`, `salud`)
- `categories` — facets exactos del índice (multi)
- `activo` — boolean
- `notas` — texto interno opcional
- `updated_at` / quién editó si el panel ya trackea usuarios

**Acciones:** crear, editar, desactivar, duplicar.  
**Validación:** `key` única; `queries` o `categories` al menos uno no vacío.

Al **guardar**, el runtime del chatbot debe leer este mapa en el próximo request (cache corta OK, TTL p.ej. 30–60s, o invalidación al guardar). **No** exigir redeploy para sumar un sinónimo.

### C) Copy y control
- Editar: `COPY_INTRO`, `COPY_NO_RESULTS`, `COPY_CTA_ANUNCIAR`
- Toggle **Pausar chatbot** (si pausado: el widget muestra mensaje fijo o se oculta según flag; documentar cuál).
- Readonly útil: modelo LLM configurado, nombre del índice Algolia (para ops).

### D) (Nice-to-have, no bloqueante MVP)
- Botón “Probar query” en admin: escribe una frase → muestra hits que devolvería el pipeline (sin LLM o con respuesta seca de hits).
- Export CSV de misses.

---

## Datos y contrato

### Persistencia
- Misses: tabla/colección durable (no solo logs de hosting). Campos alineados a la telemetría del instructivo de sinónimos.
- Expansiones: tabla o documento versionable; fuente de verdad del bot = **esta** store (o sync hacia el JSON que ya lea el bot; una sola fuente).
- Copy + pause: config key-value en la misma área admin.

### API interna (nombres orientativos)
- `GET /admin/chatbot/misses`
- `PATCH /admin/chatbot/misses/:id` (estado)
- `GET|POST|PATCH /admin/chatbot/expansions`
- `GET|PUT /admin/chatbot/settings`

Respetar el estilo de API del panel existente.

### Relación con Algolia Synonyms
- **MVP:** el mapa local alimenta el pipeline del chat (suficiente).
- **Plus:** si hay credenciales admin de Algolia, botón “Sincronizar synonyms” o doc en README de cómo pegarlos en la consola Algolia para que también mejore la **search bar**.
- No fallar el módulo si la sync a Algolia no está: el mapa local es obligatorio.

---

## UX (es-AR)
- Textos claros: “Sin resultado”, “Diccionario”, “Ajustes”.
- Desde un miss, el flujo feliz: *Crear expansión* → completar queries/categorías → Guardar → la fila de miss pasa a resuelto (o sugerirlo).
- Confirmación al pausar el chatbot.
- No exponer API keys de OpenAI/Algolia en la UI.

---

## Criterios de aceptación
1. En el panel aparece el módulo Chatbot/Asistente con las pestañas Misses, Diccionario y Ajustes.
2. Los `no_results` del asistente web se ven en Misses (no hace falta entrar a Vercel/logs).
3. Diego puede crear/editar una expansión desde un miss y **sin redeploy** el chat empieza a usarla (tras TTL de cache corto).
4. “necesito médico” (u otro miss real) se puede resolver agregando expansión desde el panel.
5. Pausar chatbot y editar copy funciona y se refleja en el sitio.
6. Mismos permisos/layout que el resto del panel.
7. README ops: URL del módulo, cómo realimentar, qué es mapa local vs synonyms Algolia.

## Fuera de alcance
- Reentrenar el modelo OpenAI / fine-tuning.
- Editar el índice completo de fichas (eso es otro módulo/catálogo).
- Bot de WhatsApp atención (backlog).
- Cambiar el diseño general del panel.

---

## Orden sugerido
1. Persistencia misses + expansions + settings.
2. Que el runtime del chat lea expansions desde esa store (reemplazar JSON estático si había).
3. UI Misses → Crear expansión.
4. UI Diccionario CRUD + Ajustes (copy/pause).
5. README + prueba E2E: miss → expansión → query OK.

---

## Prompt corto para pegar en Cursor
```
Implementá un módulo Admin "Chatbot / Asistente guía" en el panel de control existente de SR360, según instructivo-admin-chatbot-guia.md:

- Pestañas: Misses (guide_no_results), Diccionario (expansiones intención→Algolia), Ajustes (copy + pausar bot).
- Desde un miss, poder crear expansión; el chat debe usar el mapa sin redeploy (cache corta OK).
- Misma auth/layout que los otros módulos del panel.
- No fine-tuning; no tocar outbound WSP+IG; no admin aparte.
- Cumplir criterios de aceptación + README ops.

Diego dirige; solo lo declarado en el md.
```
