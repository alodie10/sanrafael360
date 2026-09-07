# Instructivo Cursor — Fix: guía no encuentra fichas obvias (sinónimos / query)

## Problema reportado
Query de usuario tipo “necesito médico” → el bot dice que no hay nada, pero en catálogo hay hospitales (y casos similares evidentes).

Hoy el flujo falla en el **retrieve** (Algolia), no solo en el texto del LLM. Ir arreglando palabra por palabra con redeploys no escala.

## Causa probable
1. El LLM (o el parser) manda a Algolia la query casi cruda: `médico`.
2. Los hits están indexados como `hospital`, `clínica`, `salud`, categoría “Salud”, etc.
3. Sin sinónimos / expansión / facet de categoría → 0 hits → el bot responde “no encontré”.

## Objetivo
Antes de consultar Algolia, **expandir** la intención del usuario a términos y filtros que existan en el índice. El LLM puede ayudar a elegir la categoría, pero **la verdad sigue siendo Algolia**.

## Qué implementar (MUST)

### 1. Mapa local de intención → búsqueda (config editable)
Archivo o tabla de config (JSON/YAML) versionada, editable sin redeploy de lógica si es posible (o al menos sin tocar el prompt):

```json
{
  "medico": {
    "queries": ["medico", "médico", "hospital", "clinica", "clínica", "salud"],
    "categories": ["Salud", "Hospitales", "Clínicas"]
  },
  "comer": {
    "queries": ["restaurant", "restaurante", "comida", "gastronomia"],
    "categories": ["Gastronomía", "Restaurantes"]
  }
}
```

- Claves en lenguaje natural (médico, dentista, gomería, cabañas, etc.).
- `queries`: términos a mandar a Algolia (OR / multiple queries).
- `categories`: facets reales del índice (nombres **exactos** como están en Algolia).

Diego irá cargando entradas; Cursor debe dejar el mecanismo genérico.

### 2. Pipeline de retrieve (orden fijo)
1. Normalizar texto (minúsculas, sin signos raros).
2. Match contra el mapa (keyword / LLM clasifica a una clave del mapa).
3. Si hay match:
   - Buscar en Algolia con **unión** de `queries` expandidas **y/o** filter por `categories`.
   - Preferir filter de categoría cuando el facet existe (más preciso).
4. Si no hay match en el mapa: query Algolia con el texto original + (opcional) 3–5 sinónimos que el LLM proponga **solo como keywords de búsqueda**, nunca como nombres de comercios inventados.
5. Si aún 0 hits: una reformulación automática (quitar “necesito”, “busco”, “quiero”) y reintentar **una** vez.
6. Recién ahí: “no encontré” + sugerir barra de search.

### 3. Algolia: sinónimos en el índice (recomendado)
Además del mapa en app, configurar **Synonyms** en Algolia para el índice de fichas, p.ej.:
- `medico`, `médico`, `hospital`, `clinica` ↔ equivalentes
- Igual para verticales fuertes de SR360

Así la **barra de search** también mejora, no solo el chat.

### 4. Telemetría de miss (MUST para no ir a ciegas)
Cuando `hits == 0`, loguear:
- `guide_no_results` con `raw_query`, `expanded_queries`, `categories_tried`

Diego revisa misses semanales y agrega filas al mapa (proceso ops, no bug eterno).

### 5. Tests de regresión (MUST)
Casos fijos que no pueden volver a romper:
- “necesito médico” → ≥1 hit de tipo hospital/salud (según datos reales del índice)
- “gomería” / “dónde comer” / al menos 3–5 queries obvias del catálogo SR360

Correr en CI o script pre-deploy.

## Qué NO hacer
- Hardcodear “si dice médico, devolver Hospital X” en el prompt.
- Dejar que el LLM invente hospitales si Algolia falla.
- Redeploy solo por agregar un sinónimo: el mapa debe ser datos/config.

## Criterios de aceptación
1. “necesito médico” (y variantes) devuelve hospitales/clínicas que ya están en Algolia.
2. Agregar un sinónimo nuevo = editar config/mapa (o synonym Algolia), no un if nuevo en el prompt.
3. Search bar se beneficia si se cargan synonyms en Algolia.
4. Todo `no_results` queda logueado con query cruda + expansión.
5. Tests de regresión verdes para el set mínimo acordado.

## Prompt corto para Cursor
```
Hay un bug de producto: queries obvias como "necesito médico" dan 0 resultados aunque hay hospitales en Algolia.

Implementá según instructivo-fix-guia-sinonimos-algolia.md:
- Capa de expansión intención→queries/categorías (config editable).
- Pipeline retrieve antes de redactar; sin inventar fichas.
- Synonyms en Algolia cuando sea posible (mejora también la search bar).
- Log de no_results + tests de regresión ("necesito médico", etc.).
- No ir caso por caso hardcodeado en el prompt.

Diego dirige; solo lo declarado en el md.
```
