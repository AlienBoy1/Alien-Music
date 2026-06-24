import { SettingsPageClient } from "./SettingsPageClient";
import { auth } from "@/auth";
import { getCurrentUserProfile } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let initialUsername: string | null = null;

  try {
    const session = await auth();
    if (session?.user?.id) {
      const profile = await getCurrentUserProfile();
      initialUsername = profile.data?.username ?? null;
    }
  } catch {
    // La página de ajustes debe cargar aunque falle el perfil en producción
  }

  return <SettingsPageClient initialUsername={initialUsername} />;
}
