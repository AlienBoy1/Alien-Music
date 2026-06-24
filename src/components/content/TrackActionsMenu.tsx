"use client";

import { useState, useRef, useEffect } from "react";
import { ListPlus, MoreHorizontal, Share2 } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { ShareWithFriendModal } from "@/components/share/ShareWithFriendModal";
import type { PlayerTrack } from "@/types/music";

interface TrackActionsMenuProps {
  track: PlayerTrack;
  isAuthenticated?: boolean;
  extraItems?: React.ReactNode;
}

export function TrackActionsMenu({
  track,
  isAuthenticated = false,
  extraItems,
}: TrackActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="relative opacity-0 transition-opacity group-hover:opacity-100" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="rounded-full p-1.5 text-text-muted transition-all hover:bg-surface-highlight hover:text-white"
          aria-label="Más opciones"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[210px] rounded-lg border border-border bg-surface-elevated py-1 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToQueueNext(track);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight"
            >
              <ListPlus size={14} />
              Agregar a la fila
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight"
            >
              <Share2 size={14} />
              Compartir con un amigo
            </button>
            {extraItems}
          </div>
        )}
      </div>

      <ShareWithFriendModal
        track={track}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
