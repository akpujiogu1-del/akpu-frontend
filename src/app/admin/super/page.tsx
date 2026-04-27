"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const TABS = [
  { id: "kyc",      label: "KYC Approvals",   icon: "👤" },
  { id: "users",    label: "All Users",        icon: "👥" },
  { id: "leaders",  label: "Leaders",          icon: "🏛️" },
  { id: "news",     label: "News",             icon: "📰" },
  { id: "announce", label: "Announcements",    icon: "📢" },
  { id: "gallery",  label: "Media Gallery",    icon: "🖼️" },
  { id: "groups",   label: "Groups",           icon: "🏘️" },
  { id: "settings", label: "Site Settings",    icon: "⚙️" },
  { id: "contacts", label: "Contact Messages", icon: "✉️" },
  { id: "logs",     label: "Activity Logs",    icon: "📋" },
];

type AdminData = {
  users: any[]; leaders: any[]; news: any[]; announces: any[];
  gallery: any[]; groups: any[]; contacts: any[]; logs: any[];
  settings: Record<string, string>;
};

export default function SuperAdminPage() {
  const [tab, setTab]       = useState("kyc");
  const [data, setData]     = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [mapPreview, setMapPreview] = useState("");

  // Forms
  const [leaderForm, setLeaderForm] = useState({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" });
  const [editLeaderId, setEditLeaderId] = useState<string | null>(null);
  const [newsForm, setNewsForm]     = useState({ title: "", body: "", image_url: "" });
  const [announce, setAnnounce]     = useState("");
  const [galleryForm, setGalleryForm] = useState({ type: "image", url: "", caption: "" });
  const [groupForm, setGroupForm]   = useState({ name: "", type: "age_grade", description: "" });

  const leaderImgRef = useRef<HTMLInputElement>(null);
  const newsImgRef   = useRef<HTMLInputElement>(null);
  const galleryRef   = useRef<HTMLInputElement>(null);
  const mapRef       = useRef<HTMLInputElement>(null);

  const pending  = data?.users.filter((u) => u.status === "pending")  ?? [];
  const allUsers = data?.users ?? [];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setMapPreview(json.settings["map_image_url"] ?? "");
    } catch (err: any) {
      toast.error("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function action(payload: object) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success("Done!");
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImg(file: File, bucket: string): Promise<string> {
    const path = `${Date.now()}-${file.name}`;
    const { data: up, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(up.path).data.publicUrl;
  }

  async function uploadMapImage(file: File) {
    try {
      const url = await uploadImg(file, "wallpapers");
      await action({ action: "update_setting", data: { key: "map_image_url", value: url } });
      setMapPreview(url);
    } catch (err: any) { toast.error(err.message); }
  }

  async function saveLeader() {
    if (!leaderForm.name) return toast.error("Enter name");
    if (editLeaderId) {
      await action({ action: "update", table: "leaders", id: editLeaderId, data: leaderForm });
      setEditLeaderId(null);
    } else {
      await action({ action: "insert", table: "leaders", data: leaderForm });
    }
    setLeaderForm({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" });
  }

  async function saveNews() {
    if (!newsForm.title) return toast.error("Enter title");
    const { data: { user } } = await supabase.auth.getUser();
    await action({ action: "insert", table: "news", data: { ...newsForm, created_by: user?.id } });
    setNewsForm({ title: "", body: "", image_url: "" });
  }

  async function saveAnnounce() {
    if (!announce.trim()) return toast.error("Enter text");
    const { data: { user } } = await supabase.auth.getUser();
    // Deactivate all first
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", table: "announcements",
        data: { active: false }, id: "00000000-0000-0000-0000-000000000000" }),
    });
    await action({ action: "insert", table: "announcements",
      data: { text: announce, active: true, created_by: user?.id } });
    setAnnounce("");
  }

  async function saveGallery() {
    if (!galleryForm.url) return toast.error("Enter URL or upload");
    await action({ action: "insert", table: "gallery", data: galleryForm });
    setGalleryForm({ type: "image", url: "", caption: "" });
  }

  async function saveGroup() {
    if (!groupForm.name) return toast.error("Enter name");
    const { data: { user } } = await supabase.auth.getUser();
    await action({ action: "insert", table: "groups", data: { ...groupForm, created_by: user?.id } });
    setGroupForm({ name: "", type: "age_grade", description: "" });
  }

  async function saveSetting(key: string, value: string) {
    await action({ action: "update_setting", data: { key, value } });
  }

  async function approveUser(userId: string) {
    await action({ action: "update_user_status", id: userId, data: { status: "approved" } });
  }

  async function rejectUser(userId: string) {
    await action({ action: "update_user_status", id: userId, data: { status: "rejected" } });
  }

  async function suspendUser(userId: string) {
    await action({ action: "update_user_status", id: userId, data: { status: "suspended", comment_enabled: false } });
  }

  async function reinstateUser(userId: string) {
    await action({ action: "update_user_status", id: userId, data: { status: "approved", comment_enabled: true } });
  }

  async function assignRole(userId: string, role: string) {
    await action({ action: "assign_role", id: userId, data: { role } });
  }

  async function copyList(items: string[], label: string) {
    await navigator.clipboard.writeText(items.filter(Boolean).join(", "));
    toast.success(`${label} copied!`);
  }

  const S: React.CSSProperties = { width: "100%", border: "1px solid #c8e6c9", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const BG: React.CSSProperties = { background: "#2d6a2d", color: "white", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BB: React.CSSProperties = { background: "#6b3a1f", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BR: React.CSSProperties = { background: "#dc2626", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const CARD: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>⏳</p>
          <p style={{ color: "#2d6a2d", fontWeight: 700, fontSize: 16 }}>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>⚙️ Super Admin Dashboard</h1>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Akpu Community Platform</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            {pending.length} pending
          </span>
          <button onClick={loadData} style={{ ...BG, padding: "6px 12px", fontSize: 12 }}>🔄 Refresh</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                background: tab === t.id ? "#2d6a2d" : "white", color: tab === t.id ? "white" : "#374151",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {t.icon} {t.label}
              {t.id === "kyc" && pending.length > 0 && (
                <span style={{ background: "#dc2626", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── KYC ── */}
        {tab === "kyc" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>
              Pending KYC Approvals ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
                <p style={{ fontSize: 40, margin: "0 0 8px" }}>✅</p>
                <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>No pending approvals</p>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 8px" }}>New member registrations will appear here when users complete KYC</p>
                <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Total users in system: {allUsers.length}</p>
              </div>
            ) : pending.map((u) => (
              <div key={u.id} style={CARD}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: "#2d6a2d", margin: "0 0 6px" }}>
                      {u.full_name || "⚠️ KYC not yet submitted"}
                    </p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📧 {u.email}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📞 {u.phone || "Not provided"}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>🏡 {u.village || "Not submitted yet"}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>👤 {u.sex || "—"} · 🎂 {u.date_of_birth || "—"}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                      Registered: {new Date(u.created_at).toLocaleString()}
                    </p>
                    {!u.village
                      ? <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 6 }}>⏳ Awaiting KYC submission</span>
                      : <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 6 }}>✅ KYC submitted</span>
                    }
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignSelf: "flex-start" }}>
                    <button onClick={() => approveUser(u.id)} disabled={saving} style={BG}>✅ Approve</button>
                    <button onClick={() => rejectUser(u.id)} disabled={saving} style={BR}>❌ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ALL USERS ── */}
        {tab === "users" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", margin: 0, flex: 1 }}>
                All Members ({allUsers.length})
              </h2>
              <button onClick={() => copyList(allUsers.filter(u => u.status === "approved").map(u => u.email), "Emails")} style={BG}>📋 Copy Emails</button>
              <button onClick={() => copyList(allUsers.filter(u => u.status === "approved" && u.phone).map(u => u.phone), "Phones")} style={BB}>📋 Copy Phones</button>
            </div>
            {allUsers.map((u) => {
              const userRoles = u.user_roles?.map((r: any) => r.role) ?? [];
              return (
                <div key={u.id} style={CARD}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{u.full_name || u.email}</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{u.email} · {u.phone} · {u.village}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                          background: u.status === "approved" ? "#dcfce7" : u.status === "pending" ? "#fef9c3" : "#fee2e2",
                          color: u.status === "approved" ? "#166534" : u.status === "pending" ? "#854d0e" : "#991b1b" }}>
                          {u.status}
                        </span>
                        {userRoles.map((r: string) => (
                          <span key={r} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#eaf5ea", color: "#2d6a2d", fontWeight: 600 }}>{r}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {u.status === "pending" && <>
                        <button onClick={() => approveUser(u.id)} disabled={saving} style={{ ...BG, fontSize: 12, padding: "6px 12px" }}>Approve</button>
                        <button onClick={() => rejectUser(u.id)} disabled={saving} style={{ ...BR, fontSize: 12, padding: "6px 12px" }}>Reject</button>
                      </>}
                      {u.status === "approved" && (
                        <button onClick={() => suspendUser(u.id)} disabled={saving} style={{ ...BB, fontSize: 12, padding: "6px 12px" }}>Suspend</button>
                      )}
                      {u.status === "suspended" && (
                        <button onClick={() => reinstateUser(u.id)} disabled={saving} style={{ ...BG, fontSize: 12, padding: "6px 12px" }}>Reinstate</button>
                      )}
                      <select onChange={(e) => { if (e.target.value) { assignRole(u.id, e.target.value); e.target.value = ""; } }}
                        style={{ fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}>
                        <option value="">Assign Role</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="community_admin">Community Admin</option>
                        <option value="group_admin">Group Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LEADERS ── */}
        {tab === "leaders" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 14 }}>
                {editLeaderId ? "✏️ Edit Leader" : "➕ Add Leader"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={leaderForm.name} onChange={(e) => setLeaderForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full Name *" style={S} />
                <input value={leaderForm.title} onChange={(e) => setLeaderForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" style={S} />
                <select value={leaderForm.leader_type} onChange={(e) => setLeaderForm((p) => ({ ...p, leader_type: e.target.value }))} style={S}>
                  <option value="community">Community Leader</option>
                  <option value="political">Political Leader</option>
                  <option value="hall_of_fame">Hall of Fame</option>
                  <option value="past_pg">Past PG</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={leaderForm.photo_url} onChange={(e) => setLeaderForm((p) => ({ ...p, photo_url: e.target.value }))} placeholder="Photo URL" style={{ ...S, flex: 1 }} />
                  <button onClick={() => leaderImgRef.current?.click()} style={BB}>📷</button>
                  <input ref={leaderImgRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadImg(e.target.files[0], "leader-photos"); setLeaderForm((p) => ({ ...p, photo_url: url })); toast.success("Uploaded!"); } }} />
                </div>
              </div>
              <textarea value={leaderForm.bio} onChange={(e) => setLeaderForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Biography..." rows={3} style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              {leaderForm.photo_url && <img src={leaderForm.photo_url} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: "2px solid #2d6a2d" }} />}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveLeader} disabled={saving} style={BG}>{editLeaderId ? "Update" : "Add Leader"}</button>
                {editLeaderId && <button onClick={() => { setEditLeaderId(null); setLeaderForm({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" }); }} style={BR}>Cancel</button>}
              </div>
            </div>
            {["community","political","hall_of_fame","past_pg"].map((type) => {
              const list = (data?.leaders ?? []).filter((l) => l.leader_type === type);
              if (!list.length) return null;
              const labels: Record<string,string> = { community: "Community Leaders", political: "Political Leaders", hall_of_fame: "Hall of Fame", past_pg: "Past Presidents General" };
              return (
                <div key={type} style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#6b3a1f", fontWeight: 700, marginBottom: 10 }}>{labels[type]}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    {list.map((l) => (
                      <div key={l.id} style={{ ...CARD, textAlign: "center", padding: 12 }}>
                        <img src={l.photo_url ?? "/avatar-placeholder.png"} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #2d6a2d", marginBottom: 8 }} />
                        <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{l.name}</p>
                        <p style={{ fontSize: 12, color: "#6b3a1f", margin: "0 0 8px" }}>{l.title}</p>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => { setEditLeaderId(l.id); setLeaderForm({ name: l.name, title: l.title||"", bio: l.bio||"", leader_type: l.leader_type, photo_url: l.photo_url||"" }); setTab("leaders"); window.scrollTo(0,0); }} style={{ ...BB, fontSize: 11, padding: "4px 10px" }}>Edit</button>
                          <button onClick={() => action({ action: "delete", table: "leaders", id: l.id })} disabled={saving} style={{ ...BR, fontSize: 11, padding: "4px 10px" }}>Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── NEWS ── */}
        {tab === "news" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>➕ Post News</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={newsForm.title} onChange={(e) => setNewsForm((p) => ({ ...p, title: e.target.value }))} placeholder="Headline *" style={S} />
                <textarea value={newsForm.body} onChange={(e) => setNewsForm((p) => ({ ...p, body: e.target.value }))} placeholder="Article body..." rows={4} style={{ ...S, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => newsImgRef.current?.click()} style={BB}>📷 Upload Image</button>
                  <input ref={newsImgRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadImg(e.target.files[0], "news-images"); setNewsForm((p) => ({ ...p, image_url: url })); toast.success("Image ready!"); } }} />
                  {newsForm.image_url && <img src={newsForm.image_url} style={{ height: 36, borderRadius: 6 }} />}
                </div>
                <button onClick={saveNews} disabled={saving} style={BG}>Publish News</button>
              </div>
            </div>
            {(data?.news ?? []).map((n) => (
              <div key={n.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>{new Date(n.created_at).toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{n.body?.slice(0, 100)}{n.body?.length > 100 ? "..." : ""}</p>
                </div>
                <button onClick={() => action({ action: "delete", table: "news", id: n.id })} disabled={saving} style={{ ...BR, alignSelf: "flex-start" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {tab === "announce" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #6b3a1f" }}>
              <h3 style={{ fontWeight: 700, color: "#6b3a1f", marginBottom: 12 }}>📢 Set Announcement</h3>
              <textarea value={announce} onChange={(e) => setAnnounce(e.target.value)} placeholder="Type announcement text..." rows={3} style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              <button onClick={saveAnnounce} disabled={saving} style={BG}>Publish Announcement</button>
            </div>
            {(data?.announces ?? []).map((a) => (
              <div key={a.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>{a.text}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: a.active ? "#dcfce7" : "#f3f4f6", color: a.active ? "#166534" : "#6b7280" }}>
                    {a.active ? "● Active" : "Inactive"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => action({ action: "update", table: "announcements", id: a.id, data: { active: !a.active } })} disabled={saving} style={{ ...BB, fontSize: 12 }}>
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => action({ action: "hard_delete", table: "announcements", id: a.id })} disabled={saving} style={{ ...BR, fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GALLERY ── */}
        {tab === "gallery" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>🖼️ Add to Gallery</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <select value={galleryForm.type} onChange={(e) => setGalleryForm((p) => ({ ...p, type: e.target.value }))} style={S}>
                  <option value="image">Image</option>
                  <option value="video">YouTube Video</option>
                </select>
                <input value={galleryForm.caption} onChange={(e) => setGalleryForm((p) => ({ ...p, caption: e.target.value }))} placeholder="Caption" style={S} />
              </div>
              {galleryForm.type === "video" ? (
                <input value={galleryForm.url} onChange={(e) => setGalleryForm((p) => ({ ...p, url: e.target.value }))} placeholder="YouTube URL" style={{ ...S, marginBottom: 10 }} />
              ) : (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input value={galleryForm.url} onChange={(e) => setGalleryForm((p) => ({ ...p, url: e.target.value }))} placeholder="Image URL or upload" style={{ ...S, flex: 1 }} />
                  <button onClick={() => galleryRef.current?.click()} style={BB}>📷 Upload</button>
                  <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadImg(e.target.files[0], "gallery"); setGalleryForm((p) => ({ ...p, url })); toast.success("Uploaded!"); } }} />
                </div>
              )}
              {galleryForm.url && galleryForm.type === "image" && <img src={galleryForm.url} style={{ height: 60, borderRadius: 6, marginBottom: 10 }} />}
              <button onClick={saveGallery} disabled={saving} style={BG}>Add to Gallery</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {(data?.gallery ?? []).map((g) => (
                <div key={g.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  {g.type === "image"
                    ? <img src={g.url} style={{ width: "100%", height: 90, objectFit: "cover" }} />
                    : <div style={{ height: 90, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>▶️</div>
                  }
                  <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{g.caption || g.type}</span>
                    <button onClick={() => action({ action: "delete", table: "gallery", id: g.id })} disabled={saving} style={{ background: "#dc2626", color: "white", border: "none", padding: "2px 6px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GROUPS ── */}
        {tab === "groups" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>➕ Create Group</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={groupForm.name} onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" style={S} />
                <select value={groupForm.type} onChange={(e) => setGroupForm((p) => ({ ...p, type: e.target.value }))} style={S}>
                  <option value="age_grade">Age Grade</option>
                  <option value="umunna">Umunna</option>
                  <option value="group">Group</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <input value={groupForm.description} onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" style={{ ...S, marginBottom: 10 }} />
              <button onClick={saveGroup} disabled={saving} style={BG}>Create Group</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {(data?.groups ?? []).map((g) => (
                <div key={g.id} style={CARD}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{g.name}</p>
                  <span style={{ fontSize: 11, background: "#eaf5ea", color: "#2d6a2d", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{g.type}</span>
                  {g.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 0" }}>{g.description}</p>}
                  <button onClick={() => action({ action: "delete", table: "groups", id: g.id })} disabled={saving} style={{ ...BR, fontSize: 12, padding: "5px 10px", marginTop: 10 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>⚙️ Site Settings</h2>
            <div style={CARD}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>🗺️ Location Map Image</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="s-map_embed_url"
                  defaultValue={data?.settings["map_embed_url"] ?? ""}
                  placeholder="Paste Google Maps embed URL here..."
                  style={{ ...S, flex: 1 }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("s-map_embed_url") as HTMLInputElement;
                    saveSetting("map_embed_url", el.value);
                  }}
                  disabled={saving}
                  style={BG}>
                  Save
                </button>
              </div>
              {data?.settings["map_embed_url"] && (
                <iframe
                  src={data.settings["map_embed_url"]}
                  style={{ width: "100%", height: 160, borderRadius: 10, border: "2px solid #2d6a2d", marginTop: 10, display: "block" }}
                  loading="lazy"
                  title="Map Preview"
                />
              )}
            </div>
            {[
              { key: "landing_video_url", label: "🎬 Landing Page YouTube URL" },
              { key: "map_embed_url", label: "🗺️ Google Maps Embed URL" },
              { key: "tiktok_url",        label: "🎵 TikTok URL" },
              { key: "facebook_url",      label: "👥 Facebook URL" },
              { key: "instagram_url",     label: "📸 Instagram URL" },
              { key: "youtube_url",       label: "▶️ YouTube Channel URL" },
            ].map(({ key, label }) => (
              <div key={key} style={CARD}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>{label}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id={`s-${key}`} defaultValue={data?.settings[key] ?? ""} placeholder="Enter URL..." style={{ ...S, flex: 1 }} />
                  <button onClick={() => { const el = document.getElementById(`s-${key}`) as HTMLInputElement; saveSetting(key, el.value); }} disabled={saving} style={BG}>Save</button>
                </div>
              </div>
            ))}
            <div style={CARD}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>📝 About Akpu Text</label>
              <textarea id="s-about_text" defaultValue={data?.settings["about_text"] ?? ""} rows={5} style={{ ...S, resize: "vertical", marginBottom: 10 }} />
              <button onClick={() => { const el = document.getElementById("s-about_text") as HTMLTextAreaElement; saveSetting("about_text", el.value); }} disabled={saving} style={BG}>Save About Text</button>
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === "contacts" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>
              Contact Messages ({(data?.contacts ?? []).filter(c => !c.read).length} unread)
            </h2>
            {(data?.contacts ?? []).map((c) => (
              <div key={c.id} style={{ ...CARD, borderLeft: c.read ? "3px solid #e5e7eb" : "3px solid #6b3a1f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{c.name} → <span style={{ color: "#6b3a1f" }}>{c.recipient}</span></p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{c.email} · {c.phone}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{c.subject}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>{c.body}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  {!c.read && (
                    <button onClick={() => action({ action: "update", table: "contact_messages", id: c.id, data: { read: true } })} disabled={saving} style={{ ...BG, fontSize: 12, alignSelf: "flex-start" }}>Mark Read</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>Activity Logs</h2>
            {(data?.logs ?? []).map((l) => (
              <div key={l.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 14px" }}>
                <div>
                  <span style={{ fontWeight: 600, color: "#2d6a2d" }}>{(l.users as any)?.full_name ?? "System"}</span>
                  <span style={{ color: "#6b7280", marginLeft: 8 }}>{l.action}</span>
                  {l.target_type && <span style={{ color: "#9ca3af", marginLeft: 8 }}>→ {l.target_type}</span>}
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
