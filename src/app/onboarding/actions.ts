"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type OnboardingState = {
  error: string | null;
};

export async function saveName(
  _previousState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Enter both your first and last name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: `Could not save your profile: ${error.message}` };
  }

  redirect("/");
}
