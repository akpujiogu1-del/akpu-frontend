"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToDMs, sendDM, getDMHistory, searchUsers } from "@/lib/realtime";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const [userId, setUserId]       = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [search, setSearch]       = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser]   = useState<any>(null);
  const [messages, setMessages]   = useState<any[]>([]);
  const [newMsg, setNewMsg]       = useState("");
  const [sending, setSending]     = useState(false);
  const [showChat, setShowChat]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      loadConversations(data.user.id);
      supabase.from("users").select("full_name,avatar_url").eq("id", data.user.id).single()
        .then(({ data: p }) => setUserProfile(p));

      const ch = subscribeToDMs(data.user.id, (msg) => {
        if (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) {
          setMessages(p => [...p, msg]);
        }
        loadConversations(data.user.id);
      });
      return () => { supabase.removeChannel(ch); };
    });
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations(uid: string) {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:users!sender_id(id,full_name,avatar_url), receiver:users!receiver_id(id,full_name,avatar_url)")
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
    setSelectedUser(user); setSearchResults([]); setSearch(""); setShowChat(true);
    const { data } = await getDMHistory(userId, user.id);
    setMessages(data ?? []);
  }

  async function handleSend() {
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg("");
    try {
      const { error } = await sendDM(userId, selectedUser.id, content);
      if (error) throw error;
      setMessages(p => [...p, {
        sender_id: userId, receiver_id: selectedUser.id,
        content, created_at: new Date().toISOString(),
        sender: userProfile,
      }]);
    } catch { toast.error("Failed to send"); setNewMsg(content); }
    setSending(false);
  }

  const S: React.CSSProperties = {
    fontFamily: "Outfit, sans-serif",
  };

  return (
    <div style={{ ...S, width: "100%", height: "calc(100vh - 140px)", minHeight: 400, display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", background: "white", boxSizing: "border-box" }}>

      {/* SIDEBAR — hidden on mobile when chat open */}
      <div style={{
        width: showChat ? 0 : "100%",
        maxWidth: 300,
        minWidth: showChat ? 0 : "100%",
        borderRight: "1px solid #f3f4f6",
        display: "flex",
        flexDirection: "column",
        background: "#fafafa",
        overflow: "hidden",
        flexShrink: 0,
        transition: "all 0.2s",
      }}
        className="md:min-w-[280px] md:max-w-[300px] md:flex md:flex-col"
      >
        <div style={{ padding: 16, borderBottom: "1px solid #f3f4f6", background: "white" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 12px" }}>Messages</h2>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search members..."
              style={{ width: "100%", background: "#f3f4f6", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, marginTop: 4, overflow: "hidden" }}>
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => openConversation(u)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f9fafb" }}>
                    <img src={u.avatar_url ?? "/avatar-placeholder.png"} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{u.full_name}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{u.village || "Member"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>💬</p>
              <p style={{ fontSize: 13, fontWeight: 600 }}>No chats yet</p>
            </div>
          ) : conversations.map((c, i) => (
            <button key={i} onClick={() => openConversation(c.other)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: selectedUser?.id === c.other?.id ? "white" : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
              <img src={c.other?.avatar_url ?? "/avatar-placeholder.png"} style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.other?.full_name}</p>
                  <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginLeft: 4 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{
        flex: 1,
        display: showChat ? "flex" : "none",
        flexDirection: "column",
        minWidth: 0,
        background: "white",
      }}
        className="md:flex md:flex-col"
        ref={el => { if (el) el.style.display = "flex"; }}
      >
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10, background: "white" }}>
              <button onClick={() => setShowChat(false)}
                className="md:hidden"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#2d6a2d", padding: "0 8px 0 0", flexShrink: 0 }}>
                ←
              </button>
              <img src={selectedUser.avatar_url ?? "/avatar-placeholder.png"} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: "#111827", margin: 0 }}>{selectedUser.full_name}</p>
                <p style={{ fontSize: 11, color: "#2d6a2d", margin: 0, fontWeight: 600 }}>● Online</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => {
                const isMe = m.sender_id === userId;
                const senderName = isMe ? (userProfile?.full_name ?? "You") : selectedUser.full_name;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "75%", minWidth: 0 }}>
                      {/* Show sender name above bubble */}
                      <p style={{ fontSize: 11, fontWeight: 700, color: isMe ? "#6b7280" : "#6b3a1f", margin: "0 0 3px", textAlign: isMe ? "right" : "left" }}>
                        {senderName}
                      </p>
                      <div style={{
                        background: isMe ? "#2d6a2d" : "#f3f4f6",
                        color: isMe ? "white" : "#111827",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        padding: "10px 14px",
                        wordBreak: "break-word",
                      }}>
                        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{m.content}</p>
                      </div>
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: "3px 0 0", textAlign: isMe ? "right" : "left" }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8, alignItems: "center", background: "white" }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message..."
                style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 14, outline: "none", minWidth: 0 }} />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                style={{ background: newMsg.trim() ? "#2d6a2d" : "#e5e7eb", color: newMsg.trim() ? "white" : "#9ca3af", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                →
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}
            className="hidden md:flex">
            <div>
              <p style={{ fontSize: 48, margin: "0 0 12px" }}>💬</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Your Conversations</h3>
              <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>Select a conversation or search for a member to start chatting.</p>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE: show conversation list when no chat selected */}
      {!showChat && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          className="hidden md:flex">
          <div style={{ textAlign: "center", padding: 32 }}>
            <p style={{ fontSize: 48, margin: "0 0 12px" }}>💬</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
