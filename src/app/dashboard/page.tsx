"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function FeedPage() {
  const [userId, setUserId]       = useState<string>("");
  const [profile, setProfile]     = useState<any>(null);
  const [posts, setPosts]         = useState<any[]>([]);
  const [content, setContent]     = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting]     = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      supabase.from("users").select("*")
        .eq("id", data.user.id).single()
        .then(({ data: p }) => setProfile(p));
    });

    loadPosts();

    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "posts",
      }, () => loadPosts())
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comments",
      }, () => loadPosts())
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "likes",
      }, () => loadPosts())
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "likes",
      }, () => loadPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        users!posts_author_id_fkey (id, full_name, avatar_url),
        comments (
          id, content, created_at, deleted_at,
          users!comments_author_id_fkey (id, full_name, avatar_url)
        ),
        likes (user_id)
      `)
      .is("deleted_at", null)
      .eq("scope", "community")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { console.error(error); return; }
    setPosts(data ?? []);
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const path = `posts/${userId}/${Date.now()}-${imageFile.name}`;
        const { data: up } = await supabase.storage
          .from("post-images").upload(path, imageFile);
        if (up) {
          image_url = supabase.storage
            .from("post-images").getPublicUrl(up.path).data.publicUrl;
        }
      }
      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        content: content.trim(),
        image_url,
        scope: "community",
      });
      if (error) throw error;
      setContent(""); setImageFile(null);
      toast.success("Posted!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: string) {
    const post = posts.find((p) => p.id === postId);
    const liked = post?.likes?.some((l: any) => l.user_id === userId);
    if (liked) {
      await supabase.from("likes")
        .delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    }
  }

  async function addComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    if (!profile?.comment_enabled) {
      return toast.error("Your commenting privilege is restricted.");
    }
    await supabase.from("comments").insert({
      post_id: postId, author_id: userId, content: text,
    });
    setCommentTexts((p) => ({ ...p, [postId]: "" }));
  }

  async function deletePost(postId: string) {
    await supabase.from("posts")
      .update({ deleted_at: new Date().toISOString() }).eq("id", postId);
    toast.success("Post deleted");
  }

  async function deleteComment(commentId: string) {
    await supabase.from("comments")
      .update({ deleted_at: new Date().toISOString() }).eq("id", commentId);
    loadPosts();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, maxWidth: 680, margin: "0 auto" }}
      className="md:grid-cols-[1fr]">

      {/* Post composer */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "2px solid #2d6a2d", flexShrink: 0 }} />
          <textarea value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "Outfit, sans-serif" }} />
        </div>

        {imageFile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 10px", background: "#eaf5ea", borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: "#2d6a2d" }}>📎 {imageFile.name}</span>
            <button onClick={() => setImageFile(null)}
              style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background: "#eaf5ea", color: "#2d6a2d", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            📷 Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          <button onClick={handlePost} disabled={posting || (!content.trim() && !imageFile)}
            style={{ background: posting ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 700, marginLeft: "auto" }}>
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Feed posts */}
      {posts.length === 0 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 8px" }}>📭</p>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>No posts yet. Be the first to post!</p>
        </div>
      )}

      {posts.map((post) => {
        const liked = post.likes?.some((l: any) => l.user_id === userId);
        const isOwn = post.author_id === userId;
        const activeComments = post.comments?.filter((c: any) => !c.deleted_at) ?? [];

        return (
          <div key={post.id}
            style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>

            {/* Post header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
              <img src={post.users?.avatar_url ?? "/avatar-placeholder.png"}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #2d6a2d" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 14, color: "#111827" }}>
                  {post.users?.full_name ?? "Community Member"}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  {timeAgo(post.created_at)}
                </p>
              </div>
              {isOwn && (
                <button onClick={() => deletePost(post.id)}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18 }}
                  title="Delete post">🗑️</button>
              )}
            </div>

            {/* Post content */}
            {post.content && (
              <p style={{ padding: "0 16px 12px", fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                {post.content}
              </p>
            )}
            {post.image_url && (
              <img src={post.image_url} alt=""
                style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
            )}

            {/* Like and comment counts */}
            <div style={{ display: "flex", gap: 20, padding: "10px 16px", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
              <button onClick={() => toggleLike(post.id)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: liked ? 700 : 400, color: liked ? "#2d6a2d" : "#6b7280" }}>
                {liked ? "👍" : "👍"} {post.likes?.length ?? 0}
              </button>
              <span style={{ fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                💬 {activeComments.length}
              </span>
            </div>

            {/* Comments */}
            {activeComments.length > 0 && (
              <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {activeComments.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", gap: 8 }}>
                    <img src={c.users?.avatar_url ?? "/avatar-placeholder.png"}
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "7px 12px", flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px", color: "#2d6a2d" }}>
                        {c.users?.full_name}
                      </p>
                      <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>{c.content}</p>
                    </div>
                    {(c.users?.id === userId) && (
                      <button onClick={() => deleteComment(c.id)}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, alignSelf: "center" }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div style={{ display: "flex", gap: 8, padding: "10px 16px" }}>
              <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
                style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <input
                value={commentTexts[post.id] ?? ""}
                onChange={(e) => setCommentTexts((p) => ({ ...p, [post.id]: e.target.value }))}
                placeholder="Write a comment..."
                onKeyDown={(e) => { if (e.key === "Enter") addComment(post.id); }}
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 20, padding: "7px 14px", fontSize: 13, outline: "none" }} />
              <button onClick={() => addComment(post.id)}
                disabled={!commentTexts[post.id]?.trim()}
                style={{ background: "#2d6a2d", color: "white", border: "none", padding: "7px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Send
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
