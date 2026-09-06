import type { ReactNode } from "react";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage(
  "/login",
  "Iniciar sesión",
  "Entrá a San Rafael 360 con Google para guardar favoritos y gestionar tu negocio."
);

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
