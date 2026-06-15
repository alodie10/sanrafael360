import { Metadata } from "next";
import ContactoClient from "./ContactoClient";

export const metadata: Metadata = {
  title: "Contacto — Sumá tu Negocio | San Rafael 360",
  description:
    "¿Tenés un negocio en San Rafael, Mendoza? Contactanos para sumarte al directorio más completo de la ciudad y llegar a miles de turistas y residentes.",
  alternates: {
    canonical: "https://www.sanrafael360.com/contacto",
  },
  openGraph: {
    title: "Contacto — Sumá tu Negocio | San Rafael 360",
    description:
      "Sumate al directorio más completo de San Rafael, Mendoza. Aumentá tu visibilidad y llegá a miles de turistas y residentes.",
    url: "https://www.sanrafael360.com/contacto",
    siteName: "San Rafael 360",
    locale: "es_AR",
    type: "website",
  },
};

export default function ContactoPage() {
  return <ContactoClient />;
}
