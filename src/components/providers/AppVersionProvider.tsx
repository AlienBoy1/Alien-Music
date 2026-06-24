"use client";

import { ForceUpdateModal } from "@/components/app/ForceUpdateModal";
import { UpdateAvailableBanner } from "@/components/app/UpdateAvailableBanner";
import { useAppVersionGate } from "@/hooks/useAppVersionGate";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

/**
 * Provider global: bloqueo por versión obsoleta + banner de SW en caliente.
 */
export function AppVersionProvider({ children }: { children: React.ReactNode }) {
  const { blocked, minRequiredVersion } = useAppVersionGate();
  const { updateAvailable, applying, applyUpdate, dismiss } =
    useServiceWorkerUpdate();

  return (
    <>
      {children}

      {blocked && (
        <ForceUpdateModal minRequiredVersion={minRequiredVersion} />
      )}

      {!blocked && updateAvailable && (
        <UpdateAvailableBanner
          onApply={() => void applyUpdate()}
          onDismiss={dismiss}
          applying={applying}
        />
      )}
    </>
  );
}
