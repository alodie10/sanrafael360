# 🤖 Reglas de Comportamiento — San Rafael 360

## 🔴 Regla de Ambientes — NO NEGOCIABLE

**TODO el desarrollo se hace en el ambiente local/dev. Solo Diego toca producción.**

- El agente NUNCA ejecuta comandos que afecten producción directamente (Railway, Strapi prod, Algolia prod index).
- El agente **NUNCA** ejecuta `git push` a `master`. Todos los push a producción los hace Diego manualmente.
- El agente propone los cambios, los construye en dev, los verifica, y luego Diego decide cuándo y cómo promover a prod.
- Cualquier script, migración o cambio de configuración se ejecuta primero en dev y se documenta antes de sugerir aplicarlo en prod.

## Modo Planning Obligatorio

**REGLA CRÍTICA**: Para CUALQUIER tarea de desarrollo en este proyecto, el agente DEBE:

1. **Siempre crear un plan primero** (`implementation_plan.md`) antes de escribir código o ejecutar comandos que modifiquen archivos.
2. **Esperar aprobación explícita** del usuario antes de pasar a la fase de ejecución.
3. **No ejecutar nada** hasta recibir una señal clara de "adelante", "ok", "procede", "aprobado" o equivalente.

### ✅ Tareas que NO requieren plan previo (ejecutar directo):
- Preguntas informativas ("¿cómo funciona X?", "¿dónde está Y?")
- Fixes de un solo archivo y una sola línea
- Comandos de lectura/diagnóstico (`cat`, `grep`, `ls`, logs)
- Correcciones de sintaxis o typos obvios señalados por el usuario

### ❌ Tareas que SIEMPRE requieren plan primero:
- Nuevos features o módulos
- Cambios en el schema de Strapi
- Modificaciones en múltiples archivos
- Cambios de arquitectura o de rutas
- Cualquier cosa que toque base de datos o índices de Algolia
- Deploys o promociones a producción

## Leer skills relevantes antes de ejecutar

Antes de cualquier cambio estructural, leer el módulo de directiva correspondiente en `docs/directives/` y el skill de plugin `sanrafael360/` que aplique.
