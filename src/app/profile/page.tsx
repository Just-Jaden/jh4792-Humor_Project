import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Update your name and profile photo.
      </p>
      <ProfileForm
        userId={user.id}
        firstName={profile.first_name ?? ""}
        lastName={profile.last_name ?? ""}
        avatarUrl={profile.avatar_url ?? null}
      />
    </main>
  );
}
