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
          // Only add the message if it belongs to the current open chat
          if (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) {
            setMessages(p => [...p, msg]);
          }
          // Refresh the list to update last message preview
          loadConversations(data.user.id);
        });

        return () => { supabase.removeChannel(ch); };
      }
    });
  }, [selectedUser]); // Dependency on selectedUser ensures current chat logic

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

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
      if (other && !seen.has(other.id)) { 
        seen.add(other.id); 
        unique.push({ ...m, other }); 
      }
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
    setSelectedUser(user); 
    setSearchResults([]); 
    setSearch("");
    const { data } = await getDMHistory(userId, user.id);
    setMessages(data ?? []);
  }

  async function handleSend() {
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg(""); // Clear immediately for better UX
    
    try {
      const { error } = await sendDM(userId, selectedUser.id, content);
      if (error) throw error;
      
      // Optimistically add message
      setMessages(p => [...p, { 
        sender_id: userId, 
        receiver_id: selectedUser.id, 
        content: content, 
        created_at: new Date().toISOString() 
      }]);
    } catch { 
      toast.error("Failed to send message"); 
      setNewMsg(content); // Restore if failed
    }
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className="w-80 border-r border-gray-50 flex flex-col shrink-0 bg-gray-50/30">
        <div className="p-4 border-b border-gray-50 bg-white">
          <h2 className="text-lg font-black text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <input 
              value={search} 
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary transition-all" 
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-2 z-50 overflow-hidden">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => openConversation(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 text-left border-b border-gray-50 last:border-none">
                    <img src={u.avatar_url ?? `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{u.full_name}</p>
                      <p className="text-[10px] text-gray-400">@{u.village || 'Member'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">No chats yet</p>
            </div>
          ) : (
            conversations.map((c, i) => (
              <button key={i} onClick={() => openConversation(c.other)}
                className={`w-full flex items-center gap-4 px-4 py-5 border-b border-gray-50/50 hover:bg-white text-left transition-all ${selectedUser?.id === c.other?.id ? "bg-white shadow-inner" : ""}`}>
                <div className="relative">
                  <img src={c.other?.avatar_url ?? `https://ui-avatars.com/api/?name=${c.other?.full_name}`} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sm text-gray-900 truncate">{c.other?.full_name}</p>
                    <span className="text-[9px] font-bold text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate font-medium">{c.content}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <img src={selectedUser.avatar_url ?? `https://ui-avatars.com/api/?name=${selectedUser.full_name}`} className="w-10 h-10 rounded-2xl object-cover" />
                <div>
                  <p className="font-black text-gray-900 leading-none">{selectedUser.full_name}</p>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter mt-1">Online</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/bg-pattern.png')] bg-fixed">
              {messages.map((m, i) => {
                const isMe = m.sender_id === userId;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`px-5 py-3 shadow-sm ${
                        isMe 
                        ? "bg-primary text-white rounded-[1.5rem] rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-[1.5rem] rounded-tl-none"
                      }`}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                      </div>
                      <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${isMe ? "text-right text-gray-400" : "text-left text-gray-400"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-50">
              <div className="flex items-center gap-3 bg-gray-50 rounded-[2rem] px-2 py-2">
                <input 
                  value={newMsg} 
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none placeholder:text-gray-400" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={sending || !newMsg.trim()}
                  className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-dark transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                >
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-10">
            <div className="max-w-xs">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl grayscale opacity-40">💬</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Your Conversations</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Connect with your Umunna and other community members privately. Select a chat to begin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}