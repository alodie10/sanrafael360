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
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const res = await fetch(`${strapiUrl}/api/auth/local/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Ocurrió un error en el registro");
      }

      // Automatically sign them in after successful registration
      const signInRes = await signIn("credentials", {
        identifier: email,
        password: password,
        redirect: false,
      });

      if (signInRes?.error) {
        // Fallback to login page if auto login fails
        router.push(claimSlug ? `/login?callbackUrl=/negocios/${claimSlug}?auto_claim=1` : "/login");
      } else {
        // Auto success
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
      <h1 className="text-2xl font-heading font-bold text-center text-gray-900 dark:text-white">
        Crea tu Cuenta de Anunciante
      </h1>
      {claimSlug && (
        <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm text-center">
          Crea tu cuenta para poder reclamar el negocio.
        </div>
      )}
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
            minLength={6}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full px-4 py-2 font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta? <a href={claimSlug ? `/login?callbackUrl=/negocios/${claimSlug}?auto_claim=1` : "/login"} className="text-blue-600 hover:underline dark:text-blue-400">Inicia sesión</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md p-8 text-center text-gray-500">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
