import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Video, 
  MapPin, 
  Award, 
  Newspaper,
  Music2 // TikTok Icon equivalent
} from "lucide-react";

function toYTEmbed(url: string) {
  const id = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  )?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

const SOCIAL = [
  { key: "tiktok_url",    label: "TikTok",    icon: Music2 },
  { key: "facebook_url",  label: "Facebook",  icon: Facebook },
  { key: "instagram_url", label: "Instagram", icon: Instagram },
  { key: "youtube_url",   label: "YouTube",   icon: Youtube },
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

      {/* HERO SECTION */}
      <section className="bg-[#2d6a2d] text-white py-20 px-6 text-center border-b-8 border-[#6b3a1f]">
        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter">AKPU TOWN</h1>
        <p className="text-xl md:text-2xl text-[#f3e0cc] mb-10 font-light italic">The Land of the Ancients</p>
        {!session && (
          <Link href="/auth/register" className="inline-block bg-[#6b3a1f] hover:bg-[#4a2510] text-white px-12 py-4 rounded-full text-xl font-bold shadow-2xl transition-transform hover:scale-105">
            Join Community
          </Link>
        )}
      </section>

      {/* MULTIMEDIA SECTION: VIDEO & MAP */}
      <section className="grid md:grid-cols-2 gap-8 p-6 md:p-12 bg-[#f8f0e8]">
        <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-[#2d6a2d]">
          <div className="flex items-center gap-2 mb-4 text-[#2d6a2d]">
            <Video size={24} />
            <h2 className="font-bold uppercase tracking-wider">Community Spotlight</h2>
          </div>
          {s.landing_video_url ? (
            <iframe src={toYTEmbed(s.landing_video_url)} className="w-full aspect-video rounded-xl" allowFullScreen />
          ) : (
            <div className="w-full aspect-video bg-[#eaf5ea] rounded-xl flex items-center justify-center">
              <p className="text-[#2d6a2d] font-medium italic">Video coming soon...</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-[#2d6a2d]">
          <div className="flex items-center gap-2 mb-4 text-[#2d6a2d]">
            <MapPin size={24} />
            <h2 className="font-bold uppercase tracking-wider">Find Us</h2>
          </div>
          {s.map_embed_url ? (
            <iframe src={s.map_embed_url} className="w-full h-[250px] md:h-full rounded-xl" loading="lazy" />
          ) : (
            <div className="w-full h-[250px] bg-[#eaf5ea] rounded-xl flex items-center justify-center">
              <p className="text-[#2d6a2d] font-medium italic">Map loading...</p>
            </div>
          )}
        </div>
      </section>

      {/* HALL OF FAME */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Award className="text-[#6b3a1f]" size={32} />
            <h2 className="text-4xl font-black text-[#2d6a2d] uppercase">Hall of Fame</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(hallOfFame.length > 0 ? hallOfFame : Array(4).fill(null)).map((l, i) => (
              <div key={i} className="text-center group">
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-[#2d6a2d] rounded-full scale-105 opacity-10 group-hover:scale-110 transition"></div>
                  <img 
                    src={l?.photo_url || `https://ui-avatars.com/api/?name=${l?.name || 'Akpu'}&background=2d6a2d&color=fff`} 
                    className="w-full h-full rounded-full object-cover border-4 border-[#6b3a1f] shadow-lg relative z-10" 
                    alt="Leader" 
                  />
                </div>
                <h3 className="font-bold text-[#2d6a2d] text-lg">{l?.name || "Distinguished Citizen"}</h3>
                <p className="text-[#6b3a1f] text-sm font-semibold">{l?.title || "Community Leader"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER & SOCIALS */}
      <footer className="bg-[#6b3a1f] text-white py-16 px-6 border-t-8 border-[#2d6a2d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Connect With Akpu Town</h2>
          <div className="flex justify-center gap-8 mb-12">
            {SOCIAL.map(({ key, icon: Icon }) => (
              <a 
                key={key} 
                href={s[key] || "#"} 
                className="p-4 bg-white/10 rounded-full hover:bg-white/20 hover:text-[#f3e0cc] transition-all transform hover:-translate-y-1"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Icon size={28} />
              </a>
            ))}
          </div>
          <div className="h-px bg-white/20 w-full mb-8"></div>
          <p className="font-bold text-[#f3e0cc]">© {new Date().getFullYear()} AKPU COMMUNITY PORTAL</p>
          <p className="text-xs mt-2 opacity-60">Land of the Ancients · Orumba South, Anambra</p>
        </div>
      </footer>
    </div>
  );
}
