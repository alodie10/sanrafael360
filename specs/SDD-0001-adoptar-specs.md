# SDD-0001 — Adoptar el desarrollo guiado por specs

| Campo | Valor |
| --- | --- |
| Estado | Verified |
| Responsable | Diego |
| Fecha | 2026-10-07 |
| Tarea o commit relacionado | Adopción del flujo de specs en el repositorio |
| Reemplaza / reemplazado por | — |

## Problema y resultado

### Problema

Los cambios de comportamiento se planificaban en documentos sueltos, sin un ciclo común de alcance, criterios y evidencia. Eso deja el “listo” sujeto a la memoria del chat.

### Resultado buscado

Un cambio de comportamiento tiene un spec en `specs/`, con requisitos, criterios de aceptación y evidencia, antes de darse por verificado. Las reglas de arquitectura y de ambiente que ya rigen el repo siguen mandando.

## Alcance

### Incluido

- Guía de agentes en la raíz que remite a las reglas vigentes y al flujo de specs.
- Proceso en `SPEC_DRIVEN_DEVELOPMENT.md`.
- Índice, plantilla y este spec de adopción.
- Ajuste de `.agents/AGENTS.md` para que el trabajo nuevo use el spec como plan.

### Fuera de alcance

- Cambios de código de frontend, backend o Strapi.
- Reescritura de features ya hechas como specs retroactivos.
- El plan histórico [`implementation_plan.md`](../implementation_plan.md).
- [`frontend/AGENTS.md`](../frontend/AGENTS.md).

### Supuestos y dependencias

- [`STANDARDS.md`](../STANDARDS.md), [`.cursorrules`](../.cursorrules), [`CLAUDE.md`](../CLAUDE.md) y [`.agents/AGENTS.md`](../.agents/AGENTS.md) siguen siendo la autoridad superior a este proceso.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | Existe una guía de agentes en la raíz que apunta a las reglas vigentes y al flujo de specs. | Must |
| REQ-002 | El proceso define estados, contenido obligatorio, flujo, trazabilidad, verificación y el orden de autoridad. | Must |
| REQ-003 | `specs/` tiene índice, plantilla y este spec, y el índice lista solo SDD-0001. | Must |
| REQ-004 | `.agents/AGENTS.md` indica que el plan del trabajo nuevo es el spec, conserva la espera de aprobación y las excepciones de una línea, y no pide un `implementation_plan.md` nuevo en la raíz. | Must |
| REQ-005 | El contenido ya publicado, las rutas públicas, las variables de entorno y CORS/CSP se mantienen salvo autorización explícita del spec de cada cambio. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** el repositorio **Cuando** un agente abre la guía de la raíz **Entonces** encuentra el enlace a `STANDARDS.md`, `CLAUDE.md`, `.cursorrules`, `.agents/AGENTS.md` y `SPEC_DRIVEN_DEVELOPMENT.md`. | Lectura de `AGENTS.md` | Pasa |
| AC-002 | **Dado** el proceso **Cuando** se revisan sus secciones **Entonces** cubre ciclo de vida, contenido, flujo, trazabilidad, verificación del agente y de Diego, contratos que se mantienen y conflictos. | Lectura de `SPEC_DRIVEN_DEVELOPMENT.md` | Pasa |
| AC-003 | **Dado** `specs/` **Cuando** se abre el índice **Entonces** lista SDD-0001 en `Verified` y enlaza la plantilla. | Lectura de `specs/README.md` y `specs/TEMPLATE.md` | Pasa |
| AC-004 | **Dado** `.agents/AGENTS.md` **Cuando** se lee el modo de planificación **Entonces** el plan del trabajo nuevo es un spec en `specs/` y el `implementation_plan.md` de la raíz queda como plan histórico. | Lectura de `.agents/AGENTS.md` | Pasa |
| AC-005 | **Dado** los documentos nuevos **Cuando** se busca vocabulario ajeno a este producto **Entonces** el proceso habla de Strapi, Next.js, Railway, Vercel, Playwright y los checks de Diego. | Revisión estática de los cinco archivos | Pasa |

## Restricciones e invariantes

- No se modifica código de aplicación ni el plan de WhatsApp en la raíz.
- `frontend/AGENTS.md` permanece intacto.
- La rama de trabajo sigue siendo `develop`. El agente no hace push a `master`.
- Este spec autoriza solo documentos de proceso y el párrafo de planificación en `.agents/AGENTS.md`.

## Impacto y camino de llamada

- Entrada y camino de llamada: un agente lee `AGENTS.md` o `.agents/AGENTS.md` antes de un cambio de comportamiento.
- Sistemas y archivos afectados: `AGENTS.md`, `SPEC_DRIVEN_DEVELOPMENT.md`, `specs/README.md`, `specs/TEMPLATE.md`, `specs/SDD-0001-adoptar-specs.md`, `.agents/AGENTS.md`.
- Contratos, contenido y configuración: ninguno de runtime.

## Plan de verificación

### Checks del agente

- Revisión estática de los archivos listados en el impacto.
- Confirmar que `implementation_plan.md` y `frontend/AGENTS.md` no forman parte del diff de comportamiento de producto.

### Checks de Diego

- Ninguno. Este cambio no toca Content Manager, producción ni Railway.

### Comparación de performance, si aplica

- No aplica.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | `AGENTS.md` | Enlaces a las reglas vigentes y al proceso | Pasa |
| REQ-002 / AC-002 | `SPEC_DRIVEN_DEVELOPMENT.md` | Secciones de ciclo, contenido, flujo, trazabilidad, verificación, contratos y conflictos | Pasa |
| REQ-003 / AC-003 | `specs/README.md`, `specs/TEMPLATE.md`, este archivo | Índice con SDD-0001 y plantilla presente | Pasa |
| REQ-004 / AC-004 | `.agents/AGENTS.md` | El spec es el plan del trabajo nuevo; excepciones y aprobación se mantienen | Pasa |
| REQ-005 / AC-005 | `SPEC_DRIVEN_DEVELOPMENT.md`, `specs/TEMPLATE.md` | Sección de contratos que se mantienen y checks de este repo | Pasa |

## Decisiones y preguntas abiertas

- El spec de un cambio nuevo reemplaza la creación de otro `implementation_plan.md` en la raíz. Los planes de módulo en `docs/modulos/` siguen disponibles para diseño técnico.
- No hay preguntas abiertas.

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-07 | Adopción inicial, estado Verified | Los documentos del proceso y el enlace en `.agents/AGENTS.md` quedaron escritos en el mismo cambio |
