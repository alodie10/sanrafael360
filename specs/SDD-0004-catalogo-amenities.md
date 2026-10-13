# SDD-0004 — Catálogo de amenities

| Campo | Valor |
| --- | --- |
| Estado | Implemented |
| Responsable | Diego Alonso |
| Fecha | 2026-10-13 |
| Tarea o commit relacionado | Rama `develop` |
| Reemplaza / reemplazado por | |

## Problema y resultado

### Problema

Los atributos actuales son tags de rubro. La ficha no tiene una sección de amenities con ícono, y no hay forma de saber si Wifi aplica a alojamiento, gastronomía o comercios sin duplicar el nombre.

### Resultado buscado

Existe un catálogo único de amenities (`tipo=facilidad`) con ícono Lucide y rubros. Wifi, Accesible y el resto de los comunes son un solo registro. Ningún nombre coincide con un tag ya existente.

## Alcance

### Incluido

- Campo `rubros` (JSON) en `api::atributo`.
- 33 amenities, una sola vez, con los íconos pedidos.
- Semilla idempotente que crea los que faltan y no pisa un tag existente.
- Carga en producción de nombre, slug, tipo e ícono.

### Fuera de alcance

- Etiquetado automático de negocios.
- Sección "Lo que ofrece este lugar" y checkboxes del portal.
- Cambiar `Amigable lgbtq+` de tag a ambiente.
- Borrar tags de rubro.

### Supuestos y dependencias

- El Strapi que está en Railway todavía no tiene la columna `rubros`. El nombre, el tipo y el ícono se cargan ya. `rubros` queda en el esquema del repo y lo completa la semilla en el próximo arranque que incluya este código.
- Los íconos son los nombres kebab-case de Lucide 0.446.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | Cada amenity es un `api::atributo` con `tipo=facilidad` e `icono` Lucide. | Must |
| REQ-002 | Ningún `nombre` repite un atributo ya existente. Los comunes no se duplican. | Must |
| REQ-003 | `rubros` es un JSON con `alojamiento`, `gastronomia` y/o `comercios`. | Must |
| REQ-004 | La semilla es idempotente y no cambia un atributo cuyo `tipo` no sea `facilidad`. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** el catálogo **Cuando** se consulta producción **Entonces** hay 33 atributos `tipo=facilidad` con ícono y sin choque de nombre. | API pública | Pasa: 109 atributos, 33 facilidad, 76 tags. Wifi sin negocios. |
| AC-002 | **Dado** Wifi y Cochera **Cuando** se lee el catálogo **Entonces** Wifi está en los tres rubros y Cochera solo en alojamiento. Estacionamiento no incluye alojamiento. | Catálogo y test | Pasa en el catálogo del repo. La API aún no devuelve `rubros`. |
| AC-003 | **Dado** un tag existente con el mismo slug **Cuando** corre la semilla **Entonces** ese tag no se modifica. | Código de `ensureAmenityCatalog` | Implementado. No corrió en producción: el bootstrap entra con el deploy. |

## Restricciones e invariantes

- No se borran atributos ni relaciones de negocios.
- El slug de los tags existentes no se modifica.
- La lógica vive en el servicio del catálogo. El bootstrap solo lo invoca.
- Producción de Railway no se promociona a `master` desde este cambio.

## Impacto y camino de llamada

- Entrada y camino de llamada: bootstrap de Strapi → `ensureAmenityCatalog`.
- Sistemas y archivos afectados: esquema de atributo, servicio del catálogo, tipos generados.
- Contratos, contenido y configuración: `GET /api/atributos` pasa a devolver amenities. `rubros` aparece en la API cuando el backend desplegado incluye el campo.

## Plan de verificación

### Checks del agente

- Revisión del catálogo contra los nombres publicados.
- Conteo en la API de producción después de la carga.
- Test de unidad del catálogo cuando el entorno tenga dependencias.

### Checks de Diego

- En el Content Manager, filtrar atributos por tipo Facilidad y ver ícono. `rubros` se ve después del deploy de este backend.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | `amenity-catalog.json`, carga en producción | API: 33 `facilidad` | Hecho |
| REQ-002 / AC-002 | `amenity-catalog.ts` | Catálogo: Wifi en 3 rubros, Cochera solo alojamiento | Hecho en repo |
| REQ-003 | `schema.json` `rubros` | Columna pendiente del deploy | En el código |
| REQ-004 / AC-003 | `ensureAmenityCatalog` | No pisa `tipo` distinto de `facilidad` | En el código |

## Decisiones y preguntas abiertas

- `rubros` es JSON y no un enum múltiple: Strapi 5 no tiene enum múltiple nativo.
- Cochera y Estacionamiento son dos amenities. Los dos usan el ícono `car`.
- `Amigable lgbtq+` sigue como tag hasta un OK aparte.

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-13 | Aprobado e implementado | OK de Diego al catálogo |
