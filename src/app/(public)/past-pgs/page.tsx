import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function PastPGsPage() {
  // Await cookies for Next.js 15 compatibility
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
  
  const { data: pgs } = await supabase
    .from("leaders")
    .select("*")
    .eq("leader_type", "past_pg")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Past Presidents General
        </h1>
        <p className="text-gray-500 mb-10 text-lg">
          Honoring the leaders who have served and shaped the Akpu community over the years.
        </p>

        {(!pgs || pgs.length === 0) ? (
          <div className="text-center py-20 bg-primary-50 rounded-2xl border-2 border-dashed border-primary/30">
            <p className="text-5xl mb-4">🏛️</p>
            <p className="text-primary font-bold text-xl">
              Past PGs will appear here once added by the admin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pgs.map((pg, index) => (
              <div
                key={pg.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow"
              >
                <div className="shrink-0 flex justify-center sm:block">
                  <img
                    src={pg.photo_url ?? "/avatar-placeholder.png"}
                    alt={pg.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-primary/10 shadow-sm"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-bold text-primary">
                        {pg.name}
                      </h2>
                      {pg.title && (
                        <p className="text-secondary font-bold text-sm tracking-wide uppercase mt-1">
                          {pg.title}
                        </p>
                      )}
                    </div>
                    <span className="bg-primary text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      #{index + 1}
                    </span>
                  </div>
                  {pg.bio && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-gray-600 text-sm leading-relaxed italic">
                        "{pg.bio}"
                      </p>
                    </div>
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