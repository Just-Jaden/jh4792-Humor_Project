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
    <header className="site-header">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">HP</span>
          <span>
            <strong>The Humor Project</strong>
            <small>Open mic, open vote</small>
          </span>
        </Link>
        <nav className="site-nav">
          <Link href="/jokes">
            Jokes
          </Link>
          {user ? (
            <>
              <Link
                href="/create"
                className="nav-spotlight"
              >
                Create
              </Link>
              <Link href="/vault">
                Vault
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2"
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
                  className="nav-signout"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="nav-spotlight"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
