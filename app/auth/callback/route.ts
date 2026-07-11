import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Optionally forward the user to a specific path after login
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("OAuth callback error:", error.message);
    }
  }

  // Something went wrong — redirect to login with an error flag

  return NextResponse.redirect(`${origin}/login?error=true`);
}
