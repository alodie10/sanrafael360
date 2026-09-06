import { Suspense } from "react";
import BajaClient from "./BajaClient";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage("/baja", "Baja de avisos");

export default function BajaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-stone-500 text-sm">
          Cargando…
        </main>
      }
    >
      <BajaClient />
    </Suspense>
  );
}
