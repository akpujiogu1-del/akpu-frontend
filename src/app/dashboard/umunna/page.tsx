"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { castVote, getPollResults } from "@/lib/polls";
import toast from "react-hot-toast";

export default function UmunnaPage() {
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState("groups");
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, any>>({});
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [chatMsg, setChatMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadAll(data.user.id); }
    });
  }, []);

  async function loadAll(uid: string) {
    const { data: groups } = await supabase.from("groups").select("*").is("deleted_at", null).order("name");
    const { data: memberships } = await supabase.from("group_members").select("*, groups(id, name, type)").eq("user_id", uid);
    setAllGroups(groups ?? []);
    setMyMemberships(memberships ?? []);
  }

  async function requestJoin(groupId: string) {
    const already = myMemberships.find(m => m.group_id === groupId);
    if (already) return toast.error(`Already ${already.status}`);
    await supabase.from("group_members").insert({ group_id: groupId, user_id: userId, status: "pending" });
    toast.success("Join request sent! Awaiting admin approval.");
    loadAll(userId);
  }

  async function openGroupChat(group: any) {
    setSelectedGroup(group); setTab("chat");
    const { data } = await supabase.from("messages")
      .select("*, users!sender_id(full_name, avatar_url)")
      .eq("group_id", group.id).is("deleted_at", null).order("created_at");
    setGroupMessages(data ?? []);
    const { data: p } = await supabase.from("polls").select("*").eq("group_id", group.id).is("deleted_at", null).order("created_at", { ascending: false });
    setPolls(p ?? []);
    const results: Record<string, any> = {};
    for (const poll of p ?? []) { results[poll.id] = await getPollResults(poll.id); }
    setPollResults(results);
  }

  async function sendGroupMsg() {
    if (!chatMsg.trim() || !selectedGroup) return;
    await supabase.from("messages").insert({ sender_id: userId, group_id: selectedGroup.id, content: chatMsg.trim() });
    setChatMsg("");
    const { data } = await supabase.from("messages")
      .select("*, users!sender_id(full_name, avatar_url)")
      .eq("group_id", selectedGroup.id).is("deleted_at", null).order("created_at");
    setGroupMessages(data ?? []);
  }

  async function handleVote(pollId: string, optionId: string) {
    try {
      await castVote(pollId, userId, optionId);
      toast.success("Vote cast!");
      const result = await getPollResults(pollId);
      setPollResults(p => ({ ...p, [pollId]: result }));
    } catch (err: any) { toast.error(err.message); }
  }

  const myGroupIds = myMemberships.filter(m => m.status === "approved").map(m => m.group_id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Umunna, Groups & Age Grades</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {["groups", "my groups", "chat"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-primary text-white" : "bg-white border hover:bg-primary-50 text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allGroups.map(g => {
            const membership = myMemberships.find(m => m.group_id === g.id);
            return (
              <div key={g.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
                <p className="font-bold text-primary">{g.name}</p>
                <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full">{g.type}</span>
                {g.description && <p className="text-xs text-gray-500 mt-2">{g.description}</p>}
                <div className="mt-4">
                  {!membership && (
                    <button onClick={() => requestJoin(g.id)}
                      className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary-dark w-full">
                      Request to Join
                    </button>
                  )}
                  {membership?.status === "pending" && (
                    <span className="block text-center text-xs bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg font-semibold">⏳ Request Pending</span>
                  )}
                  {membership?.status === "approved" && (
                    <button onClick={() => openGroupChat(g)}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark w-full">
                      Open Group
                    </button>
                  )}
                  {membership?.status === "denied" && (
                    <span className="block text-center text-xs bg-red-100 text-red-600 px-3 py-2 rounded-lg font-semibold">Request Denied</span>
                  )}
                  {membership?.status === "suspended" && (
                    <span className="block text-center text-xs bg-orange-100 text-orange-600 px-3 py-2 rounded-lg font-semibold">Suspended from group</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "my groups" && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myMemberships.filter(m => m.status === "approved").map(m => (
            <div key={m.id} className="bg-white rounded-xl border p-5">
              <p className="font-bold text-primary">{(m.groups as any)?.name}</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Member</span>
              <button onClick={() => openGroupChat(m.groups)}
                className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark w-full">
                Open Group
              </button>
            </div>
          ))}
          {myMemberships.filter(m => m.status === "approved").length === 0 && (
            <p className="text-gray-500 col-span-3">You are not a member of any group yet.</p>
          )}
        </div>
      )}

      {tab === "chat" && selectedGroup && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="font-bold text-primary mb-3">{selectedGroup.name} — Group Chat</h2>
            <div className="bg-white rounded-xl border h-96 overflow-y-auto p-4 space-y-3 mb-3">
              {groupMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.sender_id === userId ? "bg-primary text-white" : "bg-gray-100"}`}>
                    {m.sender_id !== userId && <p className="text-xs font-semibold mb-1 text-secondary">{(m.users as any)?.full_name}</p>}
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendGroupMsg(); }}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={sendGroupMsg} disabled={!chatMsg.trim()}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                Send
              </button>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-secondary mb-3">Group Polls</h2>
            {polls.length === 0 && <p className="text-gray-400 text-sm">No polls yet.</p>}
            {polls.map(p => {
              const result = pollResults[p.id];
              const ended = new Date(p.ends_at) < new Date();
              return (
                <div key={p.id} className="bg-white rounded-xl border p-4 mb-4">
                  <p className="font-bold text-sm text-primary mb-1">{p.question}</p>
                  <p className="text-xs text-gray-400 mb-3">{ended ? "Voting closed" : `Ends: ${new Date(p.ends_at).toLocaleDateString()}`}</p>
                  <div className="space-y-2">
                    {(p.options ?? []).map((opt: any) => {
                      const count = result?.counts?.[opt.id] ?? 0;
                      const total = result?.total ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={opt.id}>
                          <button onClick={() => !ended && handleVote(p.id, opt.id)} disabled={ended}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition ${ended ? "bg-gray-50 cursor-default" : "hover:bg-primary-50 hover:border-primary"}`}>
                            {opt.text} — {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                          </button>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                            <div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
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
