"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isLoading ? "Redirecting..." : "Sign in with Google"}
      </button>
      {error ? (
        <p className="max-w-sm text-center text-sm text-red-600 dark:text-red-400">
          Sign-in failed: {error}
        </p>
      ) : null}
    </div>
  );
}
