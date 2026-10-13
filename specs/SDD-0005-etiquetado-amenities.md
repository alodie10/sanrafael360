# SDD-0005 — Etiquetado automático de amenities

| Campo | Valor |
| --- | --- |
| Estado | Implemented |
| Responsable | Diego Alonso |
| Fecha | 2026-10-13 |
| Tarea o commit relacionado | Rama `develop` |
| Reemplaza / reemplazado por | |

## Problema y resultado

### Problema

El catálogo de amenities existe, pero las 1263 fichas no están vinculadas. Cargarlas a mano no escala.

### Resultado buscado

Un script idempotente propone amenities a partir de la categoría, los tags, la descripción y las reseñas. Por defecto no escribe. `--apply` suma solo las de confianza alta. Las dudosas quedan en un CSV para aprobar y aplicar después.

## Alcance

### Incluido

- Rubro deducido de la categoría y de los tags.
- Diccionario en español, negaciones y confianza.
- Los casos ambiguos quedan para un modelo: si el modelo dice que no, no se proponen; si dice que sí, siguen siendo dudosas.
- CSV de revisión. `--apply` y `--apply-approved`.

### Fuera de alcance

- La sección de la ficha y los checkboxes del portal.
- Sincronizar reseñas de Google que todavía no están en la ficha.
- Borrar vínculos existentes.

### Supuestos y dependencias

- La descripción genérica "Negocio importado desde Google Maps..." no cuenta como evidencia.
- Una mención solo en reseñas es dudosa. Una palabra ambigua en la descripción también.
- No hay API key de modelo en el entorno. El script acepta un JSON de decisiones. Sin ese archivo, lo ambiguo queda dudoso.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | El modo por defecto es dry-run y escribe CSV con negocio_id, nombre, rubro, amenity, confianza y evidencia. | Must |
| REQ-002 | `--apply` vincula solo confianza alta, sin borrar relaciones. | Must |
| REQ-003 | "sin cochera" y "no se aceptan mascotas" no se aplican. "vajilla de cerámica artesanal" no entra como Vajilla de alta. | Must |
| REQ-004 | Lo dudoso se aplica solo con `--apply-approved` sobre el CSV que quede después de la revisión. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** una cabaña con pileta en la descripción **Cuando** corre el tagger **Entonces** Piscina queda en alta. | Test | Pasa |
| AC-002 | **Dado** "sin cochera" o una reseña como única fuente **Cuando** corre el tagger **Entonces** no entra en `--apply`. | Test | Pasa |
| AC-003 | **Dado** el script sin `--apply` **Cuando** corre contra producción **Entonces** no inserta vínculos y deja los CSV. | Corrida | Pasa: 0 vínculos de facilidad. 152 altas, 208 dudosas. |

## Restricciones e invariantes

- No se borran atributos ni relaciones.
- El script vive fuera del request path. La decisión de cada ficha es una función pura.
- Producción solo cambia con `--apply` o `--apply-approved`.

## Impacto y camino de llamada

- Entrada: `backend/scripts/tag-amenities.ts`.
- Lee negocios publicados, categorías, tags, reseñas y `google_reviews`.
- Escribe CSV en `tmp/amenity-tags/`, carpeta que no se commitea.

## Plan de verificación

### Checks del agente

- Tests del tagger.
- Una corrida dry-run y el resumen de altas, dudosas y negadas.

### Checks de Diego

- Revisar `tmp/amenity-tags/alta.csv` y `dudosas.csv` antes de pedir `--apply`.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-003 | `scripts/tag-amenities.ts` | Dry-run | Pendiente |
| REQ-002 / REQ-004 | `applyLinks` | Código, sin ejecutar | Pendiente |
| REQ-003 / AC-001 / AC-002 | `amenity-tagger.ts` | Test | Pendiente |

## Decisiones y preguntas abiertas

- Cochera en un alojamiento es Cochera. Cochera o estacionamiento en gastronomía o comercios es Estacionamiento.
- El modelo no sube una duda a alta. Solo puede rechazarla.

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-13 | Aprobado | OK de Diego al etiquetado en seco |
