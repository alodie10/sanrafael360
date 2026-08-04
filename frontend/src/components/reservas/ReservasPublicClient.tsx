'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReservaDisponibilidad, ReservaSlot } from '@/lib/reservas';
import { fetchDisponibilidad } from '@/lib/reservas';
import { postCheckout } from '@/lib/reservas-checkout';
import './reservas-public.css';

type Props = {
  initial: ReservaDisponibilidad;
};

type MetodoPago = 'mp' | 'local';

function formatDayLabel(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dt);
}

function formatPrice(ars: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(ars);
}

function resolveDefaultMetodo(
  modo: ReservaDisponibilidad['comercio']['modo_cobro']
): MetodoPago {
  if (modo === 'solo_local') return 'local';
  return 'mp';
}

export default function ReservasPublicClient({ initial }: Props) {
  const [data, setData] = useState(initial);
  const [selectedFecha, setSelectedFecha] = useState(initial.dias[0]?.fecha || initial.desde);
  const [selected, setSelected] = useState<{
    slot: ReservaSlot;
    recursoId: string;
  } | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(() =>
    resolveDefaultMetodo(initial.comercio.modo_cobro)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const softRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchDisponibilidad(data.comercio.slug, { fecha: data.desde, dias: 7 })
        .then((next) => {
          if (!next) return;
          setData(next);
        })
        .catch(() => {
          /* ignore soft refresh errors */
        });
    };
    window.addEventListener('focus', softRefresh);
    document.addEventListener('visibilitychange', softRefresh);
    return () => {
      window.removeEventListener('focus', softRefresh);
      document.removeEventListener('visibilitychange', softRefresh);
    };
  }, [data.comercio.slug, data.desde]);

  const dia = useMemo(
    () => data.dias.find((d) => d.fecha === selectedFecha) || data.dias[0],
    [data.dias, selectedFecha]
  );

  const comercio = data.comercio;
  const brand = comercio.nombre_publico || comercio.nombre;
  const modoCobro = comercio.modo_cobro || 'mp_requerido';
  const showMetodoChoice = modoCobro === 'mp_o_local' && !comercio.modo_simulacion;
  const recursoNombre = selected
    ? data.recursos.find((r) => r.documentId === selected.recursoId)?.nombre
    : null;

  const ctaLabel = (() => {
    if (submitting) return 'Confirmando…';
    if (comercio.modo_simulacion) return 'Confirmar reserva';
    if (modoCobro === 'solo_local' || metodoPago === 'local') {
      return 'Reservar (pago en el local)';
    }
    return 'Pagar y confirmar';
  })();

  const onConfirm = async () => {
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const effectiveMetodo: MetodoPago =
        modoCobro === 'solo_local'
          ? 'local'
          : modoCobro === 'mp_requerido'
            ? 'mp'
            : metodoPago;
      const result = await postCheckout({
        slug: comercio.slug,
        recursoDocumentId: selected.recursoId,
        inicio: selected.slot.inicio,
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono || undefined,
        metodo_pago: effectiveMetodo,
      });
      window.location.href = result.init_point;
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar la reserva');
      setSubmitting(false);
    }
  };

  return (
    <div className="rp-page">
      <header className="rp-hero">
        <div
          className="rp-hero-bg"
          style={
            comercio.portada_url
              ? { backgroundImage: `url(${comercio.portada_url})` }
              : undefined
          }
          aria-hidden
        />
        <div className="rp-hero-shade" aria-hidden />
        <div className="rp-hero-content">
          <div className="rp-brand">
            {comercio.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comercio.logo_url} alt="" className="rp-logo" />
            ) : null}
            <h1 className="rp-brand-name">{brand}</h1>
          </div>
          <p className="rp-headline">Reservá tu turno</p>
          {comercio.texto_llegada ? (
            <p className="rp-support">{comercio.texto_llegada}</p>
          ) : null}
        </div>
      </header>

      <section className="rp-board" aria-label="Disponibilidad">
        <div className="rp-board-meta">
          <p className="rp-meta-line">
            Turnos de {comercio.duracion_minutos} min · {formatPrice(comercio.precio_ars)}
            {modoCobro === 'solo_local' ? ' · pago en el local' : ''}
          </p>
        </div>

        <div className="rp-days" role="tablist" aria-label="Días">
          {data.dias.map((d) => {
            const active = d.fecha === selectedFecha;
            return (
              <button
                key={d.fecha}
                type="button"
                role="tab"
                aria-selected={active}
                className={`rp-day${active ? ' is-active' : ''}`}
                onClick={() => {
                  setSelected(null);
                  setSelectedFecha(d.fecha);
                }}
              >
                {formatDayLabel(d.fecha)}
              </button>
            );
          })}
        </div>

        {!dia || dia.slots.length === 0 ? (
          <p className="rp-empty">No hay horarios este día.</p>
        ) : (
          <div className="rp-grid" role="grid" aria-label="Huecos">
            <div className="rp-grid-head" role="row">
              <div className="rp-cell rp-cell-label" role="columnheader">
                Hora
              </div>
              {data.recursos.map((r) => (
                <div key={r.documentId} className="rp-cell rp-cell-label" role="columnheader">
                  {r.nombre}
                </div>
              ))}
            </div>
            {dia.slots.map((slot) => (
              <div key={slot.inicio} className="rp-grid-row" role="row">
                <div className="rp-cell rp-cell-time" role="rowheader">
                  {slot.hora}
                </div>
                {data.recursos.map((r) => {
                  const cell = slot.recursos.find((x) => x.documentId === r.documentId);
                  const disponible = !!cell?.disponible;
                  const isSelected =
                    selected?.slot.inicio === slot.inicio &&
                    selected?.recursoId === r.documentId;
                  return (
                    <button
                      key={`${slot.inicio}-${r.documentId}`}
                      type="button"
                      role="gridcell"
                      disabled={!disponible || submitting}
                      aria-pressed={isSelected}
                      className={`rp-cell rp-slot${disponible ? ' is-free' : ' is-busy'}${
                        isSelected ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        if (!disponible) return;
                        setSelected({ slot, recursoId: r.documentId });
                        setError(null);
                      }}
                    >
                      {disponible ? 'Libre' : '—'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {selected ? (
          <form
            className="rp-selection"
            data-testid="reserva-selection"
            onSubmit={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            <p>
              {selected.slot.hora} · {recursoNombre}
            </p>
            <div className="rp-form">
              <label>
                Nombre
                <input
                  required
                  name="nombre"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label>
                Teléfono
                <input
                  name="telefono"
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>

            {showMetodoChoice ? (
              <fieldset className="rp-pago" data-testid="reserva-metodo-pago">
                <legend>Cómo preferís pagar</legend>
                <label className="rp-pago-opt">
                  <input
                    type="radio"
                    name="metodo_pago"
                    checked={metodoPago === 'mp'}
                    disabled={submitting}
                    onChange={() => setMetodoPago('mp')}
                  />
                  Pagar ahora con Mercado Pago
                </label>
                <label className="rp-pago-opt">
                  <input
                    type="radio"
                    name="metodo_pago"
                    checked={metodoPago === 'local'}
                    disabled={submitting}
                    onChange={() => setMetodoPago('local')}
                  />
                  Reservar y pagar en el local
                </label>
              </fieldset>
            ) : null}

            {error ? <p className="rp-error">{error}</p> : null}
            <button type="submit" className="rp-cta" disabled={submitting}>
              {ctaLabel}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
