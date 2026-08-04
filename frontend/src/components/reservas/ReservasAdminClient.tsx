'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  deleteBloqueo,
  fetchAdminAgenda,
  postBloqueo,
  postCancelReserva,
  postWalkIn,
} from '@/lib/reservas-admin';
import ReservasAdminConfig from './ReservasAdminConfig';
import CopyPublicReservaLink from './CopyPublicReservaLink';
import './reservas-admin.css';

type Props = {
  slug: string;
  jwt: string;
  initialAgenda: any;
  initialFecha: string;
};

type Selection = {
  slot: any;
  recursoId: string;
  recursoNombre: string;
};

function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeStyle: 'short',
  }).format(new Date(iso));
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

function cellOccupant(agenda: any, slot: any, recursoId: string) {
  const slotStart = new Date(slot.inicio).getTime();
  const slotEnd = new Date(slot.fin).getTime();

  const reserva = (agenda.reservas || []).find((r: any) => {
    if (r.estado === 'cancelada') return false;
    if (r.recurso?.documentId !== recursoId) return false;
    return overlaps(slotStart, slotEnd, new Date(r.inicio).getTime(), new Date(r.fin).getTime());
  });
  if (reserva) {
    return {
      kind: 'reserva' as const,
      label: reserva.cliente_nombre || reserva.codigo,
      sub: `${reserva.estado}${reserva.codigo ? ` · ${reserva.codigo}` : ''}`,
    };
  }

  const bloqueo = (agenda.bloqueos || []).find((b: any) => {
    const sameRecurso = !b.recurso || b.recurso.documentId === recursoId;
    if (!sameRecurso) return false;
    return overlaps(slotStart, slotEnd, new Date(b.inicio).getTime(), new Date(b.fin).getTime());
  });
  if (bloqueo) {
    return {
      kind: 'bloqueo' as const,
      label: 'Bloqueo',
      sub: bloqueo.motivo || 'Admin',
    };
  }

  return { kind: 'ocupado' as const, label: 'Ocupado', sub: null };
}

