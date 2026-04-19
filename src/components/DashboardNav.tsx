"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/dashboard",          icon: "🏠", label: "Home"     },
  { href: "/dashboard/messages", icon: "💬", label: "Messages" },
  { href: "/dashboard/umunna",   icon: "👥", label: "Umunna"   },
  { href: "/dashboard/files",    icon: "📁", label: "Files"    },
];

export default function DashboardNav({ profile }: { profile: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const roles: string[] = profile?.user_roles?.map((r: any) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{ background: "#2d6a2d", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}
        className="flex items-center h-14 gap-2">

        <Link href="/dashboard"
          style={{ color: "white", fontWeight: 800, fontSize: 18, textDecoration: "none", marginRight: 16 }}>
          🏘️ Akpu
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map(({ href, icon, label }) => (
            <Link key={href} href={href}
              style={{ color: "white", textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              style={{ color: "white", background: "#6b3a1f", textDecoration: "none", padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 700, marginLeft: 8 }}>
              ⚙️ Admin
            </Link>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link href="/dashboard/settings">
            <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} />
          </Link>
          <button onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Log out
          </button>
        </div>

        {/* Mobile: show nav icons inline */}
        <div className="flex md:hidden items-center gap-1 flex-1 overflow-x-auto">
          {NAV.map(({ href, icon, label }) => (
            <Link key={href} href={href}
              style={{ color: "white", textDecoration: "none", padding: "6px 10px", borderRadius: 8, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 52 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              style={{ color: "white", background: "#6b3a1f", textDecoration: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 52 }}>
              <span style={{ fontSize: 20 }}>⚙️</span>
              <span style={{ fontSize: 10 }}>Admin</span>
            </Link>
          )}
        </div>

        {/* Mobile avatar */}
        <Link href="/dashboard/settings" className="md:hidden">
          <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} />
        </Link>
      </div>
    </nav>
  );
}
