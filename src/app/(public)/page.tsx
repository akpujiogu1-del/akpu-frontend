import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

function toYTEmbed(url: string) {
  const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

const SOCIAL = [
  { 
    key: "facebook_url", 
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" 
  },
  { 
    key: "instagram_url", 
    path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" 
  },
  { 
    key: "youtube_url", 
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z" 
  },
  { 
    key: "tiktok_url", 
    path: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" 
  }
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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Outfit, sans-serif" }}>
      <Navbar session={session} />
      <AnnouncementBanner />

      <section className="bg-[#2d6a2d] text-white py-20 px-6 text-center border-b-8 border-[#6b3a1f]">
        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter uppercase">Akpu Town</h1>
        <p className="text-xl md:text-2xl text-[#f3e0cc] mb-10 font-light italic text-balance">The Land of the Ancients</p>
        {!session && (
          <Link href="/auth/register" className="inline-block bg-[#6b3a1f] hover:bg-[#4a2510] text-white px-12 py-4 rounded-full text-xl font-bold shadow-2xl transition-transform hover:scale-105">
            Join Community
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-8 p-6 md:p-12 bg-[#f8f0e8]">
        <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-[#2d6a2d]">
          <h2 className="font-bold uppercase tracking-wider mb-4 text-[#2d6a2d]">Community Spotlight</h2>
          {s.landing_video_url ? (
            <iframe src={toYTEmbed(s.landing_video_url)} className="w-full aspect-video rounded-xl" allowFullScreen />
          ) : (
            <div className="w-full aspect-video bg-[#eaf5ea] rounded-xl flex items-center justify-center text-[#2d6a2d] italic">Video coming soon...</div>
          )}
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-[#2d6a2d]">
          <h2 className="font-bold uppercase tracking-wider mb-4 text-[#2d6a2d]">Our Location</h2>
          {s.map_embed_url ? (
            <iframe src={s.map_embed_url} className="w-full h-[250px] md:h-full rounded-xl" loading="lazy" />
          ) : (
            <div className="w-full h-[250px] bg-[#eaf5ea] rounded-xl flex items-center justify-center text-[#2d6a2d] italic">Map loading...</div>
          )}
        </div>
      </section>

      <section className="py-20 px-6 bg-white max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-[#2d6a2d] uppercase text-center mb-12">Hall of Fame</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {(hallOfFame.length > 0 ? hallOfFame : Array(4).fill(null)).map((l, i) => (
            <div key={i} className="text-center group">
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 relative">
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
      </section>

      <footer className="bg-[#6b3a1f] text-white py-16 px-6 border-t-8 border-[#2d6a2d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-[#f3e0cc]">Connect with Akpu</h2>
          <div className="flex justify-center gap-6 mb-12">
            {SOCIAL.map(({ key, path }) => (
              <a key={key} href={s[key] || "#"} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all" target="_blank">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
              </a>
            ))}
          </div>
          <p className="font-bold text-[#f3e0cc] tracking-widest">AKPU TOWN · ANAMBRA STATE</p>
          <p className="text-xs mt-2 opacity-60">© {new Date().getFullYear()} Community Portal</p>
        </div>
      </footer>
    </div>
  );
}
