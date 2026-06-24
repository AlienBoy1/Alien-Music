"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SongRow } from "@/components/content/SongRow";
import {
  updatePlaylist,
  deletePlaylist,
  removeSongFromPlaylist,
} from "@/app/actions/playlists";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlaylistWithSongs } from "@/types/music";

interface PlaylistEditorProps {
  playlist: PlaylistWithSongs & {
    isCollaborative?: boolean;
    isPublic?: boolean;
  };
  canEdit?: boolean;
}

export function PlaylistEditor({
  playlist: initial,
  canEdit = true,
}: PlaylistEditorProps) {
  const router = useRouter();
  const playCollection = usePlayerStore((s) => s.playCollection);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [isPublic, setIsPublic] = useState(initial.isPublic ?? false);
  const [isCollaborative, setIsCollaborative] = useState(
    initial.isCollaborative ?? false,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    await updatePlaylist(initial.id, {
      name,
      description,
      isPublic,
      isCollaborative,
    });
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    if (!confirm("¿Eliminar esta playlist?")) return;
    await deletePlaylist(initial.id);
    router.push("/playlists");
  };

  const handlePlayAll = () => {
    if (initial.songs.length === 0) return;
    playCollection(initial.songs.map(songToPlayerTrack), 0);
  };

  const handleRemove = async (songId: string) => {
    if (!canEdit) return;
    await removeSongFromPlaylist(initial.id, songId);
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {canEdit ? (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => void handleSave()}
                className="w-full max-w-lg rounded bg-transparent px-1 text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => void handleSave()}
                placeholder="Añade una descripción"
                rows={2}
                className="w-full max-w-lg resize-none rounded bg-transparent px-1 text-sm text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 text-text-muted">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => {
                      setIsPublic(e.target.checked);
                      void updatePlaylist(initial.id, {
                        isPublic: e.target.checked,
                      }).then(() => router.refresh());
                    }}
                    className="accent-accent"
                  />
                  Pública
                </label>
                <label className="flex items-center gap-2 text-text-muted">
                  <input
                    type="checkbox"
                    checked={isCollaborative}
                    onChange={(e) => {
                      setIsCollaborative(e.target.checked);
                      void updatePlaylist(initial.id, {
                        isCollaborative: e.target.checked,
                      }).then(() => router.refresh());
                    }}
                    className="accent-accent"
                  />
                  Colaborativa
                </label>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{initial.name}</h1>
              {initial.description && (
                <p className="text-sm text-text-muted">{initial.description}</p>
              )}
              <div className="flex gap-2">
                {initial.isPublic && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    Pública
                  </span>
                )}
                {initial.isCollaborative && (
                  <span className="rounded-full border border-alien-cyan/30 bg-alien-cyan/10 px-2 py-0.5 text-xs text-alien-cyan">
                    Colaborativa
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {initial.songs.length > 0 && (
            <button
              type="button"
              onClick={handlePlayAll}
              className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-black hover:bg-accent-hover"
            >
              Reproducir todo
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-full border border-red-500/50 p-2 text-red-400 hover:bg-red-500/10"
              aria-label="Eliminar playlist"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {saving && (
        <p className="mb-4 text-xs text-text-muted">Guardando...</p>
      )}

      {initial.songs.length === 0 ? (
        <div className="rounded-lg bg-surface-highlight p-8 text-center">
          <p className="text-text-muted">
            Esta playlist está vacía. Añade canciones desde la búsqueda o el
            home usando el menú &quot;...&quot; en cada pista.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {initial.songs.map((song, i) => (
            <div key={song.id} className="group flex items-center">
              <div className="flex-1">
                <SongRow song={song} index={i} queue={initial.songs} isAuthenticated />
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => void handleRemove(song.id)}
                  className="mr-2 rounded p-1 text-text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  aria-label="Quitar de playlist"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
