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

## 🚀 Protocolo de Push (OBLIGATORIO)
- **Bloqueo Preventivo**: El agente **NUNCA** debe hacer `git push` sin build exitoso.
- **Validación Local**: 
  1. `npx tsc --noEmit` SÍ funciona en el sandbox.
  2. `npm run build` (Next.js completo) **DEBE ser ejecutado por el USUARIO** en su terminal local.
- **Flujo Correcto**: Agente hace commit → pide al usuario que ejecute `npm run build` → si pasa, usuario ejecuta `git push`.
- **Pre-push hook**: Existe en `.git/hooks/pre-push` para bloquear el push si el build falla.
