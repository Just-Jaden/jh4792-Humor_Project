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

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => cast(1)}
          disabled={isPending}
          aria-label="Upvote caption"
          aria-pressed={currentVote === 1}
          className={`rounded-md px-2 py-1 text-sm disabled:opacity-50 ${
            currentVote === 1
              ? "bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
        >
          Up
        </button>
        <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
          {shownScore}
        </span>
        <button
          type="button"
          onClick={() => cast(-1)}
          disabled={isPending}
          aria-label="Downvote caption"
          aria-pressed={currentVote === -1}
          className={`rounded-md px-2 py-1 text-sm disabled:opacity-50 ${
            currentVote === -1
              ? "bg-rose-100 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
        >
          Down
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
