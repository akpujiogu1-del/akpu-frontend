"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const PUBLIC_LINKS = [
  { label: "About",         href: "/about" },
  { label: "Contact Us",    href: "/contact" },
  { label: "Media Gallery", href: "/gallery" },
  { label: "Age Grades",    href: "/age-grades" },
  { label: "Umunna",        href: "/umunna" },
  { label: "Past PGs",      href: "/past-pgs" },
];

export default function Navbar({ session, profile }: {
  session: any;
  profile?: { full_name?: string; avatar_url?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{ background: "#2d6a2d", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}
        className="flex items-center justify-between h-16">

        {/* Logo */}
        <Link href={session ? "/dashboard" : "/"}
          style={{ color: "white", fontWeight: 800, fontSize: 20, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          🏘️ Akpu
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 flex-1 ml-8">
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              style={{ color: "white", textDecoration: "none", fontSize: 14, opacity: 0.9 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard"
                style={{ color: "white", fontSize: 14, textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/dashboard/settings">
                <img
                  src={profile?.avatar_url ?? "/avatar-placeholder.png"}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid white", objectFit: "cover" }}
                />
              </Link>
              <button onClick={handleLogout}
                style={{ background: "#6b3a1f", color: "white", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login"
                style={{ color: "white", border: "1px solid white", padding: "6px 16px", borderRadius: 8, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
                Login
              </Link>
              <Link href="/auth/register"
                style={{ background: "#6b3a1f", color: "white", padding: "6px 16px", borderRadius: 8, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden"
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 26, padding: 4 }}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: "#1a4a1a", borderTop: "1px solid rgba(255,255,255,0.1)" }}
          className="md:hidden">
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                style={{ color: "white", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, display: "block" }}>
                {l.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 8, paddingTop: 8 }}>
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}
                    style={{ color: "white", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, display: "block" }}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setOpen(false)}
                    style={{ color: "white", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, display: "block" }}>
                    Settings
                  </Link>
                  <button onClick={() => { setOpen(false); handleLogout(); }}
                    style={{ color: "white", background: "#6b3a1f", border: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, cursor: "pointer", width: "100%", textAlign: "left", marginTop: 4 }}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setOpen(false)}
                    style={{ color: "white", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, display: "block" }}>
                    Login
                  </Link>
                  <Link href="/auth/register" onClick={() => setOpen(false)}
                    style={{ color: "#6b3a1f", background: "white", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 15, display: "block", fontWeight: 700, marginTop: 4 }}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
