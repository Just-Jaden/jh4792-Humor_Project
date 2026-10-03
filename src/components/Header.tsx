import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type HeaderProfile = {
  first_name: string | null;
  avatar_url: string | null;
};

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: HeaderProfile | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<HeaderProfile>();
    profile = data;
  }

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold">
          Humor Project
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/vault" className="hover:underline">
                Vault
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:underline"
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : null}
                {profile?.first_name?.trim() || "Profile"}
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
