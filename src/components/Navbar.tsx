"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PUBLIC_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Media Gallery", href: "/gallery" },
  { label: "Age Grades", href: "/age-grades" },
  { label: "Umunna", href: "/umunna" },
  { label: "Past PGs", href: "/past-pgs" },
];

export default function Navbar({
  session,
  profile,
}: {
  session: any;
  profile?: { full_name: string; avatar_url?: string };
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-6">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-xl shrink-0"
        >
          🏘️ <span>Akpu</span>
        </Link>

        <div className="hidden md:flex gap-5 text-sm flex-1">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-primary-100 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {session ? (
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/dashboard" className="text-sm hover:text-primary-100">
              Dashboard
            </Link>
            <Link href="/dashboard/settings">
              <img
                src={profile?.avatar_url ?? "/avatar-placeholder.png"}
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary-dark transition"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex gap-2 ml-auto">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-md border border-white text-sm hover:bg-white hover:text-primary transition"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-1.5 rounded-md bg-secondary text-sm hover:bg-secondary-dark transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}