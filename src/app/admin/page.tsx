import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminRouter() {
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

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const roles = roleRows?.map((r) => r.role) ?? [];

  if (roles.includes("super_admin"))     redirect("/admin/super");
  if (roles.includes("community_admin")) redirect("/admin/community");

  // Check if group_admin is for an umunna group
  if (roles.includes("group_admin")) {
    const { data: roleData } = await supabase
      .from("user_roles").select("role, scope_id").eq("user_id", session.user.id);
    const umunnaRole = roleData?.find((r: any) => r.role === "group_admin" && r.scope_id);
    if (umunnaRole) {
      const { data: group } = await supabase
        .from("groups").select("type").eq("id", umunnaRole.scope_id).single();
      if (group?.type === "umunna") redirect("/admin/umunna");
    }
    redirect("/admin/group");
  }

  redirect("/dashboard");
}
