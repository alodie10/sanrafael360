# SDD-0003 — Slug de ficha al crear la mesa Prospector

| Campo | Valor |
| --- | --- |
| Estado | Implemented |
| Responsable | Diego Alonso |
| Fecha | 2026-10-09 |
| Tarea o commit relacionado | Rama `develop` |
| Reemplaza / reemplazado por | |

## Problema y resultado

### Problema

Al guardar Prospector en Pagos, el sistema copia el slug de la ficha como slug de la mesa CRM. Gen Social tiene `gen_social`. Esa mesa solo acepta letras, números y guiones, y la operación responde `slug inválido`. La mesa no se crea.

### Resultado buscado

Guardar una fecha de Prospector crea la mesa aunque el slug de la ficha tenga guión bajo u otro carácter que no sea letra, número o guion. El slug de la mesa es la forma normalizada (`gen_social` → `gen-social`). La ficha no cambia.

## Alcance

### Incluido

- Normalizar el slug de la ficha antes de validar el slug de la mesa.
- Si después de normalizar no queda nada usable, usar `comercio`.
- Test del caso `gen_social`.

### Fuera de alcance

- Renombrar el slug público de la ficha.
- Cambiar el mensaje, el cupo o el modo `agenda`.
- Reintentar en producción el guardado de Gen Social.

### Supuestos y dependencias

- El dueño de la ficha ya tiene email. Sin email el error sigue siendo el de dueño, no el de slug.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | Un slug de ficha con guión bajo produce un slug de mesa con guiones y la mesa se crea. | Must |
| REQ-002 | El slug público de la ficha queda igual. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** un negocio con slug `gen_social` y dueño con email, **cuando** se activa Prospector, **entonces** la mesa queda con slug `gen-social` y modo `agenda`. | Test unitario `crm-tenant`. | Pasa |
| AC-002 | **Dado** el mismo caso, **cuando** se crea la mesa, **entonces** no se escribe el slug del negocio. | Revisión del camino `syncProspectorTenant`. | Pasa |

## Restricciones e invariantes

- La lógica queda en `crm-tenant`, no en el controlador de Pagos.
- El tenant `sr360` sigue prohibido como mesa prestada.
- Cupo, modo `agenda` y dueño no cambian.

## Impacto y camino de llamada

- Entrada: `PUT /api/negocios/admin/vigencia/:documentId` → `updateProspectorVigencia` → `syncProspectorTenant` → `pickAgendaSlug`.
- Archivos: `backend/src/api/crm/crm-tenant.ts`, `backend/tests/unit/crm-tenant.test.ts`.
- Contrato: la respuesta de error `slug inválido` deja de ocurrir por guión bajo en el slug de la ficha.

## Plan de verificación

### Checks del agente

- Test unitario `crm-tenant`.
- Revisión estática del camino de slug.

### Checks de Diego

- En producción, después del deploy, volver a guardar la fecha de Prospector de Gen Social. El aviso de error no debe aparecer y el CRM debe listar la mesa Gen Social.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | `pickAgendaSlug` / `slugFromNombre` | `crm-tenant.test.ts`: 14 tests, pasa | Hecho |
| REQ-002 / AC-002 | `syncProspectorTenant` no actualiza el negocio | El camino solo crea `crm-comercio` | Hecho |

## Decisiones y preguntas abiertas

- El slug de la mesa es solo interno del CRM. La ficha sigue en `/negocios/gen_social`.

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-09 | Aprobado | Gen Social falla al guardar Prospector con `slug inválido`. |
| 2026-10-09 | Implementado | `gen_social` pasa a `gen-social` antes de crear la mesa. |
