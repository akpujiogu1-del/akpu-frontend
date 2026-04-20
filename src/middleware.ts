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

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isProtected && session) {

    // Check if user is admin FIRST before anything else
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    const { data: communityAdminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "community_admin")
      .maybeSingle();

    const { data: groupAdminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "group_admin")
      .maybeSingle();

    const isAdmin = !!(adminRole || communityAdminRole || groupAdminRole);

    // ADMINS — skip all other checks, always allow through
    if (isAdmin) {
      return res;
    }

    // NON-ADMIN USERS — run full checks
    const { data: userRecord } = await supabase
      .from("users")
      .select("status, force_password_change, village")
      .eq("id", session.user.id)
      .single();

    if (!userRecord) {
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }

    if (userRecord.force_password_change) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    if (!userRecord.village) {
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }

    if (userRecord.status === "pending") {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    if (userRecord.status === "suspended") {
      return NextResponse.redirect(new URL("/auth/suspended", req.url));
    }

    if (userRecord.status === "rejected") {
      return NextResponse.redirect(new URL("/auth/rejected", req.url));
    }

    if (path.startsWith("/admin")) {
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
