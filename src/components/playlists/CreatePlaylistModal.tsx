"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createPlaylist } from "@/app/actions/playlists";

interface CreatePlaylistModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePlaylistModal({ open, onClose }: CreatePlaylistModalProps) {
  const router = useRouter();
  const [name, setName] = useState("Nueva playlist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createPlaylist(name);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onClose();
    if (result.data?.id) {
      router.push(`/playlists/${result.data.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-md rounded-xl alien-border-glow bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-wide text-alien-gradient">Crear playlist</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playlist-name" className="mb-1 block text-sm text-text-muted">
              Nombre
            </label>
            <input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-highlight/80 px-4 py-2.5 text-white transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_16px_rgba(0,255,159,0.1)]"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="alien-btn-primary flex w-full items-center justify-center gap-2 rounded-full py-2.5 font-semibold disabled:opacity-50"
          >
            <Plus size={18} />
            {loading ? "Creando..." : "Crear playlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
