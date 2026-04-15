"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Home, MessageCircle, Users, Folder, Settings, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/umunna", icon: Users, label: "Umunna" },
  { href: "/dashboard/files", icon: Folder, label: "Files" },
];

export default function DashboardNav({ profile }: { profile: any }) {
  const router = useRouter();
  const roles: string[] =
    profile?.user_roles?.map((r: any) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-1">
        <Link href="/dashboard" className="font-bold text-lg mr-4 shrink-0">
          🏘️ Akpu
        </Link>

        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center px-3 py-1 hover:bg-primary-dark rounded-lg transition text-xs gap-0.5"
          >
            <Icon size={18} />
            <span className="hidden sm:block">{label}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className="ml-2 text-xs bg-secondary px-3 py-1.5 rounded-md"
          >
            Admin
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard/settings">
            <img
              src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
            />
          </Link>
          <Link href="/dashboard/settings">
            <Settings size={18} />
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}