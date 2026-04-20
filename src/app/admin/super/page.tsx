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

export default function SuperAdminPage() {
  const [tab, setTab]           = useState("kyc");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [leaders, setLeaders]   = useState<any[]>([]);
  const [news, setNews]         = useState<any[]>([]);
  const [announces, setAnnounces] = useState<any[]>([]);
  const [gallery, setGallery]   = useState<any[]>([]);
  const [groups, setGroups]     = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [logs, setLogs]         = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [mapUploading, setMapUploading] = useState(false);
  const [mapPreview, setMapPreview] = useState("");

  const [leaderForm, setLeaderForm] = useState({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" });
  const [editLeader, setEditLeader] = useState<any>(null);
  const [newsForm, setNewsForm]     = useState({ title: "", body: "", image_url: "" });
  const [announce, setAnnounce]     = useState("");
  const [galleryForm, setGalleryForm] = useState({ type: "image", url: "", caption: "" });
  const [groupForm, setGroupForm]   = useState({ name: "", type: "age_grade", description: "" });

  const leaderImgRef = useRef<HTMLInputElement>(null);
  const newsImgRef   = useRef<HTMLInputElement>(null);
  const galleryRef   = useRef<HTMLInputElement>(null);
  const mapRef       = useRef<HTMLInputElement>(null);

  const pending = allUsers.filter((u) => u.status === "pending");
  const approved = allUsers.filter((u) => u.status !== "pending");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      // Load users via API route (bypasses RLS properly)
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      if (usersData.users) setAllUsers(usersData.users);
      else console.error("Users error:", usersData.error);

      // Load everything else
      const [l, n, a, g, gr, c, lo, s] = await Promise.all([
        supabase.from("leaders").select("*").is("deleted_at", null).order("sort_order"),
        supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery").select("*").is("deleted_at", null).order("sort_order"),
        supabase.from("groups").select("*").is("deleted_at", null).order("name"),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*, users(full_name)").order("created_at", { ascending: false }).limit(100),
        supabase.from("site_settings").select("key,value"),
      ]);

      setLeaders(l.data ?? []);
      setNews(n.data ?? []);
      setAnnounces(a.data ?? []);
      setGallery(g.data ?? []);
      setGroups(gr.data ?? []);
      setContacts(c.data ?? []);
      setLogs(lo.data ?? []);
      const sMap = Object.fromEntries((s.data ?? []).map((r: any) => [r.key, r.value]));
      setSettings(sMap);
      setMapPreview(sMap["map_image_url"] ?? "");
    } catch (err) {
      console.error("loadAll error:", err);
      toast.error("Failed to load data");
    }
  }

  async function userAction(userId: string, action: string, role?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Done!"); loadAll(); }
      else toast.error("Failed: " + (data.error ?? "Unknown"));
    } catch { toast.error("Network error"); }
    setLoading(false);
  }

  async function saveSetting(key: string, value: string) {
    const { error } = await supabase
      .from("site_settings").update({ value }).eq("key", key);
    if (error) toast.error(error.message);
    else toast.success("Saved!");
  }

  async function uploadImg(file: File, bucket: string): Promise<string> {
    const path = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  }

  async function uploadMapImage(file: File) {
    setMapUploading(true);
    try {
      const url = await uploadImg(file, "wallpapers");
      await saveSetting("map_image_url", url);
      setMapPreview(url);
    } catch (err: any) { toast.error(err.message); }
    setMapUploading(false);
  }

  async function saveLeader() {
    if (!leaderForm.name) return toast.error("Enter name");
    if (editLeader) {
      await supabase.from("leaders").update(leaderForm).eq("id", editLeader.id);
      toast.success("Updated!"); setEditLeader(null);
    } else {
      await supabase.from("leaders").insert(leaderForm);
      toast.success("Added!");
    }
    setLeaderForm({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" });
    loadAll();
  }

  async function deleteLeader(id: string) {
    await supabase.from("leaders").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Removed!"); loadAll();
  }

  async function saveNews() {
    if (!newsForm.title) return toast.error("Enter title");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("news").insert({ ...newsForm, created_by: user?.id });
    toast.success("Posted!"); setNewsForm({ title: "", body: "", image_url: "" }); loadAll();
  }

  async function deleteNews(id: string) {
    await supabase.from("news").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Deleted!"); loadAll();
  }

  async function saveAnnounce() {
    if (!announce.trim()) return toast.error("Enter text");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("announcements").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("announcements").insert({ text: announce, active: true, created_by: user?.id });
    toast.success("Published!"); setAnnounce(""); loadAll();
  }

  async function toggleAnnounce(id: string, active: boolean) {
    await supabase.from("announcements").update({ active: !active }).eq("id", id);
    loadAll();
  }

  async function deleteAnnounce(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("Deleted!"); loadAll();
  }

  async function saveGallery() {
    if (!galleryForm.url) return toast.error("Enter URL or upload image");
    await supabase.from("gallery").insert(galleryForm);
    toast.success("Added!"); setGalleryForm({ type: "image", url: "", caption: "" }); loadAll();
  }

  async function deleteGallery(id: string) {
    await supabase.from("gallery").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Removed!"); loadAll();
  }

  async function saveGroup() {
    if (!groupForm.name) return toast.error("Enter name");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("groups").insert({ ...groupForm, created_by: user?.id });
    toast.success("Created!"); setGroupForm({ name: "", type: "age_grade", description: "" }); loadAll();
  }

  async function deleteGroup(id: string) {
    await supabase.from("groups").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Deleted!"); loadAll();
  }

  async function copyList(items: string[], label: string) {
    await navigator.clipboard.writeText(items.filter(Boolean).join(", "));
    toast.success(`${label} copied!`);
  }

  const S: React.CSSProperties = {
    width: "100%", border: "1px solid #c8e6c9", borderRadius: 8,
    padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };
  const BG = { background: "#2d6a2d", color: "white", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" } as React.CSSProperties;
  const BB = { background: "#6b3a1f", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties;
  const BR = { background: "#dc2626", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties;
  const CARD = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>⚙️ Super Admin Dashboard</h1>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Akpu Community Platform</p>
        </div>
        <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
          {pending.length} pending KYC
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                background: tab === t.id ? "#2d6a2d" : "white",
                color: tab === t.id ? "white" : "#374151",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {t.icon} {t.label}
              {t.id === "kyc" && pending.length > 0 && (
                <span style={{ background: "#dc2626", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6, fontWeight: 700 }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── KYC APPROVALS ── */}
        {tab === "kyc" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", margin: 0 }}>
                Pending KYC Approvals ({pending.length})
              </h2>
              <button onClick={loadAll}
                style={{ ...BG, padding: "6px 14px", fontSize: 13 }}>
                🔄 Refresh
              </button>
            </div>

            {pending.length === 0 ? (
              <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
                <p style={{ fontSize: 40, margin: "0 0 8px" }}>✅</p>
                <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>No pending approvals</p>
                <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                  New member registrations will appear here when users complete KYC
                </p>
                <p style={{ color: "#9ca3af", fontSize: 12, margin: "8px 0 0" }}>
                  Total users in system: {allUsers.length}
                </p>
              </div>
            ) : (
              pending.map((u) => (
                <div key={u.id} style={CARD}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16, color: "#2d6a2d", margin: "0 0 6px" }}>
                        {u.full_name || "⚠️ KYC not yet submitted"}
                      </p>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📧 {u.email}</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📞 {u.phone || "Not provided"}</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>🏡 Village: {u.village || "Not submitted yet"}</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>👤 Sex: {u.sex || "Not submitted"}</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>🎂 DOB: {u.date_of_birth || "Not submitted"}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>
                        Registered: {new Date(u.created_at).toLocaleString()}
                      </p>
                      {!u.village && (
                        <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 6 }}>
                          ⏳ Awaiting KYC submission
                        </span>
                      )}
                      {u.village && (
                        <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 6 }}>
                          ✅ KYC submitted
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignSelf: "flex-start" }}>
                      <button onClick={() => userAction(u.id, "approve")} disabled={loading} style={BG}>
                        ✅ Approve
                      </button>
                      <button onClick={() => userAction(u.id, "reject")} disabled={loading} style={BR}>
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ALL USERS ── */}
        {tab === "users" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", margin: 0, flex: 1 }}>
                All Members ({allUsers.length})
              </h2>
              <button onClick={() => copyList(allUsers.filter(u => u.status === "approved").map(u => u.email), "Emails")} style={BG}>
                📋 Copy Emails
              </button>
              <button onClick={() => copyList(allUsers.filter(u => u.status === "approved" && u.phone).map(u => u.phone), "Phones")} style={BB}>
                📋 Copy Phones
              </button>
              <button onClick={loadAll} style={{ ...BG, padding: "8px 12px" }}>🔄</button>
            </div>
            {allUsers.map((u) => {
              const userRoles = u.user_roles?.map((r: any) => r.role) ?? [];
              return (
                <div key={u.id} style={CARD}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{u.full_name || u.email}</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>
                        {u.email} · {u.phone} · {u.village}
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                          background: u.status === "approved" ? "#dcfce7" : u.status === "pending" ? "#fef9c3" : "#fee2e2",
                          color: u.status === "approved" ? "#166534" : u.status === "pending" ? "#854d0e" : "#991b1b" }}>
                          {u.status}
                        </span>
                        {userRoles.map((r: string) => (
                          <span key={r} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#eaf5ea", color: "#2d6a2d", fontWeight: 600 }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {u.status === "pending" && (
                        <>
                          <button onClick={() => userAction(u.id, "approve")} disabled={loading} style={{ ...BG, fontSize: 12, padding: "6px 12px" }}>Approve</button>
                          <button onClick={() => userAction(u.id, "reject")} disabled={loading} style={{ ...BR, fontSize: 12, padding: "6px 12px" }}>Reject</button>
                        </>
                      )}
                      {u.status === "approved" && (
                        <button onClick={() => userAction(u.id, "suspend")} disabled={loading} style={{ ...BB, fontSize: 12, padding: "6px 12px" }}>Suspend</button>
                      )}
                      {u.status === "suspended" && (
                        <button onClick={() => userAction(u.id, "approve")} disabled={loading} style={{ ...BG, fontSize: 12, padding: "6px 12px" }}>Reinstate</button>
                      )}
                      <select onChange={(e) => { if (e.target.value) { userAction(u.id, "assign_role", e.target.value); e.target.value = ""; } }}
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
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 16, fontSize: 16 }}>
                {editLeader ? "✏️ Edit Leader" : "➕ Add Leader"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={leaderForm.name} onChange={(e) => setLeaderForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full Name *" style={S} />
                <input value={leaderForm.title} onChange={(e) => setLeaderForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Title / Position" style={S} />
                <select value={leaderForm.leader_type} onChange={(e) => setLeaderForm((p) => ({ ...p, leader_type: e.target.value }))} style={S}>
                  <option value="community">Community Leader</option>
                  <option value="political">Political Leader</option>
                  <option value="hall_of_fame">Hall of Fame</option>
                  <option value="past_pg">Past PG</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={leaderForm.photo_url} onChange={(e) => setLeaderForm((p) => ({ ...p, photo_url: e.target.value }))}
                    placeholder="Photo URL" style={{ ...S, flex: 1 }} />
                  <button onClick={() => leaderImgRef.current?.click()} style={BB}>📷</button>
                  <input ref={leaderImgRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await uploadImg(e.target.files[0], "leader-photos");
                        setLeaderForm((p) => ({ ...p, photo_url: url }));
                        toast.success("Uploaded!");
                      }
                    }} />
                </div>
              </div>
              <textarea value={leaderForm.bio} onChange={(e) => setLeaderForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Biography..." rows={3} style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              {leaderForm.photo_url && (
                <img src={leaderForm.photo_url} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: "2px solid #2d6a2d" }} />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveLeader} style={BG}>{editLeader ? "Update" : "Add Leader"}</button>
                {editLeader && <button onClick={() => { setEditLeader(null); setLeaderForm({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" }); }} style={BR}>Cancel</button>}
              </div>
            </div>
            {["community","political","hall_of_fame","past_pg"].map((type) => {
              const list = leaders.filter((l) => l.leader_type === type);
              if (!list.length) return null;
              const labels: Record<string,string> = { community: "Community Leaders", political: "Political Leaders", hall_of_fame: "Hall of Fame", past_pg: "Past Presidents General" };
              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  <h3 style={{ color: "#6b3a1f", fontWeight: 700, marginBottom: 10 }}>{labels[type]}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                    {list.map((l) => (
                      <div key={l.id} style={{ ...CARD, textAlign: "center", padding: 12 }}>
                        <img src={l.photo_url ?? "/avatar-placeholder.png"} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid #2d6a2d", marginBottom: 8 }} />
                        <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{l.name}</p>
                        <p style={{ fontSize: 12, color: "#6b3a1f", margin: "0 0 8px" }}>{l.title}</p>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => { setEditLeader(l); setLeaderForm({ name: l.name, title: l.title||"", bio: l.bio||"", leader_type: l.leader_type, photo_url: l.photo_url||"" }); setTab("leaders"); window.scrollTo(0,0); }} style={{ ...BB, fontSize: 11, padding: "4px 10px" }}>Edit</button>
                          <button onClick={() => deleteLeader(l.id)} style={{ ...BR, fontSize: 11, padding: "4px 10px" }}>Del</button>
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
                <textarea value={newsForm.body} onChange={(e) => setNewsForm((p) => ({ ...p, body: e.target.value }))} placeholder="Article..." rows={4} style={{ ...S, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => newsImgRef.current?.click()} style={BB}>📷 Upload Image</button>
                  <input ref={newsImgRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await uploadImg(e.target.files[0], "news-images");
                        setNewsForm((p) => ({ ...p, image_url: url }));
                        toast.success("Uploaded!");
                      }
                    }} />
                  {newsForm.image_url && <img src={newsForm.image_url} style={{ height: 40, borderRadius: 6 }} />}
                </div>
                <button onClick={saveNews} style={BG}>Publish News</button>
              </div>
            </div>
            {news.map((n) => (
              <div key={n.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>{new Date(n.created_at).toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }} className="line-clamp-2">{n.body}</p>
                </div>
                <button onClick={() => deleteNews(n.id)} style={{ ...BR, alignSelf: "flex-start" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {tab === "announce" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #6b3a1f" }}>
              <h3 style={{ fontWeight: 700, color: "#6b3a1f", marginBottom: 12 }}>📢 Set Announcement</h3>
              <textarea value={announce} onChange={(e) => setAnnounce(e.target.value)}
                placeholder="Type announcement..." rows={3} style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              <button onClick={saveAnnounce} style={BG}>Publish</button>
            </div>
            {announces.map((a) => (
              <div key={a.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>{a.text}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: a.active ? "#dcfce7" : "#f3f4f6", color: a.active ? "#166534" : "#6b7280" }}>
                    {a.active ? "● Active" : "Inactive"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleAnnounce(a.id, a.active)} style={{ ...BB, fontSize: 12 }}>
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => deleteAnnounce(a.id)} style={{ ...BR, fontSize: 12 }}>Delete</button>
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
                <input value={galleryForm.url} onChange={(e) => setGalleryForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="YouTube URL" style={{ ...S, marginBottom: 10 }} />
              ) : (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input value={galleryForm.url} onChange={(e) => setGalleryForm((p) => ({ ...p, url: e.target.value }))}
                    placeholder="Image URL or upload" style={{ ...S, flex: 1 }} />
                  <button onClick={() => galleryRef.current?.click()} style={BB}>📷 Upload</button>
                  <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await uploadImg(e.target.files[0], "gallery");
                        setGalleryForm((p) => ({ ...p, url }));
                        toast.success("Uploaded!");
                      }
                    }} />
                </div>
              )}
              {galleryForm.url && galleryForm.type === "image" && (
                <img src={galleryForm.url} style={{ height: 60, borderRadius: 6, marginBottom: 10 }} />
              )}
              <button onClick={saveGallery} style={BG}>Add to Gallery</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {gallery.map((g) => (
                <div key={g.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  {g.type === "image" ? (
                    <img src={g.url} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: 100, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>▶️</div>
                  )}
                  <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{g.caption || g.type}</span>
                    <button onClick={() => deleteGallery(g.id)} style={{ background: "#dc2626", color: "white", border: "none", padding: "2px 6px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>✕</button>
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
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>➕ Create Group / Age Grade / Umunna</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={groupForm.name} onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" style={S} />
                <select value={groupForm.type} onChange={(e) => setGroupForm((p) => ({ ...p, type: e.target.value }))} style={S}>
                  <option value="age_grade">Age Grade</option>
                  <option value="umunna">Umunna</option>
                  <option value="group">Group</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <input value={groupForm.description} onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)" style={{ ...S, marginBottom: 10 }} />
              <button onClick={saveGroup} style={BG}>Create</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {groups.map((g) => (
                <div key={g.id} style={CARD}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{g.name}</p>
                  <span style={{ fontSize: 11, background: "#eaf5ea", color: "#2d6a2d", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{g.type}</span>
                  {g.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 0" }}>{g.description}</p>}
                  <button onClick={() => deleteGroup(g.id)} style={{ ...BR, fontSize: 12, padding: "5px 10px", marginTop: 10 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>⚙️ Site Settings</h2>

            {/* MAP IMAGE UPLOAD */}
            <div style={CARD}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                🗺️ Location Map Image
              </label>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                Upload an image of Akpu Town map to display on the landing page.
              </p>
              <button onClick={() => mapRef.current?.click()} disabled={mapUploading}
                style={{ ...BB, marginBottom: 12 }}>
                {mapUploading ? "Uploading..." : "📤 Upload Map Image"}
              </button>
              <input ref={mapRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) uploadMapImage(e.target.files[0]); }} />
              {mapPreview ? (
                <img src={mapPreview} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, border: "2px solid #2d6a2d" }} />
              ) : (
                <div style={{ height: 100, background: "#eaf5ea", border: "2px dashed #2d6a2d", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#2d6a2d", fontSize: 14 }}>
                  No map uploaded yet
                </div>
              )}
            </div>

            {/* URL SETTINGS */}
            {[
              { key: "landing_video_url", label: "🎬 Landing Page YouTube URL" },
              { key: "tiktok_url",        label: "🎵 TikTok Profile URL" },
              { key: "facebook_url",      label: "👥 Facebook Page URL" },
              { key: "instagram_url",     label: "📸 Instagram Profile URL" },
              { key: "youtube_url",       label: "▶️ YouTube Channel URL" },
            ].map(({ key, label }) => (
              <div key={key} style={CARD}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>{label}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id={`s-${key}`} defaultValue={settings[key] ?? ""} placeholder="Enter URL..." style={{ ...S, flex: 1 }} />
                  <button onClick={() => { const el = document.getElementById(`s-${key}`) as HTMLInputElement; saveSetting(key, el.value); }} style={BG}>Save</button>
                </div>
              </div>
            ))}

            <div style={CARD}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>📝 About Akpu Text</label>
              <textarea id="s-about_text" defaultValue={settings["about_text"] ?? ""} rows={6} style={{ ...S, resize: "vertical", marginBottom: 10 }} />
              <button onClick={() => { const el = document.getElementById("s-about_text") as HTMLTextAreaElement; saveSetting("about_text", el.value); }} style={BG}>Save About Text</button>
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === "contacts" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", marginBottom: 16 }}>
              Contact Messages ({contacts.filter(c => !c.read).length} unread)
            </h2>
            {contacts.length === 0 && (
              <div style={{ ...CARD, textAlign: "center", padding: 40, color: "#6b7280" }}>No messages yet</div>
            )}
            {contacts.map((c) => (
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
                    <button onClick={async () => { await supabase.from("contact_messages").update({ read: true }).eq("id", c.id); loadAll(); }}
                      style={{ ...BG, fontSize: 12, alignSelf: "flex-start" }}>Mark Read</button>
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
            {logs.map((l) => (
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
