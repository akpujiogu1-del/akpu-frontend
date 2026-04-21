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
    const { data: user } = await supabase
      .from("users")
      .select("status, village, force_password_change")
      .eq("id", session.user.id)
      .single();

    // No record at all
    if (!user) {
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }

    // Force password change
    if (user.force_password_change) {
      return NextResponse.redirect(
        new URL("/auth/change-password", req.url)
      );
    }

    // APPROVED users — always let through, no more checks
    if (user.status === "approved") {
      // Only block non-admins from /admin paths
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
      return res;
    }

    // SUSPENDED / REJECTED
    if (user.status === "suspended") {
      return NextResponse.redirect(new URL("/auth/suspended", req.url));
    }
    if (user.status === "rejected") {
      return NextResponse.redirect(new URL("/auth/rejected", req.url));
    }

    // PENDING status
    if (user.status === "pending") {
      // If no village yet — send to KYC to fill form
      if (!user.village) {
        return NextResponse.redirect(new URL("/auth/kyc", req.url));
      }
      // Has village — KYC submitted, waiting for approval
      return NextResponse.redirect(new URL("/auth/pending", req.url));
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
