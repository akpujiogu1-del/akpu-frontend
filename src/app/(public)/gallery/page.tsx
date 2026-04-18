import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function GalleryPage() {
  // Await the cookie store for Next.js 15 compatibility
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
  
  const { data: items } = await supabase
    .from("gallery")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order")
    .order("created_at", { ascending: false });

  const images = items?.filter((i) => i.type === "image") ?? [];
  const videos = items?.filter((i) => i.type === "video") ?? [];

  function toYTEmbed(url: string) {
    const id = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    )?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Media Gallery
        </h1>
        <p className="text-gray-500 mb-10">
          Photos and videos from Akpu community events and history.
        </p>

        {videos.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
              <span>🎥</span> Videos
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <div key={v.id} className="rounded-xl overflow-hidden shadow-md border bg-white group">
                  <div className="aspect-video bg-black">
                    <iframe
                      src={toYTEmbed(v.url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={v.caption ?? "Akpu Video"}
                    />
                  </div>
                  {v.caption && (
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-700 line-clamp-2">
                        {v.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {images.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
              <span>🖼️</span> Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden shadow-sm border hover:shadow-xl transition-all duration-300 group bg-gray-100"
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? "Akpu community photo"}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {img.caption && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] text-white truncate w-full">
                        {img.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(!items || items.length === 0) && (
          <div className="text-center py-20 bg-primary-50 rounded-2xl border-2 border-dashed border-primary/30">
            <p className="text-5xl mb-4">📸</p>
            <p className="text-primary font-bold text-xl">
              The gallery is currently empty.
            </p>
            <p className="text-primary-light mt-1">
              Check back soon for photos and videos from Akpu.
            </p>
          </div>
        )}
      </div>
    </>
  );
}