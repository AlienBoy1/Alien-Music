"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentHeader } from "@/components/content/ContentHeader";
import { createPlaylist } from "@/app/actions/playlists";

export default function NewPlaylistPage() {
  const router = useRouter();
  const [name, setName] = useState("Nueva playlist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createPlaylist(name);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data?.id) {
      router.push(`/playlists/${result.data.id}`);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader title="Crear playlist" showFeedback={false} />

      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-text-muted">
            Nombre de la playlist
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-surface-highlight px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-accent py-3 font-semibold text-black hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear"}
        </button>
      </form>
    </div>
  );
}
