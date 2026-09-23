"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { STRAPI_URL, isBrowserNetworkError } from "@/lib/strapi";
import type { CrmAlcanzado, CrmBootstrap, CrmContacto, CrmCupo, CrmEstado, CrmLeadFiltro } from "@/lib/crm";
import { alcanzadoAsContacto, crmSlugQuery, filterAlcanzadosUi } from "@/lib/crm";
import { normalizePlantillaSlots, type PlantillaSlot } from "@/lib/plantilla-slots";
import CrmManualForm from "./CrmManualForm";
import CrmIngestPanel from "./CrmIngestPanel";
import CrmContactList, { type CrmCategoria } from "./CrmContactList";
import CrmPlantillaForm from "./CrmPlantillaForm";
import CrmLeadFilters from "./CrmLeadFilters";
import CrmContactadosList from "./CrmContactadosList";
import CrmFold from "./CrmFold";

type Props = { jwt: string; isAdmin: boolean };

function apiError(json: any, fallback: string) {
  return json?.error?.message || json?.error || fallback;
}

export default function CrmPilotClient({ jwt, isAdmin }: Props) {
  const [boot, setBoot] = useState<CrmBootstrap | null>(null);
  const [slug, setSlug] = useState("");
  const slugRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CrmCategoria[]>([]);
  const [alcanzados, setAlcanzados] = useState<CrmAlcanzado[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<CrmLeadFiltro>({ estado: "", desde: "", hasta: "" });
  const [tab, setTab] = useState<"mesa" | "alcanzados">("mesa");
  const [plantillaIndex, setPlantillaIndex] = useState(0);

  const plantillaSlots = normalizePlantillaSlots(boot?.plantilla.slots, boot?.plantilla.mensaje);

  const load = useCallback(
    async (nextSlug?: string) => {
      const q = crmSlugQuery(nextSlug ?? slugRef.current);
      const res = await fetch(`${STRAPI_URL}/api/crm/bootstrap${q}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setForbidden(true);
        throw new Error(apiError(json, "No tenés acceso a este CRM"));
      }
      if (!res.ok) throw new Error(apiError(json, "No se pudo cargar el CRM"));
      setForbidden(false);
      setBoot(json.data);
      if (json.data?.comercio?.slug) {
        slugRef.current = json.data.comercio.slug;
        setSlug(json.data.comercio.slug);
      }
      const hist = await fetch(
        `${STRAPI_URL}/api/crm/alcanzados${crmSlugQuery(json.data?.comercio?.slug)}`,
        { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" }
      );
      const histJson = await hist.json().catch(() => ({}));
      if (hist.ok) setAlcanzados(histJson.data || []);
    },
    [jwt]
  );

  useEffect(() => {
    load().catch((err) => {
      setError(
        isBrowserNetworkError(err)
          ? "No se pudo conectar con Strapi."
          : err instanceof Error
            ? err.message
            : "Error al cargar el CRM"
      );
    });
  }, [load]);

  useEffect(() => {
    fetch(`${STRAPI_URL}/api/categorias?sort=nombre:asc&pagination[limit]=1000`)
      .then((res) => res.json())
      .then((json) => setCategorias(json.data || []))
      .catch(() => setCategorias([]));
  }, []);

  function withSlug(body: Record<string, unknown>) {
    return slug ? { ...body, slug } : body;
  }

  async function createManual(input: {
    nombre: string;
    telefono: string;
    instagram: string;
    nota: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/contactos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug(input)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo crear"));
      const status = json.data?.status;
      const saved = json.data?.contacto?.nombre || input.nombre;
      setNotice(status === "duplicado" ? `Ya estaba en la cola: ${saved}` : `Contacto cargado: ${saved}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function ingest(payload: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/ingestar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug({ payload })),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo encolar"));
      setNotice(`Creados ${json.data.creados} · duplicados ${json.data.duplicados}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function enviar(documentId: string) {
    setBusyId(documentId);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/enviar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug({ contactoDocumentId: documentId, plantillaIndex })),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo armar WhatsApp"));
      setBoot((prev) =>
        prev
          ? { ...prev, contactos: prev.contactos.filter((c) => c.documentId !== documentId) }
          : prev
      );
      if (json.data?.whatsappUrl) {
        window.open(json.data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      if (json.data?.aviso) setNotice(json.data.aviso);
      if (json.data?.cupo) patchCupo(json.data.cupo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
      await load().catch(() => undefined);
    }
  }

  function patchCupo(cupo: CrmCupo) {
    setBoot((prev) => (prev ? { ...prev, cupo } : prev));
  }

  async function guardarPlantilla(input: { firma: string; slots: PlantillaSlot[] }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/plantilla`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug(input)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo guardar la plantilla"));
      setNotice("Plantilla CRM guardada");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function cambiarEstado(documentId: string, estado: CrmEstado) {
    const res = await fetch(`${STRAPI_URL}/api/crm/contactos/${documentId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withSlug({ estado })),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(apiError(json, "No se pudo actualizar"));
      return;
    }
    await load();
  }

  async function guardarNota(documentId: string, nota: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/contactos/${documentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug({ nota })),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo guardar el comentario"));
      setNotice("Comentario guardado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const loadNotas = useCallback(
    async (documentId: string) => {
      const q = crmSlugQuery(slug);
      const res = await fetch(`${STRAPI_URL}/api/crm/contactos/${documentId}/notas${q}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo cargar el historial"));
      return (json.data || []) as { texto: string; createdAt: string }[];
    },
    [jwt, slug]
  );

  async function cambiarCategoria(documentId: string, categoriaId: string) {
    const res = await fetch(`${STRAPI_URL}/api/crm/contactos/${documentId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withSlug({ categoriaId })),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(apiError(json, "No se pudo guardar la categoría"));
      return;
    }
    setBoot((prev) =>
      prev
        ? {
            ...prev,
            contactos: prev.contactos.map((c: CrmContacto) =>
              c.documentId === documentId ? json.data : c
            ),
          }
        : prev
    );
  }

  async function crearFicha(documentId: string) {
    setBusyId(documentId);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/crear-ficha`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug({ contactoDocumentId: documentId })),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo crear la ficha"));
      const slugFicha = json.data?.negocio?.slug;
      setNotice(
        json.data?.created
          ? `Ficha publicada${slugFicha ? ` · /negocios/${slugFicha}` : ""}`
          : "Ya tenía ficha"
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function limpiarCola() {
    if (!window.confirm("¿Sacar todos los contactos de la cola? El historial de contactados queda.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/crm/limpiar-cola`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withSlug({})),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo limpiar la cola"));
      setNotice(`Cola limpia · ${json.data?.ocultados ?? 0} contactos fuera`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black font-sans pt-[72px] pb-8" data-testid="crm-page">
      <div className="bg-zinc-950/80 border-b border-white/5 backdrop-blur-xl sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href={isAdmin ? "/portal/admin" : "/portal"}
            className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAdmin ? "Admin" : "Portal"}
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-serif font-bold text-white italic leading-tight truncate">
              CRM de captación
            </h1>
          </div>
          {!forbidden && (
            <p className="text-zinc-400 text-xs" data-testid="crm-cupo">
              Cupo {boot?.cupo.enviados ?? "—"}/{boot?.cupo.limite ?? 25}
            </p>
          )}
          {isAdmin && (boot?.tenants || []).length > 1 && (
            <select
              data-testid="crm-tenant-select"
              value={slug || boot?.comercio.slug || ""}
              onChange={(e) => {
                const next = e.target.value;
                slugRef.current = next;
                setSlug(next);
                load(next).catch((err) =>
                  setError(err instanceof Error ? err.message : "No se pudo cambiar de cola")
                );
              }}
              className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 max-w-[14rem]"
            >
              {(boot?.tenants || []).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              data-testid="crm-tab-mesa"
              onClick={() => setTab("mesa")}
              className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${
                tab === "mesa"
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-zinc-400 border-transparent hover:text-white"
              }`}
            >
              Escritorio
            </button>
            <button
              type="button"
              data-testid="crm-tab-alcanzados"
              onClick={() => setTab("alcanzados")}
              className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${
                tab === "alcanzados"
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-zinc-400 border-transparent hover:text-white"
              }`}
            >
              Contactos alcanzados
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-5 space-y-4">
        {error && (
          <p className="text-red-400 text-sm" data-testid="crm-error">
            {error}
          </p>
        )}
        {forbidden && (
          <p className="text-zinc-400 text-sm" data-testid="crm-forbidden">
            Este CRM es para quien tiene Captación Prospector vigente. Entrá con el email del dueño.
          </p>
        )}
        {notice && (
          <p className="text-primary text-sm" data-testid="crm-notice">
            {notice}
          </p>
        )}
        {!forbidden && tab === "mesa" && (
          <div className="grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] gap-4 items-start">
            <aside className="space-y-3 lg:sticky lg:top-32">
              <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3">
                <h2 className="text-lg font-serif text-white italic">Pegar lista de la IA</h2>
                <CrmIngestPanel
                  prompt={boot?.plantilla.prompt_ia || ""}
                  onIngest={ingest}
                  busy={busy}
                />
              </div>
              <CrmFold title="Alta manual" testId="crm-fold-alta">
                <CrmManualForm onCreate={createManual} busy={busy} />
              </CrmFold>
              <CrmFold title="Mensaje prospectivo" testId="crm-fold-plantilla">
                <CrmPlantillaForm
                  mensaje={boot?.plantilla.mensaje || ""}
                  firma={boot?.plantilla.firma || ""}
                  slots={boot?.plantilla.slots}
                  onSave={guardarPlantilla}
                  busy={busy}
                />
              </CrmFold>
            </aside>
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-serif text-white italic">Cola</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Mensaje
                    <select
                      data-testid="crm-plantilla-enviar"
                      value={plantillaIndex}
                      onChange={(e) => setPlantillaIndex(Number(e.target.value))}
                      className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 normal-case tracking-normal font-sans font-medium"
                    >
                      {plantillaSlots.map((slot, i) => (
                        <option key={i} value={i} disabled={!slot.texto}>
                          {i + 1}. {slot.titulo}
                          {slot.texto ? "" : " (vacía)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                  type="button"
                  data-testid="crm-limpiar-cola"
                  disabled={busy || !(boot?.contactos || []).length}
                  onClick={limpiarCola}
                  className="px-3 py-1.5 border border-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
                >
                  Limpiar cola
                </button>
                </div>
              </div>
              <CrmContactList
                contactos={boot?.contactos || []}
                categorias={categorias}
                onEnviar={enviar}
                onNota={guardarNota}
                onCategoria={cambiarCategoria}
                onCrearFicha={crearFicha}
                canCrearFicha={isAdmin && boot?.comercio.modo !== "agenda"}
                busyId={busyId}
              />
            </section>
          </div>
        )}

        {!forbidden && tab === "alcanzados" && (
          <section className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-4">
            <h2 className="text-xl font-serif text-white italic">Contactos alcanzados</h2>
            <CrmLeadFilters
              filtro={filtro}
              onChange={(next) => {
                setFiltro(next);
                setSelectedLeadId(null);
              }}
            />
              <CrmContactadosList
                contactos={filterAlcanzadosUi(alcanzados, filtro).map(alcanzadoAsContacto)}
                selectedId={selectedLeadId}
                onSelect={setSelectedLeadId}
                onNota={guardarNota}
                onEstado={cambiarEstado}
                onLoadNotas={loadNotas}
                busy={busy}
              />
          </section>
        )}
      </main>
    </div>
  );
}
