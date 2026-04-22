import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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
    if (!serviceKey) return NextResponse.json({ error: "Service key not set in environment variables" }, { status: 500 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const [usersRes, leadersRes, newsRes, announcesRes, galleryRes, groupsRes, contactsRes, logsRes, settingsRes] = await Promise.all([
      admin.from("users").select("*, user_roles(role)").order("created_at", { ascending: false }),
      admin.from("leaders").select("*").is("deleted_at", null).order("sort_order"),
      admin.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      admin.from("announcements").select("*").order("created_at", { ascending: false }),
      admin.from("gallery").select("*").is("deleted_at", null).order("sort_order"),
      admin.from("groups").select("*").is("deleted_at", null).order("name"),
      admin.from("contact_messages").select("*").order("created_at", { ascending: false }),
      admin.from("activity_logs").select("*, users(full_name)").order("created_at", { ascending: false }).limit(50),
      admin.from("site_settings").select("key,value"),
    ]);

    return NextResponse.json({
      users:     usersRes.data     ?? [],
      leaders:   leadersRes.data   ?? [],
      news:      newsRes.data      ?? [],
      announces: announcesRes.data ?? [],
      gallery:   galleryRes.data   ?? [],
      groups:    groupsRes.data    ?? [],
      contacts:  contactsRes.data  ?? [],
      logs:      logsRes.data      ?? [],
      settings:  Object.fromEntries((settingsRes.data ?? []).map((r: any) => [r.key, r.value])),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
