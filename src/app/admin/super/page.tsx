"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function SuperAdminPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("kyc");
  const [newGroup, setNewGroup] = useState({ name: "", type: "age_grade", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const { data: p } = await supabase.from("users").select("*").eq("status", "pending").order("created_at");
    const { data: u } = await supabase.from("users").select("*, user_roles(role)").is("deleted_at", null).order("created_at", { ascending: false });
    const { data: g } = await supabase.from("groups").select("*").is("deleted_at", null).order("name");
    const { data: l } = await supabase.from("activity_logs").select("*, users(full_name)").order("created_at", { ascending: false }).limit(50);
    const { data: s } = await supabase.from("site_settings").select("key,value");
    setPending(p ?? []);
    setUsers(u ?? []);
    setGroups(g ?? []);
    setLogs(l ?? []);
    setSettings(Object.fromEntries((s ?? []).map((r: any) => [r.key, r.value])));
  }

  async function handleUserAction(userId: string, action: string, role?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Done!"); loadAll(); }
      else toast.error("Failed");
    } catch { toast.error("Error"); }
    setLoading(false);
  }

  async function saveSetting(key: string, value: string) {
    await supabase.from("site_settings").update({ value }).eq("key", key);
    toast.success("Saved!");
  }

  async function createGroup() {
    if (!newGroup.name) return toast.error("Enter group name");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("groups").insert({ ...newGroup, created_by: user?.id });
    toast.success("Group created!");
    setNewGroup({ name: "", type: "age_grade", description: "" });
    loadAll();
  }

  async function copyEmails() {
    const emails = users.filter(u => u.status === "approved").map((u: any) => u.email).join(", ");
    await navigator.clipboard.writeText(emails);
    toast.success("Emails copied!");
  }

  async function copyPhones() {
    const phones = users.filter(u => u.status === "approved" && u.phone).map((u: any) => u.phone).join(", ");
    await navigator.clipboard.writeText(phones);
    toast.success("Phones copied!");
  }

  const TABS = ["kyc", "users", "groups", "settings", "logs"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🏘️ Super Admin Dashboard</h1>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Akpu Community</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-primary text-white" : "bg-white border hover:bg-primary-50 text-gray-600"}`}>
              {t === "kyc" ? `KYC Approvals (${pending.length})` : t}
            </button>
          ))}
        </div>

        {tab === "kyc" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary">Pending KYC Approvals</h2>
            {pending.length === 0 && <p className="text-gray-500 bg-white rounded-xl p-6 text-center">No pending approvals</p>}
            {pending.map(u => (
              <div key={u.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-primary">{u.full_name || "No name yet"}</p>
                    <p className="text-sm text-gray-500">{u.email} | {u.phone}</p>
                    <p className="text-sm text-gray-500">Village: {u.village} | Sex: {u.sex} | DOB: {u.date_of_birth}</p>
                    <p className="text-xs text-gray-400 mt-1">Registered: {new Date(u.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleUserAction(u.id, "approve")} disabled={loading}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                      Approve
                    </button>
                    <button onClick={() => handleUserAction(u.id, "reject")} disabled={loading}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={copyEmails} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold">Copy All Emails</button>
              <button onClick={copyPhones} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold">Copy All Phones</button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{u.full_name || u.email}</p>
                    <p className="text-xs text-gray-500">{u.email} | {u.phone} | {u.village}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.status === "approved" ? "bg-green-100 text-green-700" : u.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {u.status === "approved" && (
                      <button onClick={() => handleUserAction(u.id, "suspend")} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Suspend</button>
                    )}
                    {u.status === "suspended" && (
                      <button onClick={() => handleUserAction(u.id, "approve")} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Reinstate</button>
                    )}
                    <select onChange={e => { if (e.target.value) handleUserAction(u.id, "assign_role", e.target.value); }}
                      className="text-xs border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Assign Role</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="community_admin">Community Admin</option>
                      <option value="group_admin">Group Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "groups" && (
          <div>
            <div className="bg-white rounded-xl border p-5 mb-6">
              <h3 className="font-bold text-primary mb-4">Create New Group / Age Grade / Umunna</h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <input value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                  placeholder="Group name" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                <select value={newGroup.type} onChange={e => setNewGroup(p => ({ ...p, type: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="age_grade">Age Grade</option>
                  <option value="umunna">Umunna</option>
                  <option value="group">Group</option>
                  <option value="community">Community</option>
                </select>
                <input value={newGroup.description} onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={createGroup} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">
                Create Group
              </button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groups.map(g => (
                <div key={g.id} className="bg-white rounded-xl border p-4">
                  <p className="font-bold text-primary">{g.name}</p>
                  <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full">{g.type}</span>
                  {g.description && <p className="text-xs text-gray-500 mt-1">{g.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary mb-4">Site Settings</h2>
            {[
              { key: "landing_video_url", label: "Landing Page YouTube URL" },
              { key: "map_embed_url", label: "Google Maps Embed URL" },
              { key: "tiktok_url", label: "TikTok URL" },
              { key: "facebook_url", label: "Facebook URL" },
              { key: "instagram_url", label: "Instagram URL" },
              { key: "youtube_url", label: "YouTube Channel URL" },
            ].map(({ key, label }) => (
              <div key={key} className="bg-white rounded-xl border p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <div className="flex gap-2">
                  <input defaultValue={settings[key] ?? ""}
                    id={`setting-${key}`}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <button onClick={() => { const el = document.getElementById(`setting-${key}`) as HTMLInputElement; saveSetting(key, el.value); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">
                    Save
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-xl border p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">About Text</label>
              <textarea id="setting-about_text" defaultValue={settings["about_text"] ?? ""} rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={() => { const el = document.getElementById("setting-about_text") as HTMLTextAreaElement; saveSetting("about_text", el.value); }}
                className="mt-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">
                Save About Text
              </button>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-4">Activity Logs</h2>
            <div className="space-y-2">
              {logs.map(l => (
                <div key={l.id} className="bg-white rounded-xl border px-4 py-3 text-sm flex justify-between gap-4 flex-wrap">
                  <div>
                    <span className="font-semibold text-primary">{(l.users as any)?.full_name ?? "Unknown"}</span>
                    <span className="text-gray-500 ml-2">{l.action}</span>
                    {l.target_type && <span className="text-gray-400 ml-2">→ {l.target_type}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
