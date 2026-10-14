import Link from "next/link";
import StageRating, { type RatingAct } from "@/components/StageRating";
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

  const ratingActs: RatingAct[] = (images ?? []).flatMap(
    (image, imageIndex) =>
      [...(image.captions ?? [])]
        .sort((left, right) => right.score - left.score)
        .map((caption, captionIndex) => ({
          captionId: caption.id,
          imageUrl: image.image_url,
          caption: caption.content,
          score: caption.score,
          myVote: myVotes.get(caption.id) ?? 0,
          imageNumber: imageIndex + 1,
          captionNumber: captionIndex + 1,
          createdAt: image.created_at,
          displayDate: new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(new Date(image.created_at)),
        }))
  );

  return (
    <main className="theater-page flex-1">
      <section className="theater" aria-labelledby="show-title">
        <div className="theater-ambient" aria-hidden="true" />
        <div className="spotlight spotlight-left" aria-hidden="true" />
        <div className="spotlight spotlight-right" aria-hidden="true" />

        <div className="stage">
          <div className="stage-sign">
            <span>Tonight at</span>
            <strong id="show-title">The Humor Project</strong>
            <small>AI-generated • audience-approved</small>
          </div>

          <Link
            href={user ? "/create" : "/login"}
            className="microphone-link"
            aria-label={
              user
                ? "Go to the microphone and create a meme"
                : "Sign in to create a meme"
            }
          >
            <span className="interaction-label">
              <span>Step up</span>
              Create a meme
            </span>
            <span className="microphone" aria-hidden="true">
              <span className="mic-head">
                <i />
                <i />
                <i />
              </span>
              <span className="mic-neck" />
              <span className="mic-stand" />
              <span className="mic-base" />
            </span>
          </Link>

          <div className="stage-floor" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="curtain curtain-left" aria-hidden="true">
          <span className="curtain-fold curtain-fold-1" />
          <span className="curtain-fold curtain-fold-2" />
          <span className="curtain-fold curtain-fold-3" />
          <span className="curtain-tie" />
        </div>
        <div className="curtain curtain-right" aria-hidden="true">
          <span className="curtain-fold curtain-fold-1" />
          <span className="curtain-fold curtain-fold-2" />
          <span className="curtain-fold curtain-fold-3" />
          <span className="curtain-tie" />
        </div>
        <div className="curtain-valance" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="audience-floor" aria-hidden="true" />
        <div className="audience-scene">
          <div className="table table-left" aria-hidden="true">
            <span className="glass glass-left" />
            <span className="table-top" />
            <span className="table-leg" />
          </div>
          <div className="chair chair-left" aria-hidden="true">
            <span className="chair-back" />
            <span className="chair-seat" />
            <span className="chair-leg chair-leg-left" />
            <span className="chair-leg chair-leg-right" />
          </div>

          <div className="table table-right" aria-hidden="true">
            <span className="candle" />
            <span className="table-top" />
            <span className="table-leg" />
          </div>
          <div className="chair chair-right" aria-hidden="true">
            <span className="chair-back" aria-hidden="true" />
            <span className="chair-seat" aria-hidden="true" />
            <span className="chair-leg chair-leg-left" aria-hidden="true" />
            <span className="chair-leg chair-leg-right" aria-hidden="true" />
          </div>
        </div>

        <div className="seat-row seat-row-left" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="seat-row seat-row-right" aria-hidden="true">
          <span />
          <span />
        </div>

        <Link
          href="#caption-feed"
          className="audience-link"
          aria-label="Enter the audience area to view and vote on community memes"
        >
          <span className="audience-link-label">
            <span>Take a seat</span>
            View &amp; vote
          </span>
        </Link>

        <div className="show-intro">
          <p>From your seat, the stage is yours.</p>
          <span>Choose the microphone or enter the audience</span>
        </div>
      </section>

      <div id="caption-feed" className="feed-wrap">
        <div className="feed-heading">
          <div>
            <p className="eyebrow">Audience favorites</p>
            <h2>Tonight&apos;s lineup</h2>
          </div>
          <Link href={user ? "/create" : "/login"} className="feed-cta">
            Submit your moment <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {!images || images.length === 0 ? (
          <section className="empty-stage">
            <span className="empty-mic" aria-hidden="true">MIC</span>
            <h3>The opening slot is yours.</h3>
            <p>
              Upload a moment and let Gemini take five different swings at the
              punchline.
            </p>
            <Link href={user ? "/create" : "/login"}>
              Be the first act
            </Link>
          </section>
        ) : (
          <StageRating acts={ratingActs} loggedIn={Boolean(user)} />
        )}
      </div>
    </main>
  );
}
