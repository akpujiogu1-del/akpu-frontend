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
    setLoading(true);
    // Fetch everything in parallel for speed
    const [pRes, uRes, gRes, lRes, sRes] = await Promise.all([
      supabase.from("users").select("*").eq("status", "pending").order("created_at"),
      supabase.from("users").select("*, user_roles(role)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("groups").select("*").is("deleted_at", null).order("name"),
      supabase.from("activity_logs").select("*, users(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("site_settings").select("key,value")
    ]);

    setPending(pRes.data ?? []);
    setUsers(uRes.data ?? []);
    setGroups(gRes.data ?? []);
    setLogs(lRes.data ?? []);
    setSettings(Object.fromEntries((sRes.data ?? []).map((r: any) => [r.key, r.value])));
    setLoading(false);
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
      if (data.success) {
        toast.success(`User ${action} successful`);
        loadAll();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function saveSetting(key: string, value: string) {
    const { error } = await supabase.from("site_settings").upsert({ key, value });
    if (error) toast.error("Failed to save setting");
    else toast.success("Setting updated!");
  }

  async function createGroup() {
    if (!newGroup.name) return toast.error("Enter group name");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("groups").insert({ ...newGroup, created_by: user?.id });
    
    if (error) toast.error("Error creating group");
    else {
      toast.success(`${newGroup.name} created!`);
      setNewGroup({ name: "", type: "age_grade", description: "" });
      loadAll();
    }
  }

  // Copy helpers
  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const TABS = [
    { id: "kyc", label: `Approvals (${pending.length})` },
    { id: "users", label: "Directory" },
    { id: "groups", label: "Groups" },
    { id: "settings", label: "CMS Settings" },
    { id: "logs", label: "Logs" }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Header */}
      <div className="bg-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">SUPER ADMIN</h1>
            <p className="text-xs opacity-70 font-bold uppercase tracking-widest">Akpu Community Portal</p>
          </div>
          <button 
            onClick={loadAll} 
            className={`p-2 rounded-full hover:bg-white/10 transition ${loading ? 'animate-spin' : ''}`}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {TABS.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
                tab === t.id ? "bg-secondary text-white border-secondary" : "bg-white text-gray-500 border-gray-100 hover:border-primary/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content: KYC */}
        {tab === "kyc" && (
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-xl font-black text-gray-800">Pending Membership</h2>
              <p className="text-xs font-bold text-gray-400 uppercase">Awaiting Verification</p>
            </div>
            {pending.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">All caught up! No pending approvals.</p>
              </div>
            ) : (
              pending.map(u => (
                <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {u.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{u.full_name || "New User"}</p>
                        <p className="text-sm text-gray-500 font-medium">{u.email} • {u.phone}</p>
                        <div className="flex gap-3 mt-1">
                           <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded text-gray-600">Village: {u.village}</span>
                           <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded text-gray-600">DOB: {u.date_of_birth}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUserAction(u.id, "approve")} 
                        className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 transition active:scale-95"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleUserAction(u.id, "reject")}
                        className="bg-white text-red-600 border border-red-100 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Users */}
        {tab === "users" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-bold text-gray-800">Community Directory</h3>
               <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(users.filter(u => u.status === "approved").map(u => u.email).join(", "), "Emails")}
                    className="text-[10px] font-black bg-secondary/10 text-secondary px-3 py-2 rounded-lg hover:bg-secondary hover:text-white transition"
                  >
                    COPY EMAILS
                  </button>
                  <button 
                    onClick={() => copyToClipboard(users.filter(u => u.status === "approved" && u.phone).map(u => u.phone).join(", "), "Phones")}
                    className="text-[10px] font-black bg-secondary/10 text-secondary px-3 py-2 rounded-lg hover:bg-secondary hover:text-white transition"
                  >
                    COPY PHONES
                  </button>
               </div>
            </div>
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className="p-4 hover:bg-gray-50/50 flex items-center justify-between gap-4 flex-wrap transition">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold text-sm">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{u.village} • {u.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        u.status === "approved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>{u.status}</span>
                      {u.user_roles?.map((r: any) => (
                        <span key={r.role} className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-primary/10 text-primary">
                          {r.role.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select 
                      onChange={e => e.target.value && handleUserAction(u.id, "assign_role", e.target.value)}
                      className="text-[11px] font-bold border rounded-lg px-2 py-2 bg-white outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Edit Role</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="community_admin">Community Admin</option>
                      <option value="group_admin">Group Admin</option>
                      <option value="member">Member</option>
                    </select>
                    {u.status === "approved" ? (
                      <button onClick={() => handleUserAction(u.id, "suspend")} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Suspend">🚫</button>
                    ) : (
                      <button onClick={() => handleUserAction(u.id, "approve")} className="p-2 text-primary hover:bg-primary-50 rounded-lg transition" title="Activate">✅</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Groups */}
        {tab === "groups" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-8">
                <h3 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wider">New Organization</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Group Name</label>
                    <input 
                      value={newGroup.name} 
                      onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Udoka Age Grade" 
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Type</label>
                    <select 
                      value={newGroup.type} 
                      onChange={e => setNewGroup(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    >
                      <option value="age_grade">Age Grade</option>
                      <option value="umunna">Umunna</option>
                      <option value="group">Interest Group</option>
                    </select>
                  </div>
                  <button 
                    onClick={createGroup} 
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {groups.map(g => (
                <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-primary/20 transition">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-900">{g.name}</p>
                    <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-1 rounded uppercase">{g.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{g.description || "No description provided."}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Settings */}
        {tab === "settings" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-black text-gray-800 mb-6">Site Configuration</h2>
            {[
              { key: "landing_video_url", label: "Featured Video (YouTube URL)" },
              { key: "map_embed_url", label: "Google Maps Location (Embed URL)" },
              { key: "facebook_url", label: "Facebook Page" },
              { key: "youtube_url", label: "YouTube Channel" },
            ].map(({ key, label }) => (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">{label}</label>
                <div className="flex gap-3">
                  <input 
                    defaultValue={settings[key] ?? ""}
                    onBlur={(e) => saveSetting(key, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" 
                  />
                  <div className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-full text-xs">✓</div>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">About the Community</label>
              <textarea 
                defaultValue={settings["about_text"] ?? ""} 
                onBlur={(e) => saveSetting("about_text", e.target.value)}
                rows={6}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary" 
              />
              <p className="text-[10px] text-gray-400 mt-2 font-bold italic">* Settings auto-save when you click away from the box.</p>
            </div>
          </div>
        )}

        {/* Tab Content: Logs */}
        {tab === "logs" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
               <span className="text-xs font-black uppercase tracking-widest">System Audit Trail</span>
               <span className="text-[10px] opacity-60">Last 50 actions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {logs.map(l => (
                <div key={l.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <p className="text-gray-600">
                      <span className="font-black text-gray-900">{(l.users as any)?.full_name ?? "System"}</span>
                      <span className="mx-2 opacity-50">performed</span>
                      <span className="font-bold text-secondary uppercase tracking-tighter bg-secondary/5 px-2 py-0.5 rounded">{l.action}</span>
                      {l.target_type && <span className="ml-2 text-gray-400">on {l.target_type}</span>}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{new Date(l.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}