# Visión — módulo de reservas San Rafael 360

Fecha: **30 de julio de 2026**.  
Origen: decisión de construir (en lugar de Bookeo / venue SaaS extranjeros) + visión de producto reutilizable.

---

## La idea en una frase

Construir un **módulo de reservas + pago** (grilla online, panel de administración del local, Mercado Pago confirma el turno) pensado para **muchos comercios**.  
Las empresas de la guía [sanrafael360.com](https://sanrafael360.com) que necesiten turnos podrían **contratarlo aparte**.  
**Jaditek Sim Racing** es el **primer cliente**: un local con varios recursos (puestos de simulador) que pone a prueba el módulo.

---

## Cómo encaja en la suite

| Capa | Rol |
|------|-----|
| **San Rafael 360 (directorio)** | Guía de comercios. Trae tráfico. Hoy muchos “Reservar” mandan a un link externo o WhatsApp. |
| **Módulo de reservas (este producto)** | Agenda con cupos + cobro. Misma familia tecnológica (Next.js, Strapi, PostgreSQL, Mercado Pago), **dominio separado** del listado turístico. |
| **Jaditek Sim Racing** | Primer comercio abonado / primer caso real. |

Analogía: el directorio es la guía; el módulo es el sistema de turnos que un comercio puede contratar.

No mezclar en la misma “caja” de datos la ficha de “negocio de la guía” con las reglas internas de cada agenda: un spa y un local de simracing comparten la *idea* (recursos + horarios + pago), no el mismo formulario de turismo.

---

## Requisitos de producto (valen para cualquier comercio cliente)

1. **Online:** el visitante ve una **grilla** de disponibilidad, elige, **paga**; sin pago la reserva no es firme.  
2. **Admin del local:** puede cargar una reserva en persona y **bloquear** tiempo para que no se venda.  
3. El motor habla de **recursos** (sillas, puestos, salas), no solo de “simuladores”.

---

## Flujos acordados (MVP)

### A) Cliente online

1. Entra por publicidad o página a un **link de reservas** del comercio.  
2. Ve disponibilidad.  
3. Elige el turno.  
4. Paga (Mercado Pago).  
5. Queda confirmado.

### B) Admin / gerente

Al inicio del primer cliente: solo **Diego** y **María Laura** (lista fija; sin gestión de muchos empleados todavía).

Pueden:

1. Dar de alta una reserva en persona.  
2. Bloquear franjas (mantenimiento, uso interno, etc.).

En el MVP, **los admins son el mostrador**.

---

## Reglas del primer cliente (Jaditek) — resumen

Detalle en [primer-cliente-jaditek.md](primer-cliente-jaditek.md).

- Turnos de **1 hora**.  
- Recomendar llegar **15 minutos antes** (charla en el living).  
- Cancelación **hasta 24 h antes** con **reembolso**.  
- Cobro a la **cuenta Mercado Pago de Jaditek** (ellos son el comercio en este caso).

---

## Qué implica el diseño multi-comercio

Aunque al inicio solo exista Jaditek, el modelo debe decir “esta reserva es del **comercio X**”, no hardcodear un solo local en todo el código.

**Más adelante** (no bloquea el MVP):

- Onboarding self-service de comercios de la guía.  
- Abono del módulo automatizado.  
- Que cada comercio conecte su propia cuenta Mercado Pago (hoy el primer cliente cobra en la suya).

**No en la primera versión:** marketplace de 500 agendas, app nativa, integración con el software del juego del simulador (eso es operación del local Jaditek, otro proyecto).

---

## Preguntas aún abiertas

1. ¿El módulo se vende solo a quien ya está en la guía, o también standalone?  
2. ¿Nombre comercial público del módulo?  
3. ¿Piel / marca en el link de Jaditek (marca Jaditek vs look genérico)?  
4. Cancelación con menos de 24 h y no-show: ¿solo admin a mano?  
5. Al bloquear tiempo, el público ¿solo ve “no disponible”?

---

## Estado

Decisiones cerradas: [decisiones.md](decisiones.md).  
Alcance de construcción: [alcance-mvp.md](alcance-mvp.md).
