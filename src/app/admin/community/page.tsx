"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function CommunityAdminPage() {
  const [tab, setTab] = useState("news");
  const [news, setNews] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", body: "", image_url: "" });
  const [announcement, setAnnouncement] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [n, a, c, u] = await Promise.all([
      supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
    ]);
    setNews(n.data ?? []);
    setAnnouncements(a.data ?? []);
    setContacts(c.data ?? []);
    setUsers(u.data ?? []);
  }

  async function postNews() {
    if (!newsForm.title) return toast.error("Enter title");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("news").insert({ ...newsForm, created_by: user?.id });
    if (error) toast.error(error.message);
    else { toast.success("News posted!"); setNewsForm({ title: "", body: "", image_url: "" }); loadAll(); }
    setLoading(false);
  }

  async function deleteNews(id: string) {
    await supabase.from("news").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Deleted!"); loadAll();
  }

  async function postAnnouncement() {
    if (!announcement) return toast.error("Enter announcement text");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("announcements").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("announcements").insert({ text: announcement, active: true, created_by: user?.id });
    toast.success("Announcement set!"); setAnnouncement(""); loadAll();
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    await supabase.from("announcements").update({ active: !active }).eq("id", id);
    loadAll();
  }

  async function markContactRead(id: string) {
    await supabase.from("contact_messages").update({ read: true }).eq("id", id);
    loadAll();
  }

  async function uploadNewsImage(file: File) {
    const path = `news/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from("news-images").upload(path, file);
    if (data) {
      const url = supabase.storage.from("news-images").getPublicUrl(data.path).data.publicUrl;
      setNewsForm(p => ({ ...p, image_url: url }));
      toast.success("Image uploaded!");
    }
  }

  async function suspendUser(userId: string) {
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_user_status",
        id: userId,
        data: { status: "suspended", comment_enabled: false },
      }),
    });
    const data = await res.json();
    if (data.error) toast.error(data.error);
    else { toast.success("User suspended"); loadAll(); }
  }

  async function reinstateUser(userId: string) {
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_user_status",
        id: userId,
        data: { status: "approved", comment_enabled: true },
      }),
    });
    const data = await res.json();
    if (data.error) toast.error(data.error);
    else { toast.success("User reinstated"); loadAll(); }
  }

  const TABS = ["news", "announcements", "contacts", "users"];

  const S: React.CSSProperties = {
    width: "100%", border: "1px solid #c8e6c9", borderRadius: 8,
    padding: "10px 14px", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const BG: React.CSSProperties = {
    background: "#2d6a2d", color: "white", border: "none",
    padding: "8px 16px", borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  const BR: React.CSSProperties = {
    background: "#dc2626", color: "white", border: "none",
    padding: "6px 12px", borderRadius: 8, fontSize: 12,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  const BB: React.CSSProperties = {
    background: "#6b3a1f", color: "white", border: "none",
    padding: "6px 12px", borderRadius: 8, fontSize: 12,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  const CARD: React.CSSProperties = {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: 16, marginBottom: 12,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 20px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🏛️ Community Admin Dashboard</h1>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", textTransform: "capitalize",
                background: tab === t ? "#2d6a2d" : "white",
                color: tab === t ? "white" : "#374151",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
              {t === "contacts"
                ? `Contacts (${contacts.filter(c => !c.read).length} Unread)`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* NEWS */}
        {tab === "news" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 14, fontSize: 15 }}>
                Post News Article
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={newsForm.title}
                  onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Headline *" style={S} />
                <textarea value={newsForm.body}
                  onChange={e => setNewsForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Article body..." rows={4}
                  style={{ ...S, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input ref={imageRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { if (e.target.files?.[0]) uploadNewsImage(e.target.files[0]); }} />
                  <button onClick={() => imageRef.current?.click()} style={BB}>
                    📷 Upload Image
                  </button>
                  {newsForm.image_url && (
                    <img src={newsForm.image_url} style={{ height: 40, borderRadius: 6 }} />
                  )}
                </div>
                <button onClick={postNews} disabled={loading} style={BG}>
                  {loading ? "Posting..." : "Post News"}
                </button>
              </div>
            </div>
            {news.map(n => (
              <div key={n.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                    {n.body?.slice(0, 100)}{n.body?.length > 100 ? "..." : ""}
                  </p>
                </div>
                <button onClick={() => deleteNews(n.id)} style={{ ...BR, alignSelf: "flex-start" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "announcements" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #6b3a1f" }}>
              <h3 style={{ fontWeight: 700, color: "#6b3a1f", marginBottom: 12, fontSize: 15 }}>
                Set Scrolling Announcement
              </h3>
              <textarea value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="Type announcement text..." rows={3}
                style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              <button onClick={postAnnouncement} style={BG}>
                Publish Announcement
              </button>
            </div>
            {announcements.map(a => (
              <div key={a.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>{a.text}</p>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: a.active ? "#dcfce7" : "#f3f4f6",
                    color: a.active ? "#166534" : "#6b7280",
                  }}>
                    {a.active ? "● Active" : "Inactive"}
                  </span>
                </div>
                <button onClick={() => toggleAnnouncement(a.id, a.active)}
                  style={{ ...BB, fontSize: 12 }}>
                  {a.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CONTACTS */}
        {tab === "contacts" && (
          <div>
            {contacts.length === 0 && (
              <div style={{ ...CARD, textAlign: "center", padding: 32, color: "#9ca3af" }}>
                No messages yet
              </div>
            )}
            {contacts.map(c => (
              <div key={c.id} style={{
                ...CARD,
                borderLeft: c.read ? "3px solid #e5e7eb" : "3px solid #6b3a1f",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: "0 0 2px" }}>
                      {c.name} → <span style={{ color: "#6b3a1f" }}>{c.recipient}</span>
                    </p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>
                      {c.email} · {c.phone}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{c.subject}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>{c.body}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!c.read && (
                    <button onClick={() => markContactRead(c.id)}
                      style={{ ...BG, fontSize: 12, alignSelf: "flex-start" }}>
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>
              All Members ({users.length})
            </h2>
            {users.map(u => (
              <div key={u.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>
                    {u.full_name || "Incomplete KYC"}
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>
                    {u.email} · {u.phone} · {u.village}
                  </p>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: u.status === "approved" ? "#dcfce7"
                      : u.status === "pending" ? "#fef9c3" : "#fee2e2",
                    color: u.status === "approved" ? "#166534"
                      : u.status === "pending" ? "#854d0e" : "#991b1b",
                  }}>
                    {u.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {u.status === "approved" && (
                    <button onClick={() => suspendUser(u.id)}
                      style={{ ...BB, fontSize: 12, padding: "5px 10px" }}>
                      Suspend
                    </button>
                  )}
                  {u.status === "suspended" && (
                    <button onClick={() => reinstateUser(u.id)}
                      style={{ ...BG, fontSize: 12, padding: "5px 10px" }}>
                      Reinstate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
