import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  // 1. FIX: Await the cookie store
  const cookieStore = await cookies();
  
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

  // 2. Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Admin Permission Check
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .in("role", ["super_admin", "community_admin"])
    .single();

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, action, role: newRole, scopeId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 4. Perform Action
    let updateError = null;

    if (action === "approve") {
      const { error } = await supabase
        .from("users")
        .update({ status: "approved" })
        .eq("id", userId);
      updateError = error;
    } 
    else if (action === "suspend") {
      const { error } = await supabase
        .from("users")
        .update({ status: "suspended", comment_enabled: false })
        .eq("id", userId);
      updateError = error;
    } 
    else if (action === "reject") {
      const { error } = await supabase
        .from("users")
        .update({ status: "rejected" })
        .eq("id", userId);
      updateError = error;
    } 
    else if (action === "assign_role" && newRole) {
      const { error } = await supabase.from("user_roles").upsert({
        user_id: userId,
        role: newRole,
        scope_id: scopeId ?? null,
      });
      updateError = error;
    }

    if (updateError) throw updateError;

    // 5. Log Activity
    await supabase.from("activity_logs").insert({
      actor_id: session.user.id,
      action: action,
      target_id: userId,
      target_type: "user",
      metadata: { role: newRole },
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Admin PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}