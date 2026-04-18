"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToDMs, sendDM, getDMHistory, searchUsers } from "@/lib/realtime";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadConversations(data.user.id);
        const ch = subscribeToDMs(data.user.id, (msg) => {
          setMessages(p => [...p, msg]);
          loadConversations(data.user.id);
        });
        return () => { supabase.removeChannel(ch); };
      }
    });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations(uid: string) {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:users!sender_id(id, full_name, avatar_url), receiver:users!receiver_id(id, full_name, avatar_url)")
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    const seen = new Set<string>();
    const unique: any[] = [];
    (data ?? []).forEach(m => {
      const other = m.sender_id === uid ? m.receiver : m.sender;
      if (other && !seen.has(other.id)) { seen.add(other.id); unique.push({ ...m, other }); }
    });
    setConversations(unique);
  }

  async function handleSearch(q: string) {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await searchUsers(q);
    setSearchResults((data ?? []).filter((u: any) => u.id !== userId));
  }

  async function openConversation(user: any) {
    setSelectedUser(user); setSearchResults([]); setSearch("");
    const { data } = await getDMHistory(userId, user.id);
    setMessages(data ?? []);
  }

  async function handleSend() {
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    try {
      const { error } = await sendDM(userId, selectedUser.id, newMsg.trim());
      if (error) throw error;
      setMessages(p => [...p, { sender_id: userId, receiver_id: selectedUser.id, content: newMsg.trim(), created_at: new Date().toISOString() }]);
      setNewMsg("");
    } catch { toast.error("Failed to send"); }
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border overflow-hidden">
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          {searchResults.length > 0 && (
            <div className="absolute bg-white border rounded-lg shadow-lg mt-1 z-10 w-64">
              {searchResults.map(u => (
                <button key={u.id} onClick={() => openConversation(u)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary-50 text-left">
                  <img src={u.avatar_url ?? "/avatar-placeholder.png"} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => openConversation(c.other)}
              className={`w-full flex items-center gap-3 px-3 py-3 border-b hover:bg-primary-50 text-left transition ${selectedUser?.id === c.other?.id ? "bg-primary-50" : ""}`}>
              <img src={c.other?.avatar_url ?? "/avatar-placeholder.png"} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.other?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{c.content}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="border-b px-4 py-3 flex items-center gap-3">
              <img src={selectedUser.avatar_url ?? "/avatar-placeholder.png"} className="w-9 h-9 rounded-full object-cover" />
              <p className="font-semibold">{selectedUser.full_name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.sender_id === userId ? "bg-primary text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                    {m.content}
                    <p className={`text-xs mt-1 ${m.sender_id === userId ? "text-primary-100" : "text-gray-400"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t px-4 py-3 flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 font-semibold">Select a conversation or search for a member to start chatting</p>
              <p className="text-gray-400 text-sm mt-1">Only approved members can message each other</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
