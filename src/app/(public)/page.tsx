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
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { data: rows } = await supabase.from("site_settings").select("key,value");
  const s: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
  const { data: leaders } = await supabase.from("leaders").select("*").is("deleted_at", null).order("sort_order");
  
  const hallOfFame = leaders?.filter((l) => l.leader_type === "hall_of_fame") ?? [];
  const { data: news } = await supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(4);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Outfit, sans-serif" }}>
      <Navbar session={session} />
      <AnnouncementBanner />

      {/* HERO SECTION - Deep Green with Brown CTA */}
      <section className="relative bg-[#2d6a2d] text-white py-24 px-6 text-center">
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black mb-4">AKPU TOWN</h1>
          <p className="text-2xl md:text-3xl font-light text-[#f3e0cc] mb-10 italic">"The Land of the Ancients"</p>
          {!session && (
            <Link href="/auth/register" className="inline-block bg-[#6b3a1f] hover:bg-[#4a2510] text-white px-12 py-4 rounded-full text-xl font-bold shadow-2xl transition-all">
              Join Community
            </Link>
          )}
        </div>
      </section>

      {/* HALL OF FAME - Greenish backgrounds */}
      <section className="py-20 px-6 bg-[#f8f0e8]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-[#2d6a2d] text-center uppercase mb-12">Hall of Fame</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(hallOfFame.length > 0 ? hallOfFame : Array(4).fill({ name: "Distinguished Member", title: "Merit Awardee" })).map((l, i) => (
              <div key={i} className="text-center bg-white p-6 rounded-2xl shadow-md border-b-4 border-[#2d6a2d]">
                <div className="w-32 h-32 mx-auto mb-4 bg-[#eaf5ea] rounded-full flex items-center justify-center text-4xl border-2 border-[#2d6a2d]">👤</div>
                <h3 className="font-bold text-[#2d6a2d]">{l.name}</h3>
                <p className="text-[#6b3a1f] text-sm">{l.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER - Brown background */}
      <footer className="bg-[#6b3a1f] py-12 px-6 text-center text-white">
        <div className="flex justify-center gap-6 mb-8">
          {SOCIAL.map(({ key, label, icon }) => (
             <a key={key} href={s[key] || "#"} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition">
               {icon}
             </a>
          ))}
        </div>
        <p className="font-bold tracking-widest text-[#f3e0cc]">AKPU · LAND OF THE ANCIENTS</p>
      </footer>
    </div>
  );
}
