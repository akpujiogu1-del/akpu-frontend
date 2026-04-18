import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function UmunnaPage() {
  // Await the cookie store for Next.js 15+ compatibility
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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

  const VILLAGES = [
    "Umuihu", "Okparaebetere/Umuikpa", "Umueze", "Umuezeilo",
    "Umuezechukwu", "Chemmini", "Umuezeagu", "Umuezeakpu",
    "Umuanaga", "Upata", "Ihebuebu", "Umuokpara",
    "Mgboko", "Umudiana", "Uhuana", "Umunnukwuodu",
  ];

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-primary mb-3">
            Umunna
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            The Umunna represents the extended family and kinship groups that form the foundation of Akpu community identity. Akpu is comprised of 16 historic villages.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <span>🏘️</span> The 16 Villages of Akpu
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {VILLAGES.map((village, i) => (
              <div
                key={i}
                className="bg-white border border-primary-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm group"
              >
                <p className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏡</p>
                <p className="font-bold text-primary text-xs sm:text-sm uppercase tracking-tight">
                  {village}
                </p>
              </div>
            ))}
          </div>
        </section>

        {groups && groups.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
              <span>🤝</span> Umunna Groups
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-secondary-50 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="font-bold text-xl text-secondary mb-2">
                    {g.name}
                  </h3>
                  {g.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {g.description}
                    </p>
                  )}
                  <Link
                    href={session ? `/dashboard/umunna?group=${g.id}` : "/auth/register"}
                    className="inline-flex items-center text-sm text-primary font-bold hover:gap-2 transition-all"
                  >
                    {session ? "View Group Details" : "Join to participate"} <span className="ml-1">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {!session && (
          <div className="bg-primary text-white rounded-2xl p-10 text-center shadow-xl">
            <h3 className="text-2xl font-bold mb-3">
              Connect with your Umunna
            </h3>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Register as a community member to join your Umunna group, participate in discussions, and stay connected with your kinsmen.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-secondary text-white px-10 py-4 rounded-full font-bold hover:bg-secondary-dark transition-transform hover:scale-105 shadow-lg"
            >
              Register Now
            </Link>
          </div>
        )}
      </div>
    </>
  );
}