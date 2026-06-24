"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { AlienLogo } from "@/components/ui/AlienLogo";
import { CosmicBackground } from "@/components/ui/CosmicBackground";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email, @username o contraseña incorrectos");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full alien-glow bg-surface-highlight">
          <AlienLogo size={56} animated />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-alien-gradient">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Accede a tu biblioteca y playlists
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface-highlight/80 py-2.5 text-sm font-medium transition-all duration-200 hover:border-accent/30 hover:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface-highlight/80 py-2.5 text-sm font-medium transition-all duration-200 hover:border-accent/30 hover:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
        >
          <Github size={20} />
          GitHub
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">o con email / @username</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleCredentials} className="space-y-4">
        <input
          type="text"
          placeholder="Email o @username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoComplete="username"
          className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-3 text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-3 text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="alien-btn-primary w-full rounded-full py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <CosmicBackground />
      <div className="relative z-10 animate-fade-in-up">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
