import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function GalleryPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
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
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
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
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-secondary mb-6">Videos</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.slice(0, 8).map((v) => (
                <div key={v.id} className="rounded-xl overflow-hidden shadow-sm border">
                  <div className="aspect-video">
                    <iframe
                      src={toYTEmbed(v.url)}
                      className="w-full h-full"
                      allowFullScreen
                      title={v.caption ?? "Akpu Video"}
                    />
                  </div>
                  {v.caption && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      {v.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {images.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-secondary mb-6">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.slice(0, 30).map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition group"
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? "Akpu community photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(!items || items.length === 0) && (
          <div className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary">
            <p className="text-4xl mb-3">📸</p>
            <p className="text-primary font-semibold text-lg">
              Gallery content will appear here once uploaded by the admin.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
