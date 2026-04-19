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

  if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("status, force_password_change")
      .eq("id", session.user.id)
      .single();

    if (userRecord?.force_password_change && path !== "/auth/change-password") {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    if (path.startsWith("/dashboard")) {
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
