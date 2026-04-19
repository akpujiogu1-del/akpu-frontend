import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
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
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const roles = roleData?.map((r) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin"].includes(r)
  );
  if (!isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  if (body.action === "approve") {
    await supabase.from("users")
      .update({ status: "approved" }).eq("id", body.userId);
  } else if (body.action === "suspend") {
    await supabase.from("users")
      .update({ status: "suspended", comment_enabled: false }).eq("id", body.userId);
  } else if (body.action === "reject") {
    await supabase.from("users")
      .update({ status: "rejected" }).eq("id", body.userId);
  } else if (body.action === "assign_role" && body.role) {
    await supabase.from("user_roles").upsert({
      user_id: body.userId,
      role: body.role,
      scope_id: body.scopeId ?? null,
    });
  }

  await supabase.from("activity_logs").insert({
    actor_id: session.user.id,
    action: body.action,
    target_id: body.userId,
    target_type: "user",
    metadata: { role: body.role },
  });

  return NextResponse.json({ success: true });
}
