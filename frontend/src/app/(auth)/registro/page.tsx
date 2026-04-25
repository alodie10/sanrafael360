"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimSlug = searchParams.get("claim");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(`${strapiUrl}/api/auth/local/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          tipo_registro: "propietario",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Ocurrió un error en el registro");
      }

      const signInRes = await signIn("credentials", {
        identifier: email,
        password: password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push(claimSlug ? `/login?callbackUrl=/negocios/${claimSlug}?auto_claim=1` : "/login");
      } else {
        if (claimSlug) {
          router.push(`/negocios/${claimSlug}?auto_claim=1`);
        } else {
          router.push("/portal");
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-gray-900 mx-auto">
      <h1 className="text-2xl font-heading font-bold text-center text-gray-900 dark:text-white">Crea tu Cuenta</h1>
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de usuario</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-white" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-white" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-white" required minLength={6} />
        </div>
        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg transition-colors disabled:opacity-50">
          {isLoading ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm italic">o</span>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      <button 
        onClick={() => signIn("google", { callbackUrl: claimSlug ? `/negocios/${claimSlug}?auto_claim=1` : "/portal" })}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>
      
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta? <a href={claimSlug ? `/login?callbackUrl=/negocios/${claimSlug}?auto_claim=1` : "/login"} className="text-blue-600 hover:underline dark:text-blue-400">Ingresa aquí</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-32 pb-12">
      <Suspense fallback={<div className="w-full max-w-md p-8 text-center text-gray-500">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
