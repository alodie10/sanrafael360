# Directivas de Despliegue: San Rafael 360 (Railway Monorepo)

Este documento es una guía de referencia para cualquier IA o desarrollador que trabaje en este repositorio para evitar regresiones en el despliegue de Railway.

## 1. Estructura de Monorepositorio
Railway/Nixpacks detecta el proyecto desde la raíz. Es OBLIGATORIO que el `package.json` de la raíz contenga:
- `"build": "npm run build:all"` que orqueste la compilación de `frontend` y `backend`.
- `"start": "cd backend && npm run start"` (o el comando de arranque del servicio principal).
- Motores de Node definidos: `"engines": { "node": ">=20.0.0" }`.

## 2. Prevención de Errores TypeScript (TS2451)
El backend contiene una carpeta `scripts/` con utilidades de migración. Estas causan errores de "Redeclaración de variables globales" durante el build de Strapi.
- **Acción:** La carpeta `scripts/` DEBE estar siempre en la lista `exclude` de `backend/tsconfig.json`.

## 3. Conexión a Base de Datos (PostgreSQL)
Para despliegues en Railway usando Postgres:
- **Dependencias:** El paquete `pg` debe estar listado explícitamente en `dependencies` tanto en la raíz como en `backend/package.json`. No basta con instalarlo localmente; debe estar en el archivo.
- **Sanitización de Variables:** Debido a posibles errores de copy-paste en el panel de Railway (ej: `DATABASE_CLIENT =postgres`), el archivo `backend/config/database.ts` debe limpiar la variable antes de usarla:
  ```typescript
  const client = (env('DATABASE_CLIENT', 'sqlite') || 'sqlite').toString().trim().replace(/^=/, '').trim();
  ```

## 4. Estética y Tailwind CSS (Purge/JIT)
Para evitar que las clases dinámicas (como los gradientes de las categorías) desaparezcan en producción:
- **Safelist:** Las clases generadas dinámicamente deben estar en el `safelist` de `frontend/tailwind.config.ts`.
- **Opacidad:** Usar opacidad completa (o alta) en degradados para evitar que el fondo oscuro del "Dark Mode" los vuelva negros.

## 5. Tipos de Contenido Nuevos (Strapi 5)
Al crear nuevos Content Types (especialmente Single Types como 'Hero'):
- Si el build falla por tipos no generados, usar `// @ts-ignore` temporalmente en los factory calls de controllers/routes/services para permitir el primer arranque exitoso, lo cual generará los tipos reales.
