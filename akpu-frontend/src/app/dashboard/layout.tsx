import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_roles(role)")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav profile={profile} />
      <AnnouncementBanner />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}