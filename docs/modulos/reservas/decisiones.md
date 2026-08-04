# Decisiones del módulo de reservas (San Rafael 360)

Numeración **RES-DEC-…** para no confundirlas con decisiones del local físico Jaditek (repo Jaditek-SimR).

Formato:

```text
### AAAA-MM-DD — RES-DEC-número — título
- Contexto:
- Decisión:
- Qué se descartó:
- Qué sigue:
```

---

## Decisiones registradas

### 2026-07-30 — RES-DEC-001 — Dueño del producto = suite SR360

- **Contexto:** El motor nació del análisis del local Jaditek, pero el producto es reutilizable.  
- **Decisión:** Documentación y desarrollo del **módulo de reservas** viven en el repo **sanrafael360** (`docs/modulos/reservas/`). Jaditek Sim Racing es el **primer cliente**, no el dueño del producto.  
- **Qué se descartó:** Mantener la fuente de verdad del motor solo en el repo del local.  
- **Qué sigue:** Construir según alcance MVP.

### 2026-07-30 — RES-DEC-002 — Requisitos de reservas

- **Contexto:** Definir qué debe cumplir cualquier comercio cliente.  
- **Decisión:**  
  1. Online con **grilla** de disponibilidad.  
  2. Admin puede crear reserva en persona y **bloquear** tiempo.  
  3. Reserva **firme solo si está paga** (excepciones solo manuales del admin).  
- **Qué se descartó:** Tienda online + planilla como único sistema; WhatsApp como cupo; holds sin pagar como camino normal.  
- **Qué sigue:** Implementación.

### 2026-07-30 — RES-DEC-003 — Se construye (no Bookeo / venue SaaS)

- **Contexto:** Bookeo no integra Mercado Pago; ShiftOS/GTLane no convencen por costo/prestaciones.  
- **Decisión:** **Desarrollar** el módulo reutilizando patrones de SR360 (Next, Strapi, Postgres, Mercado Pago), con dominio de agenda **separado** del directorio.  
- **Qué se descartó:** Bookeo como solución completa; depender de un venue SaaS extranjero solo por la agenda.  
- **Qué sigue:** MVP con primer cliente.

### 2026-07-30 — RES-DEC-004 — Producto multi-comercio; Jaditek = cliente #1

- **Contexto:** No nacer como script de un solo local.  
- **Decisión:** Módulo vendible con costo aparte; modelo “comercio + recursos”; **Jaditek Sim Racing** es el primer cliente (varios recursos / puestos).  
- **Qué se descartó:** Hardcodear un único local sin entidad comercio.  
- **Qué sigue:** Flujos y reglas del cliente #1.

### 2026-07-30 — RES-DEC-005 — Flujos MVP y admins fijos

- **Decisión:**  
  1. Online: link → disponibilidad → elige → paga → firme.  
  2. Admin: alta en persona + bloquear tiempo.  
  3. Admins del MVP del primer cliente: solo **Diego** y **María Laura** (lista fija).  
- **Qué se descartó (MVP):** muchos roles de empleados de mostrador.  
- **Qué sigue:** Duraciones y cobro.

### 2026-07-30 — RES-DEC-006 — Turnos 1 h + llegada 15 min antes (cliente Jaditek)

- **Decisión:** Solo turnos de **1 hora**. Comunicar: llegar **15 minutos antes** para charla en el living.  
- **Qué se descartó (por ahora):** varias duraciones en la grilla.  
- **Qué sigue:** Cancelación.

### 2026-07-30 — RES-DEC-007 — Cancelación 24 h con reembolso (cliente Jaditek)

- **Decisión:** Cancelar **hasta 24 horas antes** → **reembolso** → liberar hueco.  
- **Qué se descartó:** Solo WhatsApp sin regla.  
- **Pendiente:** &lt;24 h y no-show (puede ser admin a mano al inicio).

### 2026-07-30 — RES-DEC-008 — Mercado Pago del comercio Jaditek

- **Decisión:** En el primer cliente, el visitante paga a la **cuenta Mercado Pago de Jaditek** (ellos son el comercio). Reembolsos desde esa cuenta. Sin split plataforma→local.  
- **Nota:** Otros comercios del módulo: decidir después (su MP vs marketplace).  
- **Qué sigue:** Implementar MVP.

### 2026-08-02 — RES-DEC-009 — Alta multi-cliente + secretos MP desde portal

- **Contexto:** El MVP Jaditek ya corre; falta producto para (a) configurar MP sin `.env` y (b) activar el módulo en otro `negocio` del portal SR360.  
- **Decisión:**  
  1. **Operación admin vs cliente:** cada `reserva-comercio` tiene flag `operado_por_plataforma` (o equivalente). Si es `true`, Master Admin gestiona config/secretos aunque haya `negocio` linkeado; si es `false`, el **owner** del `negocio` puede gestionar lo operativo (y el token solo si se habilita explícitamente — default: token solo Master Admin hasta OAuth).  
  2. **Alta del módulo:** solo desde **`/portal/admin`** (Master Admin): elegir `negocio` → crear `reserva-comercio` + recursos + soft-link.  
  3. **Simulación por defecto:** al crear, `modo_simulacion = true` hasta que exista un Access Token MP válido cargado; la grilla pública de cobro real no se habilita sin token (simulación sí puede probarse).  
  4. **Almacenamiento del token:** cifrado at-rest en el comercio (no plaintext; no devolver el secreto en GET). Migración gradual desde `mp_token_env`.  
  5. **UX no técnica para el token (fase 1):** guía paso a paso con capturas (“entrar a Mercado Pago Developers → Tu aplicación → Credenciales de prueba → copiar Access Token”) + campo “pegar acá” en el portal admin. Fase 2 (después): botón **Conectar Mercado Pago** (OAuth) para no copiar secretos.  
- **Qué se descartó (por ahora):** self-serve del dueño para “activar reservas”; OAuth MP como primer corte; tokens solo en variables de entorno por cliente.  
- **Qué sigue:** backlog D/E en `backlog-operativo.md` (D1 token cifrado + E1 alta desde admin).

### 2026-08-04 — RES-DEC-010 — Modos de cobro (MP y/o pago en local)

- **Contexto:** No todos los comercios quieren cobrar anticipado con Mercado Pago; algunos confirman turno y cobran en el local.  
- **Decisión:** campo `modo_cobro` en `reserva-comercio`:
  1. `mp_requerido` (default): hold → MP → confirmada (como hoy).  
  2. `solo_local`: confirma online sin MP (`excepcion_sin_pago`), bloquea el hueco. Permite apagar simulación sin token MP.  
  3. `mp_o_local`: la grilla pública ofrece elegir MP anticipado o pago en el local.  
- **Alta de módulo:** además de `reserva_url` / `reserva_habilitada`, setea CTA del negocio (`cta_habilitado`, `cta_link` absoluto al slug, textos “Reserve su turno”). La ficha pública también fuerza el link si existe relación `reserva_comercio` (aunque el CTA en DB esté viejo).  
- **Home:** badge “Reserve su turno” si el negocio tiene módulo (`/reservas/…`).  
- **Qué sigue:** documentar en [alta-cliente.md](alta-cliente.md); sync Algolia para el badge en prod.