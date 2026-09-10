import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage(
  "/registro",
  "Crear cuenta",
  "Registrate en San Rafael 360 con Google para reclamar tu negocio o guardar favoritos."
);

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
