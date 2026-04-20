import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function toYTEmbed(url: string) {
  const id = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  )?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

const SOCIAL = [
  { key: "tiktok_url",    label: "TikTok",    icon: "🎵" },
  { key: "facebook_url",  label: "Facebook",  icon: "👥" },
  { key: "instagram_url", label: "Instagram", icon: "📸" },
  { key: "youtube_url",   label: "YouTube",   icon: "▶️" },
];

export default async function LandingPage() {
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

  const { data: rows } = await supabase
    .from("site_settings").select("key,value");
  const s: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r) => [r.key, r.value])
  );

  const { data: leaders } = await supabase
    .from("leaders").select("*")
    .is("deleted_at", null).order("sort_order");

  const hallOfFame = leaders?.filter((l) => l.leader_type === "hall_of_fame") ?? [];
  const community  = leaders?.filter((l) => l.leader_type === "community")    ?? [];
  const political  = leaders?.filter((l) => l.leader_type === "political")    ?? [];

  const { data: news } = await supabase
    .from("news").select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <div style={{ fontFamily: "Outfit, Segoe UI, sans-serif" }}>
      <Navbar session={session} />
      

      {/* HERO */}
      <section style={{ background: "#eaf5ea" }} className="grid md:grid-cols-2 gap-6 p-6 md:p-10">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          {s.landing_video_url ? (
            <iframe
              src={toYTEmbed(s.landing_video_url)}
              className="w-full h-full"
              allowFullScreen
              title="Akpu Community Video"
            />
          ) : (
            <div style={{ background: "#c8e6c9", color: "#2d6a2d" }}
              className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">🎬</span>
              <p className="font-semibold">Community Video</p>
              <p className="text-sm opacity-70">Set by admin in settings</p>
            </div>
          )}
        </div>
        <div>
          <p style={{ color: "#6b3a1f" }} className="font-bold text-lg mb-1">Our Location</p>
          <p className="text-sm text-gray-600 mb-1">Akpu Town, Orumba South LGA</p>
          <p className="text-sm text-gray-600 mb-3">Anambra State, Nigeria</p>
          {s.map_embed_url ? (
            <iframe
              src={s.map_embed_url}
              className="w-full h-64 rounded-xl"
              style={{ border: "2px solid #2d6a2d" }}
              loading="lazy"
              title="Akpu Map"
            />
          ) : (
            <div style={{ background: "#eaf5ea", border: "2px dashed #2d6a2d", color: "#2d6a2d" }}
              className="w-full h-64 rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">🗺️</span>
              <p className="font-semibold">Map</p>
              <p className="text-xs opacity-70">Set Google Maps embed URL in admin settings</p>
            </div>
          )}
        </div>
      </section>

      {/* WELCOME */}
      <section className="text-center py-16" style={{ background: "white" }}>
        <h1 style={{ color: "#2d6a2d" }} className="text-4xl md:text-5xl font-extrabold mb-2">
          Welcome to Akpu
        </h1>
        <p style={{ color: "#6b3a1f" }} className="text-xl font-light mb-8">
          The Land of the Ancients
        </p>
        <Link href="/auth/register"
          style={{ background: "#6b3a1f", color: "white" }}
          className="inline-block px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:opacity-90 transition">
          Join Community
        </Link>
      </section>

      {/* HALL OF FAME */}
      <section style={{ background: "#eaf5ea" }} className="py-12">
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">
          Hall of Fame
        </h2>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {hallOfFame.length > 0 ? hallOfFame.map((l) => (
            <div key={l.id} className="bg-white rounded-xl shadow p-4 text-center">
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                style={{ border: "4px solid #2d6a2d" }} />
              <p className="font-semibold text-gray-800">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{l.title}</p>
            </div>
          )) : ["Community Champion", "Distinguished Elder", "Youth Icon", "Cultural Ambassador"].map((name, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
                style={{ background: "#eaf5ea", border: "4px solid #2d6a2d" }}>👤</div>
              <p className="font-semibold text-gray-400 text-sm">{name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">Add via Admin</p>
            </div>
          ))}
        </div>
      </section>

      {/* OUR LEADERS */}
      <section className="py-12" style={{ background: "white" }}>
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">
          Our Leaders
        </h2>
        <div className="max-w-6xl mx-auto px-6 flex gap-4 overflow-x-auto pb-2">
          {community.length > 0 ? community.map((l) => (
            <div key={l.id} className="min-w-[160px] rounded-xl p-4 text-center shrink-0"
              style={{ background: "#eaf5ea" }}>
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                style={{ border: "4px solid #2d6a2d" }} />
              <p className="font-semibold text-sm">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{l.title}</p>
            </div>
          )) : ["President General", "Vice President", "Secretary", "Treasurer", "Financial Sec."].map((title, i) => (
            <div key={i} className="min-w-[160px] rounded-xl p-4 text-center shrink-0"
              style={{ background: "#eaf5ea" }}>
              <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                style={{ background: "white", border: "4px solid #2d6a2d" }}>👤</div>
              <p className="font-semibold text-sm text-gray-400">Leader Name</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POLITICAL LEADERS */}
      <section className="py-12" style={{ background: "#f8f0e8" }}>
        <h2 style={{ color: "#6b3a1f" }} className="text-2xl font-bold text-center mb-8">
          Our Political Leaders
        </h2>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          {political.length > 0 ? political.map((l) => (
            <div key={l.id} className="bg-white rounded-xl shadow p-4 text-center">
              <img src={l.photo_url ?? "/avatar-placeholder.png"} alt={l.name}
                className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                style={{ border: "4px solid #6b3a1f" }} />
              <p className="font-semibold">{l.name}</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{l.title}</p>
            </div>
          )) : ["Senator", "House of Reps Member", "Councilor"].map((title, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                style={{ background: "#f8f0e8", border: "4px solid #6b3a1f" }}>👤</div>
              <p className="font-semibold text-gray-400 text-sm">Leader Name</p>
              <p style={{ color: "#6b3a1f" }} className="text-xs">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="py-12" style={{ background: "white" }}>
        <h2 style={{ color: "#2d6a2d" }} className="text-2xl font-bold text-center mb-8">
          Latest News
        </h2>
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {(news && news.length > 0) ? news.map((n) => (
            <div key={n.id} className="rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition">
              {n.image_url && (
                <img src={n.image_url} alt={n.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <p style={{ color: "#2d6a2d" }} className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</p>
              </div>
            </div>
          )) : ["Community Meeting", "Development Update", "Cultural Festival", "Youth Program"].map((title, i) => (
            <div key={i} className="rounded-xl border overflow-hidden shadow-sm">
              <div className="w-full h-36 flex items-center justify-center text-4xl"
                style={{ background: "#eaf5ea" }}>📰</div>
              <div className="p-4">
                <p style={{ color: "#2d6a2d" }} className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-1">News will appear here once posted by admin</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-white text-center" style={{ background: "#2d6a2d" }}>
        <p className="font-semibold mb-4 text-lg">Social Handles</p>
        <div className="flex justify-center gap-4 flex-wrap mb-6">
          {SOCIAL.map(({ key, label, icon }) => {
            const url = s[key];
            return (
              <a key={key}
                href={url || "#"}
                target={url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  opacity: url ? 1 : 0.5,
                  pointerEvents: url ? "auto" : "none",
                }}>
                <span>{icon}</span>
                <span>{label}</span>
              </a>
            );
          })}
        </div>
        <p className="text-xs opacity-80 mb-1">
          {`© ${new Date().getFullYear()} Akpu Community Portal · Land of the Ancients`}
        </p>
        <p className="text-xs opacity-60 mb-3">
          Platform brought to you by One Nation Agency Services
        </p>
        <div className="flex justify-center gap-6 text-xs opacity-70">
          <Link href="/terms" className="hover:underline text-white">Terms of Use</Link>
          <Link href="/privacy" className="hover:underline text-white">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
