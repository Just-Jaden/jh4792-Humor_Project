import { redirect } from "next/navigation";
import type { Joke } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

export default async function VaultPage() {
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

  if (!profile?.first_name?.trim() || !profile.last_name?.trim()) {
    redirect("/onboarding");
  }

  const { data: jokes, error: jokesError } = await supabase
    .from("jokes")
    .select("*")
    .order("id")
    .returns<Joke[]>();

  if (jokesError) {
    throw new Error(`Unable to load the joke vault: ${jokesError.message}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-16">
      <section className="rounded-2xl border border-black/10 bg-zinc-50 p-8 dark:border-white/15 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Members only
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          The Joke Vault
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Welcome in, {profile.first_name}. This route is only available to
          signed-in users.
        </p>
      </section>

      {!jokes || jokes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-black/15 p-6 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          The vault is empty. Add a joke to the Supabase jokes table.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {jokes.map((joke) => (
            <li
              key={joke.id}
              className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950"
            >
              <p className="font-medium">{joke.setup}</p>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                {joke.punchline}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
