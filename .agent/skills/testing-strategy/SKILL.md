# SKILL: Testing Strategy & Playwright Optimization
> **Handle:** `@testing-strategy`
> **Ubicación:** `.agent/skills/testing-strategy/SKILL.md`

## Descripción
Estrategia de verificación progresiva para maximizar velocidad sin sacrificar confianza. El agente NUNCA lanza el navegador para verificar cambios simples. Escala la profundidad del test según la complejidad del cambio.

## Cuándo Activarse
- Después de implementar cualquier cambio
- Cuando el agente esté por lanzar Playwright para verificar
- Cuando el usuario pide "probá esto" o "verificá que funciona"
- En cualquier ciclo de fix → verificar → fix

---

## La Pirámide de Verificación (OBLIGATORIA)

El agente DEBE seguir este orden. Solo avanzar al siguiente nivel si el anterior pasa.

```
        🌐 NIVEL 4: Playwright headed (navegador visible)
           Solo para: flujos críticos en PR / release final
           Tiempo: 5-15 min | Frecuencia: raramente

      🤖 NIVEL 3: Playwright headless (sin ventana)
         Solo para: flujos E2E que requieren browser real
         Tiempo: 1-3 min | Frecuencia: antes de merge

    🔗 NIVEL 2: Supertest (HTTP real, sin browser)
       Para: todos los endpoints de la API
       Tiempo: 10-30 seg | Frecuencia: cada cambio de backend

  ⚡ NIVEL 1: Unit tests (lógica pura, sin servidor)
     Para: services, utils, validators
     Tiempo: 1-5 seg | Frecuencia: en cada cambio
```

**Regla de oro: verificar con el nivel más bajo posible que sea suficiente.**

---

## Nivel 1 — Unit Tests (default para cambios de lógica)

Usar **Jest** o **Vitest**. Sin levantar servidor, sin browser.

```javascript
// tests/unit/services/user.service.test.js
const { UserService } = require('../../../src/services/user.service');
const { UserRepository } = require('../../../src/repositories/user.repository');

// Mock del repository — no toca DB real
jest.mock('../../../src/repositories/user.repository');

describe('UserService.findById', () => {
  it('lanza NotFoundError si el usuario no existe', async () => {
    UserRepository.findById.mockResolvedValue(null);
    await expect(UserService.findById('123')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('retorna el usuario si existe', async () => {
    const mockUser = { id: '123', email: 'test@test.com' };
    UserRepository.findById.mockResolvedValue(mockUser);
    const result = await UserService.findById('123');
    expect(result).toEqual(mockUser);
  });
});
```

**Correr con:** `npx jest --testPathPattern=unit --passWithNoTests`

---

## Nivel 2 — Supertest (default para cambios de API)

Verifica endpoints HTTP reales sin abrir ningún navegador.

```javascript
// tests/integration/routes/users.test.js
const request = require('supertest');
const app = require('../../../src/app'); // Solo el app, sin server.listen()

describe('GET /api/users/:id', () => {
  it('200 con usuario existente', async () => {
    const res = await request(app)
      .get('/api/users/123')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('404 con usuario inexistente', async () => {
    const res = await request(app)
      .get('/api/users/nonexistent')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('401 sin token', async () => {
    const res = await request(app).get('/api/users/123');
    expect(res.status).toBe(401);
  });
});
```

**Instalar:** `npm install --save-dev supertest`
**Correr con:** `npx jest --testPathPattern=integration --passWithNoTests`

---

## Nivel 3 — Playwright Headless (solo flujos E2E críticos)

**Configuración para máxima velocidad:**

```javascript
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // NUNCA headed por defecto
  use: {
    headless: true,           // Sin ventana visible
    screenshot: 'only-on-failure',
    video: 'off',             // Video consume mucho tiempo y disco
    trace: 'off',             // Activar solo para debug
    actionTimeout: 5000,      // Timeout agresivo (default es 30s)
    navigationTimeout: 10000,
  },

  // Correr tests en paralelo
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,

  // Reintentos solo en CI
  retries: process.env.CI ? 1 : 0,

  // Timeout global por test
  timeout: 20000, // 20 seg max por test (no 60s que es el default)

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      // Solo Chromium para rapidez — Safari/Firefox solo en release
    },
  ],

  // Output limpio
  reporter: [['list'], ['html', { open: 'never' }]],
});
```

