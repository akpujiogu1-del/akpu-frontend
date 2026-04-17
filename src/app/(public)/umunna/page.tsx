import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function UmunnaPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
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
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Umunna
        </h1>
        <p className="text-gray-500 mb-10">
          The Umunna represents the extended family and kinship groups that form the foundation of Akpu community identity. Akpu is made up of 16 villages.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-secondary mb-6">
            The 16 Villages of Akpu
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {VILLAGES.map((village, i) => (
              <div
                key={i}
                className="bg-white border border-primary-100 rounded-xl p-4 text-center hover:bg-primary-50 transition shadow-sm"
              >
                <p className="text-2xl mb-1">🏡</p>
                <p className="font-semibold text-primary text-sm">{village}</p>
              </div>
            ))}
          </div>
        </section>

        {groups && groups.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-secondary mb-6">
              Umunna Groups
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                >
                  <div className="w-12 h-12 bg-secondary-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <h3 className="font-bold text-lg text-secondary mb-2">
                    {g.name}
                  </h3>
                  {g.description && (
                    <p className="text-gray-500 text-sm mb-4">
                      {g.description}
                    </p>
                  )}
                  {session ? (
                    <Link
                      href={`/dashboard/umunna?group=${g.id}`}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      View Group →
                    </Link>
                  ) : (
                    <Link
                      href="/auth/register"
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      Join to participate →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!session && (
          <div className="bg-primary-50 rounded-xl p-8 text-center border border-primary-100">
            <h3 className="text-xl font-bold text-primary mb-2">
              Connect with your Umunna
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Register as a community member to join your Umunna group, participate in discussions, and stay connected with your kinsmen.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-dark transition"
            >
              Register Now
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
