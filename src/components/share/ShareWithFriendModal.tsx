"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Share2, X } from "lucide-react";
import { getFollowingForShare } from "@/app/actions/follows";
import { shareSongWithUser } from "@/app/actions/messages";
import type { PlayerTrack } from "@/types/music";

interface ShareWithFriendModalProps {
  track: PlayerTrack;
  open: boolean;
  onClose: () => void;
}

interface ShareUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export function ShareWithFriendModal({
  track,
  open,
  onClose,
}: ShareWithFriendModalProps) {
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    const result = await getFollowingForShare();
    setLoading(false);
    setLoaded(true);
    if (result.data) setUsers(result.data);
  };

  if (open && !loaded && !loading) {
    void load();
  }

  if (!open) return null;

  const handleShare = async (userId: string) => {
    setSending(userId);
    const result = await shareSongWithUser(userId, track);
    setSending(null);
    if (!result.error) {
      setDone(userId);
      setTimeout(onClose, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-elevated p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-alien-gradient">
            Compartir con un amigo
          </h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-accent">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-text-muted">
          {track.title} — {track.artistName}
        </p>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-accent" />
          </div>
        )}

        {!loading && users.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">
            Sigue a otros usuarios para poder compartirles música.
          </p>
        )}

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => void handleShare(u.id)}
                disabled={sending === u.id || done === u.id}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-highlight disabled:opacity-60"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-surface-highlight">
                  {u.image ? (
                    <Image src={u.image} alt="" fill sizes="36px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-accent">
                      {(u.name?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.username ? `@${u.username}` : u.name}
                  </p>
                </div>
                {sending === u.id ? (
                  <Loader2 size={16} className="animate-spin text-accent" />
                ) : done === u.id ? (
                  <span className="text-xs text-accent">Enviado</span>
                ) : (
                  <Share2 size={16} className="text-text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
