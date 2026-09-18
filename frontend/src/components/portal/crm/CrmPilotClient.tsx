"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { STRAPI_URL, isBrowserNetworkError } from "@/lib/strapi";
import type { CrmAlcanzado, CrmBootstrap, CrmContacto, CrmCupo, CrmEstado, CrmLeadFiltro } from "@/lib/crm";
import { alcanzadoAsContacto, crmSlugQuery, filterAlcanzadosUi } from "@/lib/crm";
import CrmManualForm from "./CrmManualForm";
import CrmIngestPanel from "./CrmIngestPanel";
import CrmContactList, { type CrmCategoria } from "./CrmContactList";
import CrmPlantillaForm from "./CrmPlantillaForm";
import CrmLeadFilters from "./CrmLeadFilters";
import CrmContactadosList from "./CrmContactadosList";

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
      setNotice(status === "duplicado" ? "Ya estaba en la cola" : "Contacto cargado");
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
        body: JSON.stringify(withSlug({ contactoDocumentId: documentId })),
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

  async function guardarPlantilla(input: { mensaje: string; firma: string }) {
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

  const kicker = boot?.comercio.nombre
    ? `Tu mesa · ${boot.comercio.nombre}`
    : "Tu mesa · San Rafael 360";

  return (
    <div className="min-h-screen bg-black font-sans pt-24 pb-20" data-testid="crm-page">
      <div className="bg-zinc-950/50 border-b border-white/5 backdrop-blur-xl sticky top-[72px] z-40">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href={isAdmin ? "/portal/admin" : "/portal"}
            className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-6 text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAdmin ? "Volver al admin" : "Volver al portal"}
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-black" />
            </div>
            <div>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em]">
                {kicker}
              </p>
              <h1 className="text-4xl font-serif font-bold text-white italic">CRM de captación</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-8">
            <button
              type="button"
              data-testid="crm-tab-mesa"
              onClick={() => setTab("mesa")}
              className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all ${
                tab === "mesa"
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-zinc-400 border-transparent hover:text-white"
              }`}
            >
              Mesa y cola
            </button>
            <button
              type="button"
              data-testid="crm-tab-alcanzados"
              onClick={() => setTab("alcanzados")}
              className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all ${
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

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {error && (
          <p className="text-red-400 text-sm" data-testid="crm-error">
            {error}
          </p>
        )}
        {forbidden && (
          <p className="text-zinc-400 text-sm" data-testid="crm-forbidden">
            Este CRM es para el comercio que lo tiene contratado. Si es tu caso, entra con el mismo email.
          </p>
        )}
        {notice && (
          <p className="text-primary text-sm" data-testid="crm-notice">
            {notice}
          </p>
        )}
        {!forbidden && (
          <>
            <p className="text-zinc-400 text-sm" data-testid="crm-cupo">
              Cupo CRM hoy: {boot?.cupo.enviados ?? "—"} / {boot?.cupo.limite ?? 25}
            </p>

            {tab === "mesa" && (
              <>
                <section className="grid md:grid-cols-2 gap-10">
                  <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-4">
                    <h2 className="text-2xl font-serif text-white italic">Alta manual</h2>
                    <CrmManualForm onCreate={createManual} busy={busy} />
                  </div>
                  <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-4">
                    <h2 className="text-2xl font-serif text-white italic">Pegar lista de la IA</h2>
                    <CrmIngestPanel
                      prompt={boot?.plantilla.prompt_ia || ""}
                      onIngest={ingest}
                      busy={busy}
                    />
                  </div>
                </section>

                <section className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-4">
                  <h2 className="text-2xl font-serif text-white italic">Mensaje WhatsApp</h2>
                  <CrmPlantillaForm
                    mensaje={boot?.plantilla.mensaje || ""}
                    firma={boot?.plantilla.firma || ""}
                    onSave={guardarPlantilla}
                    busy={busy}
                  />
                </section>

                <section>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-serif text-white italic">Cola</h2>
                    <button
                      type="button"
                      data-testid="crm-limpiar-cola"
                      disabled={busy || !(boot?.contactos || []).length}
                      onClick={limpiarCola}
                      className="px-4 py-2 border border-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
                    >
                      Limpiar cola
                    </button>
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
              </>
            )}

            {tab === "alcanzados" && (
              <section className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-5">
                <h2 className="text-2xl font-serif text-white italic">Contactos alcanzados</h2>
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
                  busy={busy}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
