import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url  = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/auth/kyc";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options));
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if KYC already submitted
      const { data: profile } = await supabase
        .from("users")
        .select("village, status")
        .eq("id", data.user.id)
        .single();

      if (profile?.village) {
        // KYC done — redirect based on status
        if (profile.status === "approved") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/auth/pending", req.url));
      }

      // No KYC yet — go to KYC page
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/login", req.url));
}
