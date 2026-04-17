import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .in("role", ["super_admin", "community_admin"])
    .single();

  if (!role)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  if (body.action === "approve") {
    await supabase
      .from("users")
      .update({ status: "approved" })
      .eq("id", body.userId);
  } else if (body.action === "suspend") {
    await supabase
      .from("users")
      .update({ status: "suspended", comment_enabled: false })
      .eq("id", body.userId);
  } else if (body.action === "reject") {
    await supabase
      .from("users")
      .update({ status: "rejected" })
      .eq("id", body.userId);
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