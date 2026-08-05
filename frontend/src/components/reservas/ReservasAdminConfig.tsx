'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchAdminConfig,
  putAdminConfig,
  startAdminMpOauth,
  disconnectAdminMpOauth,
  type ReservaComercioConfig,
} from '@/lib/reservas-admin';
import ReservasMpTokenGuide from '@/components/reservas/ReservasMpTokenGuide';

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
  const [open, setOpen] = useState(false);
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
  const [modoCobro, setModoCobro] = useState<'mp_requerido' | 'solo_local' | 'mp_o_local'>(
    'mp_requerido'
  );
  const [days, setDays] = useState<Record<string, DayRow>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [mpTokenInput, setMpTokenInput] = useState('');
  const [clearMpToken, setClearMpToken] = useState(false);
  const [operadoPlataforma, setOperadoPlataforma] = useState(true);
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
    setModoCobro(
      data.modo_cobro === 'solo_local' || data.modo_cobro === 'mp_o_local'
        ? data.modo_cobro
        : 'mp_requerido'
    );
    setOperadoPlataforma(data.operado_por_plataforma !== false);
    setDays(horarioToRows(data.horario));
    setLogoFile(null);
    setPortadaFile(null);
    setMpTokenInput('');
    setClearMpToken(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('mp_oauth');
    const tab = params.get('tab');
    if (oauth || tab === 'config') {
      setOpen(true);
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-testid="reserva-admin-config"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (!oauth) return;
    if (oauth === 'ok') {
      toast.success('Mercado Pago conectado. Ya podés apagar la simulación.');
    } else if (oauth === 'error') {
      toast.error(params.get('msg') || 'No se pudo conectar Mercado Pago');
    }
    params.delete('mp_oauth');
    params.delete('msg');
    params.delete('tab');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', next);
  }, []);

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
      const fields: Record<string, unknown> = {};
      if (config.can_edit_config) {
        const canDisable =
          !clearMpToken &&
          (modoCobro === 'solo_local' ||
            Boolean(config.can_disable_simulacion || config.mp_configured) ||
            mpTokenInput.trim().length >= 20);
        Object.assign(fields, {
          nombre_publico: nombrePublico,
          texto_llegada: textoLlegada,
          precio_ars: Number(precio),
          duracion_minutos: Number(duracion),
          buffer_limpieza_minutos: Number(buffer),
          hold_ttl_minutos: Number(holdTtl),
          anticipacion_llegada_minutos: Number(anticipacion),
          cancelacion_horas_minimas: Number(cancelHoras),
          reembolso_porcentaje: Number(reembolso),
          modo_simulacion: canDisable ? modoSim : true,
          modo_cobro: modoCobro,
          horario: rowsToHorario(days),
        });
      }
      if (config.can_edit_mp_token) {
        if (clearMpToken) {
          fields.mp_access_token_clear = true;
        } else if (mpTokenInput.trim()) {
          fields.mp_access_token = mpTokenInput.trim();
        }
      }
      if (config.can_edit_operacion) {
        fields.operado_por_plataforma = operadoPlataforma;
      }
      const media =
        config.can_edit_config && (logoFile || portadaFile)
          ? { logo: logoFile, portada: portadaFile }
          : undefined;
      if (!Object.keys(fields).length && !media) {
        const msg = 'No tenés permisos para guardar cambios en esta configuración.';
        setError(msg);
        toast.error(msg, { id: toastId });
        return;
      }
      const data = await putAdminConfig(jwt, slug, fields, media);
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
      <section className="ra-panel ra-config-collapsed" data-testid="reserva-admin-config">
        <button
          type="button"
          className="ra-config-toggle"
          aria-expanded={false}
          disabled
          data-testid="reserva-config-toggle"
        >
          <span className="ra-config-toggle-label">
            <span className="ra-config-toggle-title">Configuración del comercio</span>
            <span className="ra-muted">Cargando…</span>
          </span>
        </button>
      </section>
    );
  }

  const canEdit = Boolean(config?.can_edit_config);
  const canEditMp = Boolean(config?.can_edit_mp_token);
  const canEditOp = Boolean(config?.can_edit_operacion);
  const fieldsDisabled = busy || !canEdit;
  const canDisableSim =
    !clearMpToken &&
    (modoCobro === 'solo_local' ||
      Boolean(config?.can_disable_simulacion || config?.mp_configured) ||
      mpTokenInput.trim().length >= 20);
  const effectiveModoSim = canDisableSim ? modoSim : true;

  return (
    <section
      className={`ra-panel${open ? '' : ' ra-config-collapsed'}`}
      data-testid="reserva-admin-config"
    >
      <button
        type="button"
        className="ra-config-toggle"
        aria-expanded={open}
        data-testid="reserva-config-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ra-config-toggle-label">
          <span className="ra-config-toggle-title">Configuración del comercio</span>
          <span className={`ra-badge ${effectiveModoSim ? 'is-sim' : 'is-live'}`}>
            {effectiveModoSim ? 'Simulación ON' : 'MP real (sandbox/prod)'}
          </span>
        </span>
        <span className="ra-config-toggle-action">{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>

      {open ? (
        <>
      <div className="ra-config-head">
        <p className="ra-hint" style={{ margin: 0, flex: 1 }}>
          {config?.operado_por_plataforma !== false
            ? 'Operación: San Rafael 360 (plataforma).'
            : 'Operación: dueño del negocio.'}{' '}
          {canEdit
            ? 'Podés editar precio, horario y simulación.'
            : 'Solo lectura: pedile al admin de SR360 si necesitás un cambio.'}
        </p>
        <button
          type="button"
          className="ra-btn primary"
          disabled={busy || (!canEdit && !canEditMp && !canEditOp)}
          data-testid="reserva-config-save-top"
          onClick={() => void onSave()}
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {error ? <p className="ra-error">{error}</p> : null}

      {canEditOp ? (
        <fieldset className="ra-fieldset" disabled={busy} data-testid="reserva-operacion-flag">
          <legend>¿Quién opera este módulo?</legend>
          <label className="ra-check">
            <input
              type="radio"
              name="operacion"
              checked={operadoPlataforma}
              onChange={() => setOperadoPlataforma(true)}
            />
            Lo opera San Rafael 360 (admin)
          </label>
          <label className="ra-check">
            <input
              type="radio"
              name="operacion"
              checked={!operadoPlataforma}
              onChange={() => setOperadoPlataforma(false)}
            />
            Lo opera el dueño del negocio
          </label>
        </fieldset>
      ) : null}

      <div className="ra-tools">
        <label>
          Nombre público
          <input
            value={nombrePublico}
            disabled={fieldsDisabled}
            onChange={(e) => setNombrePublico(e.target.value)}
          />
        </label>
        <label>
          Precio ARS
          <input
            type="number"
            min={1}
            value={precio}
            disabled={fieldsDisabled}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </label>
        <label>
          Duración (min)
          <input
            type="number"
            min={15}
            value={duracion}
            disabled={fieldsDisabled}
            onChange={(e) => setDuracion(e.target.value)}
          />
        </label>
        <label>
          Buffer limpieza (min)
          <input
            type="number"
            min={0}
            value={buffer}
            disabled={fieldsDisabled}
            onChange={(e) => setBuffer(e.target.value)}
          />
        </label>
        <label>
          Hold TTL (min)
          <input
            type="number"
            min={5}
            value={holdTtl}
            disabled={fieldsDisabled}
            onChange={(e) => setHoldTtl(e.target.value)}
          />
        </label>
        <label>
          Anticipación llegada (min)
          <input
            type="number"
            min={0}
            value={anticipacion}
            disabled={fieldsDisabled}
            onChange={(e) => setAnticipacion(e.target.value)}
          />
        </label>
        <label>
          Cancelación mínima (h)
          <input
            type="number"
            min={0}
            value={cancelHoras}
            disabled={fieldsDisabled}
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
            disabled={fieldsDisabled}
            onChange={(e) => setReembolso(e.target.value)}
          />
        </label>
      </div>

      <label className="ra-check">
        <input
          type="checkbox"
          checked={effectiveModoSim}
          disabled={fieldsDisabled || !canDisableSim}
          onChange={(e) => setModoSim(e.target.checked)}
          data-testid="reserva-modo-sim"
        />
        Modo simulación (sin Mercado Pago)
      </label>
      {!canDisableSim ? (
        <p className="ra-muted" data-testid="reserva-sim-gate-hint">
          Sin token de cobros no se puede cobrar con MP: la simulación queda fija en ON.
          {canEdit
            ? ' Conectá MP, o elegí cobro “solo en el local” abajo.'
            : canEditMp
              ? ' Pegá el token abajo para poder apagarla.'
              : ''}
        </p>
      ) : (
        <p className="ra-muted">
          {modoCobro === 'solo_local'
            ? 'Cobro en el local: podés apagar la simulación sin Mercado Pago.'
            : 'Con token cargado (o cobro local) podés apagar la simulación.'}
        </p>
      )}

      {canEdit ? (
        <fieldset className="ra-fieldset ra-modo-cobro" disabled={busy} data-testid="reserva-modo-cobro">
          <legend>Modo de cobro</legend>
          <label className="ra-check">
            <input
              type="radio"
              name="modo_cobro"
              checked={modoCobro === 'mp_requerido'}
              onChange={() => setModoCobro('mp_requerido')}
            />
            Solo Mercado Pago (anticipado)
          </label>
          <label className="ra-check">
            <input
              type="radio"
              name="modo_cobro"
              checked={modoCobro === 'solo_local'}
              onChange={() => setModoCobro('solo_local')}
            />
            Solo pago en el local (confirma turno sin MP)
          </label>
          <label className="ra-check">
            <input
              type="radio"
              name="modo_cobro"
              checked={modoCobro === 'mp_o_local'}
              onChange={() => setModoCobro('mp_o_local')}
            />
            El visitante elige: MP anticipado o pago en el local
          </label>
        </fieldset>
      ) : null}

      <h3 className="ra-subhead">Mercado Pago — Token de cobros</h3>
      <p className="ra-muted" style={{ marginBottom: '0.75rem' }}>
        {config?.mp_configured
          ? `Token de cobros cargado${config.mp_token_hint ? ` (${config.mp_token_hint})` : ''}${
              config.mp_oauth_connected ? ' · conectado con OAuth' : ''
            }.${canEditMp ? ' Pegá uno nuevo solo si querés rotarlo a mano.' : ''}`
          : canEditMp || config?.mp_oauth_available
            ? 'Todavía no hay token de cobros. Conectá con Mercado Pago o seguí la guía para pegarlo.'
            : 'Sin permiso para cargar el token (solo admin SR360).'}
      </p>

      {config?.mp_oauth_available ? (
        <div className="ra-oauth-row" data-testid="reserva-mp-oauth">
          <button
            type="button"
            className="ra-btn primary"
            disabled={busy}
            data-testid="reserva-mp-oauth-connect"
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  const data = await startAdminMpOauth(jwt, slug);
                  window.location.href = data.authorizeUrl;
                } catch (err: any) {
                  toast.error(err?.message || 'No se pudo iniciar OAuth');
                  setBusy(false);
                }
              })();
            }}
          >
            {config.mp_oauth_connected || config.mp_configured
              ? 'Reconectar Mercado Pago'
              : 'Conectar Mercado Pago'}
          </button>
          {config.mp_oauth_connected || config.mp_configured ? (
            <button
              type="button"
              className="ra-btn ghost"
              disabled={busy}
              data-testid="reserva-mp-oauth-disconnect"
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    await disconnectAdminMpOauth(jwt, slug);
                    const data = await fetchAdminConfig(jwt, slug);
                    hydrate(data);
                    toast.success('Mercado Pago desconectado. Simulación ON.');
                  } catch (err: any) {
                    toast.error(err?.message || 'No se pudo desconectar');
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Desconectar
            </button>
          ) : null}
        </div>
      ) : (
        <p className="ra-muted" data-testid="reserva-mp-oauth-disabled">
          OAuth no está habilitado en este entorno (faltan variables MP_OAUTH_*). Podés seguir
          pegando el token a mano.
        </p>
      )}

      <ReservasMpTokenGuide canPaste={canEditMp} />

      {canEditMp ? (
        <>
          <label className="ra-block-label">
            Token de cobros (Access Token)
            <input
              type="password"
              autoComplete="off"
              placeholder="APP_USR-… o TEST-…"
              value={mpTokenInput}
              disabled={busy || clearMpToken}
              onChange={(e) => setMpTokenInput(e.target.value)}
              data-testid="reserva-mp-token-input"
            />
          </label>
          <label className="ra-check">
            <input
              type="checkbox"
              checked={clearMpToken}
              disabled={busy || !config?.mp_configured}
              onChange={(e) => {
                setClearMpToken(e.target.checked);
                if (e.target.checked) {
                  setMpTokenInput('');
                  setModoSim(true);
                }
              }}
            />
            Quitar token guardado en el portal
          </label>
        </>
      ) : null}

      <label className="ra-block-label">
        Texto de llegada
        <textarea
          rows={2}
          value={textoLlegada}
          disabled={fieldsDisabled}
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
                  disabled={fieldsDisabled}
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
                disabled={fieldsDisabled || !row.abierto}
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
                disabled={fieldsDisabled || !row.abierto}
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
              disabled={fieldsDisabled}
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
              disabled={fieldsDisabled}
              onChange={(e) => setPortadaFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      <div className="ra-action-buttons">
        <button
          type="button"
          className="ra-btn primary"
          disabled={busy || (!canEdit && !canEditMp && !canEditOp)}
          data-testid="reserva-config-save-bottom"
          onClick={() => void onSave()}
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
        </>
      ) : null}
    </section>
  );
}