**Correr con:** `npx playwright test --reporter=list`

---

## Nivel 4 — Playwright Headed (solo release / revisión humana)

Solo usar cuando:
- Se está haciendo una revisión manual final antes de un deploy
- El usuario explícitamente pide "mostrame cómo se ve en el navegador"
- Se está grabando una demo

```bash
# Solo para revisión final — NO en ciclos de desarrollo
npx playwright test --headed --workers=1
```

---

## Protocolo del Agente para Verificar Cambios

### Cambio de lógica en service/util:
```
1. Correr: npx jest --testPathPattern=unit --passWithNoTests
2. Si pasa → ✅ verificación completa
3. Si falla → corregir y repetir
4. NO lanzar browser
```

### Cambio de endpoint/ruta:
```
1. Correr: npx jest --testPathPattern=unit --passWithNoTests
2. Correr: npx jest --testPathPattern=integration --passWithNoTests
3. Si pasa → ✅ verificación completa
4. NO lanzar browser
```

### Cambio de UI / flujo completo:
```
1. Correr unit + integration tests
2. Si pasan → correr: npx playwright test --reporter=list (headless)
3. Si pasan → ✅ verificación completa
4. NO usar --headed salvo pedido explícito
```

### Feature completa lista para review:
```
1. Correr todos los niveles anteriores
2. Si todos pasan y el usuario pide revisión visual:
   npx playwright test --headed --workers=1
```

---

## Reglas Estrictas para el Agente

### ✅ SIEMPRE:
- Empezar por el nivel de test más rápido posible
- Usar `--passWithNoTests` para no fallar si no hay tests del nivel
- Reportar cuánto tardó cada nivel
- Sugerir qué tests nuevos escribir si no existen

### ❌ NUNCA:
- Lanzar Playwright headed para verificar un cambio de lógica de backend
- Usar `video: 'on'` en modo desarrollo
- Usar `trace: 'on'` salvo debugging activo
- Correr todos los browsers (chromium + firefox + webkit) en desarrollo
- Esperar más de 5 segundos por una acción individual en un test
- Usar `page.waitForTimeout(X)` — siempre usar `waitForSelector` o `waitForResponse`

---

## Optimizaciones de Playwright a Aplicar al Código Existente

Si hay tests de Playwright existentes, buscar y corregir estos patrones lentos:

```javascript
// ❌ LENTO: espera fija
await page.waitForTimeout(3000);

// ✅ RÁPIDO: espera por condición real
await page.waitForSelector('[data-testid="result"]');
await page.waitForResponse('**/api/users');
await expect(page.locator('.result')).toBeVisible();

// ❌ LENTO: navegar y esperar sin condición
await page.goto('http://localhost:3000/dashboard');
await page.waitForTimeout(2000);

// ✅ RÁPIDO: esperar por elemento específico
await page.goto('http://localhost:3000/dashboard');
await page.waitForLoadState('networkidle');

// ❌ LENTO: screenshot en cada step
await page.screenshot({ path: 'step1.png' });
await page.screenshot({ path: 'step2.png' });

// ✅ RÁPIDO: screenshot solo si falla (configurado en playwright.config.js)
// No agregar screenshots manuales
```

---

## Scripts en package.json

Agregar estos scripts para que el agente los use directamente:

```json
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:unit": "jest --testPathPattern=unit --passWithNoTests",
    "test:integration": "jest --testPathPattern=integration --passWithNoTests",
    "test:e2e": "playwright test --reporter=list",
    "test:e2e:headed": "playwright test --headed --workers=1",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:fast": "npm run test:unit && npm run test:integration"
  }
}
```

**El agente debe preferir `test:fast` para la mayoría de los ciclos de desarrollo.**
