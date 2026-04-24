"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { castVote, getPollResults } from "@/lib/polls";
import toast from "react-hot-toast";

const TYPE_LABELS: Record<string, string> = {
  umunna:     "Umunna Groups",
  age_grade:  "Age Grades",
  group:      "Community Groups",
  community:  "Community",
};

const TYPE_ORDER = ["umunna", "age_grade", "group", "community"];

export default function UmunnaPage() {
  const [userId, setUserId]   = useState("");
  const [tab, setTab]         = useState("groups");
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [polls, setPolls]     = useState<any[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, any>>({});
  const [chatMsg, setChatMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadAll(data.user.id); }
    });
  }, []);

  async function loadAll(uid: string) {
    setLoading(true);
    const { data: groups } = await supabase
      .from("groups").select("*").is("deleted_at", null).order("name");
    const { data: myMemberships } = await supabase
      .from("group_members").select("*, groups(id,name,type)")
      .eq("user_id", uid);
    setAllGroups(groups ?? []);
    setMemberships(myMemberships ?? []);
    setLoading(false);
  }

  async function requestJoin(groupId: string) {
    const already = memberships.find((m) => m.group_id === groupId);
    if (already) return toast.error(`Already ${already.status} in this group`);
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId, user_id: userId, status: "pending",
    });
    if (error) toast.error(error.message);
    else { toast.success("Join request sent! Awaiting admin approval."); loadAll(userId); }
  }

  async function openGroup(group: any) {
    setSelectedGroup(group);
    setTab("chat");
    const { data: msgs } = await supabase
      .from("messages")
      .select("*, users!sender_id(full_name,avatar_url)")
      .eq("group_id", group.id).is("deleted_at", null)
      .order("created_at");
    setGroupMessages(msgs ?? []);

    const { data: p } = await supabase
      .from("polls").select("*").eq("group_id", group.id)
      .is("deleted_at", null).order("created_at", { ascending: false });
    setPolls(p ?? []);
    const results: Record<string, any> = {};
    for (const poll of p ?? []) {
      results[poll.id] = await getPollResults(poll.id);
    }
    setPollResults(results);
  }

  async function sendGroupMsg() {
    if (!chatMsg.trim() || !selectedGroup) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: userId, group_id: selectedGroup.id, content: chatMsg.trim(),
    });
    if (!error) {
      setChatMsg("");
      const { data } = await supabase
        .from("messages")
        .select("*, users!sender_id(full_name,avatar_url)")
        .eq("group_id", selectedGroup.id).is("deleted_at", null)
        .order("created_at");
      setGroupMessages(data ?? []);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    try {
      await castVote(pollId, userId, optionId);
      toast.success("Vote cast!");
      const result = await getPollResults(pollId);
      setPollResults((p) => ({ ...p, [pollId]: result }));
    } catch (err: any) { toast.error(err.message); }
  }

  const myApprovedGroupIds = memberships
    .filter((m) => m.status === "approved")
    .map((m) => m.group_id);

  const groupsByType = TYPE_ORDER.reduce((acc, type) => {
    acc[type] = allGroups.filter((g) => g.type === type);
    return acc;
  }, {} as Record<string, any[]>);

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 8, border: "none",
    fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
    background: tab === t ? "#2d6a2d" : "white",
    color: tab === t ? "white" : "#374151",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2d6a2d", marginBottom: 4 }}>
        Umunna, Groups & Age Grades
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        Join groups, chat with members, vote on polls and access files.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button onClick={() => setTab("groups")} style={tabStyle("groups")}>All Groups</button>
        <button onClick={() => setTab("mine")} style={tabStyle("mine")}>My Groups</button>
        {selectedGroup && <button onClick={() => setTab("chat")} style={tabStyle("chat")}>💬 {selectedGroup.name}</button>}
      </div>

      {/* ALL GROUPS — organised by type */}
      {tab === "groups" && (
        <div>
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading groups...</p>
          ) : (
            TYPE_ORDER.map((type) => {
              const list = groupsByType[type];
              if (!list || list.length === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6b3a1f", marginBottom: 12,
                    paddingBottom: 8, borderBottom: "2px solid #f3e0cc" }}>
                    {TYPE_LABELS[type]} ({list.length})
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {list.map((g) => {
                      const membership = memberships.find((m) => m.group_id === g.id);
                      return (
                        <div key={g.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>
                            {type === "umunna" ? "🤝" : type === "age_grade" ? "👥" : "🏘️"}
                          </div>
                          <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px", fontSize: 14 }}>{g.name}</p>
                          {g.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 10px" }}>{g.description}</p>}
                          <div style={{ marginTop: 8 }}>
                            {!membership && (
                              <button onClick={() => requestJoin(g.id)}
                                style={{ background: "#6b3a1f", color: "white", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                                Request to Join
                              </button>
                            )}
                            {membership?.status === "pending" && (
                              <span style={{ display: "block", textAlign: "center", fontSize: 12, background: "#fef9c3", color: "#854d0e", padding: "6px", borderRadius: 8, fontWeight: 600 }}>
                                ⏳ Request Pending
                              </span>
                            )}
                            {membership?.status === "approved" && (
                              <button onClick={() => openGroup(g)}
                                style={{ background: "#2d6a2d", color: "white", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                                Open Group 💬
                              </button>
                            )}
                            {membership?.status === "denied" && (
                              <span style={{ display: "block", textAlign: "center", fontSize: 12, background: "#fee2e2", color: "#991b1b", padding: "6px", borderRadius: 8, fontWeight: 600 }}>
                                Request Denied
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MY GROUPS */}
      {tab === "mine" && (
        <div>
          {myApprovedGroupIds.length === 0 ? (
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>👥</p>
              <p style={{ color: "#6b7280", fontWeight: 600 }}>You have not joined any groups yet.</p>
              <button onClick={() => setTab("groups")}
                style={{ background: "#2d6a2d", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>
                Browse Groups
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {memberships.filter((m) => m.status === "approved").map((m) => (
                <div key={m.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontWeight: 700, color: "#2d6a2d", margin: "0 0 4px" }}>{(m.groups as any)?.name}</p>
                  <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Member</span>
                  <button onClick={() => openGroup(m.groups)}
                    style={{ background: "#2d6a2d", color: "white", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 10 }}>
                    Open Group 💬
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GROUP CHAT + POLLS */}
      {tab === "chat" && selectedGroup && (
        <div style={{ display: "grid", gap: 16 }} className="md:grid-cols-[1fr_280px]">
          <div>
            <h2 style={{ fontWeight: 700, color: "#2d6a2d", marginBottom: 12, fontSize: 16 }}>
              💬 {selectedGroup.name}
            </h2>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", height: 380, overflowY: "auto", padding: 16, marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {groupMessages.length === 0 && (
                <p style={{ color: "#9ca3af", textAlign: "center", margin: "auto" }}>No messages yet. Start the conversation!</p>
              )}
              {groupMessages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.sender_id === userId ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "75%", background: m.sender_id === userId ? "#2d6a2d" : "#f3f4f6", color: m.sender_id === userId ? "white" : "#111827", borderRadius: 12, padding: "8px 14px" }}>
                    {m.sender_id !== userId && (
                      <p style={{ fontSize: 11, fontWeight: 700, margin: "0 0 4px", color: m.sender_id === userId ? "#c8e6c9" : "#6b3a1f" }}>
                        {(m.users as any)?.full_name}
                      </p>
                    )}
                    <p style={{ fontSize: 13, margin: 0 }}>{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendGroupMsg(); }}
                placeholder="Type a message..."
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
              <button onClick={sendGroupMsg} disabled={!chatMsg.trim()}
                style={{ background: chatMsg.trim() ? "#2d6a2d" : "#e5e7eb", color: chatMsg.trim() ? "white" : "#9ca3af", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Send
              </button>
            </div>
          </div>

          {/* Polls */}
          <div>
            <h2 style={{ fontWeight: 700, color: "#6b3a1f", marginBottom: 12, fontSize: 16 }}>📊 Polls</h2>
            {polls.length === 0 ? (
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                No polls yet
              </div>
            ) : polls.map((p) => {
              const result = pollResults[p.id];
              const ended = new Date(p.ends_at) < new Date();
              const myVote = result?.votes?.find((v: any) => v.user_id === userId);
              return (
                <div key={p.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 14, marginBottom: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#2d6a2d", margin: "0 0 4px" }}>{p.question}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 10px" }}>
                    {ended ? "Voting closed" : `Ends ${new Date(p.ends_at).toLocaleDateString()}`} · {result?.total ?? 0} votes
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(p.options ?? []).map((opt: any) => {
                      const count = result?.counts?.[opt.id] ?? 0;
                      const total = result?.total ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const isMyVote = myVote?.option_id === opt.id;
                      return (
                        <div key={opt.id}>
                          <button
                            onClick={() => !ended && !myVote && handleVote(p.id, opt.id)}
                            style={{ width: "100%", textAlign: "left", background: isMyVote ? "#eaf5ea" : "#f9fafb", border: isMyVote ? "1.5px solid #2d6a2d" : "1px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: ended || myVote ? "default" : "pointer", display: "flex", justifyContent: "space-between" }}>
                            <span>{opt.text}</span>
                            <span style={{ fontWeight: 700, color: "#2d6a2d" }}>{pct}%</span>
                          </button>
                          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 4, margin: "3px 0" }}>
                            <div style={{ height: 4, background: "#2d6a2d", borderRadius: 4, width: `${pct}%`, transition: "width 0.3s" }} />
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
    </div>
  );
}
