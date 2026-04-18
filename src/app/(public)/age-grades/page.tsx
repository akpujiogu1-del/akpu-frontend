import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function AgeGradesPage() {
  // Added 'await' here to ensure cookies are loaded correctly
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
    .eq("type", "age_grade")
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Age Grades
        </h1>
        <p className="text-gray-500 mb-8">
          Age grades are a core part of Akpu community structure. Each grade plays a unique role in community development and governance.
        </p>

        {(!groups || groups.length === 0) ? (
          <div className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary">
            <p className="text-2xl mb-2">🏛️</p>
            <p className="text-primary font-semibold">Age grades will appear here once configured by the admin.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h2 className="font-bold text-lg text-primary mb-2">{g.name}</h2>
                {g.description && (
                  <p className="text-gray-500 text-sm mb-4">{g.description}</p>
                )}
                {session ? (
                  <Link
                    href={`/dashboard/umunna?group=${g.id}`}
                    className="text-sm text-secondary font-semibold hover:underline"
                  >
                    View Group →
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="text-sm text-secondary font-semibold hover:underline"
                  >
                    Join to participate →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {!session && (
          <div className="mt-12 bg-secondary-50 rounded-xl p-8 text-center border border-secondary-100">
            <h3 className="text-xl font-bold text-secondary mb-2">
              Want to join an age grade?
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Register and complete your KYC to become a verified community member and join your age grade.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-secondary text-white px-8 py-3 rounded-full font-semibold hover:bg-secondary-dark transition"
            >
              Register Now
            </Link>
          </div>
        )}
      </div>
    </>
  );
}s
