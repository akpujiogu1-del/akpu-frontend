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
      
      if (!hashRes.ok) throw new Error("Encryption failed");
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
    } catch (err: any) {
      toast.error(err.message || "File upload failed");
    } finally {
      setLoading(false);
    }
  }

  /** * FIX: Added missing deleteFile function 
   */
  async function deleteFile(fileId: string) {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;
    
    try {
      // 1. Get storage path from DB first
      const { data: fileRecord } = await supabase
        .from("files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      // 2. Delete physical file from storage
      if (fileRecord?.storage_path) {
        await supabase.storage.from("group-files").remove([fileRecord.storage_path]);
      }

      // 3. Mark as deleted in DB (or hard delete)
      const { error } = await supabase.from("files").delete().eq("id", fileId);
      
      if (error) throw error;
      
      toast.success("File removed");
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      toast.error("Delete failed");
    }
  }

  const pending = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-[#1a1a1a] text-white px-6 py-6 shadow-md">
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
            <p className="text-gray-400 font-medium">Please select a group to manage members and content</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: "members", label: `Members (${pending.length} pending)` },
                { id: "polls", label: "Voting & Polls" },
                { id: "files", label: "Group Documents" }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTab(t.id)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm whitespace-nowrap ${tab === t.id ? "bg-primary text-white" : "bg-white border text-gray-500 hover:border-primary/50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "members" && (
              <div className="space-y-6">
                {pending.length > 0 && (
                  <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
                    <h3 className="font-black text-orange-600 uppercase tracking-wider text-[10px] mb-4">Membership Requests</h3>
                    <div className="grid gap-3">
                      {pending.map(m => (
                        <div key={m.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm border border-orange-200/50">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{m.users?.full_name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{m.users?.email} • {m.users?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateMember(m.id, "approved")} className="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition">Approve</button>
                            <button onClick={() => updateMember(m.id, "denied")} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                  <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px] mb-6">Active Roster ({approved.length})</h3>
                  <div className="divide-y divide-gray-50">
                    {approved.map(m => (
                      <div key={m.id} className="py-4 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-primary font-black text-xs border border-gray-100">
                            {m.users?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{m.users?.full_name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{m.role || "Member"}</p>
                          </div>
                        </div>
                        <button onClick={() => updateMember(m.id, "suspended")} className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-orange-600 hover:underline uppercase tracking-tighter transition-opacity">Suspend Access</button>
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
                    <h3 className="font-black text-gray-900 mb-4 text-[10px] uppercase tracking-[0.2em]">New Community Poll</h3>
                    <div className="space-y-4">
                      <input 
                        value={pollForm.question} 
                        onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))}
                        placeholder="What is the question?" 
                        className="w-full border-b py-2 text-sm outline-none focus:border-primary transition-colors font-medium" 
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
                            className="w-full bg-gray-50 rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:bg-white transition-all" 
                          />
                        ))}
                      </div>
                      <button 
                        onClick={() => setPollForm(p => ({ ...p, options: [...p.options, ""] }))}
                        className="text-[10px] font-black text-primary hover:text-primary-dark transition tracking-widest"
                      >
                        + ADD ANOTHER OPTION
                      </button>
                      <div className="pt-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Closing Date</label>
                        <input 
                          type="datetime-local" 
                          value={pollForm.ends_at} 
                          onChange={e => setPollForm(p => ({ ...p, ends_at: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-xs font-medium" 
                        />
                      </div>
                      <button 
                        onClick={createPoll} 
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:shadow-xl disabled:opacity-50 transition-all"
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
                      <div key={p.id} className="bg-white rounded-2xl border p-6 shadow-sm relative overflow-hidden group">
                        {isExpired && <div className="absolute top-0 right-0 bg-gray-100 text-gray-400 text-[9px] px-3 py-1 font-black rounded-bl-xl uppercase tracking-widest">Poll Closed</div>}
                        <p className="font-bold text-gray-900 mb-1">{p.question}</p>
                        <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest font-bold">Total Participation: {total}</p>
                        
                        <div className="space-y-5">
                          {(p.options ?? []).map((opt: any) => {
                            const count = voteCounts[opt.id] ?? 0;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={opt.id}>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2">
                                  <span className="text-gray-600">{opt.text}</span>
                                  <span className="text-primary">{pct}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                  <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
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
                <div className="bg-white rounded-[2rem] border p-8 mb-8 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Secure Document Vault</h3>
                  <p className="text-[11px] font-medium text-gray-400 mb-8 max-w-xs mx-auto">All group files are encrypted. Passwords are required for members to view contents.</p>
                  
                  <div className="space-y-4 text-left">
                    <input 
                      value={fileForm.name} 
                      onChange={e => setFileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Document Title (e.g. Town Hall Minutes)" 
                      className="w-full border rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 focus:bg-white transition-all font-medium" 
                    />
                    <input 
                      value={fileForm.password} 
                      onChange={e => setFileForm(p => ({ ...p, password: e.target.value }))}
                      type="password" 
                      placeholder="Set protection password"
                      className="w-full border rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 focus:bg-white transition-all font-medium" 
                    />
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center hover:bg-gray-50 hover:border-primary/20 transition cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg"
                        onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">
                        {fileToUpload ? `✅ ${fileToUpload.name}` : "Select PDF or Document"}
                      </p>
                    </div>
                    <button 
                      onClick={uploadFile} 
                      disabled={loading || !fileToUpload}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {loading ? "Encrypting & Uploading..." : "Store in Secure Vault"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-4">Stored Documents</p>
                  {files.map(f => (
                    <div key={f.id} className="bg-white rounded-2xl border p-5 flex justify-between items-center group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-lg">📄</div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{f.name}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteFile(f.id)} 
                        className="opacity-0 group-hover:opacity-100 p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div className="text-center py-10 opacity-40">
                      <p className="text-xs font-bold uppercase tracking-widest">No documents found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}