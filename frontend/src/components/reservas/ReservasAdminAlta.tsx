'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getStrapiUrl } from '@/lib/strapi';
import { postAdminCreateComercio } from '@/lib/reservas-admin';

type NegocioPicker = {
  documentId: string;
  nombre: string;
  slug: string;
};

type Props = {
  jwt: string;
  /** documentIds de negocios que ya tienen módulo */
  linkedNegocioIds: string[];
};

export default function ReservasAdminAlta({ jwt, linkedNegocioIds }: Props) {
  const router = useRouter();
  const linked = useMemo(() => new Set(linkedNegocioIds), [linkedNegocioIds]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NegocioPicker[]>([]);
  const [selected, setSelected] = useState<NegocioPicker | null>(null);
  const [cantidad, setCantidad] = useState('4');
  const [precio, setPrecio] = useState('15000');
  const [slugOverride, setSlugOverride] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(
        `${getStrapiUrl()}/api/clientes/admin/negocios-picker?search=${encodeURIComponent(value.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || `Picker ${res.status}`);
      const rows = (json.data || []) as NegocioPicker[];
      setResults(rows.filter((n) => !linked.has(n.documentId)));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo buscar negocios');
    }
  };

  const onCreate = async () => {
    if (!selected) {
      toast.error('Elegí un negocio del directorio');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Activando módulo de reservas…');
    try {
      const data = await postAdminCreateComercio(jwt, {
        negocioDocumentId: selected.documentId,
        cantidad_recursos: Number(cantidad) || 4,
        precio_ars: Number(precio) || 15000,
        ...(slugOverride.trim() ? { slug: slugOverride.trim() } : {}),
      });
      toast.success(`Módulo activo: /reservas/${data.slug} (simulación ON)`, { id: toastId });
      router.push(`/portal/reservas/${data.slug}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo activar', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="ra-btn primary"
        data-testid="reserva-admin-alta-open"
        onClick={() => setOpen(true)}
      >
        Activar módulo en un negocio
      </button>
    );
  }

  return (
    <section className="ra-panel" data-testid="reserva-admin-alta">
      <div className="ra-config-head">
        <h2>Alta de módulo reservas</h2>
        <button type="button" className="ra-btn" disabled={busy} onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
      <p className="ra-hint">
        Solo Master Admin. Se crea el comercio de turnos + puestos, se linkea al negocio y queda en{' '}
        <strong>simulación ON</strong>.
      </p>

      <label className="ra-block-label">
        Buscar negocio
        <input
          type="search"
          value={query}
          placeholder="Escribí al menos 2 letras…"
          disabled={busy}
          onChange={(e) => void search(e.target.value)}
          data-testid="reserva-admin-alta-search"
        />
      </label>

      {results.length ? (
        <ul className="ra-list" data-testid="reserva-admin-alta-results">
          {results.map((n) => (
            <li key={n.documentId}>
              <button
                type="button"
                className={`ra-picker-item ${selected?.documentId === n.documentId ? 'is-selected' : ''}`}
                disabled={busy}
                onClick={() => {
                  setSelected(n);
                  setSlugOverride(n.slug || '');
                }}
              >
                <span>{n.nombre}</span>
                <span className="ra-muted">/{n.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 ? (
        <p className="ra-muted">Sin resultados disponibles (o ya tienen módulo).</p>
      ) : null}

      {selected ? (
        <p className="ra-ok" data-testid="reserva-admin-alta-selected">
          Seleccionado: {selected.nombre}
        </p>
      ) : null}

      <div className="ra-tools">
        <label>
          Slug público
          <input
            value={slugOverride}
            disabled={busy || !selected}
            onChange={(e) => setSlugOverride(e.target.value)}
            placeholder="ej. mi-local"
          />
        </label>
        <label>
          Cantidad de puestos
          <input
            type="number"
            min={1}
            max={40}
            value={cantidad}
            disabled={busy}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </label>
        <label>
          Precio ARS (default)
          <input
            type="number"
            min={1}
            value={precio}
            disabled={busy}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </label>
      </div>

      <div className="ra-action-buttons">
        <button
          type="button"
          className="ra-btn primary"
          disabled={busy || !selected}
          data-testid="reserva-admin-alta-submit"
          onClick={() => void onCreate()}
        >
          Crear módulo
        </button>
      </div>
    </section>
  );
}
