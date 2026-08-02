# Runbook — pasar de simulación a Mercado Pago sandbox (local)

**Precondición:** MVP reservas en `develop`, backend `:1337` + frontend `:3000`.  
**No hace falta** push a `master` ni deploy Railway para esta prueba.

## Qué ya está listo (sin token)

- Grilla pública `/reservas/jaditek`
- Checkout en **modo simulación** (confirma sin MP)
- Admin agenda: turno manual, bloqueos, cancelar
- Admin **configuración**: precio, horario, duración, buffer, política, logo/portada, toggle simulación
- Webhook/refund cableados en código (`/api/reservas/webhook`)

## Switch a sandbox (solo ops + token Diego)

### 1. Token de prueba Jaditek

En `backend/.env`:

```bash
MP_ACCESS_TOKEN_JADITEK=TEST-...   # Access Token de prueba de la cuenta MP Jaditek
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://TU-TUNEL       # ver paso 2
```

Reiniciá el backend tras editar `.env`.

### 2. Túnel hacia Strapi

Mercado Pago no puede pegarle a `localhost`. Exponé `:1337`:

```bash
# ejemplo cloudflared
cloudflared tunnel --url http://localhost:1337
```

Copiá la URL `https://…` a `BACKEND_URL` (sin slash final).  
Webhook esperado: `${BACKEND_URL}/api/reservas/webhook`

En el panel de la app MP (credenciales de prueba), configurá esa notification URL si hace falta.

### 3. Apagar simulación

En el portal: [Admin Jaditek](http://localhost:3000/portal/reservas/jaditek) → **Configuración del comercio** → desmarcar **Modo simulación** → Guardar.

(Alternativa: Strapi Content Manager → Reserva Comercio → Jaditek → `modo_simulacion = false`.)

### 4. Probar un pago

1. Abrí `/reservas/jaditek`, elegí hueco, completá datos.
2. Deberías ir al Checkout MP (sandbox / tarjetas de prueba).
3. Al aprobar: webhook confirma → la reserva queda `confirmada` (aunque `FRONTEND_URL` sea localhost: en local **no** usamos `auto_return`; volvé a mano a `/reservas/jaditek/exito?codigo=…` o mirá el admin).
4. Cancelá dentro de 24 h (mail o admin) y verificá refund en MP sandbox.

> **Nota local:** Mercado Pago rechaza `auto_return` si `back_urls` apuntan a `localhost`. El código omite `auto_return` en ese caso. El webhook vía `BACKEND_URL` (túnel) sigue confirmando el pago.

## Volver a simulación

Marcá de nuevo **Modo simulación** en el portal (o `modo_simulacion = true` en Strapi). No hace falta sacar el token del `.env`.

## Checklist rápido

- [ ] `MP_ACCESS_TOKEN_JADITEK` cargado (prueba)
- [ ] Túnel vivo y `BACKEND_URL` = URL del túnel
- [ ] `modo_simulacion = false`
- [ ] Preferencia creada + redirect a MP
- [ ] Webhook → reserva `confirmada`
- [ ] Cancel + refund (si % > 0)
