import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import AnnouncementBanner from "@/components/AnnouncementBanner";

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
              cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_roles(role)")
    .eq("id", session.user.id)
    .single();

  if (profile?.status === "pending") redirect("/auth/pending");
  if (profile?.status === "suspended") redirect("/auth/suspended");
  if (profile?.status === "rejected") redirect("/auth/rejected");

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      <DashboardNav profile={profile} />
      <AnnouncementBanner />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}
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
                <p style={{ fontSize: 11, margin: "4px 0 0" }}>Community notices will appear here</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
