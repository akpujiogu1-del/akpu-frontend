import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function PastPGsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { data: pgs } = await supabase
    .from("leaders")
    .select("*")
    .eq("leader_type", "past_pg")
    .is("deleted_at", null)
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Past Presidents General
        </h1>
        <p className="text-gray-500 mb-10">
          Honoring the leaders who have served and shaped the Akpu community over the years.
        </p>

        {(!pgs || pgs.length === 0) ? (
          <div className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary">
            <p className="text-4xl mb-3">🏛️</p>
            <p className="text-primary font-semibold text-lg">
              Past PGs will appear here once added by the admin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pgs.map((pg, index) => (
              <div
                key={pg.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex gap-6 hover:shadow-md transition"
              >
                <div className="shrink-0">
                  <img
                    src={pg.photo_url ?? "/avatar-placeholder.png"}
                    alt={pg.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold text-primary">
                        {pg.name}
                      </h2>
                      {pg.title && (
                        <p className="text-secondary font-semibold text-sm mt-0.5">
                          {pg.title}
                        </p>
                      )}
                    </div>
                    <span className="bg-primary-50 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
                      #{index + 1}
                    </span>
                  </div>
                  {pg.bio && (
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                      {pg.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
