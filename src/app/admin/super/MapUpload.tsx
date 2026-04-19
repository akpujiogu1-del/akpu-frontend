"use client";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function MapUpload({ currentUrl }: { currentUrl: string }) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `map/akpu-map-${Date.now()}.${file.name.split(".").pop()}`;
      const { data, error } = await supabase.storage
        .from("wallpapers").upload(path, file, { upsert: true });
      if (error) throw error;
      const url = supabase.storage
        .from("wallpapers").getPublicUrl(data.path).data.publicUrl;
      await supabase.from("site_settings")
        .update({ value: url }).eq("key", "map_image_url");
      setPreview(url);
      toast.success("Map image updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        🗺️ Location Map Image
      </label>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
        Upload an image of Akpu Town map. This displays on the landing page.
      </p>
      <button onClick={() => ref.current?.click()} disabled={uploading}
        style={{ background: "#6b3a1f", color: "white", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
        {uploading ? "Uploading..." : "📤 Upload Map Image"}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
      {preview && (
        <img src={preview} alt="Map"
          style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, border: "2px solid #2d6a2d" }} />
      )}
      {!preview && (
        <div style={{ height: 120, background: "#eaf5ea", borderRadius: 10, border: "2px dashed #2d6a2d", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d6a2d", fontSize: 14 }}>
          No map uploaded yet
        </div>
      )}
    </div>
  );
}
