"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, type RegisterState } from "@/app/actions/auth";

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
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl">
            👽
          </div>
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="mt-1 text-sm text-text-muted">Únete a Alien Music</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Nombre"
            required
            className="w-full rounded-lg bg-surface-highlight px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg bg-surface-highlight px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            required
            minLength={8}
            className="w-full rounded-lg bg-surface-highlight px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent py-3 font-semibold text-black hover:bg-accent-hover disabled:opacity-50"
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
