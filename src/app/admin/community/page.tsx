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
  const [files, setFiles] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [adverts, setAdverts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", body: "", image_url: "" });
  const [announcement, setAnnouncement] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], ends_at: "" });
  const [advertForm, setAdvertForm] = useState({ subject: "", body: "", image_url: "" });
  const [fileForm, setFileForm] = useState({ name: "", password: "" });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [advertImg, setAdvertImg] = useState<string>("");
  const newsImgRef = useRef<HTMLInputElement>(null);
  const advertImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [n, a, c, u, f, p, adv, s] = await Promise.all([
      supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("files").select("*").is("deleted_at", null).is("group_id", null).order("created_at", { ascending: false }),
      supabase.from("polls").select("*").is("deleted_at", null).is("group_id", null).order("created_at", { ascending: false }),
      supabase.from("groups").select("*").eq("type", "advert").is("deleted_at", null),
      supabase.from("site_settings").select("key,value").eq("key", "landing_video_url"),
    ]);
    setNews(n.data ?? []);
    setAnnouncements(a.data ?? []);
    setContacts(c.data ?? []);
    setUsers(u.data ?? []);
    setFiles(f.data ?? []);
    setPolls(p.data ?? []);
    setAdverts(adv.data ?? []);
    const ytRow = s.data?.find((r: any) => r.key === "landing_video_url");
    setYoutubeUrl(ytRow?.value ?? "");
  }

  async function callAction(payload: object) {
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function postNews() {
    if (!newsForm.title) return toast.error("Enter title");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await callAction({ action: "insert", table: "news", data: { ...newsForm, created_by: user?.id } });
      toast.success("News posted!"); setNewsForm({ title: "", body: "", image_url: "" }); loadAll();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  async function deleteNews(id: string) {
    await callAction({ action: "delete", table: "news", id });
    toast.success("Deleted!"); loadAll();
  }

  async function postAnnouncement() {
    if (!announcement) return toast.error("Enter announcement");
    const { data: { user } } = await supabase.auth.getUser();
    await callAction({ action: "deactivate_announcements", table: "announcements", data: {}, id: "" });
    await callAction({ action: "insert", table: "announcements", data: { text: announcement, active: true, created_by: user?.id } });
    toast.success("Announcement set!"); setAnnouncement(""); loadAll();
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    await callAction({ action: "update", table: "announcements", id, data: { active: !active } });
    loadAll();
  }

  async function saveYoutube() {
    await callAction({ action: "update_setting", data: { key: "landing_video_url", value: youtubeUrl } });
    toast.success("YouTube URL saved!"); loadAll();
  }

  async function createPoll() {
    const validOpts = pollForm.options.filter(o => o.trim());
    if (!pollForm.question || validOpts.length < 2 || !pollForm.ends_at) {
      return toast.error("Question, 2+ options and deadline required");
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await callAction({ action: "insert", table: "polls", data: {
        created_by: user?.id,
        question: pollForm.question,
        options: validOpts.map((text, i) => ({ id: String(i), text })),
        ends_at: new Date(pollForm.ends_at).toISOString(),
        group_id: null,
      }});
      toast.success("Poll published!"); setPollForm({ question: "", options: ["", ""], ends_at: "" }); loadAll();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  async function uploadNewsImg(file: File) {
    const path = `news/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from("news-images").upload(path, file);
    if (data) {
      const url = supabase.storage.from("news-images").getPublicUrl(data.path).data.publicUrl;
      setNewsForm(p => ({ ...p, image_url: url }));
      toast.success("Image uploaded!");
    }
  }

  async function uploadAdvertImg(file: File) {
    const path = `adverts/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from("post-images").upload(path, file);
    if (data) {
      const url = supabase.storage.from("post-images").getPublicUrl(data.path).data.publicUrl;
      setAdvertImg(url); toast.success("Image uploaded!");
    }
  }

  async function publishAdvert() {
    if (!advertForm.subject) return toast.error("Enter subject");
    await callAction({ action: "insert", table: "groups", data: {
      name: advertForm.subject, description: advertForm.body,
      type: "advert", avatar_url: advertImg,
    }});
    toast.success("Advert published!"); setAdvertForm({ subject: "", body: "", image_url: "" }); setAdvertImg(""); loadAll();
  }

  async function deleteAdvert(id: string) {
    await callAction({ action: "delete", table: "groups", id });
    toast.success("Deleted!"); loadAll();
  }

  async function uploadDoc() {
    if (!fileToUpload || !fileForm.name || !fileForm.password) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `community/${Date.now()}-${fileToUpload.name}`;
      const { data: up } = await supabase.storage.from("group-files").upload(path, fileToUpload);
      if (!up) throw new Error("Upload failed");
      const hashRes = await fetch("/api/hash-password", { method: "POST", body: JSON.stringify({ password: fileForm.password }) });
      const { hash } = await hashRes.json();
      await callAction({ action: "insert", table: "files", data: {
        uploaded_by: user?.id, name: fileForm.name, storage_path: up.path, password_hash: hash, group_id: null,
      }});
      toast.success("Document uploaded!"); setFileForm({ name: "", password: "" }); setFileToUpload(null); loadAll();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  async function suspendUser(userId: string) {
    try { await callAction({ action: "update_user_status", id: userId, data: { status: "suspended" } }); toast.success("Suspended"); loadAll(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function reinstateUser(userId: string) {
    try { await callAction({ action: "update_user_status", id: userId, data: { status: "approved" } }); toast.success("Reinstated"); loadAll(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function markRead(id: string) {
    await callAction({ action: "update", table: "contact_messages", id, data: { read: true } });
    loadAll();
  }

  const TABS = [
    { id: "news", label: "News" },
    { id: "announcements", label: "Announcements" },
    { id: "youtube", label: "YouTube URL" },
    { id: "polls", label: "Polls" },
    { id: "adverts", label: "Adverts" },
    { id: "documents", label: "Documents" },
    { id: "contacts", label: `Contacts (${contacts.filter(c => !c.read).length} Unread)` },
    { id: "users", label: "Users" },
  ];

  const S: React.CSSProperties = { width: "100%", border: "1px solid #c8e6c9", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const BG: React.CSSProperties = { background: "#2d6a2d", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BB: React.CSSProperties = { background: "#6b3a1f", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BR: React.CSSProperties = { background: "#dc2626", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const CARD: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 20px" }}>
        <div>
        <button onClick={() => window.location.href="/dashboard"}
          style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, marginBottom: 6, display: "inline-block" }}>
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🏛️ Community Admin Dashboard</h1>
      </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: tab === t.id ? "#2d6a2d" : "white", color: tab === t.id ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* NEWS */}
        {tab === "news" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 15 }}>Post News Article</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))} placeholder="Headline *" style={S} />
                <textarea value={newsForm.body} onChange={e => setNewsForm(p => ({ ...p, body: e.target.value }))} placeholder="Article body..." rows={4} style={{ ...S, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => newsImgRef.current?.click()} style={BB}>📷 Upload Image</button>
                  <input ref={newsImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadNewsImg(e.target.files[0]); }} />
                  {newsForm.image_url && <img src={newsForm.image_url} style={{ height: 40, borderRadius: 6 }} />}
                </div>
                <button onClick={postNews} disabled={loading} style={BG}>{loading ? "Posting..." : "Post News"}</button>
              </div>
            </div>
            {news.map(n => (
              <div key={n.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>{new Date(n.created_at).toLocaleString()}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{n.body?.slice(0, 100)}...</p>
                </div>
                <button onClick={() => deleteNews(n.id)} style={{ ...BR, alignSelf: "flex-start" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "announcements" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #6b3a1f" }}>
              <h3 style={{ fontWeight: 700, color: "#6b3a1f", marginBottom: 12, fontSize: 15 }}>Set Scrolling Announcement</h3>
              <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Type announcement..." rows={3} style={{ ...S, marginBottom: 10, resize: "vertical" }} />
              <button onClick={postAnnouncement} style={BG}>Publish</button>
            </div>
            {announcements.map(a => (
              <div key={a.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>{a.text}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: a.active ? "#dcfce7" : "#f3f4f6", color: a.active ? "#166534" : "#6b7280" }}>
                    {a.active ? "● Active" : "Inactive"}
                  </span>
                </div>
                <button onClick={() => toggleAnnouncement(a.id, a.active)} style={{ ...BB, fontSize: 12 }}>
                  {a.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* YOUTUBE */}
        {tab === "youtube" && (
          <div style={CARD}>
            <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 15 }}>🎬 Landing Page YouTube URL</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>This video appears on the landing page hero section.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ ...S, flex: 1 }} />
              <button onClick={saveYoutube} style={BG}>Save</button>
            </div>
          </div>
        )}

        {/* POLLS */}
        {tab === "polls" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 15 }}>Create Community Poll</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={pollForm.question} onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))} placeholder="Poll question *" style={S} />
                {pollForm.options.map((opt, i) => (
                  <input key={i} value={opt} onChange={e => { const o = [...pollForm.options]; o[i] = e.target.value; setPollForm(p => ({ ...p, options: o })); }} placeholder={`Option ${i + 1}`} style={S} />
                ))}
                <button onClick={() => setPollForm(p => ({ ...p, options: [...p.options, ""] }))}
                  style={{ background: "none", border: "none", color: "#2d6a2d", fontSize: 13, cursor: "pointer", textAlign: "left", fontWeight: 600, padding: 0 }}>
                  + Add Option
                </button>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Closing Date</label>
                  <input type="datetime-local" value={pollForm.ends_at} onChange={e => setPollForm(p => ({ ...p, ends_at: e.target.value }))} style={S} />
                </div>
                <button onClick={createPoll} disabled={loading} style={BG}>{loading ? "Publishing..." : "Publish Poll"}</button>
              </div>
            </div>
            {polls.map(p => (
              <div key={p.id} style={CARD}>
                <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{p.question}</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Ends: {new Date(p.ends_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* ADVERTS */}
        {tab === "adverts" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 15 }}>📣 Create Advert</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={advertForm.subject} onChange={e => setAdvertForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject / Title *" style={S} />
                <textarea value={advertForm.body} onChange={e => setAdvertForm(p => ({ ...p, body: e.target.value }))} placeholder="Advert write-up..." rows={4} style={{ ...S, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => advertImgRef.current?.click()} style={BB}>📷 Upload Image</button>
                  <input ref={advertImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadAdvertImg(e.target.files[0]); }} />
                  {advertImg && <img src={advertImg} style={{ height: 48, borderRadius: 8 }} />}
                </div>
                <button onClick={publishAdvert} style={BG}>Publish Advert</button>
              </div>
            </div>
            {adverts.map(a => (
              <div key={a.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{a.name}</p>
                  {a.description && <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{a.description}</p>}
                </div>
                <button onClick={() => deleteAdvert(a.id)} style={{ ...BR, alignSelf: "flex-start" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div>
            <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
              <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 15 }}>📁 Upload Community Document</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={fileForm.name} onChange={e => setFileForm(p => ({ ...p, name: e.target.value }))} placeholder="Document title *" style={S} />
                <input type="password" value={fileForm.password} onChange={e => setFileForm(p => ({ ...p, password: e.target.value }))} placeholder="Set protection password *" style={S} />
                <div style={{ border: "2px dashed #c8e6c9", borderRadius: 10, padding: 20, textAlign: "center", position: "relative", cursor: "pointer" }}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFileToUpload(e.target.files?.[0] ?? null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  <p style={{ fontSize: 13, color: fileToUpload ? "#2d6a2d" : "#9ca3af", fontWeight: 600 }}>
                    {fileToUpload ? `✅ ${fileToUpload.name}` : "Select PDF or Document"}
                  </p>
                </div>
                <button onClick={uploadDoc} disabled={loading || !fileToUpload} style={BG}>
                  {loading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
            {files.map(f => (
              <div key={f.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, margin: "0 0 2px" }}>📄 {f.name}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(f.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTACTS */}
        {tab === "contacts" && (
          <div>
            {contacts.length === 0 && <div style={{ ...CARD, textAlign: "center", padding: 32, color: "#9ca3af" }}>No messages yet</div>}
            {contacts.map(c => (
              <div key={c.id} style={{ ...CARD, borderLeft: c.read ? "3px solid #e5e7eb" : "3px solid #6b3a1f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{c.name} → <span style={{ color: "#6b3a1f" }}>{c.recipient}</span></p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{c.email} · {c.phone}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{c.subject}</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>{c.body}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  {!c.read && <button onClick={() => markRead(c.id)} style={{ ...BG, fontSize: 12, alignSelf: "flex-start" }}>Mark Read</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", marginBottom: 12 }}>All Members ({users.length})</h2>
            {users.map(u => (
              <div key={u.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>{u.full_name || "Incomplete KYC"}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{u.email} · {u.phone} · {u.village}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: u.status === "approved" ? "#dcfce7" : u.status === "pending" ? "#fef9c3" : "#fee2e2", color: u.status === "approved" ? "#166534" : u.status === "pending" ? "#854d0e" : "#991b1b" }}>
                    {u.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {u.status === "approved" && <button onClick={() => suspendUser(u.id)} style={{ ...BB, fontSize: 12, padding: "5px 10px" }}>Suspend</button>}
                  {u.status === "suspended" && <button onClick={() => reinstateUser(u.id)} style={{ ...BG, fontSize: 12, padding: "5px 10px" }}>Reinstate</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
