"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const showTestLogin = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === "1";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "CredentialsSignin") {
        setError("Credenciales incorrectas. Por favor, intenta de nuevo.");
      } else {
        setError("Error de conexión con el servidor. Por favor, contacta a soporte o intenta más tarde.");
      }
      console.error("Login Error:", res.error);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div
      data-testid="login-page"
      className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-gray-900 mx-auto"
    >
      <div className="text-center space-y-2">
        <h1
          data-testid="login-title"
          className="text-3xl font-heading font-bold text-gray-900 dark:text-white"
        >
          Bienvenido
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Iniciá sesión para guardar tus favoritos y gestionar tu negocio.
        </p>
      </div>

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      <button
        data-testid="login-google-button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-bold shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

      {showTestLogin && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-xs text-center text-gray-400 uppercase tracking-widest">Solo tests E2E</p>
          <input
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@test.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
            autoComplete="username"
          />
          <input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent"
            autoComplete="current-password"
          />
          <button
            data-testid="login-submit"
            type="submit"
            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl"
          >
            Ingresar (test)
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-32 pb-12">
      <Suspense fallback={<div className="w-full max-w-md p-8 text-center text-gray-500">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
