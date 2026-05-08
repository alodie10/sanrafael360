# 🧪 Testing & Push Protocols (San Rafael 360)

## 🧪 Pirámide de Verificación Progresiva
El agente NUNCA lanza Playwright headed para verificar un cambio. Sigue la pirámide:

| Nivel | Herramienta | Cuándo | Tiempo |
|-------|-------------|--------|--------|
| 1 | Jest unit | Cambio en service/util | < 5 seg |
| 2 | Supertest | Cambio en endpoint | < 30 seg |
| 3 | Playwright headless | Flujo E2E completo | < 3 min |
| 4 | Playwright headed | Solo revisión final / demo | 5-15 min |

## 🛡️ Playwright — Configuración Obligatoria
- `headless: true` siempre (salvo pedido explícito del usuario)
- `video: 'off'` y `trace: 'off'` en desarrollo
- Solo Chromium en desarrollo.
- `actionTimeout: 5000`.
- Prohibido: `page.waitForTimeout(X)` — usar `waitForSelector` o `waitForResponse`.

## 🚀 Protocolo de Despliegue (OBLIGATORIO)

- **Aislamiento**: Todo el desarrollo se realiza en la rama `develop`.
- **Inmutabilidad**: La rama `master` es de SÓLO LECTURA para el desarrollo diario. Prohibido hacer push directo.
- **Flujo de Promoción (Dev-to-Prod)**:
  1. Validar visualmente en `localhost:3000`.
  2. Ejecutar `npm run build` localmente (Usuario).
  3. Ejecutar `./promote.sh` (Esto fusiona develop con master y pushea a Railway).
- **Rollback**: En caso de error en Prod, Railway CLI permite revertir a la imagen anterior mientras se corrige en `develop`.
