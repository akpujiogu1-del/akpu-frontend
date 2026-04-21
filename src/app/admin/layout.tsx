import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const userRoles = roles?.map((r) => r.role) ?? [];
  const isAdmin = userRoles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  if (!isAdmin) redirect("/dashboard");

  return <>{children}</>;
}
