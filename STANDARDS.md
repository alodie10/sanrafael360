# STANDARDS.md — Constitución Técnica San Rafael 360

Este documento es la **Soberanía de Estándares (SDS)** del proyecto. Es la fuente de verdad definitiva e innegociable para cualquier desarrollo en este repositorio.

---

## 1. Arquitectura y Capas (Obligatorio)

### 1.1 Estructura Backend (Strapi 5/Node.js)
Se prohíben los "Fat Controllers". Toda lógica debe seguir este flujo:
**Routes** → **Middlewares (Validación)** → **Controllers (Orquestación)** → **Services (Lógica)** → **Repositories (Persistencia/API)**

- Los `Services` NO conocen el objeto `ctx` o `req/res`.
- Los `Controllers` NO realizan consultas directas a la DB.

### 1.2 Estructura Frontend (Next.js 15)
- **Server Components:** Manejan la sesión y el fetch inicial.
- **Client Components ("use client"):** Deben ser hojas del árbol, dedicados exclusivamente a la interactividad.
- **URLs:** Siempre usar `process.env.NEXT_PUBLIC_STRAPI_URL`. Nunca hardcodear IPs.

---

## 2. Resiliencia y Manejo de Errores

### 2.1 Jerarquía de Errores
Se deben usar siempre clases de error tipadas de `src/utils/errors.ts`:
- `NotFoundError`: Para recursos no encontrados.
- `ValidationError`: Para fallos de validación de negocio.
- `UnauthorizedError/ForbiddenError`: Para fallos de permisos.

### 2.2 Async Handling
**NUNCA** usar `try/catch` repetitivos en controladores. Envolver siempre con `asyncHandler()` para que el error fluya al `errorHandler` global.

---

## 3. Seguridad y Validación

- **Validación de Entrada:** Toda ruta que reciba datos debe tener un middleware de validación asociado.
- **Secrets:** Prohibido el uso de strings hardcodeados para tokens o claves. Todo va en `.env`.
- **Sanitización:** Limpiar todo el output para evitar la exposición de stacks de error en producción.

---

## 4. Testing (Playwright E2E)

- **Selectores:** Priorizar `data-testid` sobre selectores CSS.
- **Robustez:** Los tests deben validar estados de error y de carga, no solo el "happy path".
- **WebKit:** Se aceptan skips controlados en WebKit para tests de Auth si son validados en Chromium/Firefox.

---

## 5. Restricciones de Strapi 5
- Prohibido modificar el core del Admin UI sin previa auditoría de estabilidad.
- No usar propiedades obsoletas de Strapi 4.
- Mantener compatible con React 18.2.

**REGLA DE ORO:** Antes de implementar, el agente debe generar un "Plan de Estabilidad" validando contra este documento.
