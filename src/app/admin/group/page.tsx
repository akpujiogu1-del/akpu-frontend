"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function GroupAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("members");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingKYC, setPendingKYC] = useState<any[]>([]);
  const [savingKYC, setSavingKYC] = useState(false);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], ends_at: "" });
  const [fileForm, setFileForm] = useState({ name: "", password: "" });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (selectedGroup) loadGroupData(); }, [selectedGroup?.id]);

  async function loadGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: roleData } = await supabase
      .from("user_roles").select("scope_id")
      .eq("user_id", user.id).eq("role", "group_admin");
    const scopeIds = (roleData ?? []).map((r: any) => r.scope_id).filter(Boolean);
    const query = scopeIds.length > 0
      ? supabase.from("groups").select("*").is("deleted_at", null).in("id", scopeIds).order("name")
      : supabase.from("groups").select("*").is("deleted_at", null).order("name");
    const { data } = await query;
    setGroups(data ?? []);
    if (data && data.length > 0) setSelectedGroup(data[0]);
  }

  async function loadKYC() {
    if (!selectedGroup || selectedGroup.type !== "umunna") return;
    const res = await fetch("/api/admin/umunna");
    const data = await res.json();
    if (!data.error) setPendingKYC(data.pendingUsers ?? []);
  }

  async function kycAction(userId: string, status: string) {
    setSavingKYC(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_user_status", id: userId, data: { status } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(status === "approved" ? "User approved!" : "User rejected");
      loadKYC();
    } catch (err: any) { toast.error(err.message); }
    setSavingKYC(false);
  }

  async function loadGroupData() {
    if (!selectedGroup) return;
    setLoading(true);
    const [m, p, f] = await Promise.all([
      supabase.from("group_members")
        .select("*, users(full_name,email,phone,avatar_url,status)")
        .eq("group_id", selectedGroup.id).order("joined_at", { ascending: false }),
      supabase.from("polls").select("*, votes(option_id)")
        .eq("group_id", selectedGroup.id).is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("files").select("*")
        .eq("group_id", selectedGroup.id).is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);
    setMembers(m.data ?? []);
    setPolls(p.data ?? []);
    setFiles(f.data ?? []);
    setLoading(false);
    loadKYC();
  }

  async function updateMember(memberId: string, status: string) {
    const { error } = await supabase.from("group_members").update({ status }).eq("id", memberId);
    if (error) toast.error(error.message);
    else { toast.success(`Member ${status}`); loadGroupData(); }
  }

  async function createPoll() {
    const validOptions = pollForm.options.filter(o => o.trim());
    if (!pollForm.question || validOptions.length < 2 || !pollForm.ends_at) {
      return toast.error("Question, 2+ options and deadline required");
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("polls").insert({
      group_id: selectedGroup?.id,
      created_by: user?.id,
      question: pollForm.question,
      options: validOptions.map((text, i) => ({ id: String(i), text })),
      ends_at: new Date(pollForm.ends_at).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Poll published!"); setPollForm({ question: "", options: ["", ""], ends_at: "" }); loadGroupData(); }
    setLoading(false);
  }

  async function uploadFile() {
    if (!fileToUpload || !fileForm.name || !fileForm.password) return toast.error("Missing fields");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${selectedGroup?.id}/${Date.now()}-${fileToUpload.name}`;
      const { data: up, error: upErr } = await supabase.storage.from("group-files").upload(path, fileToUpload);
      if (upErr) throw upErr;
      const hashRes = await fetch("/api/hash-password", { method: "POST", body: JSON.stringify({ password: fileForm.password }) });
      const { hash } = await hashRes.json();
      await supabase.from("files").insert({ group_id: selectedGroup?.id, uploaded_by: user?.id, name: fileForm.name, storage_path: up.path, password_hash: hash });
      toast.success("File uploaded!"); setFileForm({ name: "", password: "" }); setFileToUpload(null); loadGroupData();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function deleteFile(fileId: string) {
    const { data: f } = await supabase.from("files").select("storage_path").eq("id", fileId).single();
    if (f?.storage_path) await supabase.storage.from("group-files").remove([f.storage_path]);
    await supabase.from("files").delete().eq("id", fileId);
    toast.success("Deleted"); loadGroupData();
  }

  const pending  = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");

  const S: React.CSSProperties = { width: "100%", border: "1px solid #c8e6c9", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const BG: React.CSSProperties = { background: "#2d6a2d", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BB: React.CSSProperties = { background: "#6b3a1f", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const BR: React.CSSProperties = { background: "#dc2626", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const CARD: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "Outfit, sans-serif", boxSizing: "border-box", width: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#2d6a2d", color: "white", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <button onClick={() => router.push("/dashboard")}
              style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, marginBottom: 8, display: "block" }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              🛡️ {selectedGroup ? selectedGroup.name : "Group Management"}
            </h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, boxSizing: "border-box", width: "100%" }}>
        {/* Group selector — show only if multiple groups */}
        {groups.length > 1 && (
          <div style={{ ...CARD, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontWeight: 600, color: "#374151", fontSize: 13, margin: "0 0 4px", width: "100%" }}>Select Group:</p>
            {groups.map(g => (
              <button key={g.id} onClick={() => setSelectedGroup(g)}
                style={{ padding: "6px 14px", borderRadius: 20, border: "2px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: selectedGroup?.id === g.id ? "#2d6a2d" : "white",
                  color: selectedGroup?.id === g.id ? "white" : "#2d6a2d",
                  borderColor: "#2d6a2d" }}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {!selectedGroup ? (
          <div style={{ ...CARD, textAlign: "center", padding: 40, color: "#9ca3af" }}>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>👥</p>
            <p style={{ fontWeight: 600 }}>No group assigned to you yet</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
              {[
                ...(selectedGroup?.type === "umunna" ? [{ id: "kyc", label: `KYC Approvals (${pendingKYC.length})` }] : []),
                { id: "members", label: `Members (${pending.length} pending)` },
                { id: "polls",   label: "Polls" },
                { id: "files",   label: "Documents" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                    background: tab === t.id ? "#2d6a2d" : "white",
                    color: tab === t.id ? "white" : "#374151",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* KYC APPROVALS — umunna only */}
            {tab === "kyc" && selectedGroup?.type === "umunna" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", margin: 0 }}>
                    KYC Approvals — {selectedGroup.name} ({pendingKYC.length})
                  </h2>
                  <button onClick={loadKYC}
                    style={{ ...BG, padding: "6px 14px", fontSize: 12 }}>
                    🔄 Refresh
                  </button>
                </div>
                {pendingKYC.length === 0 ? (
                  <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
                    <p style={{ fontSize: 36, margin: "0 0 8px" }}>✅</p>
                    <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>No pending approvals</p>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                      New registrations from {selectedGroup.name} will appear here
                    </p>
                  </div>
                ) : pendingKYC.map((u: any) => (
                  <div key={u.id} style={CARD}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 15, color: "#2d6a2d", margin: "0 0 6px" }}>
                          {u.full_name || "⚠️ KYC not submitted"}
                        </p>
                        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📧 {u.email}</p>
                        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>📞 {u.phone || "Not provided"}</p>
                        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>🏡 {u.village || "Not submitted"}</p>
                        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 2px" }}>👤 {u.sex || "—"} · 🎂 {u.date_of_birth || "—"}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                          Registered: {new Date(u.created_at).toLocaleString()}
                        </p>
                        <div style={{ marginTop: 6 }}>
                          {!u.village
                            ? <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>⏳ Awaiting KYC</span>
                            : <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>✅ KYC submitted</span>
                          }
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignSelf: "flex-start", flexWrap: "wrap" }}>
                        <button onClick={() => kycAction(u.id, "approved")} disabled={savingKYC} style={BG}>✅ Approve</button>
                        <button onClick={() => kycAction(u.id, "rejected")} disabled={savingKYC} style={BR}>❌ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MEMBERS */}
            {tab === "members" && (
              <div>
                {pending.length > 0 && (
                  <div style={{ ...CARD, borderTop: "3px solid #f97316" }}>
                    <h3 style={{ fontWeight: 700, color: "#ea580c", marginBottom: 12, fontSize: 14 }}>
                      Membership Requests ({pending.length})
                    </h3>
                    {pending.map(m => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>{m.users?.full_name}</p>
                          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{m.users?.email} · {m.users?.phone}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => updateMember(m.id, "approved")} style={BG}>Approve</button>
                          <button onClick={() => updateMember(m.id, "denied")} style={BR}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={CARD}>
                  <h3 style={{ fontWeight: 700, color: "#374151", marginBottom: 12, fontSize: 14 }}>
                    Active Members ({approved.length})
                  </h3>
                  {approved.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No approved members yet</p>}
                  {approved.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#2d6a2d", flexShrink: 0 }}>
                          {m.users?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 13 }}>{m.users?.full_name}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Member</p>
                        </div>
                      </div>
                      <button onClick={() => updateMember(m.id, "suspended")}
                        style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Suspend
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POLLS */}
            {tab === "polls" && (
              <div>
                <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
                  <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 14 }}>Create Poll</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input value={pollForm.question} onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))} placeholder="Poll question *" style={S} />
                    {pollForm.options.map((opt, i) => (
                      <input key={i} value={opt}
                        onChange={e => { const o = [...pollForm.options]; o[i] = e.target.value; setPollForm(p => ({ ...p, options: o })); }}
                        placeholder={`Option ${i + 1}`} style={S} />
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
                {polls.map(p => {
                  const total = p.votes?.length ?? 0;
                  const isExpired = new Date(p.ends_at) < new Date();
                  return (
                    <div key={p.id} style={CARD}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, color: "#2d6a2d", margin: 0, fontSize: 14 }}>{p.question}</p>
                        <span style={{ fontSize: 11, background: isExpired ? "#f3f4f6" : "#dcfce7", color: isExpired ? "#6b7280" : "#166534", padding: "2px 8px", borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>
                          {isExpired ? "Closed" : "Active"}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>{total} votes · Ends {new Date(p.ends_at).toLocaleDateString()}</p>
                      {(p.options ?? []).map((opt: any) => {
                        const count = (p.votes ?? []).filter((v: any) => v.option_id === opt.id).length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={opt.id} style={{ marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                              <span>{opt.text}</span><span style={{ fontWeight: 700, color: "#2d6a2d" }}>{pct}%</span>
                            </div>
                            <div style={{ height: 4, background: "#f3f4f6", borderRadius: 4 }}>
                              <div style={{ height: 4, background: "#2d6a2d", borderRadius: 4, width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* FILES */}
            {tab === "files" && (
              <div>
                <div style={{ ...CARD, borderTop: "3px solid #2d6a2d" }}>
                  <h3 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 14 }}>🔒 Upload Secure Document</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input value={fileForm.name} onChange={e => setFileForm(p => ({ ...p, name: e.target.value }))} placeholder="Document title *" style={S} />
                    <input type="password" value={fileForm.password} onChange={e => setFileForm(p => ({ ...p, password: e.target.value }))} placeholder="Set protection password *" style={S} />
                    <div style={{ border: "2px dashed #c8e6c9", borderRadius: 10, padding: 20, textAlign: "center", position: "relative", cursor: "pointer" }}>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFileToUpload(e.target.files?.[0] ?? null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                      <p style={{ fontSize: 13, color: fileToUpload ? "#2d6a2d" : "#9ca3af", fontWeight: 600, margin: 0 }}>
                        {fileToUpload ? `✅ ${fileToUpload.name}` : "Select PDF or Document"}
                      </p>
                    </div>
                    <button onClick={uploadFile} disabled={loading || !fileToUpload} style={BG}>
                      {loading ? "Uploading..." : "Upload Document"}
                    </button>
                  </div>
                </div>
                {files.map(f => (
                  <div key={f.id} style={{ ...CARD, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 700, margin: "0 0 2px" }}>📄 {f.name}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{new Date(f.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => deleteFile(f.id)} style={BR}>Delete</button>
                  </div>
                ))}
                {files.length === 0 && <div style={{ ...CARD, textAlign: "center", color: "#9ca3af", padding: 32 }}>No documents yet</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
