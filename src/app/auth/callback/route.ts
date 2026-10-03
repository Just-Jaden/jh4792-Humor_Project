import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function loginErrorUrl(requestUrl: string, error: "auth" | "profile") {
  const url = new URL("/login", requestUrl);
  url.searchParams.set("error", error);
  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(loginErrorUrl(request.url, "auth"));
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(loginErrorUrl(request.url, "auth"));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(loginErrorUrl(request.url, "auth"));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.redirect(loginErrorUrl(request.url, "profile"));
  }

  const destination =
    profile.first_name?.trim() && profile.last_name?.trim()
      ? "/"
      : "/onboarding";

  return NextResponse.redirect(new URL(destination, request.url));
}
