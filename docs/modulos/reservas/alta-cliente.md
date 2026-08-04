# Alta de cliente — módulo de reservas

Instructivo operativo para **otorgar** el módulo a un comercio del directorio.  
Fuente de verdad del producto: [backlog-operativo.md](backlog-operativo.md) · [decisiones.md](decisiones.md) (RES-DEC-009).

No asume deploy a `master`: si el cambio es solo de datos/config en prod, alcanza con el portal; si falta código, Diego promotea.

---

## Premisas (una sola vez, plataforma)

Estas ya viven en la app **San Rafael 360** (Railway + panel MP de la plataforma). **No las configura el dueño del local:**

| Qué | Quién |
|-----|--------|
| App MP de SR360 + Redirect URI OAuth | Plataforma |
| `MP_OAUTH_*`, `MP_TOKEN_ENCRYPTION_KEY`, `MP_WEBHOOK_SECRET` | Railway |
| Webhooks de la app (no del comercio) | Panel MP de SR360 |
| Código en prod | Diego (`promote` / push `master`) |

El dueño solo autoriza cobros con **su** cuenta Mercado Pago vía OAuth en el portal.

---

## Checklist por cliente

### 0. Precondiciones

- [ ] El **negocio existe** en el directorio (slug estable).
- [ ] Si el dueño va a entrar al módulo: tiene usuario portal y es `owner` del `negocio` (si no, no ve “Gestionar reservas”).
- [ ] Acordado: puestos, precio, horario, cancelación, quién opera (SR360 vs dueño).

### 1. Alta del módulo (solo Master Admin)

1. `/portal/admin` → **Reservas** (`/portal/reservas`).
2. **Activar módulo en un negocio**.
3. Buscar negocio (≥ 2 letras) → seleccionar.
4. Revisar:
   - **Slug público** → `https://sanrafael360.com/reservas/{slug}`
   - **Cantidad de puestos** (default 4 → `Puesto 1…N`)
   - **Precio ARS** default
5. **Crear módulo**.

El sistema crea `reserva-comercio` + recursos, soft-link al `negocio`, setea `reserva_url` + `reserva_habilitada`, y arranca con:

- `modo_simulacion = true`
- `operado_por_plataforma = true`
- Defaults: lun–sáb 16–22, duración 60′, anticipación 15′, cancelación 24 h / 100 % reembolso, TZ `America/Argentina/Mendoza`

Un negocio = un módulo; re-alta falla si ya está linkeado.

### 2. Configurar el comercio

En `/portal/reservas/{slug}` → **Configuración**:

- [ ] Nombre público, precio, duración, buffer, hold TTL
- [ ] Horario real
- [ ] Texto de llegada / anticipación
- [ ] Política de cancelación
- [ ] Logo / portada (si aplica)
- [ ] **¿Quién opera?**
  - *Lo opera San Rafael 360* → admin edita config; owner en lectura (salvo OAuth, ver §3)
  - *Lo opera el dueño* → owner edita lo operativo

### 3. Mercado Pago — vínculo remoto (paso crítico)

**No hace falta que el admin entre a la cuenta MP del cliente.**  
OAuth lo hace quien tiene el login de Mercado Pago **del local**.

#### Quién puede qué (hoy)

| Acción | Admin SR360 | Owner |
|--------|-------------|--------|
| Pegar Access Token a mano | Sí | No |
| **Conectar Mercado Pago** (OAuth) | Sí | Sí (si es owner del negocio linkeado) |
| Apagar **Modo simulación** con `operado_por_plataforma=true` | Sí | No |
| Apagar simulación con `operado_por_plataforma=false` | Sí | Sí (si ya hay token/OAuth) |

#### Playbook recomendado (vos administrás, ellos vinculan)

1. Confirmá que el dueño es `owner` del negocio y ve **Gestionar reservas**.
2. Mandale este mensaje:

> Entrá a sanrafael360.com → Portal → tu negocio → **Gestionar reservas** → **Configuración** → **Conectar Mercado Pago**.  
> Iniciá sesión con la cuenta Mercado Pago **del local** (donde querés recibir los cobros) y aceptá.  
> Cuando vuelvas al portal y diga que está conectado, avisame.

3. Cuando avise (o veas en Config “conectado con OAuth” / token cargado), **vos** apagás **Modo simulación** y guardás.
4. Smoke de una reserva de prueba (ver §5).

Videollamada solo si se traban en el login de MP. **No** pedir usuario/clave de MP ni Access Token por WhatsApp.

#### Qué no hacer

- Conectar OAuth con la MP **personal del admin**: el dinero va a esa cuenta (smoke Jaditek con MP de Diego ≠ cuenta del local).
- Pedir pegar Access Token por chat: peor UX; preferir OAuth ([guia-oauth-mp.md](guia-oauth-mp.md)). Respaldo: [guia-token-mp.md](guia-token-mp.md).

Detalles técnicos de setup de la app SR360: [guia-oauth-mp.md](guia-oauth-mp.md).

### 4. Verificar accesos

- [ ] Admin: `/portal/reservas/{slug}` (agenda, walk-in, bloqueos, cancel)
- [ ] Dueño: card del negocio → **Gestionar reservas** + **Ver grilla pública**
- [ ] Link público: `/reservas/{slug}`

### 5. Smoke antes de “está en vivo”

Con simulación OFF y MP del cliente:

1. Reserva de prueba en la grilla → pago.
2. Confirmar webhook → reserva `confirmada` (el cliente **no** configura webhooks).
3. Cancel admin + refund si aplica.
4. Si un pago queda colgado: `backend/scripts/reprocess-mp-payment.js <paymentId>` (env Railway + DB).

### 6. Entrega al cliente

Mensaje corto con:

1. Link público de reservas
2. Cómo entrar al portal y gestionar agenda
3. Que **no** configure webhooks en MP (es de la app SR360)
4. Política de cancelación (self-service = WhatsApp; admin libera hueco + reembolsa)

---

## Caso Jaditek (estado)

Alta y portal ya existen (`/reservas/jaditek`).  
Pendiente **B4**: reconectar OAuth con la **cuenta MP de Jaditek** (hoy el smoke prod fue con MP personal de Diego) y dejar simulación OFF con esa cuenta. Usar el playbook de §3.

---

## Trampas frecuentes

- Sin MP conectado no se puede apagar simulación.
- Webhooks / `MP_WEBHOOK_SECRET` = plataforma, no el cliente.
- Con `operado_por_plataforma=true` el owner no edita config ni apaga simulación; sí puede OAuth.
- Push a `master` / promote: solo Diego, cuando lo pida.
