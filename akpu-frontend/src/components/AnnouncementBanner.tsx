"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("text")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setText(data?.text ?? null));

    const channel = supabase
      .channel("announcements-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          supabase
            .from("announcements")
            .select("text")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => setText(data?.text ?? null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!text) return null;

  return (
    <div className="bg-secondary text-white py-2 overflow-hidden whitespace-nowrap">
      <span className="inline-block animate-marquee text-sm font-medium">
        📢 &nbsp; {text} &nbsp;&nbsp;&nbsp; 📢 &nbsp; {text}
      </span>
    </div>
  );
}