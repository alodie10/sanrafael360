'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchAdminConfig,
  putAdminConfig,
  type ReservaComercioConfig,
} from '@/lib/reservas-admin';

const DAY_META: Array<{ key: string; label: string }> = [
  { key: '1', label: 'Lun' },
  { key: '2', label: 'Mar' },
  { key: '3', label: 'Mié' },
  { key: '4', label: 'Jue' },
  { key: '5', label: 'Vie' },
  { key: '6', label: 'Sáb' },
  { key: '0', label: 'Dom' },
];

type DayRow = { abierto: boolean; inicio: string; fin: string };

type Props = {
  slug: string;
  jwt: string;
};

function horarioToRows(horario: ReservaComercioConfig['horario']): Record<string, DayRow> {
  const rows: Record<string, DayRow> = {};
  for (const { key } of DAY_META) {
    const slot = horario?.dias?.[key]?.[0];
    rows[key] = {
      abierto: Boolean(slot),
      inicio: slot?.inicio || '16:00',
      fin: slot?.fin || '22:00',
    };
  }
  return rows;
}

function rowsToHorario(rows: Record<string, DayRow>) {
  const dias: Record<string, Array<{ inicio: string; fin: string }>> = {};
  for (const { key } of DAY_META) {
    const row = rows[key];
    dias[key] = row?.abierto ? [{ inicio: row.inicio, fin: row.fin }] : [];
  }
  return { dias };
}

