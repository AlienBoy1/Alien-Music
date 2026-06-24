"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppButtonProps {
  className?: string;
  variant?: "sidebar" | "topbar";
}

export function InstallAppButton({
  className = "",
  variant = "sidebar",
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (variant === "topbar") {
    return (
      <button
        type="button"
        onClick={() => void handleInstall()}
        className={`flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:shadow-[0_0_12px_rgba(0,255,159,0.2)] ${className}`}
      >
        <Download size={14} />
        Instalar App
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className={`mx-2 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-sm font-semibold text-accent transition-all hover:border-accent/40 hover:bg-accent/10 hover:shadow-[0_0_12px_rgba(0,255,159,0.15)] ${className}`}
    >
      <Download size={18} />
      Instalar App
    </button>
  );
}
