import { Suspense } from "react";
import type { Metadata } from "next";
import BajaClient from "./BajaClient";

export const metadata: Metadata = {
  title: "Baja de avisos | San Rafael 360",
  robots: { index: false, follow: false },
};

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
