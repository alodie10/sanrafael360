# SDD-0006 — Sección de amenities en la ficha

| Campo | Valor |
| --- | --- |
| Estado | Implemented |
| Responsable | Diego Alonso |
| Fecha | 2026-10-13 |
| Tarea o commit relacionado | Rama `develop` |
| Reemplaza / reemplazado por | |

## Problema y resultado

### Problema

Los amenities quedaron vinculados, pero en la ficha se mezclan con las pastillas de categoría y no tienen ícono.

### Resultado buscado

La ficha muestra "Lo que ofrece este lugar": grilla de dos columnas, ícono Lucide y nombre, solo `tipo=facilidad`. Hasta 10, y "Mostrar todos" si hay más. Las pastillas del encabezado siguen siendo la categoría y los tags.

## Alcance

### Incluido

- Sección en la ficha premium y en la ficha de directorio.
- Ícono según el campo `icono`. Si no hay uno conocido, un círculo.
- El encabezado no lista amenities.
- En el editor, la nube muestra solo facilidades del rubro de la categoría (alojamiento, gastronomía o comercios), en orden alfabético. Las etiquetas de categoría no entran en esa nube, salvo las que el negocio ya tiene marcadas, para poder sacarlas.
- Si hay alguna etiqueta o facilidad marcada, el selector de categoría muestra el aviso y no cambia hasta desmarcarlas todas.

### Fuera de alcance

- Filtros del buscador.
- Desplegar el frontend a producción.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | La sección lista solo atributos `tipo=facilidad`, con ícono y nombre, en dos columnas. | Must |
| REQ-002 | Si hay más de 10, se ven 10 y un botón "Mostrar todos". | Must |
| REQ-003 | El encabezado no muestra amenities. | Must |
| REQ-004 | El editor de la ficha ofrece solo facilidades del rubro de la categoría, ordenadas alfabéticamente. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** Cabañas Elita **Cuando** se abre la ficha local contra producción **Entonces** la grilla muestra amenities con ícono y el encabezado solo la categoría. | Browser | Pasa: encabezado solo Cabañas. Grilla con íconos. |
| AC-002 | **Dado** más de 10 amenities **Cuando** se pulsa "Mostrar todos" **Entonces** aparecen el resto. | Browser | Pasa: 10, luego TV / DirecTV y Wifi. |

## Restricciones e invariantes

- No se cambia el contrato de Strapi.
- La ficha sigue leyendo `NEXT_PUBLIC_STRAPI_URL`.
- El estilo es CSS propio del componente, sobre el fondo oscuro de la ficha.

## Impacto y camino de llamada

- `getNegocioBySlug` pide también `icono`.
- `PlaceAmenities` se renderiza en la ficha premium y en el directorio.
- `BusinessHero` filtra `tipo=facilidad`.

## Plan de verificación

### Checks del agente

- Abrir Cabañas Elita en el frontend local apuntando a producción.
- Confirmar 10 ítems, el botón, y que al pulsarlo se ven los 12.
- Confirmar que el encabezado no repite Wifi ni Piscina.

### Checks de Diego

- En producción se ve después de desplegar el frontend.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | `PlaceAmenities.tsx` | Browser | Pendiente |
| REQ-002 / AC-002 | botón `place-amenities-more` | Browser | Pendiente |
| REQ-003 | `BusinessHero.tsx` | Browser | Pendiente |

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-13 | Implementado | OK de Diego a la ficha |
