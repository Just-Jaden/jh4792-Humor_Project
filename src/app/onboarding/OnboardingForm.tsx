"use client";

import { useActionState } from "react";
import { saveName, type OnboardingState } from "./actions";

const initialState: OnboardingState = { error: null };

export default function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    saveName,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">First name</span>
        <input
          name="first_name"
          autoComplete="given-name"
          required
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Last name</span>
        <input
          name="last_name"
          autoComplete="family-name"
          required
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Saving..." : "Continue"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
