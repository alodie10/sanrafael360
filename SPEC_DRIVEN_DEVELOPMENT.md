# Desarrollo guiado por specs

Estas reglas convierten un cambio previsto en un resultado acordado, implementado y verificado. Aplican a features, bugs, refactors, cambios de schema o de API pública, cambios de arquitectura y trabajo de performance.

Una edición solo de documentación, que no cambia el comportamiento del producto ni una regla normativa, no necesita spec.

Este archivo define el proceso. [`STANDARDS.md`](STANDARDS.md), [`.cursorrules`](.cursorrules), [`CLAUDE.md`](CLAUDE.md) y [`.agents/AGENTS.md`](.agents/AGENTS.md) definen las restricciones permanentes. Un spec en `specs/` define el comportamiento pedido y los criterios de aceptación de un cambio cohesivo.

## Ubicación y ciclo de vida

- Los specs activos y cerrados viven en `specs/`. Cuando un subsistema acumula varios, se agrupan en `specs/<subsistema>/` con su propio índice.
- Un spec cubre un cambio cohesivo. Si el comportamiento previsto cambia, se actualiza ese spec.
- El nombre es `SDD-####-nombre-corto.md`, con el siguiente ID numérico libre.
- Cada spec tiene un estado: `Draft`, `Approved`, `Implemented`, `Verified` o `Superseded`.
- `Approved` significa que el alcance, los requisitos y los criterios de aceptación están cerrados y se puede implementar. Un pedido explícito de implementar un alcance ya claro vale como aprobación, y el spec igual registra ese alcance.
- `Implemented` significa que el código y la documentación del cambio están en el repo, y que todavía falta evidencia de uno o más criterios.
- `Verified` significa que cada criterio tiene un resultado registrado, o un resultado manual explícito de Diego.
- `Superseded` significa que otro spec es la fuente de verdad. El spec viejo enlaza al que lo reemplaza.
- Un spec no pasa a `Verified` si falta un check de Diego que el plan de verificación marcó como obligatorio: Content Manager, login de producción, Railway, o el escenario manual que el agente no puede correr.

La plantilla está en [`specs/TEMPLATE.md`](specs/TEMPLATE.md). El índice y los patrones de prompt están en [`specs/README.md`](specs/README.md).

## Contenido obligatorio

Cada spec de feature o de bug incluye:

1. **Identidad y estado.** ID, título, estado, responsable, fecha y tarea o commit relacionado cuando exista.
2. **Problema y resultado.** Quién lo sufre, qué resultado observable lo resuelve y por qué hace falta el cambio.
3. **Alcance.** Comportamiento incluido, exclusiones explícitas, supuestos y dependencias.
4. **Requisitos.** Enunciados `REQ-###` entendibles y comprobables por separado.
5. **Criterios de aceptación.** Escenarios `AC-###` con condición de pasa o falla. Given/When/Then cuando aclara el comportamiento.
6. **Restricciones e invariantes.** Qué puede cambiar y qué se mantiene: capas de [`STANDARDS.md`](STANDARDS.md), contenido de Strapi, rutas públicas, variables de entorno, CORS/CSP, contratos de API y datos ya publicados.
7. **Impacto y trazabilidad.** Camino de llamada, archivos y sistemas afectados, contratos, y el mapa de cada requisito y criterio hacia el código y la evidencia.
8. **Plan de verificación.** Checks del agente y checks de Diego, separados. Un cambio de performance incluye el mismo escenario antes y después, y las métricas que se van a comparar.
9. **Decisiones e historial.** Decisiones cerradas, preguntas abiertas y cada actualización relevante del spec.

Un bug incluye un criterio de regresión que fallaba antes del arreglo. Un trabajo de performance presenta los hallazgos priorizados y espera la aprobación de Diego antes de implementarlos.

## Flujo

1. Clasificar el pedido: feature, bug, refactor, cambio de datos o API, arquitectura, performance, o documentación.
2. Crear o actualizar el spec antes de editar código de implementación. Leer las guías vigentes y anotar sus restricciones en el spec.
3. Definir el resultado observable, el alcance, los requisitos numerados, los criterios, las invariantes, el camino afectado y el plan de verificación.
4. Pasar el spec a `Approved` antes de implementar. En performance, primero van los hallazgos y la aprobación explícita.
5. Implementar solo el alcance aprobado. Si cambian el comportamiento, el contrato de datos o los criterios, se actualiza el spec y su estado de aprobación antes de ampliar la implementación.
6. En el mismo cambio, actualizar los contratos, las invariantes y los puntos de llamada que el spec exige.
7. Correr los checks del agente. Pedir a Diego los checks que le corresponden y registrar el resultado que él informe.
8. Completar la tabla de trazabilidad y pasar el spec a `Verified` solo cuando cada `REQ-###` y cada `AC-###` tiene evidencia.

## Trazabilidad

- Cada `REQ-###` apunta al menos a un lugar de implementación y a un resultado de verificación.
- Cada `AC-###` identifica la evidencia de pasa o falla, incluido el escenario manual cuando el agente no puede ejecutarlo.
- Un cambio que introduce un contrato de arquitectura, una invariante o un límite de caché actualiza la guía permanente que corresponda y enlaza esa actualización desde el spec.
- Un cambio que retira un comportamiento nombra el contrato anterior y el que lo reemplaza.
- Las guías permanentes describen reglas reutilizables. El spec describe por qué este cambio hace falta y cómo se juzga que terminó.
- Cuando un spec queda `Superseded`, se conserva su registro de verificación y se enlaza el reemplazo.

## Límites de verificación

El agente corre la revisión estática, y cuando el cambio lo amerita el typecheck, el lint, el flujo afectado en el browser y Playwright si el cambio toca tests E2E. Diego corre Content Manager, el login de producción, Railway y cualquier escenario que el spec marque como manual.

El spec separa esos dos tipos de evidencia. Un check que no se corrió permanece pendiente.

## Contratos que se mantienen

Salvo que el spec del cambio lo autorice de forma explícita, se mantienen:

- El contenido ya publicado en Strapi y la forma en que el frontend lo lee.
- Las rutas públicas del sitio y de la API.
- Las variables de entorno obligatorias de [`STANDARDS.md`](STANDARDS.md).
- La alineación de CORS y CSP descrita en [`CLAUDE.md`](CLAUDE.md).

El desarrollo sigue en local, en la rama `develop`. El agente no promociona a producción.

## Conflictos

El orden de autoridad es:

1. [`STANDARDS.md`](STANDARDS.md) y [`.cursorrules`](.cursorrules).
2. [`CLAUDE.md`](CLAUDE.md) y [`.agents/AGENTS.md`](.agents/AGENTS.md).
3. Este archivo.
4. El spec `specs/SDD-####` del cambio en curso.

Si el spec choca con un documento de mayor autoridad, se resuelve el choque antes de codear.
