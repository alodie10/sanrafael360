"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleType, setRoleType] = useState("residente");
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
          tipo_registro: roleType,
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cuenta</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRoleType("residente")} className={`p-2 text-sm border rounded-lg transition-all ${roleType === "residente" ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              🙋‍♂️ Residente
            </button>
            <button type="button" onClick={() => setRoleType("propietario")} className={`p-2 text-sm border rounded-lg transition-all ${roleType === "propietario" ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              💼 Propietario
            </button>
          </div>
        </div>
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
