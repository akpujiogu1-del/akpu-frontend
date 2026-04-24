"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

function AnnouncementRow() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("announcements").select("text").eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setText(data?.text ?? null));
    const ch = supabase.channel("ann-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" },
        () => supabase.from("announcements").select("text").eq("active", true)
          .order("created_at", { ascending: false }).limit(1).maybeSingle()
          .then(({ data }) => setText(data?.text ?? null)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  if (!text) return null;
  return (
    <div style={{ background: "#6b3a1f", color: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 16, overflow: "hidden" }}>
      <div style={{ display: "inline-block", animation: "marquee 30s linear infinite", whiteSpace: "nowrap", fontSize: 14, fontWeight: 600, paddingLeft: "100%" }}>
        📢 &nbsp; {text} &nbsp;&nbsp;&nbsp; 📢 &nbsp; {text}
      </div>
      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}`}</style>
    </div>
  );
}

export default function FeedPage() {
  const [userId, setUserId]   = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts]     = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments]   = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      supabase.from("users").select("*").eq("id", data.user.id).single()
        .then(({ data: p }) => setProfile(p));
    });
    loadPosts();
    const ch = supabase.channel("feed-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, loadPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, loadPosts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, users!posts_author_id_fkey(id,full_name,avatar_url),
        comments(id,content,created_at,deleted_at,author_id,
          users!comments_author_id_fkey(id,full_name,avatar_url)),
        likes(user_id)`)
      .is("deleted_at", null)
      .eq("scope", "community")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setPosts(data ?? []);
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const path = `posts/${userId}/${Date.now()}-${imageFile.name}`;
        const { data: up, error: upErr } = await supabase.storage
          .from("post-images").upload(path, imageFile);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("post-images").getPublicUrl(up.path).data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: userId, content: content.trim(), image_url, scope: "community",
      });
      if (error) throw error;
      setContent(""); setImageFile(null); setImagePreview(null);
    } catch (err: any) { toast.error(err.message); }
    finally { setPosting(false); }
  }

  async function toggleLike(postId: string) {
    const post = posts.find((p) => p.id === postId);
    const liked = post?.likes?.some((l: any) => l.user_id === userId);
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    }
  }

  async function addComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    if (!profile?.comment_enabled) return toast.error("Commenting restricted.");
    const { error } = await supabase.from("comments").insert({
      post_id: postId, author_id: userId, content: text,
    });
    if (!error) setCommentTexts((p) => ({ ...p, [postId]: "" }));
    else toast.error(error.message);
  }

  async function deletePost(postId: string) {
    const { error } = await supabase.from("posts")
      .update({ deleted_at: new Date().toISOString() }).eq("id", postId);
    if (error) toast.error(error.message);
    else { toast.success("Post deleted"); loadPosts(); }
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase.from("comments")
      .update({ deleted_at: new Date().toISOString() }).eq("id", commentId);
    if (error) toast.error(error.message);
    else loadPosts();
  }

  function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function toggleComments(postId: string) {
    setOpenComments((p) => ({ ...p, [postId]: !p[postId] }));
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <AnnouncementRow />

      {/* Composer */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "2px solid #2d6a2d", flexShrink: 0 }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?" rows={3}
            style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" }} />
        </div>

        {imagePreview && (
          <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
            <img src={imagePreview} style={{ maxHeight: 160, borderRadius: 10, border: "1px solid #e5e7eb" }} />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              style={{ position: "absolute", top: 4, right: 4, background: "#dc2626", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background: "#eaf5ea", color: "#2d6a2d", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            📷 Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }
            }} />
          <button onClick={handlePost} disabled={posting || (!content.trim() && !imageFile)}
            style={{ background: posting ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 700, marginLeft: "auto" }}>
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 8px" }}>📭</p>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>No posts yet. Be the first!</p>
        </div>
      )}

      {posts.map((post) => {
        const liked = post.likes?.some((l: any) => l.user_id === userId);
        const isOwn = post.author_id === userId;
        const activeComments = (post.comments ?? []).filter((c: any) => !c.deleted_at);
        const showComments = openComments[post.id];
        const isExpanded = expandedComments[post.id];
        const visibleComments = showComments
          ? (isExpanded ? activeComments : activeComments.slice(-4))
          : [];

        return (
          <div key={post.id} style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", marginBottom: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
              <img src={post.users?.avatar_url ?? "/avatar-placeholder.png"}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #2d6a2d" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>
                  {post.users?.full_name ?? "Community Member"}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{timeAgo(post.created_at)}</p>
              </div>
              {isOwn && (
                <button
                  onClick={() => deletePost(post.id)}
                  style={{ background: "#fee2e2", border: "none", color: "#dc2626", cursor: "pointer", padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  🗑️ Delete
                </button>
              )}
            </div>

            {post.content && (
              <p style={{ padding: "0 16px 12px", fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                {post.content}
              </p>
            )}
            {post.image_url && (
              <img src={post.image_url} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
            )}

            {/* Actions row */}
            <div style={{ display: "flex", gap: 16, padding: "10px 16px", borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => toggleLike(post.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: liked ? 700 : 400, color: liked ? "#2d6a2d" : "#6b7280", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                👍 {post.likes?.length ?? 0}
              </button>
              <button onClick={() => toggleComments(post.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: showComments ? "#2d6a2d" : "#6b7280", fontWeight: showComments ? 700 : 400, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                💬 {activeComments.length} {showComments ? "▲" : "▼"}
              </button>
            </div>

            {/* Comments section */}
            {showComments && (
              <div style={{ padding: "0 16px 8px" }}>
                {/* Load more button */}
                {activeComments.length > 4 && !isExpanded && (
                  <button onClick={() => setExpandedComments((p) => ({ ...p, [post.id]: true }))}
                    style={{ background: "none", border: "none", color: "#2d6a2d", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0 8px", display: "block" }}>
                    ↑ View all {activeComments.length} comments
                  </button>
                )}
                {isExpanded && activeComments.length > 4 && (
                  <button onClick={() => setExpandedComments((p) => ({ ...p, [post.id]: false }))}
                    style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: "4px 0 8px", display: "block" }}>
                    ↓ Show less
                  </button>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {visibleComments.map((c: any) => (
                    <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <img src={c.users?.avatar_url ?? "/avatar-placeholder.png"}
                        style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ background: "#f9fafb", borderRadius: 10, padding: "7px 12px", flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px", color: "#2d6a2d" }}>
                          {c.users?.full_name}
                        </p>
                        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>{c.content}</p>
                      </div>
                      {(c.author_id === userId) && (
                        <button onClick={() => deleteComment(c.id)}
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, padding: "4px", alignSelf: "center" }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comment input */}
            <div style={{ display: "flex", gap: 8, padding: "8px 16px 12px" }}>
              <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
                style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <input value={commentTexts[post.id] ?? ""}
                onChange={(e) => setCommentTexts((p) => ({ ...p, [post.id]: e.target.value }))}
                placeholder="Write a comment..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(post.id); } }}
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 20, padding: "7px 14px", fontSize: 13, outline: "none" }} />
              <button onClick={() => addComment(post.id)}
                disabled={!commentTexts[post.id]?.trim()}
                style={{ background: commentTexts[post.id]?.trim() ? "#2d6a2d" : "#e5e7eb", color: commentTexts[post.id]?.trim() ? "white" : "#9ca3af", border: "none", padding: "7px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Send
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
