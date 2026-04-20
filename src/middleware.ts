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

  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isProtected && session) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("status, force_password_change, village, full_name")
      .eq("id", session.user.id)
      .single();

    // Force password change
    if (userRecord?.force_password_change && path !== "/auth/change-password") {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    // Not submitted KYC yet — redirect to KYC
    if (
      path.startsWith("/dashboard") &&
      !path.startsWith("/dashboard") === false &&
      !userRecord?.village &&
      path !== "/auth/kyc"
    ) {
      return NextResponse.redirect(new URL("/auth/kyc", req.url));
    }

    // Pending — can only see /auth/pending
    if (userRecord?.status === "pending" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    // Suspended
    if (userRecord?.status === "suspended" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/suspended", req.url));
    }

    // Rejected
    if (userRecord?.status === "rejected" && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/rejected", req.url));
    }

    // Admin route protection
    if (path.startsWith("/admin")) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const roles = roleData?.map((r) => r.role) ?? [];
      const isAdmin = roles.some((r) =>
        ["super_admin", "community_admin", "group_admin"].includes(r)
      );
      if (!isAdmin) {
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
