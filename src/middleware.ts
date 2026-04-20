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
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
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

  // Not logged in — redirect to login
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isProtected && session) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("status, force_password_change, village, full_name")
      .eq("id", session.user.id)
      .single();

    // No user record at all — go to KYC
    if (!userRecord) {
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }

    // Force password change
    if (
      userRecord.force_password_change &&
      path !== "/auth/change-password"
    ) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    // Check roles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    const roles = roleData?.map((r) => r.role) ?? [];
    const isAdmin = roles.some((r) =>
      ["super_admin", "community_admin", "group_admin"].includes(r)
    );

    // ADMIN USERS — bypass all status checks, go straight through
    if (isAdmin) {
      // Only check admin path permission
      if (path.startsWith("/admin")) {
        return res; // admins can always access /admin
      }
      return res; // admins can always access /dashboard
    }

    // REGULAR USERS — check KYC and status

    // Has not submitted KYC yet (no village means KYC not done)
    if (!userRecord.village && path.startsWith("/dashboard")) {
      // Only redirect to KYC if not already going there
      if (path !== "/auth/kyc") {
        return NextResponse.redirect(new URL("/auth/kyc", req.url));
      }
    }

    // Pending approval
    if (userRecord.status === "pending" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    // Suspended
    if (userRecord.status === "suspended" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/suspended", req.url));
    }

    // Rejected
    if (userRecord.status === "rejected" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/rejected", req.url));
    }

    // Non-admin trying to access /admin
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
