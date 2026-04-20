"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VILLAGES } from "@/lib/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles]     = useState<string[]>([]);
  const [form, setForm] = useState({
    full_name: "", phone: "", date_of_birth: "", sex: "", village: "",
  });
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (p) {
      setProfile(p);
      setForm({
        full_name:     p.full_name     ?? "",
        phone:         p.phone         ?? "",
        date_of_birth: p.date_of_birth ?? "",
        sex:           p.sex           ?? "",
        village:       p.village       ?? "",
      });
    }
    setRoles(r?.map((x) => x.role) ?? []);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("users")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
      toast.success("Profile updated!");
      loadProfile();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
      const { data } = await supabase.storage
        .from("avatars").upload(path, file, { upsert: true });
      if (data) {
        const url = supabase.storage
          .from("avatars").getPublicUrl(data.path).data.publicUrl;
        await supabase.from("users")
          .update({ avatar_url: url }).eq("id", user!.id);
        setProfile((p: any) => ({ ...p, avatar_url: url }));
        toast.success("Photo updated!");
      }
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  const primaryRole = roles.includes("super_admin")
    ? "Super Admin"
    : roles.includes("community_admin")
    ? "Community Admin"
    : roles.includes("group_admin")
    ? "Group Admin"
    : "Community Member";

  const roleColor = roles.includes("super_admin")
    ? { bg: "#eaf5ea", color: "#2d6a2d", border: "#c8e6c9" }
    : roles.includes("community_admin")
    ? { bg: "#fff3e0", color: "#e65100", border: "#ffe0b2" }
    : { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1.5px solid #c8e6c9", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", fontFamily: "Outfit, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
        Account Settings
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
        Manage your identity and preferences in the Akpu Portal.
      </p>

      {/* Profile card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 16, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <img
            src={profile?.avatar_url ?? "/avatar-placeholder.png"}
            style={{ width: 96, height: 96, borderRadius: 20, objectFit: "cover", border: "3px solid #2d6a2d" }}
          />
          <button
            onClick={() => avatarRef.current?.click()}
            style={{ position: "absolute", bottom: -4, right: -4, background: "#2d6a2d", border: "2px solid white", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            📷
          </button>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
        </div>

        <p style={{ fontWeight: 800, fontSize: 18, margin: "0 0 4px", color: "#111827" }}>
          {profile?.full_name || profile?.email || "Loading..."}
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 12px" }}>
          {profile?.email}
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
            background: roleColor.bg, color: roleColor.color, border: `1px solid ${roleColor.border}`,
          }}>
            {primaryRole}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
            background: profile?.status === "approved" ? "#dcfce7" : "#fef9c3",
            color: profile?.status === "approved" ? "#166534" : "#854d0e",
            border: profile?.status === "approved" ? "1px solid #bbf7d0" : "1px solid #fde68a",
          }}>
            ● {(profile?.status ?? "loading").toUpperCase()}
          </span>
        </div>

        {uploading && (
          <p style={{ fontSize: 12, color: "#2d6a2d", margin: "8px 0 0" }}>
            Uploading photo...
          </p>
        )}
      </div>

      {/* Edit form */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>
          Edit Profile
        </h2>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name</label>
            <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Phone Number</label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Sex</label>
            <select value={form.sex} onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))} style={inputStyle}>
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Village</label>
            <select value={form.village} onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))} style={inputStyle}>
              <option value="">-- Select --</option>
              {VILLAGES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ background: loading ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6b3a1f", marginBottom: 14 }}>Account Info</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Email",        value: profile?.email },
            { label: "Village",      value: profile?.village || "Not set" },
            { label: "Role",         value: primaryRole },
            { label: "Status",       value: profile?.status },
            { label: "Member since", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
              <span style={{ color: "#6b7280" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div style={{ background: "#1a2e1a", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#4a9e4a", margin: "0 0 8px", textTransform: "uppercase" }}>
          Security Notice
        </p>
        <p style={{ fontSize: 13, color: "#a5c8a5", margin: 0, lineHeight: 1.5 }}>
          Only verified members can participate in Umunna groups and view community files. Keep your profile updated to ensure uninterrupted access.
        </p>
      </div>
    </div>
  );
}
