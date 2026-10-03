import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  if (profile?.first_name?.trim() && profile.last_name?.trim()) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Finish your profile
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Add your name before continuing to the members-only pages.
      </p>
      <OnboardingForm />
    </main>
  );
}
