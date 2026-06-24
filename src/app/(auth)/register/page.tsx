"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, type RegisterState } from "@/app/actions/auth";
import { AlienLogo } from "@/components/ui/AlienLogo";
import { CosmicBackground } from "@/components/ui/CosmicBackground";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <CosmicBackground />
      <div className="relative z-10 w-full max-w-md animate-fade-in-up space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full alien-glow bg-surface-highlight">
            <AlienLogo size={56} animated />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-alien-gradient">
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-text-muted">Únete a Alien Music</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Nombre"
            required
            className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-3 text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-3 text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-3 text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
          />
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="alien-btn-primary w-full rounded-full py-3 font-semibold disabled:opacity-50"
          >
            {pending ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
