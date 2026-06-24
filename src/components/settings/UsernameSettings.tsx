"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { checkUsernameAvailable, updateUsername } from "@/app/actions/profile";
import { normalizeUsername } from "@/lib/username";

interface UsernameSettingsProps {
  initialUsername: string | null;
}

export function UsernameSettings({ initialUsername }: UsernameSettingsProps) {
  const [value, setValue] = useState(initialUsername ?? "");
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const debounced = useDebounce(value, 400);

  const check = useCallback(async (raw: string) => {
    const n = normalizeUsername(raw);
    if (!n || n.length < 3) {
      setStatus("idle");
      setMessage(null);
      return;
    }
    if (initialUsername && n === initialUsername) {
      setStatus("idle");
      setMessage(null);
      return;
    }
    setStatus("checking");
    const result = await checkUsernameAvailable(n);
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    if (result.data?.available) {
      setStatus("available");
      setMessage("@username disponible");
    } else {
      setStatus("taken");
      setMessage("Ese @username ya está en uso");
    }
  }, [initialUsername]);

  useEffect(() => {
    void check(debounced);
  }, [debounced, check]);

  const handleSave = async () => {
    setMessage(null);
    const result = await updateUsername(value);
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStatus("saved");
    setMessage(
      `¡Listo! Ahora puedes iniciar sesión con tu email o con @${result.data?.username}`,
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Tu identidad pública en la comunidad. Puedes iniciar sesión con tu email
        o con tu <span className="text-accent">@username</span>.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            @
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\s/g, ""))}
            placeholder="tu_nombre_alien"
            className="w-full rounded-lg border border-border bg-surface-highlight py-2.5 pl-8 pr-4 text-sm focus:border-accent/40 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={status === "taken" || status === "checking"}
          className="alien-btn-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Guardar username
        </button>
      </div>
      {message && (
        <p
          className={`text-xs ${
            status === "error" || status === "taken"
              ? "text-red-400"
              : status === "available" || status === "saved"
                ? "text-accent"
                : "text-text-muted"
          }`}
        >
          {status === "checking" ? "Comprobando disponibilidad..." : message}
        </p>
      )}
    </div>
  );
}
