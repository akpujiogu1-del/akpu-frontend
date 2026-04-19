import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const VILLAGES = [
  { name: "Umueze/Umuezeilo",       icon: "🏡" },
  { name: "Umuihu",                 icon: "🏡" },
  { name: "Ohemmiri",               icon: "🏡" },
  { name: "Mgboko",                 icon: "🏡" },
  { name: "Okparaebutere/Umuikpa",  icon: "🏡" },
  { name: "Upata",                  icon: "🏡" },
  { name: "Umuokpara",              icon: "🏡" },
  { name: "Umuanaga",               icon: "🏡" },
  { name: "Umuezeagu",              icon: "🏡" },
  { name: "Umuezeakpu",             icon: "🏡" },
  { name: "Umuezechukwu",           icon: "🏡" },
  { name: "Ihebuebu",               icon: "🏡" },
  { name: "Uhuana",                 icon: "🏡" },
  { name: "Umudiana",               icon: "🏡" },
  { name: "Umunnukwuobu",           icon: "🏡" },
];

export default async function UmunnaPage() {
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
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("type", "umunna")
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <Navbar session={session} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 16px", fontFamily: "Outfit, sans-serif" }}>
        <Link href="/" style={{ color: "#6b3a1f", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          ← Back to Home
        </Link>

        <h1 style={{ color: "#2d6a2d", fontSize: 32, fontWeight: 800, margin: "16px 0 4px" }}>
          Umunna
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 15 }}>
          Akpu Town is made up of 15 villages forming the foundation of our community identity.
        </p>

        <h2 style={{ color: "#6b3a1f", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          The 15 Villages of Akpu
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 40 }}>
          {VILLAGES.map((v, i) => (
            <div key={i} style={{
              background: "white", border: "1px solid #c8e6c9",
              borderRadius: 12, padding: "14px 12px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontSize: 28, margin: "0 0 6px" }}>🏡</p>
              <p style={{ fontWeight: 700, color: "#2d6a2d", fontSize: 13, margin: 0 }}>{v.name}</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>Village {i + 1}</p>
            </div>
          ))}
        </div>

        {groups && groups.length > 0 && (
          <>
            <h2 style={{ color: "#6b3a1f", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Umunna Groups
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
              {groups.map((g) => (
                <div key={g.id} style={{
                  background: "white", border: "1px solid #e5e7eb",
                  borderRadius: 12, padding: 16,
                }}>
                  <p style={{ fontSize: 28, margin: "0 0 8px" }}>🤝</p>
                  <p style={{ fontWeight: 700, color: "#6b3a1f", margin: "0 0 4px" }}>{g.name}</p>
                  {g.description && <p style={{ fontSize: 12, color: "#6b7280" }}>{g.description}</p>}
                  <Link href={session ? `/dashboard/umunna?group=${g.id}` : "/auth/register"}
                    style={{ color: "#2d6a2d", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    {session ? "View Group →" : "Join to participate →"}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {!session && (
          <div style={{ background: "#eaf5ea", border: "1px solid #c8e6c9", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <h3 style={{ color: "#2d6a2d", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
              Connect with your Umunna
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
              Register as a community member to join your Umunna group and participate in discussions.
            </p>
            <Link href="/auth/register"
              style={{ background: "#2d6a2d", color: "white", padding: "12px 28px", borderRadius: 25, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Register Now
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
