# Asistente guía SR360 — ops

Chat escrito en sanrafael360.com. Consulta el índice Algolia del directorio y redacta solo sobre hits reales. No reemplaza la barra de search. Spec: [instructivo-sprint-asistente-guia-web.md](./instructivo-sprint-asistente-guia-web.md).

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

## Pausar el asistente

En Vercel (frontend), sin cambiar código:

```
ASISTENTE_ENABLED=false
```

El widget no se monta y la API responde 503. Para volver: `true` o borrar la variable (default: habilitado).

Allowlist opcional (solo esas rutas muestran el widget):

```
ASISTENTE_PAGE_ALLOWLIST=/,/categoria,/negocios
```

## Copy editable

Variables de entorno del frontend (Vercel). Si no están, usan el default del código.

| Variable | Default |
|----------|---------|
| `COPY_INTRO` | Soy Rafi, tu guía en San Rafael 360. Preguntame qué necesitás… |
| `COPY_NO_RESULTS` | No encontré fichas para eso. Probá con otra zona o rubro, o usá la búsqueda de arriba. |
| `COPY_CTA_ANUNCIAR` | Si querés destacar tu negocio en SR360, escribinos acá. |
| `COPY_CTA_ANUNCIAR_URL` | `/contacto` |
| `MAX_RESULTS` | `3` |
| `PREMIUM_FIRST` | `true` |

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
- `guide_no_results`
- `guide_cta_anunciar`
- `guide_error`

