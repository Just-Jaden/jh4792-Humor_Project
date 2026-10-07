import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import UploadForm from "./UploadForm";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Create a post
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Turn a city moment into five punchlines
      </h1>
      <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
        Upload a campus, dorm, or NYC photo. Gemini will try five different
        comedic angles, and the community will rank the best one.
      </p>
      <UploadForm />
    </main>
  );
}
