"use client";
import { useEffect, useState, useRef } from "react";
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { 
        setUserId(data.user.id); 
        loadAll(data.user.id); 
      }
    });
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  async function loadAll(uid: string) {
    const { data: groups } = await supabase.from("groups").select("*").is("deleted_at", null).order("name");
    const { data: memberships } = await supabase.from("group_members").select("*, groups(id, name, type)").eq("user_id", uid);
    setAllGroups(groups ?? []);
    setMyMemberships(memberships ?? []);
  }

  async function requestJoin(groupId: string) {
    const already = myMemberships.find(m => m.group_id === groupId);
    if (already) return toast.error(`Already ${already.status}`);
    
    const { error } = await supabase.from("group_members").insert({ 
      group_id: groupId, 
      user_id: userId, 
      status: "pending" 
    });

    if (error) return toast.error("Request failed");
    
    toast.success("Join request sent! Awaiting approval.");
    loadAll(userId);
  }

  async function openGroupChat(group: any) {
    setSelectedGroup(group); 
    setTab("chat");
    
    const { data } = await supabase.from("messages")
      .select("*, users!sender_id(full_name, avatar_url)")
      .eq("group_id", group.id)
      .is("deleted_at", null)
      .order("created_at");
    
    setGroupMessages(data ?? []);
    
    const { data: p } = await supabase.from("polls")
      .select("*")
      .eq("group_id", group.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    setPolls(p ?? []);
    
    const results: Record<string, any> = {};
    for (const poll of p ?? []) { 
      results[poll.id] = await getPollResults(poll.id); 
    }
    setPollResults(results);
  }

  async function sendGroupMsg() {
    if (!chatMsg.trim() || !selectedGroup) return;
    const content = chatMsg.trim();
    setChatMsg("");

    const { error } = await supabase.from("messages").insert({ 
      sender_id: userId, 
      group_id: selectedGroup.id, 
      content 
    });

    if (error) {
      toast.error("Message failed");
      setChatMsg(content);
    } else {
      // Re-load messages (In production, use Realtime subscriptions here)
      const { data } = await supabase.from("messages")
        .select("*, users!sender_id(full_name, avatar_url)")
        .eq("group_id", selectedGroup.id)
        .is("deleted_at", null)
        .order("created_at");
      setGroupMessages(data ?? []);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    try {
      await castVote(pollId, userId, optionId);
      toast.success("Vote recorded");
      const result = await getPollResults(pollId);
      setPollResults(p => ({ ...p, [pollId]: result }));
    } catch (err: any) { 
      toast.error(err.message); 
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Community Groups</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold text-[10px]">Umunna • Age Grades • Committees</p>
        </div>

        <div className="inline-flex bg-gray-100 p-1 rounded-2xl">
          {["groups", "my groups", "chat"].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              disabled={t === "chat" && !selectedGroup}
              className={`px-6 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                tab === t 
                ? "bg-white text-primary shadow-sm scale-100" 
                : "text-gray-400 hover:text-gray-600 disabled:opacity-30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "groups" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allGroups.map(g => {
            const membership = myMemberships.find(m => m.group_id === g.id);
            return (
              <div key={g.id} className="group bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {g.type}
                  </div>
                </div>
                <h3 className="font-black text-gray-900 text-xl mb-2">{g.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {g.description || "A community group for Akpu members to discuss and grow together."}
                </p>
                
                <div className="pt-4 border-t border-gray-50">
                  {!membership ? (
                    <button onClick={() => requestJoin(g.id)}
                      className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all text-sm">
                      Request to Join
                    </button>
                  ) : (
                    <div className="w-full">
                      {membership.status === "pending" && (
                        <div className="text-center py-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-black uppercase tracking-tighter">
                          ⏳ Approval Pending
                        </div>
                      )}
                      {membership.status === "approved" && (
                        <button onClick={() => openGroupChat(g)}
                          className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-all text-sm shadow-lg shadow-primary/10">
                          Enter Group
                        </button>
                      )}
                      {membership.status === "denied" && (
                        <div className="text-center py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-tighter">
                          Access Denied
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "my groups" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMemberships.filter(m => m.status === "approved").map(m => (
            <div key={m.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl mb-4">✅</div>
              <h3 className="font-black text-gray-900 text-xl mb-4">{(m.groups as any)?.name}</h3>
              <button onClick={() => openGroupChat(m.groups)}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all text-sm">
                Open Dashboard
              </button>
            </div>
          ))}
          {myMemberships.filter(m => m.status === "approved").length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-4">🏘️</p>
              <h3 className="text-lg font-black text-gray-900">No Memberships Yet</h3>
              <p className="text-gray-400 text-sm mt-2 mb-6">Join your Umunna or Age Grade to see them here.</p>
              <button onClick={() => setTab("groups")} className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline">
                Browse Groups →
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "chat" && selectedGroup && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Chat Panel */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-[600px]">
            <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                  {selectedGroup.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-gray-900">{selectedGroup.name}</h2>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Live Conversation</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
              {groupMessages.map((m, i) => {
                const isMe = m.sender_id === userId;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {!isMe && (
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5 ml-2">
                          {(m.users as any)?.full_name}
                        </p>
                      )}
                      <div className={`px-5 py-3 shadow-sm ${
                        isMe 
                        ? "bg-primary text-white rounded-[1.5rem] rounded-tr-none" 
                        : "bg-white text-gray-800 border border-gray-100 rounded-[1.5rem] rounded-tl-none"
                      }`}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-5 border-t border-gray-50 bg-white">
              <div className="flex gap-3 bg-gray-50 rounded-2xl p-2">
                <input 
                  value={chatMsg} 
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendGroupMsg(); }}
                  placeholder="Share something with the group..."
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none placeholder:text-gray-400" 
                />
                <button 
                  onClick={sendGroupMsg} 
                  disabled={!chatMsg.trim()}
                  className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/10 disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Polls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-black text-gray-900 px-2 flex items-center gap-2">
              <span>🗳️</span> Community Voting
            </h2>
            
            {polls.length === 0 && (
              <div className="bg-white rounded-[2rem] border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Active Polls</p>
              </div>
            )}
            
            {polls.map(p => {
              const result = pollResults[p.id];
              const ended = new Date(p.ends_at) < new Date();
              
              return (
                <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm overflow-hidden relative">
                  {ended && <div className="absolute top-4 right-4 text-[8px] font-black bg-gray-100 text-gray-400 px-2 py-1 rounded-full uppercase">Closed</div>}
                  
                  <p className="font-black text-gray-900 mb-2 leading-tight">{p.question}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-6">
                    {ended ? "Results are final" : `Deadline: ${new Date(p.ends_at).toLocaleDateString()}`}
                  </p>

                  <div className="space-y-4">
                    {(p.options ?? []).map((opt: any) => {
                      const count = result?.counts?.[opt.id] ?? 0;
                      const total = result?.total ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      
                      return (
                        <div key={opt.id} className="group/opt">
                          <button 
                            onClick={() => !ended && handleVote(p.id, opt.id)} 
                            disabled={ended}
                            className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                              ended 
                              ? "bg-gray-50 border-gray-100 cursor-default" 
                              : "bg-white border-gray-100 hover:border-primary active:scale-[0.98]"
                            }`}
                          >
                            <div className="relative z-10 flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-700">{opt.text}</span>
                              <span className="text-[10px] font-black text-primary">{pct}%</span>
                            </div>
                            
                            {/* Vote Percentage Progress Bar */}
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-primary/10 transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center px-1">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{result?.total || 0} Total Votes</p>
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