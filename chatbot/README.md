# Asistente guía SR360 — ops

Chat escrito en sanrafael360.com. Consulta el índice Algolia del directorio y redacta solo sobre hits reales. No reemplaza la barra de search. Spec: [instructivo-sprint-asistente-guia-web.md](./instructivo-sprint-asistente-guia-web.md). Sinónimos / retrieve: [instructivo-fix-guia-sinonimos-algolia.md](./instructivo-fix-guia-sinonimos-algolia.md). Panel ops: [instructivo-admin-chatbot-guia.md](./instructivo-admin-chatbot-guia.md).

## Mapa de intención (sinónimos)

Fuente de verdad del chat: **Diccionario** en `/portal/admin` → Chatbot (colección Strapi `guide-expansion`). El runtime lo lee con cache de 45s; no hace falta redeploy para un sinónimo nuevo.

Fallback si Strapi no responde: `frontend/src/lib/asistente/intent-map.json`. Copia para Synonyms de Algolia (search bar): `backend/src/api/negocio/data/guide-intent-map.json`. Esas dos copias JSON tienen que ser iguales (test unitario). El seed de bootstrap carga el JSON al Diccionario **solo si la colección está vacía**.

Cada clave tiene `queries` (unión a Algolia) y `categories` (nombres exactos del índice). El pipeline: mapa → Algolia → redactar. Si Algolia da 0, se persiste un miss (`guide_no_results`) visible en el panel.

## Dónde está

- Widget flotante: layout del frontend (`GuideChatWidget`). Oculto en `/portal*`, `/login`, `/registro` y en `/asistente` (ahí va la página llena).
- Página: `/asistente`
- API: `POST /api/asistente` y `GET /api/asistente` (copy + enabled)

## Índice Algolia

Mismo índice que la search bar:

| Entorno | Variable | Default |
|---------|----------|---------|
| Frontend search | `NEXT_PUBLIC_ALGOLIA_INDEX_NAME` | `negocios` |
| Strapi sync | `ALGOLIA_INDEX_NAME` | `negocios` en production, `negocios_dev` en el resto |

Keys de búsqueda (públicas): `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`.

## Panel Admin (Chatbot / Asistente guía)

URL: `/portal/admin` → **Chatbot** (misma sesión admin que el resto del panel).

Pestañas:

1. **Sin resultado** — misses agrupados por query normalizada (`count`). Desde una fila: crear expansión (prellena key/aliases), marcar resuelto o ignorar.
2. **Diccionario** — CRUD del mapa intención → queries/categorías Algolia. El chat lo usa sin redeploy (TTL ~45s).
3. **Ajustes** — copy (intro, sin resultados, CTA anunciar) y **Pausar chatbot**. Confirmación al pausar. No muestra API keys. Readonly: modelo LLM e índice Algolia.

### Cómo realimentar

1. Un visitante pregunta algo que da 0 hits → queda un miss en **Sin resultado**.
2. **Crear expansión** → key (ej. `medico`), aliases, queries Algolia y/o categorías exactas del índice → Guardar.
3. El miss pasa a `resuelto`. En menos de un minuto el chat usa la expansión.
4. Ejemplo: “necesito médico” se resuelve con queries `hospital` / `clinica` y categoría `Salud y Bienestar` (el seed ya lo trae).

### Mapa local vs synonyms Algolia

| Qué | Dónde | Para qué |
|-----|--------|----------|
| **Mapa vivo (ops)** | Panel Diccionario / Strapi `guide-expansion` | Retrieve del chat. Cambios sin redeploy. |
| **Fallback JSON** | `frontend/src/lib/asistente/intent-map.json` | Si Strapi no responde. También seed inicial. |
| **Synonyms Algolia** | `backend/src/api/negocio/data/guide-intent-map.json` → consola Algolia | Search bar del sitio, no el chat. Pegar a mano; el módulo no falla si no hay sync. |

## Pausar el asistente

**Desde el panel:** Ajustes → Pausar chatbot. Efecto: se oculta el widget, `/asistente` muestra copy de pausa, `GET/POST /api/asistente` responde 503. Fórmula: `enabled = ASISTENTE_ENABLED && !paused`.

**Kill switch de entorno** (Vercel, sin panel):

```
ASISTENTE_ENABLED=false
```

El widget no se monta y la API responde 503 aunque el panel no esté pausado. Para volver: `true` o borrar la variable (default: habilitado). El pause del panel no reemplaza este flag; son capas.

Allowlist opcional (solo esas rutas muestran el widget):

```
ASISTENTE_PAGE_ALLOWLIST=/,/categoria,/negocios
```

## Copy editable

Prioridad: **Ajustes del panel** (Strapi) → si el campo está vacío, variables de entorno del frontend (Vercel) → default del código.

| Variable | Default |
|----------|---------|
| `COPY_INTRO` | Soy Rafi, tu guía en San Rafael 360. Preguntame qué necesitás… |
| `COPY_NO_RESULTS` | No encontré fichas para eso. Probá con otra zona o rubro, o usá la búsqueda de arriba. |
| `COPY_CTA_ANUNCIAR` | Si querés destacar tu negocio en SR360, escribinos acá. |
| `COPY_CTA_ANUNCIAR_URL` | `/contacto` |
| `MAX_RESULTS` | `3` |

Los premium que coinciden con la búsqueda van siempre primero (listado y chat). `PREMIUM_FIRST` quedó deprecado: el ranking ya no lo apaga.

`OPENAI_API_KEY` (server-only) es obligatorio para extraer filtros y redactar. Si falta o falla OpenAI, se usa plantilla sobre los hits de Algolia: nunca se inventan fichas.

## Campos del índice (CTAs)

Premium ya entra en el ranking Algolia (`customRanking: desc(is_premium)`).

No hay faceta `zona`: la query a Algolia es **solo el rubro** (nombre, categoría, keywords y **descripción**). Después se descartan hits que no coincidan con ese rubro en nombre, descripción o una categoría simple (las mixtas tipo “Talleres - Gomerías” no alcanzan). Si hay zona, se filtra dirección/nombre. Un follow-up tipo “otro lugar cercano” **no cambia la necesidad**: sigue buscando gomería, no una bodega.

La redacción usa un extracto plano de la descripción (sin HTML) y no inventa horarios ni precios.

CTAs WhatsApp / Instagram **solo** si el hit trae dato. Campos mínimos agregados al objeto Algolia:

- `whatsapp`
- `instagram_username`

Las fichas ya publicadas no muestran esos CTAs hasta un reindex (`reindexAllPublishedNegocios` en Strapi / sync por publish). No reindexar producción desde el agente.

## Analytics

Eventos custom en Meta Pixel (`trackCustom`):

- `guide_chat_opened`
- `guide_query`
- `guide_results_shown` (params `n`, `premium_n`)
- `guide_no_results` (params `raw_query`, `expanded_queries`, `categories_tried`; también `console.info` en el server)
- `guide_cta_anunciar`
- `guide_error`

