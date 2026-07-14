"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowLeft } from "lucide-react";

/**
 * FE-11: el acceso público es solo Google.
 * Email/password queda limitado a E2E (PLAYWRIGHT_TEST); estas rutas no deben
 * ofrecer recuperación de contraseña como si el login local existiera en prod.
 */
export default function GoogleOnlyAuthNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-32 pb-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100 dark:bg-gray-900 mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio de sesión
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/portal" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-bold shadow-sm"
        >
          Continuar con Google
        </button>

        <p className="text-center text-xs text-gray-400">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="underline hover:text-gray-600">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
