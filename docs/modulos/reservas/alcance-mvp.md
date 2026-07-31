# Alcance MVP — módulo de reservas

Fecha: **30 de julio de 2026**.  
Basado en [vision.md](vision.md) y [decisiones.md](decisiones.md).

“MVP” aquí significa la **primera versión útil**: alcanza para que Jaditek venda turnos online y los admins operen el día a día. No es el módulo completo soñado para 500 comercios.

---

## Objetivo del MVP

Un visitante puede reservar y pagar un turno de 1 hora en Jaditek.  
Diego o María Laura pueden ver la agenda, cargar una reserva en persona, bloquear horarios, y el sistema respeta cupos (recursos) sin sobrevender.

---

## Entra en el MVP

1. **Entidad comercio** (aunque solo exista Jaditek al inicio).  
2. **Recursos** configurables (4 puestos para Jaditek).  
3. **Horario de atención** del comercio y generación de huecos de **1 hora**.  
4. **Página / link público** de reservas (grilla de disponibilidad).  
5. **Checkout Mercado Pago** → webhook → reserva **confirmada** (sin pago = no firme; liberar holds vencidos).  
6. **Texto** “llegá 15 minutos antes…”.  
7. **Panel admin** (Diego, María Laura):  
   - ver agenda del día / semana,  
   - crear reserva (con cobro o excepción explícita),  
   - bloquear franjas,  
   - cancelar con reembolso si aplica la regla de 24 h.  
8. **Cancelación** self-service o vía admin **hasta 24 h antes** con reembolso MP y liberación del hueco.  
9. **Aviso** mínimo al cliente (mail con Resend, o equivalente ya usado en SR360).

---

## Queda fuera del MVP (explícito)

| Ítem | Motivo |
|------|--------|
| Onboarding self-service de muchos comercios de la guía | Segunda oleada |
| Cobro automático del abono del módulo | Facturar a mano al inicio |
| Split / marketplace de pagos entre plataforma y terceros | Primer cliente cobra en su MP |
| Muchos empleados con roles | Solo 2 admins |
| Varias duraciones (2 h, packs) | Solo 1 h |
| Gift cards / membresías | Otro momento |
| Lista de espera automática | No pedido |
| App nativa | No |
| Integración con Assetto Corsa / launcher | Proyecto del local, no del módulo |
| Buffer automático de limpieza entre turnos | No definido |
| Regla automática &lt;24 h / no-show | Admin a mano hasta decidir |

---

## Criterio de “listo para usar en Jaditek”

- [ ] Link público muestra huecos reales de 1 h para 4 recursos.  
- [ ] Pago MP confirma y evita doble venta del mismo hueco.  
- [ ] Admin bloquea una hora y deja de verse online.  
- [ ] Admin carga walk-in.  
- [ ] Cancelación &gt;24 h reembolsa y libera.  
- [ ] Diego y María Laura pueden entrar; nadie más sin cambiar la lista.

---

## Siguiente paso de implementación (cuando se abra desarrollo)

1. Diseño de datos (comercio, recurso, slot/reserva, pago, bloqueo).  
2. Spike: reusar servicio de pagos SR360 apuntando el “éxito” a confirmar reserva.  
3. UI pública mínima + UI admin mínima.  
4. Pruebas con dinero real en modo prueba de Mercado Pago.
