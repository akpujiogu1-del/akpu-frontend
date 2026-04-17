import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export default async function AboutPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "about_text")
    .single();

  return (
    <>
      <Navbar session={session} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-primary mb-6">
          About Akpu
        </h1>
        <div className="bg-primary-50 border-l-4 border-primary rounded-xl p-6 mb-8">
          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
            {setting?.value ||
              "Akpu, also known as Akpujiogu, is a town in Orumba South Local Government Area of Anambra State, Nigeria. It is known as the Land of the Ancients, with a rich cultural heritage, strong community bonds, and a proud history that spans many generations."}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-primary">
            <h2 className="text-xl font-bold text-primary mb-3">Location</h2>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li><span className="font-semibold">Town:</span> Akpu (Akpujiogu)</li>
              <li><span className="font-semibold">LGA:</span> Orumba South</li>
              <li><span className="font-semibold">State:</span> Anambra State</li>
              <li><span className="font-semibold">Country:</span> Nigeria</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-secondary">
            <h2 className="text-xl font-bold text-secondary mb-3">Learn More</h2>
            <p className="text-gray-600 text-sm mb-4">
              Read about Akpu on Wikipedia for detailed historical and cultural information.
            </p>
            
              href="https://en.wikipedia.org/wiki/Akpujiogu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-secondary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-secondary-dark transition"
            >
              View on Wikipedia
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
