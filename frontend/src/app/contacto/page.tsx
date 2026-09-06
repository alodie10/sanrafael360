import { Metadata } from "next";
import ContactoClient from "./ContactoClient";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Contacto — Sumá tu negocio",
  description:
    "¿Tenés un negocio en San Rafael, Mendoza? Contactanos para sumarte al directorio más completo de la ciudad y llegar a miles de turistas y residentes.",
  alternates: {
    canonical: `${siteUrl}/contacto`,
  },
  openGraph: {
    title: "Contacto — Sumá tu negocio",
    description:
      "Sumate al directorio más completo de San Rafael, Mendoza. Aumentá tu visibilidad y llegá a miles de turistas y residentes.",
    url: `${siteUrl}/contacto`,
    siteName: "San Rafael 360",
    locale: "es_AR",
    type: "website",
  },
};

export default function ContactoPage() {
  return <ContactoClient />;
}
