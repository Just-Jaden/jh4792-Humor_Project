import LoginButton from "./LoginButton";

const errorMessages: Record<string, string> = {
  auth: "Google sign-in could not be completed. Please try again.",
  profile: "Your account was created, but your profile could not be loaded.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const message = error ? errorMessages[error] : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Sign in to create caption posts, vote for favorites, manage your
          profile, and enter the Joke Vault.
        </p>
        {message ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {message}
          </p>
        ) : null}
        <div className="mt-8">
          <LoginButton />
        </div>
      </section>
    </main>
  );
}
