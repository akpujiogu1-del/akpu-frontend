"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/dashboard",          icon: "🏠", label: "Home"     },
  { href: "/dashboard/messages", icon: "💬", label: "Messages" },
  { href: "/dashboard/umunna",   icon: "👥", label: "Umunna"   },
  { href: "/dashboard/files",    icon: "📁", label: "Files"    },
];

export default function DashboardNav({ profile }: { profile: any }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const roles: string[] = profile?.user_roles?.map((r: any) => r.role) ?? [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "community_admin", "group_admin"].includes(r)
  );

  useEffect(() => {
    loadNotifs();
    const ch = supabase
      .channel("notif-bell")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications",
          filter: `user_id=eq.${profile?.id}` },
        () => loadNotifs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  async function loadNotifs() {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs(data ?? []);
    setUnread((data ?? []).filter((n: any) => !n.read).length);
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    loadNotifs();
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true })
      .eq("user_id", profile?.id).eq("read", false);
    loadNotifs();
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{ background: "#2d6a2d", position: "sticky", top: 0, zIndex: 50, fontFamily: "Outfit, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px", display: "flex", alignItems: "center", height: 56, width: "100%", overflowX: "hidden" }}>

        <Link href="/dashboard"
          style={{ color: "white", fontWeight: 800, fontSize: 18, textDecoration: "none", marginRight: 16, flexShrink: 0 }}>
          🏘️ Akpu
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" }}>
          {NAV.map(({ href, icon, label }) => (
            <Link key={href} href={href}
              style={{ color: "white", textDecoration: "none", padding: "6px 10px", borderRadius: 8, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 44, flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              style={{ color: "white", background: "#6b3a1f", textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, marginLeft: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span style={{ fontSize: 10 }}>Admin</span>
            </Link>
          )}
        </div>

        {/* Right: notifications + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4, flexShrink: 0, position: "relative" }}>

          {/* Notification bell */}
          <button onClick={() => setShowNotifs(!showNotifs)}
            style={{ background: "none", border: "none", cursor: "pointer", position: "relative", color: "white", fontSize: 22, padding: 4 }}>
            🔔
            {unread > 0 && (
              <span style={{ position: "absolute", top: 0, right: 0, background: "#dc2626", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifs && (
            <div style={{ position: "fixed", top: 56, right: 8, width: "min(320px, calc(100vw - 16px))", background: "white", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", zIndex: 100, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#2d6a2d", fontSize: 14 }}>Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead}
                    style={{ background: "none", border: "none", color: "#2d6a2d", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  No notifications yet
                </div>
              )}
              {notifs.map((n) => (
                <div key={n.id}
                  onClick={() => { markRead(n.id); setShowNotifs(false); if (isAdmin) router.push("/admin/super"); }}
                  style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: n.read ? "white" : "#eaf5ea" }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: "#111827" }}>{n.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{n.body}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Avatar */}
          <Link href="/dashboard/settings">
            <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid white", objectFit: "cover", cursor: "pointer" }} />
          </Link>

          {/* Logout - desktop only */}
          <button onClick={handleLogout}
            className="hidden md:block"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            Out
          </button>
        </div>
      </div>
    </nav>
  );
}