export default function ReservasAdminClient({
  slug,
  jwt,
  initialAgenda,
  initialFecha,
}: Props) {
  const router = useRouter();
  const [agenda, setAgenda] = useState(initialAgenda);
  const [fecha, setFecha] = useState(initialFecha);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [walkNombre, setWalkNombre] = useState('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('Mantenimiento');
  const fechaRef = useRef(fecha);
  const busyRef = useRef(busy);
  fechaRef.current = fecha;
  busyRef.current = busy;

  const brand = agenda.comercio?.nombre_publico || agenda.comercio?.nombre || slug;
  const dia = agenda.dias?.[0];

  const reload = useCallback(
    async (nextFecha = fechaRef.current, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) {
        setBusy(true);
        setError(null);
      }
      try {
        const data = await fetchAdminAgenda(jwt, slug, { fecha: nextFecha, dias: 1 });
        setAgenda(data);
        setFecha(data.desde);
        if (!opts.silent) setSelected(null);
        router.replace(`/portal/reservas/${slug}?fecha=${data.desde}`);
      } catch (err: any) {
        if (!opts.silent) {
          const msg = err?.message || 'Error al recargar';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!opts.silent) setBusy(false);
      }
    },
    [jwt, slug, router]
  );

  // Tras una reserva online (otra pestaña), al volver al módulo se actualiza sola.
  useEffect(() => {
    const softRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (busyRef.current) return;
      void reload(fechaRef.current, { silent: true });
    };
    window.addEventListener('focus', softRefresh);
    document.addEventListener('visibilitychange', softRefresh);
    return () => {
      window.removeEventListener('focus', softRefresh);
      document.removeEventListener('visibilitychange', softRefresh);
    };
  }, [reload]);

  const onWalkIn = async () => {
    if (!selected) return;
    if (!walkNombre.trim()) {
      setError('Escribí el nombre del cliente para el turno manual');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postWalkIn(jwt, slug, {
        recursoDocumentId: selected.recursoId,
        inicio: selected.slot.inicio,
        cliente_nombre: walkNombre.trim(),
        excepcion_sin_pago: true,
      });
      setWalkNombre('');
      await reload();
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el turno manual');
      setBusy(false);
    }
  };

  const onBlockSelected = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await postBloqueo(jwt, slug, {
        inicio: selected.slot.inicio,
        fin: selected.slot.fin,
        motivo: bloqueoMotivo || 'Bloqueo admin',
        recursoDocumentId: selected.recursoId,
      });
      await reload();
    } catch (err: any) {
      setError(err?.message || 'No se pudo bloquear');
      setBusy(false);
    }
  };

  const onBlockHourAll = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await postBloqueo(jwt, slug, {
        inicio: selected.slot.inicio,
        fin: selected.slot.fin,
        motivo: bloqueoMotivo || 'Bloqueo admin',
        recursoDocumentId: null,
      });
      await reload();
    } catch (err: any) {
      setError(err?.message || 'No se pudo bloquear la hora');
      setBusy(false);
    }
  };

  const onCancel = async (documentId: string) => {
    if (
      !confirm(
        '¿Liberar este hueco en la agenda?\n\nSi hay pago MP, reembolsá aparte desde la cuenta de prueba/producción según corresponda.'
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postCancelReserva(jwt, slug, documentId);
      await reload();
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cancelar';
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  };

  const onDeleteBloqueo = async (documentId: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteBloqueo(jwt, slug, documentId);
      await reload();
    } catch (err: any) {
      setError(err?.message || 'No se pudo quitar el bloqueo');
      setBusy(false);
    }
  };

  return (
    <main className="ra-page">
      <header className="ra-header">
        <div>
          <p className="ra-kicker">Admin reservas</p>
          <h1>{brand}</h1>
          <p className="ra-sub">
            <Link href={`/reservas/${slug}`} target="_blank">
              Ver grilla pública
            </Link>
            {' · '}
            <Link href="/portal/reservas">Todos los comercios</Link>
          </p>
          <CopyPublicReservaLink path={`/reservas/${slug}`} />
        </div>
      </header>

      {error ? <p className="ra-error">{error}</p> : null}

      <ReservasAdminConfig slug={slug} jwt={jwt} />

      <section className="ra-panel">
        <div className="ra-panel-head">
          <div>
            <h2>Agenda del día</h2>
            <p className="ra-hint">Tocá un hueco libre. Después elegís turno manual o bloqueo abajo.</p>
          </div>
          <div className="ra-date">
            <label>
              Día
              <input
                type="date"
                value={fecha}
                disabled={busy}
                onChange={(e) => {
                  const v = e.target.value;
                  setFecha(v);
                  void reload(v);
                }}
              />
            </label>
            <button
              type="button"
              className="ra-btn"
              disabled={busy}
              data-testid="reserva-agenda-refresh"
              onClick={() => void reload(fecha)}
            >
              Actualizar
            </button>
          </div>
        </div>

        {!dia || !dia.slots?.length ? (
          <p className="ra-muted">Sin horarios este día.</p>
        ) : (
          <div className="ra-grid">
            <div className="ra-row ra-head">
              <span>Hora</span>
              {(agenda.recursos || []).map((r: any) => (
                <span key={r.documentId}>{r.nombre}</span>
              ))}
            </div>
            {dia.slots.map((slot: any) => (
              <div key={slot.inicio} className="ra-row">
                <span className="ra-time">{slot.hora}</span>
                {(agenda.recursos || []).map((r: any) => {
                  const cell = slot.recursos.find((x: any) => x.documentId === r.documentId);
                  const libre = !!cell?.disponible;
                  const isSelected =
                    selected?.slot.inicio === slot.inicio && selected?.recursoId === r.documentId;
                  if (!libre) {
                    const occupant = cellOccupant(agenda, slot, r.documentId);
                    return (
                      <div
                        key={`${slot.inicio}-${r.documentId}`}
                        className={`ra-cell is-busy${occupant.kind === 'reserva' ? ' is-reserva' : ''}${occupant.kind === 'bloqueo' ? ' is-bloqueo' : ''}`}
                        title={occupant.sub || occupant.label}
                      >
                        <span className="ra-cell-main">{occupant.label}</span>
                        {occupant.sub ? <span className="ra-cell-sub">{occupant.sub}</span> : null}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={`${slot.inicio}-${r.documentId}`}
                      type="button"
                      disabled={busy}
                      className={`ra-cell is-free${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        setError(null);
                        setSelected({
                          slot,
                          recursoId: r.documentId,
                          recursoNombre: r.nombre,
                        });
                      }}
                    >
                      Libre
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {selected ? (
          <div className="ra-action-bar" data-testid="reserva-admin-action">
            <p className="ra-action-title">
              Seleccionado: <strong>{selected.slot.hora}</strong> · {selected.recursoNombre}
            </p>
            <div className="ra-tools">
              <label>
                Nombre del cliente (turno manual)
                <input
                  value={walkNombre}
                  onChange={(e) => setWalkNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  disabled={busy}
                />
              </label>
              <label>
                Motivo si bloqueás
                <input
                  value={bloqueoMotivo}
                  onChange={(e) => setBloqueoMotivo(e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>
            <div className="ra-action-buttons">
              <button type="button" className="ra-btn primary" disabled={busy} onClick={() => void onWalkIn()}>
                Registrar turno manual
              </button>
              <button
                type="button"
                className="ra-btn"
                disabled={busy}
                onClick={() => void onBlockSelected()}
              >
                Bloquear este puesto
              </button>
              <button
                type="button"
                className="ra-btn"
                disabled={busy}
                onClick={() => void onBlockHourAll()}
              >
                Bloquear toda la hora
              </button>
              <button
                type="button"
                className="ra-btn ghost"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Limpiar selección
              </button>
            </div>
          </div>
        ) : (
          <p className="ra-muted ra-action-placeholder">Ningún hueco seleccionado.</p>
        )}
      </section>

      <section className="ra-panel">
        <h2>Reservas</h2>
        <ul className="ra-list">
          {(agenda.reservas || [])
            .filter((r: any) => r.estado !== 'cancelada')
            .map((r: any) => (
              <li key={r.documentId}>
                <div>
                  <strong>
                    {formatTimeLabel(r.inicio)} · {r.recurso?.nombre}
                  </strong>
                  <span>
                    {r.cliente_nombre} · {r.codigo} · {r.estado}/{r.origen}
                    {r.mp_payment_id ? ` · MP ${r.mp_payment_id}` : ''}
                  </span>
                </div>
                {(r.estado === 'confirmada' || r.estado === 'hold') && (
                  <button type="button" disabled={busy} onClick={() => void onCancel(r.documentId)}>
                    Cancelar
                  </button>
                )}
              </li>
            ))}
          {!(agenda.reservas || []).filter((r: any) => r.estado !== 'cancelada').length ? (
            <li className="ra-muted">Sin reservas activas este día.</li>
          ) : null}
        </ul>
      </section>

      <section className="ra-panel">
        <h2>Bloqueos</h2>
        <ul className="ra-list">
          {(agenda.bloqueos || []).map((b: any) => (
            <li key={b.documentId}>
              <div>
                <strong>
                  {formatTimeLabel(b.inicio)}–{formatTimeLabel(b.fin)}
                  {b.recurso ? ` · ${b.recurso.nombre}` : ' · todos'}
                </strong>
                <span>{b.motivo}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDeleteBloqueo(b.documentId)}
              >
                Quitar
              </button>
            </li>
          ))}
          {!(agenda.bloqueos || []).length ? (
            <li className="ra-muted">Sin bloqueos este día.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
