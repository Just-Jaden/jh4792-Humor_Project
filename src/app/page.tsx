import Link from "next/link";
import VoteButtons from "@/components/VoteButtons";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Caption = {
  id: string;
  content: string;
  score: number;
};

type ImagePost = {
  id: string;
  image_url: string;
  created_at: string;
  captions: Caption[] | null;
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("id, image_url, created_at, captions(id, content, score)")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<ImagePost[]>();

  if (imagesError) {
    throw new Error(`Unable to load the caption feed: ${imagesError.message}`);
  }

  const myVotes = new Map<string, number>();
  if (user) {
    const { data: votes, error: votesError } = await supabase
      .from("caption_votes")
      .select("caption_id, vote")
      .eq("user_id", user.id);

    if (votesError) {
      throw new Error(`Unable to load your votes: ${votesError.message}`);
    }

    votes?.forEach((item) => myVotes.set(item.caption_id, item.vote));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
      <section className="rounded-3xl bg-zinc-950 px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
          Life off syllabus
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
          Five AI punchlines. One community favorite.
        </h1>
        <p className="mt-4 max-w-xl text-zinc-300">
          From roommate lore and late-night food runs to new friendships and
          weekend detours, share the moments that define college life. Vote the
          funniest angle to the top.
        </p>
        <Link
          href={user ? "/create" : "/login"}
          className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-zinc-200"
        >
          {user ? "Create a caption post" : "Sign in to create and vote"}
        </Link>
      </section>

      {!images || images.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/20">
          <h2 className="text-xl font-semibold">The feed is ready for a first post.</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload a moment from your week and let Gemini try five distinct
            comedic angles.
          </p>
        </section>
      ) : (
        <section className="mt-10 space-y-8" aria-label="Caption feed">
          {images.map((image) => {
            const captions = [...(image.captions ?? [])].sort(
              (left, right) => right.score - left.score
            );

            return (
              <article
                key={image.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-zinc-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt="Community caption challenge"
                  className="max-h-[42rem] w-full bg-zinc-100 object-contain dark:bg-black"
                />
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-semibold">Rank the captions</h2>
                    <time
                      dateTime={image.created_at}
                      className="text-xs text-zinc-500"
                    >
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(image.created_at))}
                    </time>
                  </div>

                  <ol className="mt-4 divide-y divide-black/10 dark:divide-white/10">
                    {captions.map((caption, index) => (
                      <li
                        key={caption.id}
                        className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 gap-3">
                          <span className="text-sm font-semibold text-zinc-400">
                            {index + 1}
                          </span>
                          <p>{caption.content}</p>
                        </div>
                        <VoteButtons
                          captionId={caption.id}
                          score={caption.score}
                          myVote={myVotes.get(caption.id) ?? 0}
                          loggedIn={Boolean(user)}
                        />
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
