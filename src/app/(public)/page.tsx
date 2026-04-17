import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

function toYTEmbed(url: string) {
  const id = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  )?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export default async function LandingPage() {
  const cookieStore = cookies();

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("key,value");
  const s: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r) => [r.key, r.value])
  );

  const { data: leaders } = await supabase
    .from("leaders")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");

  const hallOfFame =
    leaders?.filter((l) => l.leader_type === "hall_of_fame") ?? [];
  const community =
    leaders?.filter((l) => l.leader_type === "community") ?? [];
  const political =
    leaders?.filter((l) => l.leader_type === "political") ?? [];

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(4);

  const socialLinks = [
    { socialKey: "tiktok_url", label: "TikTok", icon: "🎵" },
    { socialKey: "facebook_url", label: "Facebook", icon: "👥" },
    { socialKey: "instagram_url", label: "Instagram", icon: "📸" },
    { socialKey: "youtube_url", label: "YouTube", icon: "▶️" },
  ];

  return (
    <>
      <Navbar session={session} />
      <AnnouncementBanner />

      <section className="grid md:grid-cols-2 gap-6 p-6 md:p-10 bg-primary-50">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          {s.landing_video_url ? (
            <iframe
              src={toYTEmbed(s.landing_video_url)}
              className="w-full h-full"
              allowFullScreen
              title="Akpu Community Video"
            />
          ) : (
            <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary">
              Video Coming Soon
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-secondary mb-1">Our Location</p>
          <p className="text-sm text-gray-500 mb-3">
            Akpu Town, Orumba South LGA, Anambra State, Nigeria
          </p>
          {s.map_embed_url ? (
            <iframe
              src={s.map_embed_url}
              className="w-full h-64 rounded-xl border-2 border-primary"
              loading="lazy"
              title="Akpu Map"
            />
          ) : (
            <div className="w-full h-64 rounded-xl bg-primary-50 border-2 border-dashed border-primary flex items-center justify-center text-primary-light">
              Map not configured yet
            </div>
          )}
        </div>
      </section>

      <section className="text-center py-16 bg-white">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
          Welcome to Akpu
        </h1>
        <p className="text-secondary text-xl font-light mb-8">
          The Land of the Ancients
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-secondary text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-secondary-dark transition shadow-lg"
        >
          Join Community
        </Link>
      </section>

      {hallOfFame.length > 0 && (
        <section className="py-12 bg-primary-50">
          <h2 className="text-2xl font-bold text-center text-primary mb-8">
            Hall of Fame
          </h2>
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {hallOfFame.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl shadow p-4 text-center"
              >
                <img
                  src={l.photo_url ?? "/avatar-placeholder.png"}
                  alt={l.name}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-primary"
                />
                <p className="font-semibold text-gray-800">{l.name}</p>
                <p className="text-xs text-secondary">{l.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {community.length > 0 && (
        <section className="py-12 bg-white">
          <h2 className="text-2xl font-bold text-center text-primary mb-8">
            Our Leaders
          </h2>
          <div className="max-w-6xl mx-auto px-6 flex gap-4 overflow-x-auto pb-2">
            {community.map((l) => (
              <div
                key={l.id}
                className="min-w-[160px] bg-primary-50 rounded-xl p-4 text-center shrink-0"
              >
                <img
                  src={l.photo_url ?? "/avatar-placeholder.png"}
                  alt={l.name}
                  className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-4 border-primary"
                />
                <p className="font-semibold text-sm">{l.name}</p>
                <p className="text-xs text-secondary">{l.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {political.length > 0 && (
        <section className="py-12 bg-secondary-50">
          <h2 className="text-2xl font-bold text-center text-secondary mb-8">
            Our Political Leaders
          </h2>
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-6">
            {political.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl shadow p-4 text-center"
              >
                <img
                  src={l.photo_url ?? "/avatar-placeholder.png"}
                  alt={l.name}
                  className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-4 border-secondary"
                />
                <p className="font-semibold">{l.name}</p>
                <p className="text-xs text-secondary">{l.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(news?.length ?? 0) > 0 && (
        <section className="py-12 bg-white">
          <h2 className="text-2xl font-bold text-center text-primary mb-8">
            Latest News
          </h2>
          <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {news!.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {n.image_url && (
                  <img
                    src={n.image_url}
                    alt={n.title}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="font-semibold text-sm text-primary">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {n.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
<section className="py-10 bg-primary text-white text-center">
        <p className="font-semibold mb-4 text-lg">Social Handles</p>
        <div className="flex justify-center gap-6 flex-wrap">
          {socialLinks.map(({ socialKey, label, icon }) => {
            const url = s[socialKey];
            if (!url) return null;
            return (
              <a
                key={socialKey}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/20 px-5 py-2 rounded-full hover:bg-white/30 transition text-sm font-medium"
              >
                {icon} {label}
              </a>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-primary-100">
          © {new Date().getFullYear()} Akpu Community · Land of the Ancients
        </p>
      </section>
    </>
);
}