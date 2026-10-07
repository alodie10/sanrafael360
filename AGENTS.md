# Guía de agentes — San Rafael 360

Este archivo agrega el flujo de desarrollo guiado por specs. La arquitectura, el ambiente y la operación siguen definidos en los documentos vigentes.

## Reglas vigentes

Antes de un cambio significativo, leer en este orden:

1. [`STANDARDS.md`](STANDARDS.md) y [`.cursorrules`](.cursorrules): capas, resiliencia, validación, UI y restricciones de Strapi 5.
2. [`CLAUDE.md`](CLAUDE.md) y [`.agents/AGENTS.md`](.agents/AGENTS.md): desarrollo en local, rama `develop`, y producción solo la toca Diego.
3. El módulo que corresponda en `docs/directives/` y el skill de `sanrafael360/` cuando el cambio sea estructural.

Si este archivo o un spec en `specs/` contradice esos documentos, el trabajo se detiene y la contradicción se resuelve antes de escribir código.

## Desarrollo guiado por specs

Para un feature, un bug, un refactor, un cambio de datos o de API, un cambio de arquitectura o un trabajo de performance, seguir [`SPEC_DRIVEN_DEVELOPMENT.md`](SPEC_DRIVEN_DEVELOPMENT.md). El spec aplicable en `specs/` se crea o se actualiza antes de modificar código de implementación.

- [`specs/README.md`](specs/README.md) define el ciclo de estados, el índice y los patrones de prompt.
- [`specs/TEMPLATE.md`](specs/TEMPLATE.md) es la plantilla de un spec nuevo.
- Un spec aprobado define el resultado observable, el alcance y lo que queda fuera, los requisitos, los criterios de aceptación, las invariantes y la verificación.
- Un pedido corto puede citar el ID del spec aprobado. Un pedido cuya aceptación es ambigua se escribe primero como spec en `Draft`.
- Si cambian el comportamiento, un contrato público o la verificación esperada, el spec se actualiza en el mismo cambio.
- El contrato del cambio es el comportamiento observable. El detalle de implementación no lo reemplaza.

## Qué no necesita spec

- Preguntas, diagnóstico de solo lectura, typos y correcciones de una sola línea en un solo archivo.
- Documentación que no cambia el comportamiento del producto ni una regla normativa.

## Planes que ya existen

[`implementation_plan.md`](implementation_plan.md) en la raíz es el plan histórico de la migración a WhatsApp Cloud API. Permanece como está. Los planes en `docs/modulos/` siguen siendo diseño técnico de un módulo; un spec puede enlazarlos.

Para trabajo nuevo que cambie comportamiento, el plan es el spec en `specs/`. No se crea otro `implementation_plan.md` en la raíz.
