import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  const isProtected =
    path.startsWith("/dashboard") || path.startsWith("/admin");

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isProtected && session) {
    // Get user profile only — single query, no joins
    const { data: user } = await supabase
      .from("users")
      .select("status, village, force_password_change")
      .eq("id", session.user.id)
      .single();

    // No user record yet
    if (!user) {
      if (path !== "/auth/kyc") {
        return NextResponse.redirect(new URL("/auth/kyc", req.url));
      }
      return res;
    }

    // Force password change
    if (user.force_password_change) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    // Status-based redirects only for /dashboard
    if (path.startsWith("/dashboard")) {
      if (user.status === "suspended") {
        return NextResponse.redirect(new URL("/auth/suspended", req.url));
      }
      if (user.status === "rejected") {
        return NextResponse.redirect(new URL("/auth/rejected", req.url));
      }

      // No village = KYC not done
      if (!user.village) {
        return NextResponse.redirect(new URL("/auth/kyc", req.url));
      }

      // Has village but still pending = show pending page
      // EXCEPTION: if status is approved, always let through
      if (user.status === "pending") {
        return NextResponse.redirect(new URL("/auth/pending", req.url));
      }
    }

    // For /admin paths — check role separately
    if (path.startsWith("/admin")) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["super_admin", "community_admin", "group_admin"])
        .limit(1)
        .maybeSingle();

      if (!roleRow) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/change-password",
  ],
};
