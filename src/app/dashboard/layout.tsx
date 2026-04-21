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

  // Get user status
  const { data: user } = await supabase
    .from("users")
    .select("status, village, force_password_change")
    .eq("id", session.user.id)
    .single();

  // Get roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  const userRoles = roles?.map((r) => r.role) ?? [];
  const isAdmin = userRoles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  // Force password change
  if (user?.force_password_change) {
    redirect("/auth/change-password");
  }

  // APPROVED or ADMIN — always allow in
  if (user?.status === "approved" || isAdmin) {
    const { data: profile } = await supabase
      .from("users")
      .select("*, user_roles(role)")
      .eq("id", session.user.id)
      .single();

    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
        <DashboardNav profile={profile} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "grid", gap: 20 }}
            className="md:grid-cols-[1fr_260px]">
            <main>{children}</main>
            <aside className="hidden md:block">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  background: "white", border: "1px solid #e5e7eb",
                  borderRadius: 12, padding: 16, marginBottom: 12,
                  textAlign: "center", color: "#9ca3af", fontSize: 13,
                }}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>📣</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>Adverts</p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // PENDING with no village — needs KYC
  if (user?.status === "pending" && !user?.village) {
    redirect("/auth/kyc");
  }

  // PENDING with village — waiting for approval
  if (user?.status === "pending" && user?.village) {
    redirect("/auth/pending");
  }

  // Suspended
  if (user?.status === "suspended") redirect("/auth/suspended");

  // Rejected
  if (user?.status === "rejected") redirect("/auth/rejected");

  // No user record
  redirect("/auth/kyc");
}
