"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function GroupAdminPage() {
  const [tab, setTab] = useState("members");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [pollForm, setPollForm] = useState({ question: "", description: "", options: ["", ""], ends_at: "" });
  const [fileForm, setFileForm] = useState({ name: "", password: "" });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) loadGroupData();
  }, [selectedGroup]);

  async function loadGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("scope_id")
      .eq("user_id", user.id)
      .eq("role", "group_admin");

    const scopeIds = (roleData ?? []).map((r: any) => r.scope_id).filter(Boolean);

    let query = supabase.from("groups").select("*").is("deleted_at", null).order("name");
    
    // If they have specific scope, filter by it. Otherwise, if they are super admin, they see all.
    if (scopeIds.length > 0) {
      query = query.in("id", scopeIds);
    }

    const { data } = await query;
    setGroups(data ?? []);
    if (data && data.length > 0) setSelectedGroup(data[0].id);
  }

  async function loadGroupData() {
    setLoading(true);
    const [m, p, f] = await Promise.all([
      supabase.from("group_members").select("*, users(full_name, email, phone, avatar_url, status)").eq("group_id", selectedGroup).order("joined_at", { ascending: false }),
      supabase.from("polls").select("*, votes(option_id)").eq("group_id", selectedGroup).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("files").select("*").eq("group_id", selectedGroup).is("deleted_at", null).order("created_at", { ascending: false })
    ]);

    setMembers(m.data ?? []);
    setPolls(p.data ?? []);
    setFiles(f.data ?? []);
    setLoading(false);
  }

  async function updateMember(memberId: string, status: string) {
    const { error } = await supabase.from("group_members").update({ status }).eq("id", memberId);
    if (error) toast.error("Failed to update member");
    else {
      toast.success(`Member ${status}`);
      loadGroupData();
    }
  }

  async function createPoll() {
    const validOptions = pollForm.options.filter(o => o.trim());
    if (!pollForm.question || validOptions.length < 2 || !pollForm.ends_at) {
      return toast.error("Question, 2+ options, and deadline required");
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("polls").insert({
      group_id: selectedGroup,
      created_by: user?.id,
      question: pollForm.question,
      description: pollForm.description,
      options: validOptions.map((text, i) => ({ id: String(i), text })),
      ends_at: new Date(pollForm.ends_at).toISOString(),
    });

    if (error) toast.error("Failed to create poll");
    else {
      toast.success("Poll published!");
      setPollForm({ question: "", description: "", options: ["", ""], ends_at: "" });
      loadGroupData();
    }
    setLoading(false);
  }

  async function uploadFile() {
    if (!fileToUpload || !fileForm.name || !fileForm.password) {
      return toast.error("Missing file details");
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const storagePath = `${selectedGroup}/${Date.now()}-${fileToUpload.name}`;
      
      const { data: uploaded, error: upErr } = await supabase.storage.from("group-files").upload(storagePath, fileToUpload);
      if (upErr) throw upErr;

      const hashRes = await fetch("/api/hash-password", {
        method: "POST",
        body: JSON.stringify({ password: fileForm.password }),
      });
      const { hash } = await hashRes.json();

      await supabase.from("files").insert({
        group_id: selectedGroup,
        uploaded_by: user?.id,
        name: fileForm.name,
        storage_path: uploaded.path,
        password_hash: hash,
      });

      toast.success("Secure file uploaded!");
      setFileForm({ name: "", password: "" });
      setFileToUpload(null);
      loadGroupData();
    } catch (err) {
      toast.error("File upload failed");
    } finally {
      setLoading(false);
    }
  }

  const pending = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-primary text-white px-6 py-6 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">🛡️ Group Management</h1>
          <select 
            value={selectedGroup} 
            onChange={e => setSelectedGroup(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:bg-white/20 transition"
          >
            <option value="" className="text-black">Select a Group</option>
            {groups.map(g => <option key={g.id} value={g.id} className="text-black">{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {!selectedGroup ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
            <p className="text-gray-400">Please select a group to manage members and content</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                { id: "members", label: `Members (${pending.length} pending)` },
                { id: "polls", label: "Voting & Polls" },
                { id: "files", label: "Group Documents" }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTab(t.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap ${tab === t.id ? "bg-secondary text-white" : "bg-white border text-gray-500 hover:border-secondary"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "members" && (
              <div className="space-y-6">
                {pending.length > 0 && (
                  <div className="bg-secondary/5 rounded-2xl border border-secondary/20 p-6">
                    <h3 className="font-black text-secondary uppercase tracking-wider text-xs mb-4">Membership Requests</h3>
                    <div className="grid gap-3">
                      {pending.map(m => (
                        <div key={m.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm border border-secondary/10">
                          <div>
                            <p className="font-bold text-gray-900">{m.users?.full_name}</p>
                            <p className="text-xs text-gray-500">{m.users?.email} • {m.users?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateMember(m.id, "approved")} className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-dark">Approve</button>
                            <button onClick={() => updateMember(m.id, "denied")} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                  <h3 className="font-bold text-primary mb-4">Active Roster ({approved.length})</h3>
                  <div className="divide-y">
                    {approved.map(m => (
                      <div key={m.id} className="py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {m.users?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{m.users?.full_name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{m.role || "Member"}</p>
                          </div>
                        </div>
                        <button onClick={() => updateMember(m.id, "suspended")} className="text-[10px] font-black text-orange-600 hover:underline uppercase tracking-tighter">Suspend Access</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "polls" && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-white rounded-2xl border p-5 sticky top-6 shadow-sm">
                    <h3 className="font-bold text-primary mb-4 text-sm">Create New Poll</h3>
                    <div className="space-y-4">
                      <input 
                        value={pollForm.question} 
                        onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))}
                        placeholder="What is the question?" 
                        className="w-full border-b py-2 text-sm outline-none focus:border-primary" 
                      />
                      <div className="space-y-2">
                        {pollForm.options.map((opt, i) => (
                          <input 
                            key={i} 
                            value={opt} 
                            onChange={e => {
                              const o = [...pollForm.options];
                              o[i] = e.target.value;
                              setPollForm(p => ({ ...p, options: o }));
                            }}
                            placeholder={`Option ${i + 1}`} 
                            className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary" 
                          />
                        ))}
                      </div>
                      <button 
                        onClick={() => setPollForm(p => ({ ...p, options: [...p.options, ""] }))}
                        className="text-[10px] font-bold text-primary hover:text-primary-dark transition"
                      >
                        + ADD ANOTHER OPTION
                      </button>
                      <div className="pt-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Closing Date</label>
                        <input 
                          type="datetime-local" 
                          value={pollForm.ends_at} 
                          onChange={e => setPollForm(p => ({ ...p, ends_at: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-xs" 
                        />
                      </div>
                      <button 
                        onClick={createPoll} 
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {loading ? "Publishing..." : "Publish Poll"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {polls.map(p => {
                    const voteCounts: Record<string, number> = {};
                    (p.votes ?? []).forEach((v: any) => { voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1; });
                    const total = p.votes?.length ?? 0;
                    const isExpired = new Date(p.ends_at) < new Date();

                    return (
                      <div key={p.id} className="bg-white rounded-2xl border p-6 shadow-sm relative overflow-hidden">
                        {isExpired && <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[10px] px-3 py-1 font-bold rounded-bl-lg uppercase">Closed</div>}
                        <p className="font-bold text-gray-800 mb-1">{p.question}</p>
                        <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest font-bold">Total Votes: {total}</p>
                        
                        <div className="space-y-4">
                          {(p.options ?? []).map((opt: any) => {
                            const count = voteCounts[opt.id] ?? 0;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={opt.id}>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                  <span className="text-gray-600">{opt.text}</span>
                                  <span className="text-primary">{pct}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
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
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border p-8 mb-8 shadow-sm text-center">
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📁</span>
                  </div>
                  <h3 className="font-bold text-primary mb-2">Secure Document Upload</h3>
                  <p className="text-xs text-gray-500 mb-6">Files are password-protected and only accessible to group members.</p>
                  
                  <div className="space-y-4 text-left">
                    <input 
                      value={fileForm.name} 
                      onChange={e => setFileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Document Title (e.g. March 2026 Minutes)" 
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" 
                    />
                    <input 
                      value={fileForm.password} 
                      onChange={e => setFileForm(p => ({ ...p, password: e.target.value }))}
                      type="password" 
                      placeholder="Set access password"
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" 
                    />
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg"
                        onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <p className="text-xs text-gray-400">{fileToUpload ? `✅ ${fileToUpload.name}` : "Click or drag to upload (PDF, DOC, JPEG)"}</p>
                    </div>
                    <button 
                      onClick={uploadFile} 
                      disabled={loading || !fileToUpload}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      {loading ? "Uploading Securely..." : "Upload Secure Document"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {files.map(f => (
                    <div key={f.id} className="bg-white rounded-xl border p-4 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">📄</div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{f.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteFile(f.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition">🗑️</button>
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