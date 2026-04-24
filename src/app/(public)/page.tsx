import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LandingClient from "@/components/LandingClient";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { data: rows } = await supabase.from("site_settings").select("key,value");
  const s: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
  const { data: leaders } = await supabase.from("leaders").select("*").is("deleted_at", null).order("sort_order");
  const { data: news } = await supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(4);

  const hallOfFame = leaders?.filter((l) => l.leader_type === "hall_of_fame") ?? [];
  const community  = leaders?.filter((l) => l.leader_type === "community")    ?? [];
  const political  = leaders?.filter((l) => l.leader_type === "political")    ?? [];
  const pastPGs    = leaders?.filter((l) => l.leader_type === "past_pg")      ?? [];

  return (
    <LandingClient
      session={session}
      settings={s}
      hallOfFame={hallOfFame}
      community={community}
      political={political}
      pastPGs={pastPGs}
      news={news ?? []}
    />
  );
}
