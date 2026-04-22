import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { data: { session } } = await authClient.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: roleRows } = await authClient.from("user_roles").select("role").eq("user_id", session.user.id);
    const roles = roleRows?.map((r) => r.role) ?? [];
    const isAdmin = roles.some((r) => ["super_admin","community_admin","group_admin"].includes(r));
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "Service key not configured" }, { status: 500 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    const body = await req.json();
    const { action, table, data, id } = body;

    let result: any;

    if (action === "insert") {
      result = await admin.from(table).insert(data).select();
    } else if (action === "update") {
      result = await admin.from(table).update(data).eq("id", id).select();
    } else if (action === "delete") {
      result = await admin.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id);
    } else if (action === "hard_delete") {
      result = await admin.from(table).delete().eq("id", id);
    } else if (action === "update_user_status") {
      const updateData: any = { status: data.status };
      if (data.status === "suspended") updateData.comment_enabled = false;
      if (data.status === "approved")  updateData.comment_enabled = true;
      result = await admin.from("users").update(updateData).eq("id", id);
      await admin.from("activity_logs").insert({
        actor_id: session.user.id,
        action: `user_${data.status}`,
        target_id: id,
        target_type: "user",
      });
    } else if (action === "assign_role") {
      await admin.from("user_roles").delete().eq("user_id", id);
      result = await admin.from("user_roles").insert({ user_id: id, role: data.role, scope_id: null });
    } else if (action === "update_setting") {
      result = await admin.from("site_settings").update({ value: data.value }).eq("key", data.key);
    } else if (action === "deactivate_announcements") {
      result = await admin.from("announcements").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      return NextResponse.json({ error: "Unknown action: " + action }, { status: 400 });
    }

    if (result?.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
