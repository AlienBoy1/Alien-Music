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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Crear playlist</h2>
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
              className="w-full rounded-lg bg-surface-highlight px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Plus size={18} />
            {loading ? "Creando..." : "Crear playlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
