# 🤖 Reglas de Comportamiento — San Rafael 360

## 🔴 Regla de Ambientes — NO NEGOCIABLE

**TODO el desarrollo se hace en el ambiente local/dev. Solo Diego toca producción.**

- El agente NUNCA ejecuta comandos que afecten producción directamente (Railway, Strapi prod, Algolia prod index).
- El agente **NUNCA** ejecuta `git push` a `master`. Todos los push a producción los hace Diego manualmente.
- **Rama de trabajo: `develop`**. Commits del agente van siempre en `develop`. Promoción a prod solo cuando Diego lo pida (`./promote.sh` + push `master` por Diego).
- Cualquier script, migración o cambio de configuración se ejecuta primero en dev y se documenta antes de sugerir aplicarlo en prod.

## Modo Planning Obligatorio

**REGLA CRÍTICA**: Para un cambio de comportamiento, el plan es un spec en `specs/`, según [`AGENTS.md`](../AGENTS.md) y [`SPEC_DRIVEN_DEVELOPMENT.md`](../SPEC_DRIVEN_DEVELOPMENT.md). El agente DEBE:

1. **Crear o actualizar el spec** (`specs/SDD-####-nombre-corto.md`) antes de escribir código de implementación o ejecutar comandos que modifiquen el producto.
2. **Esperar aprobación explícita** del usuario antes de pasar a la fase de ejecución. Con el alcance cerrado, el spec pasa a `Approved`.
3. **No ejecutar nada** hasta recibir una señal clara de "adelante", "ok", "procede", "aprobado" o equivalente.

`implementation_plan.md` en la raíz es el plan histórico de la migración a WhatsApp Cloud API. No se reescribe y no se crea otro en la raíz. Los planes en `docs/modulos/` siguen siendo diseño técnico; un spec puede enlazarlos.

### ✅ Tareas que NO requieren spec previo (ejecutar directo):
- Preguntas informativas ("¿cómo funciona X?", "¿dónde está Y?")
- Fixes de un solo archivo y una sola línea
- Comandos de lectura/diagnóstico (`cat`, `grep`, `ls`, logs)
- Correcciones de sintaxis o typos obvios señalados por el usuario
- Documentación que no cambia el comportamiento del producto ni una regla normativa

### ❌ Tareas que SIEMPRE requieren spec primero:
- Nuevos features o módulos
- Cambios en el schema de Strapi
- Modificaciones en múltiples archivos
- Cambios de arquitectura o de rutas
- Cualquier cosa que toque base de datos o índices de Algolia
- Deploys o promociones a producción

## Leer skills relevantes antes de ejecutar

Antes de cualquier cambio estructural, leer el módulo de directiva correspondiente en `docs/directives/` y el skill de plugin `sanrafael360/` que aplique.
