import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({
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

  const uid = session.user.id;

  // Single query for user record
  const { data: user } = await supabase
    .from("users")
    .select("id, status, village, full_name, avatar_url, force_password_change")
    .eq("id", uid)
    .single();

  // Single query for roles
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);

  const roles = roleRows?.map((r) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  // No user record yet
  if (!user) redirect("/auth/kyc");

  // Force password change
  if (user.force_password_change) redirect("/auth/change-password");

  // ADMIN — always allow through
  if (isAdmin) {
    const profile = { ...user, user_roles: roleRows };
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
        <DashboardNav profile={profile} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "grid", gap: 20 }}
            style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr" }} className="md:grid-cols-[1fr_260px]">
            <main>{children}</main>
            <aside className="hidden md:block">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  <p style={{ fontSize: 24, margin: "0 0 4px" }}>📣</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>Adverts</p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // REGULAR USER routing
  if (user.status === "approved") {
    const profile = { ...user, user_roles: roleRows };
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
        <DashboardNav profile={profile} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "grid", gap: 20 }}
            style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr" }} className="md:grid-cols-[1fr_260px]">
            <main>{children}</main>
            <aside className="hidden md:block">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  <p style={{ fontSize: 24, margin: "0 0 4px" }}>📣</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>Adverts</p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "suspended") redirect("/auth/suspended");
  if (user.status === "rejected")  redirect("/auth/rejected");

  // Pending: check if KYC was submitted
  if (!user.village) redirect("/auth/kyc");
  redirect("/auth/pending");
}
