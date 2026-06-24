import { SettingsPageClient } from "./SettingsPageClient";
import { getCurrentUserProfile } from "@/app/actions/profile";

export default async function SettingsPage() {
  const profile = await getCurrentUserProfile();
  return (
    <SettingsPageClient initialUsername={profile.data?.username ?? null} />
  );
}
