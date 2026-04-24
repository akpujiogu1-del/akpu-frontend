"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("announcements")
      .select("text")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data?.text) setText(data.text);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("announce-live")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
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
        paddingLeft: "100%",
        animation: "marquee 30s linear infinite",
        fontSize: 14,
        fontWeight: 600,
      }}>
        📢 &nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp;&nbsp; 📢 &nbsp;&nbsp; {text}
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
