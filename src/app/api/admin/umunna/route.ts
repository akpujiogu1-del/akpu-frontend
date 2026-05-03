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

    // Get the group_admin's scope — must be an umunna group
    const { data: roleRows } = await authClient
      .from("user_roles")
      .select("role, scope_id")
      .eq("user_id", session.user.id);

    const umunnaRole = roleRows?.find((r) =>
      r.role === "group_admin" && r.scope_id
    );

    // Also allow super_admin and community_admin
    const isSuperOrCommunity = roleRows?.some((r) =>
      ["super_admin", "community_admin"].includes(r.role)
    );

    if (!umunnaRole && !isSuperOrCommunity) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    let pendingUsers: any[] = [];

    if (isSuperOrCommunity) {
      // Super/community admin sees ALL pending users
      const { data } = await admin
        .from("users")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      pendingUsers = data ?? [];
    } else {
      // Umunna admin: get their group name, filter pending users by village match
      const { data: group } = await admin
        .from("groups")
        .select("name")
        .eq("id", umunnaRole!.scope_id)
        .single();

      if (group) {
        const groupName = group.name.toLowerCase();
        const { data: allPending } = await admin
          .from("users")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        // Match by village name containing group name or vice versa
        pendingUsers = (allPending ?? []).filter((u) => {
          if (!u.village) return false;
          const village = u.village.toLowerCase();
          return village.includes(groupName) || groupName.includes(village);
        });
      }
    }

    return NextResponse.json({ pendingUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
