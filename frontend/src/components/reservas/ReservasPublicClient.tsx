'use client';

import { useMemo, useState } from 'react';
import type { ReservaDisponibilidad, ReservaSlot } from '@/lib/reservas';
import { postCheckout } from '@/lib/reservas-checkout';
import './reservas-public.css';

type Props = {
  initial: ReservaDisponibilidad;
};

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

export default function ReservasPublicClient({ initial }: Props) {
  const [selectedFecha, setSelectedFecha] = useState(initial.dias[0]?.fecha || initial.desde);
  const [selected, setSelected] = useState<{
    slot: ReservaSlot;
    recursoId: string;
  } | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dia = useMemo(
    () => initial.dias.find((d) => d.fecha === selectedFecha) || initial.dias[0],
    [initial.dias, selectedFecha]
  );

  const comercio = initial.comercio;
  const brand = comercio.nombre_publico || comercio.nombre;
  const recursoNombre = selected
    ? initial.recursos.find((r) => r.documentId === selected.recursoId)?.nombre
    : null;

  const onConfirm = async () => {
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await postCheckout({
        slug: comercio.slug,
        recursoDocumentId: selected.recursoId,
        inicio: selected.slot.inicio,
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono || undefined,
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
          </p>
        </div>

        <div className="rp-days" role="tablist" aria-label="Días">
          {initial.dias.map((d) => {
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
              {initial.recursos.map((r) => (
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
                {initial.recursos.map((r) => {
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
            {error ? <p className="rp-error">{error}</p> : null}
            <button type="submit" className="rp-cta" disabled={submitting}>
              {submitting ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
