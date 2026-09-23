import { supabase, type Joke } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: jokes, error } = await supabase
    .from("jokes")
    .select("*")
    .order("id")
    .returns<Joke[]>();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl flex-1 px-6 py-16 sm:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Jokes
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Fetched live from Supabase.
        </p>

        {error ? (
          <p className="mt-8 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Error loading jokes: {error.message}
          </p>
        ) : !jokes || jokes.length === 0 ? (
          <p className="mt-8 text-zinc-600 dark:text-zinc-400">
            No jokes yet. Add a row to the <code>jokes</code> table in Supabase.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {jokes.map((joke) => (
              <li
                key={joke.id}
                className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <p className="font-medium text-black dark:text-zinc-50">
                  {joke.setup}
                </p>
                <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                  {joke.punchline}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
