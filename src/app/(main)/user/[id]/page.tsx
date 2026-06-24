import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicUserProfile } from "@/lib/db/users";
import { UserProfileView } from "@/components/user/UserProfileView";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const session = await auth();
  const profile = await getPublicUserProfile(id);

  if (!profile) notFound();

  return (
    <UserProfileView
      profile={profile}
      isAuthenticated={Boolean(session?.user)}
    />
  );
}
