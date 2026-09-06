import type { ReactNode } from "react";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage(
  "/offline",
  "Sin conexión",
  "Estás sin conexión. San Rafael 360 se recarga cuando vuelva internet."
);

export default function OfflineLayout({ children }: { children: ReactNode }) {
  return children;
}
