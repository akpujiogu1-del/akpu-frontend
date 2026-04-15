import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("status, force_password_change")
      .eq("id", session.user.id)
      .single();

    if (
      userRecord?.force_password_change &&
      path !== "/auth/change-password"
    ) {
      return NextResponse.redirect(
        new URL("/auth/change-password", req.url)
      );
    }

    if (userRecord?.status === "pending") {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    if (userRecord?.status === "suspended") {
      return NextResponse.redirect(new URL("/auth/suspended", req.url));
    }

    if (userRecord?.status === "rejected") {
      return NextResponse.redirect(new URL("/auth/rejected", req.url));
    }
  }

  if (path.startsWith("/admin")) {
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session!.user.id)
      .in("role", ["super_admin", "community_admin", "group_admin"])
      .single();

    if (!role) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/change-password"],
};