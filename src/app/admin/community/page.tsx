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
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", body: "", image_url: "" });
  const [announcement, setAnnouncement] = useState("");
  const [leaderForm, setLeaderForm] = useState({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" });
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: n } = await supabase.from("news").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    const { data: a } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    const { data: c } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    const { data: u } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    const { data: l } = await supabase.from("leaders").select("*").is("deleted_at", null).order("sort_order");
    setNews(n ?? []); setAnnouncements(a ?? []); setContacts(c ?? []); setUsers(u ?? []); setLeaders(l ?? []);
  }

  async function postNews() {
    if (!newsForm.title) return toast.error("Enter title");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("news").insert({ ...newsForm, created_by: user?.id });
    toast.success("News posted!"); setNewsForm({ title: "", body: "", image_url: "" }); loadAll();
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

  async function addLeader() {
    if (!leaderForm.name) return toast.error("Enter leader name");
    await supabase.from("leaders").insert(leaderForm);
    toast.success("Leader added!"); setLeaderForm({ name: "", title: "", bio: "", leader_type: "community", photo_url: "" }); loadAll();
  }

  async function deleteLeader(id: string) {
    await supabase.from("leaders").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Removed!"); loadAll();
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

  const TABS = ["news", "announcements", "leaders", "contacts", "users"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-6 py-4">
        <h1 className="text-xl font-bold">🏛️ Community Admin Dashboard</h1>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-primary text-white" : "bg-white border hover:bg-primary-50 text-gray-600"}`}>
              {t === "contacts" ? `Contacts (${contacts.filter(c => !c.read).length} unread)` : t}
            </button>
          ))}
        </div>

        {tab === "news" && (
          <div>
            <div className="bg-white rounded-xl border p-5 mb-6">
              <h3 className="font-bold text-primary mb-4">Post News Article</h3>
              <div className="space-y-3">
                <input value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Headline" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <textarea value={newsForm.body} onChange={e => setNewsForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Article body..." rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <div className="flex gap-2 items-center">
                  <input ref={imageRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) uploadNewsImage(e.target.files[0]); }} />
                  <button onClick={() => imageRef.current?.click()}
                    className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Upload Image
                  </button>
                  {newsForm.image_url && <img src={newsForm.image_url} className="h-10 rounded" />}
                </div>
                <button onClick={postNews} disabled={loading}
                  className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                  {loading ? "Posting..." : "Post News"}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {news.map(n => (
                <div key={n.id} className="bg-white rounded-xl border p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-primary">{n.title}</p>
                    <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.body}</p>
                  </div>
                  <button onClick={() => deleteNews(n.id)}
                    className="text-red-500 text-sm font-semibold hover:underline shrink-0">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "announcements" && (
          <div>
            <div className="bg-white rounded-xl border p-5 mb-6">
              <h3 className="font-bold text-primary mb-3">Set Scrolling Announcement</h3>
              <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)}
                placeholder="Type announcement text..." rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary mb-3" />
              <button onClick={postAnnouncement}
                className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">
                Publish Announcement
              </button>
            </div>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-white rounded-xl border p-4 flex justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-700">{a.text}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {a.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button onClick={() => toggleAnnouncement(a.id, a.active)}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${a.active ? "bg-gray-200 text-gray-700" : "bg-primary text-white"}`}>
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "leaders" && (
          <div>
            <div className="bg-white rounded-xl border p-5 mb-6">
              <h3 className="font-bold text-primary mb-4">Add Leader / Hall of Fame / Past PG</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input value={leaderForm.name} onChange={e => setLeaderForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Full Name" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <input value={leaderForm.title} onChange={e => setLeaderForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Title / Position" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <input value={leaderForm.photo_url} onChange={e => setLeaderForm(p => ({ ...p, photo_url: e.target.value }))}
                  placeholder="Photo URL" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <select value={leaderForm.leader_type} onChange={e => setLeaderForm(p => ({ ...p, leader_type: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="community">Community Leader</option>
                  <option value="political">Political Leader</option>
                  <option value="hall_of_fame">Hall of Fame</option>
                  <option value="past_pg">Past PG</option>
                </select>
              </div>
              <textarea value={leaderForm.bio} onChange={e => setLeaderForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Biography..." rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary mb-3" />
              <button onClick={addLeader}
                className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">
                Add Leader
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {leaders.map(l => (
                <div key={l.id} className="bg-white rounded-xl border p-4 flex gap-3">
                  <img src={l.photo_url ?? "/avatar-placeholder.png"} className="w-14 h-14 rounded-full object-cover border-2 border-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-primary">{l.name}</p>
                    <p className="text-xs text-secondary">{l.title}</p>
                    <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full">{l.leader_type}</span>
                  </div>
                  <button onClick={() => deleteLeader(l.id)} className="text-red-500 text-xs font-semibold hover:underline shrink-0">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className={`bg-white rounded-xl border p-4 ${!c.read ? "border-secondary" : ""}`}>
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{c.name} → <span className="text-secondary">{c.recipient}</span></p>
                    <p className="text-xs text-gray-500">{c.email} | {c.phone}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{c.subject}</p>
                    <p className="text-sm text-gray-600 mt-1">{c.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  {!c.read && (
                    <button onClick={() => markContactRead(c.id)}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold shrink-0">
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white rounded-xl border p-4 flex justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{u.full_name || "Incomplete KYC"}</p>
                  <p className="text-xs text-gray-500">{u.email} | {u.phone} | {u.village}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.status === "approved" ? "bg-green-100 text-green-700" : u.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
