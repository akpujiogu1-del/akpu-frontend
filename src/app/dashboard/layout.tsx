import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. FIX: Await the cookie store for Next.js 15
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

  // 2. Auth Guard
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  // 3. Fetch Detailed Profile with Roles
  const { data: profile } = await supabase
    .from("users")
    .select("*, user_roles(role)")
    .eq("id", session.user.id)
    .single();

  // 4. Status Guard (Security Enforcement)
  if (profile?.status === "suspended") {
    redirect("/suspended");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Global Navigation - Pass profile for conditional Admin links */}
      <DashboardNav profile={profile} />

      {/* Community-wide Alerts */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <AnnouncementBanner />
      </div>

      {/* Main App Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>
    </div>
  );
}