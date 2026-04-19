"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface Props {
  settings: Record<string, string>;
}

export default function SettingsTab({ settings }: Props) {
  const [mapPreview, setMapPreview] = useState(settings["map_image_url"] ?? "");
  const mapImgRef = useRef<HTMLInputElement>(null);

  const inputStyle = {
    width: "100%", border: "1px solid #c8e6c9", borderRadius: 8,
    padding: "10px 14px", fontSize: 14, outline: "none",
  };
  const btnGreen = {
    background: "#2d6a2d", color: "white", border: "none",
    padding: "10px 20px", borderRadius: 8, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  };
  const btnBrown = {
    background: "#6b3a1f", color: "white", border: "none",
    padding: "10px 16px", borderRadius: 8, fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  };
  const card = {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: 16, marginBottom: 12,
  };

  async function saveSetting(key: string, value: string) {
    await supabase.from("site_settings").update({ value }).eq("key", key);
    toast.success("Saved!");
  }

  async function uploadMapImage(file: File) {
    const path = `map-${Date.now()}.${file.name.split(".").pop()}`;
    const { data } = await supabase.storage.from("wallpapers").upload(path, file, { upsert: true });
    if (!data) return toast.error("Upload failed");
    const url = supabase.storage.from("wallpapers").getPublicUrl(data.path).data.publicUrl;
    await saveSetting("map_image_url", url);
    setMapPreview(url);
    toast.success("Map image uploaded!");
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>
        ⚙️ Site Settings
      </h2>

      {/* Map Image Upload */}
      <div style={card}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
          🗺️ Location Map Image
        </label>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
          Upload an image of the Akpu Town map to display on the landing page.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => mapImgRef.current?.click()} style={btnBrown}>
            📤 Upload Map Image
          </button>
          <input ref={mapImgRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) uploadMapImage(e.target.files[0]); }} />
        </div>
        {mapPreview && (
          <img src={mapPreview} alt="Map preview"
            style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, border: "2px solid #2d6a2d" }} />
        )}
      </div>

      {/* Video URL */}
      {[
        { key: "landing_video_url", label: "🎬 Landing Page YouTube URL" },
        { key: "tiktok_url",        label: "🎵 TikTok Profile URL" },
        { key: "facebook_url",      label: "👥 Facebook Page URL" },
        { key: "instagram_url",     label: "📸 Instagram Profile URL" },
        { key: "youtube_url",       label: "▶️ YouTube Channel URL" },
      ].map(({ key, label }) => (
        <div key={key} style={card}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {label}
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id={`s-${key}`} defaultValue={settings[key] ?? ""}
              placeholder="Enter URL..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => {
              const el = document.getElementById(`s-${key}`) as HTMLInputElement;
              saveSetting(key, el.value);
            }} style={btnGreen}>Save</button>
          </div>
        </div>
      ))}

      {/* About text */}
      <div style={card}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
          📝 About Akpu Text
        </label>
        <textarea id="s-about_text" defaultValue={settings["about_text"] ?? ""}
          rows={6} style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
        <button onClick={() => {
          const el = document.getElementById("s-about_text") as HTMLTextAreaElement;
          saveSetting("about_text", el.value);
        }} style={btnGreen}>Save About Text</button>
      </div>
    </div>
  );
}
