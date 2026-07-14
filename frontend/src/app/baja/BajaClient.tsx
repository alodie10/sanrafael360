"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStrapiUrl } from "@/lib/strapi";

type Status = "loading" | "ok" | "already" | "error";

export default function BajaClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Procesando tu solicitud…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el enlace de baja. Abrí el link desde el correo.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${getStrapiUrl()}/api/clientes/baja?token=${encodeURIComponent(token)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(json?.error?.message || "No pudimos procesar la baja.");
          return;
        }
        if (json?.data?.already) {
          setStatus("already");
          setMessage("Ya estabas dado de baja de estos avisos.");
        } else {
          setStatus("ok");
          setMessage("Listo. No vas a recibir más avisos comerciales de San Rafael 360.");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Error de red al procesar la baja. Probá de nuevo en unos minutos.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 via-amber-50/40 to-stone-100 flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white/90 p-8 shadow-sm text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 mb-3">
          San Rafael 360
        </p>
        <h1 className="font-serif text-3xl text-stone-900 mb-4">Avisos comerciales</h1>
        <p
          className={`text-sm leading-relaxed mb-8 ${
            status === "error" ? "text-red-700" : "text-stone-600"
          }`}
          data-testid="baja-message"
        >
          {message}
        </p>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
