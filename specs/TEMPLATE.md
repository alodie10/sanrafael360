# SDD-#### — Título corto del cambio

| Campo | Valor |
| --- | --- |
| Estado | Draft |
| Responsable | <!-- persona o equipo --> |
| Fecha | <!-- AAAA-MM-DD --> |
| Tarea o commit relacionado | <!-- opcional --> |
| Reemplaza / reemplazado por | <!-- opcional --> |

## Problema y resultado

### Problema

<!-- Qué problema hay, quién lo sufre y por qué importa. -->

### Resultado buscado

<!-- El resultado observable. -->

## Alcance

### Incluido

- <!-- ... -->

### Fuera de alcance

- <!-- ... -->

### Supuestos y dependencias

- <!-- ... -->

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | <!-- entendible y comprobable por separado --> | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** ... **Cuando** ... **Entonces** ... | <!-- estática, browser, Playwright o manual --> | Pendiente |

## Restricciones e invariantes

- <!-- Reglas de STANDARDS.md, CLAUDE.md y .agents/AGENTS.md que aplican. -->
- <!-- Qué se mantiene: contenido Strapi, rutas públicas, variables de entorno, CORS/CSP, contratos de API. -->
- <!-- Qué este spec autoriza a cambiar. -->

## Impacto y camino de llamada

- Entrada y camino de llamada: <!-- ... -->
- Sistemas y archivos afectados: <!-- ... -->
- Contratos, contenido y configuración: <!-- ... -->

## Plan de verificación

### Checks del agente

- Revisión estática de los archivos del cambio.
- Typecheck y lint cuando el cambio los amerita.
- Flujo afectado en el browser cuando hay UI.
- Playwright cuando el cambio toca tests E2E.

### Checks de Diego

- <!-- Escenario reproducible, resultado esperado y evidencia. Content Manager, login de producción o Railway cuando apliquen. -->

### Comparación de performance, si aplica

- Escenario antes y después: <!-- el mismo escenario y la misma carga -->
- Métricas: <!-- tiempo, requests, peso, errores -->
- Aprobación: <!-- hallazgos presentados y aprobación de Diego antes de implementar -->

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | <!-- archivo, tipo o método --> | <!-- check o resultado de Diego --> | Pendiente |

## Decisiones y preguntas abiertas

- <!-- ... -->

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| <!-- AAAA-MM-DD --> | Borrador inicial | <!-- ... --> |
