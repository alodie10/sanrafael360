# WORKFLOW: /refactor-pro
> **Comando:** `/refactor-pro`
> **Ubicación:** `.agent/workflows/refactor-pro.md`

## Descripción
Refactorización sistemática y completa de un proyecto Node.js/Express existente. Aplica todos los estándares definidos en `GEMINI.md`: arquitectura en capas, manejo de errores, validación, seguridad y código limpio.

**Duración estimada:** Proyecto pequeño (< 10 rutas): 20-40 min | Proyecto mediano: 1-3 hs

---

## Instrucciones para el Agente

Ejecutar los siguientes pasos **en orden**. No pasar al siguiente hasta completar el actual. Generar un artefacto de reporte al finalizar cada fase.

---

## FASE 1: Auditoría y Mapeo (No tocar código aún)

### 1.1 — Inventario del proyecto
Escanear todo el proyecto y documentar:
- Todas las rutas definidas (método HTTP + path)
- Todos los archivos y su responsabilidad actual
- Dependencias en `package.json`
- Versión de Node.js en uso

### 1.2 — Detectar violaciones de arquitectura
Para cada archivo, clasificar:

| Archivo | Capa Actual | Capa Correcta | Violación Detectada |
|---------|-------------|---------------|---------------------|
| ...     | ...         | ...           | ...                 |

Violaciones a buscar:
- Lógica de negocio en rutas
- Queries a DB en controllers
- Imports de `express` en services
- Lógica duplicada entre archivos

### 1.3 — Detectar problemas de resiliencia
- `catch` vacíos o silenciosos
- Async routes sin asyncHandler ni try/catch
- Promesas flotantes (sin await ni .catch)
- Ausencia de errorHandler global
- Ausencia de handlers de proceso (unhandledRejection, uncaughtException)

### 1.4 — Detectar problemas de seguridad
- Ausencia de `helmet`
- Ausencia de rate limiting
- Secrets hardcodeados
- Entrada de usuario sin validar
- Mensajes de error que exponen stack traces en producción

### 1.5 — Generar Artefacto: Reporte de Auditoría
Crear un documento con todos los hallazgos ordenados por prioridad:
- 🔴 CRÍTICO: puede causar crash o brecha de seguridad
- 🟡 IMPORTANTE: degrada mantenibilidad
- 🟢 MEJORA: buenas prácticas

**Esperar aprobación del usuario antes de continuar.**

---

## FASE 2: Infraestructura Base

Crear/verificar que existen estos archivos antes de refactorizar:

```
src/
├── utils/
│   ├── errors.js          ← Jerarquía de errores (ver @error-resilience)
│   └── asyncHandler.js    ← Wrapper para async controllers
└── middlewares/
    └── errorHandler.js    ← Middleware global de errores
```

Si no existen, crearlos siguiendo las plantillas de `@error-resilience`.

Agregar en `app.js` (o el archivo principal):
- Handlers de `unhandledRejection` y `uncaughtException`
- Middleware `helmet`
- Middleware `cors`
- Rate limiter
- `errorHandler` como **último** middleware

---

## FASE 3: Refactorizar por Módulo

Para cada entidad/dominio identificado en la Fase 1, ejecutar en orden:

### Por cada módulo:

**3.1 — Crear estructura de carpetas:**
```
src/routes/{modulo}.route.js
src/controllers/{modulo}.controller.js
src/services/{modulo}.service.js
src/repositories/{modulo}.repository.js
```

**3.2 — Migrar lógica:**
1. Mover lógica de negocio al `service`
2. Mover acceso a DB al `repository`
3. Limpiar el `controller` (solo req/res + llamada al service)
4. Limpiar la `route` (solo definición + validadores)

**3.3 — Agregar asyncHandler:**
Envolver todos los handlers async con `asyncHandler()`

**3.4 — Reemplazar throws genéricos:**
```javascript
// Antes:
throw new Error('Usuario no encontrado');
// Después:
throw new NotFoundError('Usuario');
```

**3.5 — Verificar que el módulo sigue funcionando:**
Si hay tests, correrlos. Si no, verificar manualmente el flujo principal.

**Repetir 3.1–3.5 para cada módulo.**

---

## FASE 4: Validación y Seguridad

Para cada ruta que recibe input del usuario:

**4.1 — Crear validadores:**
```
src/middlewares/validators/{modulo}.validator.js
```

**4.2 — Conectar validadores en las rutas**

**4.3 — Verificar variables de entorno:**
- Crear/actualizar `.env.example` con TODAS las variables requeridas
- Verificar que no hay secrets hardcodeados

---

## FASE 5: Revisión Final

### 5.1 — Verificación de arquitectura
- [ ] Ninguna ruta tiene lógica de negocio
- [ ] Ningún controller hace queries a DB
- [ ] Ningún service importa `express`
- [ ] `errorHandler` es el último middleware en `app.js`
- [ ] Todos los controllers async usan `asyncHandler`

### 5.2 — Verificación de resiliencia
- [ ] `unhandledRejection` manejado
- [ ] `uncaughtException` manejado
- [ ] Shutdown graceful implementado
- [ ] No hay `catch` vacíos

### 5.3 — Verificación de seguridad
- [ ] `helmet` activo
- [ ] Rate limiting activo
- [ ] Sin secrets hardcodeados
- [ ] Stack traces no expuestos en producción

### 5.4 — Generar Artefacto: Reporte de Refactoring
Documento final con:
- Resumen de cambios por módulo
- Tabla: problemas detectados → solución aplicada
- Lista de dependencias npm nuevas necesarias (`npm install ...`)
- Deuda técnica pendiente (lo que quedó fuera del scope)
- Próximos pasos recomendados

---

## Comandos npm para instalar dependencias

```bash
# Seguridad y middlewares esenciales
npm install helmet cors express-rate-limit

# Validación
npm install express-validator
# O alternativamente:
npm install joi

# Logging HTTP
npm install morgan

# Variables de entorno
npm install dotenv
```
