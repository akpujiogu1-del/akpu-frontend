import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role =
  | "super_admin"
  | "community_admin"
  | "group_admin"
  | "member";

export async function requireRole(allowed: Role[]) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
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

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const userRoles = data?.map((r) => r.role) ?? [];
  const hasRole = allowed.some((r) => userRoles.includes(r));
  if (!hasRole) redirect("/dashboard");

  return { session, roles: userRoles };
}

export async function logAction(
  supabase: any,
  actorId: string,
  action: string,
  targetId?: string,
  targetType?: string,
  metadata?: object
) {
  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    target_id: targetId,
    target_type: targetType,
    metadata,
  });
}
