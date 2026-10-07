"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type VoteResult = { ok: true } | { error: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function vote(
  captionId: string,
  value: 1 | -1
): Promise<VoteResult> {
  if (!uuidPattern.test(captionId) || (value !== 1 && value !== -1)) {
    return { error: "That vote is not valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sign in to vote." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("caption_votes")
    .select("id, vote")
    .eq("caption_id", captionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { error: `Could not check your vote: ${existingError.message}` };
  }

  let mutationError;
  if (existing?.vote === value) {
    const { error } = await supabase
      .from("caption_votes")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    mutationError = error;
  } else if (existing) {
    const { error } = await supabase
      .from("caption_votes")
      .update({ vote: value })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    mutationError = error;
  } else {
    const { error } = await supabase.from("caption_votes").insert({
      caption_id: captionId,
      user_id: user.id,
      vote: value,
    });
    mutationError = error;
  }

  if (mutationError) {
    return { error: `Could not save your vote: ${mutationError.message}` };
  }

  revalidatePath("/");
  return { ok: true };
}
