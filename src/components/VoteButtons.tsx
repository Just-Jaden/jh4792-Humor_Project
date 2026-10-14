"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { vote } from "@/app/actions/vote";

type VoteButtonsProps = {
  captionId: string;
  score: number;
  myVote: number;
  loggedIn: boolean;
};

export default function VoteButtons({
  captionId,
  score,
  myVote,
  loggedIn,
}: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState(myVote);
  const [shownScore, setShownScore] = useState(score);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-full border border-black/15 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-900"
      >
        Sign in to vote
      </Link>
    );
  }

  function cast(value: 1 | -1) {
    const previousVote = currentVote;
    const previousScore = shownScore;
    const nextVote = currentVote === value ? 0 : value;

    setError("");
    setCurrentVote(nextVote);
    setShownScore(shownScore - currentVote + nextVote);

    startTransition(async () => {
      const result = await vote(captionId, value);
      if ("error" in result) {
        setCurrentVote(previousVote);
        setShownScore(previousScore);
        setError(result.error);
      }
    });
  }

  const scoreTone =
    shownScore > 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : shownScore < 0
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-stone-200 bg-stone-50 text-stone-600";

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => cast(1)}
          disabled={isPending}
          aria-label="Clap for this caption"
          aria-pressed={currentVote === 1}
          title="Clap"
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition hover:-translate-y-0.5 disabled:opacity-50 ${
            currentVote === 1
              ? "border-emerald-300 bg-emerald-100 shadow-sm shadow-emerald-200"
              : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          <span aria-hidden="true">👏</span>
        </button>
        <span
          className={`flex min-w-14 flex-col items-center rounded-lg border px-2 py-1 font-bold tabular-nums ${scoreTone}`}
          aria-label={`Score: ${shownScore}`}
        >
          <span className="text-[0.55rem] font-extrabold uppercase tracking-[0.14em] opacity-65">
            Score
          </span>
          <span className="text-base leading-none">
            {shownScore > 0 ? `+${shownScore}` : shownScore}
          </span>
        </span>
        <button
          type="button"
          onClick={() => cast(-1)}
          disabled={isPending}
          aria-label="Give this caption a thumbs down"
          aria-pressed={currentVote === -1}
          title="Thumbs down"
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition hover:-translate-y-0.5 disabled:opacity-50 ${
            currentVote === -1
              ? "border-red-300 bg-red-100 shadow-sm shadow-red-200"
              : "border-stone-200 bg-white hover:border-red-300 hover:bg-red-50"
          }`}
        >
          <span aria-hidden="true">👎</span>
        </button>
      </div>
      {error ? (
        <p className="mt-1 max-w-48 text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
