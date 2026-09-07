import { Metadata } from "next";
import GuideChatPanel from "@/components/asistente/GuideChatPanel";
import { getAsistenteConfig } from "@/lib/asistente/config";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rafi, el asistente",
  description: "Preguntale a Rafi qué necesitás en San Rafael y te arma fichas reales del directorio.",
  alternates: { canonical: `${siteUrl}/asistente` },
};

export default function AsistentePage() {
  const config = getAsistenteConfig();
  if (!config.enabled) {
    return (
      <main className="min-h-[60vh] px-4 pt-28 pb-24">
        <p className="max-w-xl mx-auto text-slate-400">
          El asistente está pausado. Usá la búsqueda de arriba.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] px-4 pt-28 pb-24">
      <GuideChatPanel intro={config.copyIntro} variant="page" />
    </main>
  );
}
