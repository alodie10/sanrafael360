import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPiezaPublica } from "@/lib/crm-pieza";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const pieza = await fetchPiezaPublica(token);
  if (!pieza) return { title: "San Rafael 360", robots: { index: false, follow: false } };

  const image = {
    url: pieza.previewUrl,
    alt: pieza.titulo,
    ...(pieza.width && pieza.height ? { width: pieza.width, height: pieza.height } : {}),
  };

  return {
    title: pieza.titulo,
    description: "San Rafael 360",
    alternates: { canonical: pieza.pageUrl },
    robots: { index: false, follow: false },
    openGraph: {
      title: pieza.titulo,
      description: "San Rafael 360",
      url: pieza.pageUrl,
      siteName: "San Rafael 360",
      locale: "es_AR",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: pieza.titulo,
      description: "San Rafael 360",
      images: [pieza.previewUrl],
    },
  };
}

export default async function PiezaPage({ params }: Props) {
  const { token } = await params;
  const pieza = await fetchPiezaPublica(token);
  if (!pieza) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 pb-28 pt-8">
      <img
        src={pieza.imageUrl}
        alt={pieza.titulo}
        className="w-full rounded-3xl border border-white/10 shadow-2xl"
      />
      <p className="mt-4 text-center font-serif text-2xl italic text-white">{pieza.titulo}</p>
    </main>
  );
}
