"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("announcements")
      .select("text")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setText(data?.text ?? null);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("announcements-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!text) return null;

  return (
    <div style={{
      background: "#6b3a1f",
      color: "white",
      padding: "10px 0",
      overflow: "hidden",
      whiteSpace: "nowrap",
    }}>
      <div style={{
        display: "inline-block",
        animation: "marquee 35s linear infinite",
        paddingLeft: "100%",
        fontSize: 14,
        fontWeight: 600,
      }}>
        📢 &nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 📢 &nbsp;&nbsp; {text}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
