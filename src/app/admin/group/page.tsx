"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function GroupAdminPage() {
  const [tab, setTab] = useState("members");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [pollForm, setPollForm] = useState({ question: "", description: "", options: ["", ""], ends_at: "" });
  const [fileForm, setFileForm] = useState({ name: "", password: "" });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (selectedGroup) loadGroupData(); }, [selectedGroup]);

  async function loadGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: roleData } = await supabase.from("user_roles").select("scope_id").eq("user_id", user.id).eq("role", "group_admin");
    const scopeIds = (roleData ?? []).map((r: any) => r.scope_id).filter(Boolean);
    if (scopeIds.length === 0) {
      const { data } = await supabase.from("groups").select("*").is("deleted_at", null).order("name");
      setGroups(data ?? []);
    } else {
      const { data } = await supabase.from("groups").select("*").in("id", scopeIds).is("deleted_at", null);
      setGroups(data ?? []);
      if (data && data.length > 0) setSelectedGroup(data[0].id);
    }
  }

  async function loadGroupData() {
    const { data: m } = await supabase.from("group_members").select("*, users(full_name, email, phone, avatar_url, status)").eq("group_id", selectedGroup).order("joined_at", { ascending: false });
    const { data: p } = await supabase.from("polls").select("*, votes(option_id)").eq("group_id", selectedGroup).is("deleted_at", null).order("created_at", { ascending: false });
    const { data: f } = await supabase.from("files").select("*").eq("group_id", selectedGroup).is("deleted_at", null).order("created_at", { ascending: false });
    setMembers(m ?? []); setPolls(p ?? []); setFiles(f ?? []);
  }

  async function updateMember(memberId: string, status: string) {
    await supabase.from("group_members").update({ status }).eq("id", memberId);
    toast.success("Updated!"); loadGroupData();
  }

  async function createPoll() {
    const validOptions = pollForm.options.filter(o => o.trim());
    if (!pollForm.question || validOptions.length < 2 || !pollForm.ends_at) {
      return toast.error("Fill question, at least 2 options, and end date");
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("polls").insert({
      group_id: selectedGroup, created_by: user?.id,
      question: pollForm.question, description: pollForm.description,
      options: validOptions.map((text, i) => ({ id: String(i), text })),
      ends_at: new Date(pollForm.ends_at).toISOString(),
    });
    toast.success("Poll created!"); setPollForm({ question: "", description: "", options: ["", ""], ends_at: "" }); loadGroupData();
    setLoading(false);
  }

  async function uploadFile() {
    if (!fileToUpload || !fileForm.name || !fileForm.password) {
      return toast.error("Select file, enter name and password");
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const storagePath = `${selectedGroup}/${Date.now()}-${fileToUpload.name}`;
      const { data: uploaded } = await supabase.storage.from("group-files").upload(storagePath, fileToUpload);
      if (!uploaded) throw new Error("Upload failed");
      const hashRes = await fetch("/api/hash-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: fileForm.password }),
      });
      const { hash } = await hashRes.json();
      await supabase.from("files").insert({
        group_id: selectedGroup, uploaded_by: user?.id,
        name: fileForm.name, storage_path: uploaded.path, password_hash: hash,
      });
      toast.success("File uploaded!"); setFileForm({ name: "", password: "" }); setFileToUpload(null); loadGroupData();
    } catch { toast.error("Upload failed"); }
    setLoading(false);
  }

  async function deleteFile(id: string) {
    await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Deleted!"); loadGroupData();
  }

  const pending = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-6 py-4">
        <h1 className="text-xl font-bold">🔧 Group / Age Grade Admin</h1>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Select Group</label>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="">-- Select --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.type})</option>)}
          </select>
        </div>

        {selectedGroup && (
          <>
            <div className="flex gap-2 flex-wrap mb-6">
              {["members", "polls", "files"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-primary text-white" : "bg-white border hover:bg-primary-50 text-gray-600"}`}>
                  {t === "members" ? `Members (${pending.length} pending)` : t}
                </button>
              ))}
            </div>

            {tab === "members" && (
              <div>
                {pending.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-secondary mb-3">Pending Requests ({pending.length})</h3>
                    <div className="space-y-3">
                      {pending.map(m => (
                        <div key={m.id} className="bg-white rounded-xl border border-secondary p-4 flex justify-between items-center gap-4 flex-wrap">
                          <div>
                            <p className="font-semibold">{(m.users as any)?.full_name}</p>
                            <p className="text-xs text-gray-500">{(m.users as any)?.email} | {(m.users as any)?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateMember(m.id, "approved")}
                              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Approve</button>
                            <button onClick={() => updateMember(m.id, "denied")}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Deny</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <h3 className="font-bold text-primary mb-3">Approved Members ({approved.length})</h3>
                <div className="space-y-2">
                  {approved.map(m => (
                    <div key={m.id} className="bg-white rounded-xl border p-4 flex justify-between items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{(m.users as any)?.full_name}</p>
                        <p className="text-xs text-gray-500">{(m.users as any)?.email}</p>
                      </div>
                      <button onClick={() => updateMember(m.id, "suspended")}
                        className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Suspend</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "polls" && (
              <div>
                <div className="bg-white rounded-xl border p-5 mb-6">
                  <h3 className="font-bold text-primary mb-4">Create Poll</h3>
                  <div className="space-y-3">
                    <input value={pollForm.question} onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))}
                      placeholder="Poll question" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    <input value={pollForm.description} onChange={e => setPollForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description (optional)" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    {pollForm.options.map((opt, i) => (
                      <input key={i} value={opt} onChange={e => { const o = [...pollForm.options]; o[i] = e.target.value; setPollForm(p => ({ ...p, options: o })); }}
                        placeholder={`Option ${i + 1}`} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    ))}
                    <button onClick={() => setPollForm(p => ({ ...p, options: [...p.options, ""] }))}
                      className="text-sm text-primary font-semibold hover:underline">+ Add Option</button>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Voting Deadline</label>
                      <input type="datetime-local" value={pollForm.ends_at} onChange={e => setPollForm(p => ({ ...p, ends_at: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary mt-1" />
                    </div>
                    <button onClick={createPoll} disabled={loading}
                      className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                      {loading ? "Creating..." : "Create Poll"}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {polls.map(p => {
                    const voteCounts: Record<string, number> = {};
                    (p.votes ?? []).forEach((v: any) => { voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1; });
                    const total = p.votes?.length ?? 0;
                    return (
                      <div key={p.id} className="bg-white rounded-xl border p-5">
                        <p className="font-bold text-primary">{p.question}</p>
                        <p className="text-xs text-gray-400 mb-3">Ends: {new Date(p.ends_at).toLocaleString()} | {total} votes</p>
                        <div className="space-y-2">
                          {(p.options ?? []).map((opt: any) => {
                            const count = voteCounts[opt.id] ?? 0;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={opt.id}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{opt.text}</span><span className="font-semibold">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full">
                                  <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "files" && (
              <div>
                <div className="bg-white rounded-xl border p-5 mb-6">
                  <h3 className="font-bold text-primary mb-4">Upload Password-Protected File</h3>
                  <div className="space-y-3">
                    <input value={fileForm.name} onChange={e => setFileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="File display name" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    <input value={fileForm.password} onChange={e => setFileForm(p => ({ ...p, password: e.target.value }))}
                      type="password" placeholder="Access password for members"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                    <input type="file" accept=".pdf,.doc,.docx,.jpeg,.jpg"
                      onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-gray-600" />
                    <button onClick={uploadFile} disabled={loading}
                      className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                      {loading ? "Uploading..." : "Upload File"}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {files.map(f => (
                    <div key={f.id} className="bg-white rounded-xl border p-4 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-semibold text-sm">📄 {f.name}</p>
                        <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => deleteFile(f.id)} className="text-red-500 text-xs font-semibold hover:underline">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
