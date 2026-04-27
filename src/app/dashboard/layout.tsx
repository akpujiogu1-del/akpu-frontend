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

  const { data: user } = await supabase
    .from("users")
    .select("id, status, village, force_password_change")
    .eq("id", session.user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const roles = roleRows?.map((r) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  if (!user) redirect("/auth/kyc");
  if (user.force_password_change) redirect("/auth/change-password");

  if (!isAdmin) {
    if (user.status === "suspended") redirect("/auth/suspended");
    if (user.status === "rejected")  redirect("/auth/rejected");
    if (!user.village)               redirect("/auth/kyc");
    if (user.status === "pending")   redirect("/auth/pending");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_roles(role)")
    .eq("id", session.user.id)
    .single();

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      <DashboardNav profile={profile} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 8px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 20,
        }}
          className="lg:grid-cols-[1fr_260px]">
          <main>{children}</main>
          <aside className="hidden lg:block">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}>
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