export default function ReservasAdminConfig({ slug, jwt }: Props) {
  const [config, setConfig] = useState<ReservaComercioConfig | null>(null);
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('60');
  const [buffer, setBuffer] = useState('0');
  const [holdTtl, setHoldTtl] = useState('15');
  const [anticipacion, setAnticipacion] = useState('15');
  const [textoLlegada, setTextoLlegada] = useState('');
  const [nombrePublico, setNombrePublico] = useState('');
  const [cancelHoras, setCancelHoras] = useState('24');
  const [reembolso, setReembolso] = useState('100');
  const [modoSim, setModoSim] = useState(true);
  const [days, setDays] = useState<Record<string, DayRow>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = (data: ReservaComercioConfig) => {
    setConfig(data);
    setPrecio(String(data.precio_ars ?? ''));
    setDuracion(String(data.duracion_minutos ?? 60));
    setBuffer(String(data.buffer_limpieza_minutos ?? 0));
    setHoldTtl(String(data.hold_ttl_minutos ?? 15));
    setAnticipacion(String(data.anticipacion_llegada_minutos ?? 15));
    setTextoLlegada(data.texto_llegada || '');
    setNombrePublico(data.nombre_publico || '');
    setCancelHoras(String(data.cancelacion_horas_minimas ?? 24));
    setReembolso(
      String(data.cancelacion_politica?.dentro_ventana?.reembolso_porcentaje ?? 100)
    );
    setModoSim(Boolean(data.modo_simulacion));
    setDays(horarioToRows(data.horario));
    setLogoFile(null);
    setPortadaFile(null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminConfig(jwt, slug);
        if (!cancelled) hydrate(data);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || 'No se pudo cargar la config';
          setError(msg);
          toast.error(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jwt, slug]);

  const onSave = async () => {
    if (!config) {
      const msg = 'La configuración todavía no cargó. Recargá la página.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    setError(null);
    const toastId = toast.loading('Guardando configuración…');
    try {
      const data = await putAdminConfig(
        jwt,
        slug,
        {
          nombre_publico: nombrePublico,
          texto_llegada: textoLlegada,
          precio_ars: Number(precio),
          duracion_minutos: Number(duracion),
          buffer_limpieza_minutos: Number(buffer),
          hold_ttl_minutos: Number(holdTtl),
          anticipacion_llegada_minutos: Number(anticipacion),
          cancelacion_horas_minimas: Number(cancelHoras),
          reembolso_porcentaje: Number(reembolso),
          modo_simulacion: modoSim,
          horario: rowsToHorario(days),
        },
        { logo: logoFile, portada: portadaFile }
      );
      hydrate(data);
      toast.success(
        data.modo_simulacion
          ? '¡Configuración guardada! (simulación ON)'
          : '¡Configuración guardada!',
        { id: toastId }
      );
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar';
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  if (!config && !error) {
    return (
      <section className="ra-panel">
        <h2>Configuración del comercio</h2>
        <p className="ra-muted">Cargando…</p>
      </section>
    );
  }

  return (
    <section className="ra-panel" data-testid="reserva-admin-config">
      <div className="ra-config-head">
        <h2>Configuración del comercio</h2>
        <span className={`ra-badge ${modoSim ? 'is-sim' : 'is-live'}`}>
          {modoSim ? 'Simulación ON' : 'MP real (sandbox/prod)'}
        </span>
      </div>
      <p className="ra-hint">
        Para probar Mercado Pago sandbox: apagá simulación, cargá{' '}
        <code>MP_ACCESS_TOKEN_JADITEK</code> en el backend y usá un túnel para el webhook.
      </p>

      {error ? <p className="ra-error">{error}</p> : null}

      <div className="ra-tools">
        <label>
          Nombre público
          <input value={nombrePublico} disabled={busy} onChange={(e) => setNombrePublico(e.target.value)} />
        </label>
        <label>
          Precio ARS
          <input type="number" min={1} value={precio} disabled={busy} onChange={(e) => setPrecio(e.target.value)} />
        </label>
        <label>
          Duración (min)
          <input type="number" min={15} value={duracion} disabled={busy} onChange={(e) => setDuracion(e.target.value)} />
        </label>
        <label>
          Buffer limpieza (min)
          <input type="number" min={0} value={buffer} disabled={busy} onChange={(e) => setBuffer(e.target.value)} />
        </label>
        <label>
          Hold TTL (min)
          <input type="number" min={5} value={holdTtl} disabled={busy} onChange={(e) => setHoldTtl(e.target.value)} />
        </label>
        <label>
          Anticipación llegada (min)
          <input
            type="number"
            min={0}
            value={anticipacion}
            disabled={busy}
            onChange={(e) => setAnticipacion(e.target.value)}
          />
        </label>
        <label>
          Cancelación mínima (h)
          <input
            type="number"
            min={0}
            value={cancelHoras}
            disabled={busy}
            onChange={(e) => setCancelHoras(e.target.value)}
          />
        </label>
        <label>
          Reembolso dentro de ventana (%)
          <input
            type="number"
            min={0}
            max={100}
            value={reembolso}
            disabled={busy}
            onChange={(e) => setReembolso(e.target.value)}
          />
        </label>
      </div>

      <label className="ra-check">
        <input
          type="checkbox"
          checked={modoSim}
          disabled={busy}
          onChange={(e) => setModoSim(e.target.checked)}
        />
        Modo simulación (sin Mercado Pago)
      </label>

      <label className="ra-block-label">
        Texto de llegada
        <textarea
          rows={2}
          value={textoLlegada}
          disabled={busy}
          onChange={(e) => setTextoLlegada(e.target.value)}
        />
      </label>

      <h3 className="ra-subhead">Horario</h3>
      <div className="ra-days">
        {DAY_META.map(({ key, label }) => {
          const row = days[key] || { abierto: false, inicio: '16:00', fin: '22:00' };
          return (
            <div key={key} className="ra-day-row">
              <label className="ra-check">
                <input
                  type="checkbox"
                  checked={row.abierto}
                  disabled={busy}
                  onChange={(e) =>
                    setDays((prev) => ({
                      ...prev,
                      [key]: { ...row, abierto: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
              <input
                type="time"
                value={row.inicio}
                disabled={busy || !row.abierto}
                onChange={(e) =>
                  setDays((prev) => ({
                    ...prev,
                    [key]: { ...row, inicio: e.target.value },
                  }))
                }
              />
              <input
                type="time"
                value={row.fin}
                disabled={busy || !row.abierto}
                onChange={(e) =>
                  setDays((prev) => ({
                    ...prev,
                    [key]: { ...row, fin: e.target.value },
                  }))
                }
              />
            </div>
          );
        })}
      </div>

      <h3 className="ra-subhead">Piel (logo / portada)</h3>
      <div className="ra-media">
        <div>
          {config?.logo_url || logoFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoFile ? URL.createObjectURL(logoFile) : config?.logo_url || ''}
              alt="Logo"
              className="ra-media-preview is-logo"
            />
          ) : (
            <p className="ra-muted">Sin logo</p>
          )}
          <label className="ra-file">
            Logo
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <div>
          {config?.portada_url || portadaFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portadaFile ? URL.createObjectURL(portadaFile) : config?.portada_url || ''}
              alt="Portada"
              className="ra-media-preview is-cover"
            />
          ) : (
            <p className="ra-muted">Sin portada</p>
          )}
          <label className="ra-file">
            Portada
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => setPortadaFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      <div className="ra-action-buttons">
        <button type="button" className="ra-btn primary" disabled={busy} onClick={() => void onSave()}>
          Guardar configuración
        </button>
      </div>
    </section>
  );
}
