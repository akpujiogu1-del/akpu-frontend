"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { ImageIcon, Send } from "lucide-react";

export default function FeedPage() {
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single()
        .then(({ data: p }) => setProfile(p));
    });

    loadPosts();

    const ch = supabase
      .channel("feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => setPosts((p) => [payload.new, ...p])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select(
        "*, users(full_name, avatar_url), comments(*, users(full_name, avatar_url)), likes(user_id)"
      )
      .is("deleted_at", null)
      .eq("scope", "community")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts(data ?? []);
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const path = `posts/${Date.now()}-${imageFile.name}`;
        const { data: up } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile);
        if (up) {
          image_url = supabase.storage
            .from("post-images")
            .getPublicUrl(up.path).data.publicUrl;
        }
      }
      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        content,
        image_url,
        scope: "community",
      });
      if (error) throw error;
      setContent("");
      setImageFile(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: userId });
    }
    loadPosts();
  }

  async function addComment(postId: string, text: string) {
    if (!profile?.comment_enabled) {
      toast.error("Your commenting privileges are restricted.");
      return;
    }
    await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      content: text,
    });
    loadPosts();
  }

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex gap-3">
            <img
              src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 border rounded-lg p-3 resize-none text-sm focus:ring-2 focus:ring-primary outline-none"
              rows={3}
            />
          </div>

          {imageFile && (
            <p className="text-xs text-gray-500 mt-2">
              📎 {imageFile.name}
              <button
                onClick={() => setImageFile(null)}
                className="ml-2 text-red-400"
              >
                ✕
              </button>
            </p>
          )}

          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition px-3 py-1.5 rounded-lg hover:bg-primary-50"
            >
              <ImageIcon size={15} /> Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={handlePost}
              disabled={posting}
              className="flex items-center gap-1 bg-primary text-white text-sm px-4 py-1.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-60"
            >
              <Send size={14} /> {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userId={userId}
            onLike={toggleLike}
            onComment={addComment}
          />
        ))}
      </div>

      <aside className="hidden md:block space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-secondary-50 border border-secondary-100 rounded-xl p-4 text-center text-secondary text-sm font-medium"
          >
            Adverts
          </div>
        ))}
      </aside>
    </div>
  );
}

function PostCard({ post, userId, onLike, onComment }: any) {
  const [commentText, setCommentText] = useState("");
  const liked = post.likes?.some((l: any) => l.user_id === userId);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={post.users?.avatar_url ?? "/avatar-placeholder.png"}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-sm">{post.users?.full_name}</p>
          <p className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {post.content && (
        <p className="text-sm text-gray-700">{post.content}</p>
      )}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="rounded-lg w-full object-cover max-h-72"
        />
      )}

      <div className="flex gap-4 text-sm text-gray-500 border-t pt-2">
        <button
          onClick={() => onLike(post.id, liked)}
          className={`hover:text-primary transition ${liked ? "text-primary font-semibold" : ""}`}
        >
          👍 {post.likes?.length ?? 0}
        </button>
        <span>💬 {post.comments?.length ?? 0} comments</span>
      </div>

      {post.comments?.slice(-3).map((c: any) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <img
            src={c.users?.avatar_url ?? "/avatar-placeholder.png"}
            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
          />
          <div className="bg-gray-50 rounded-lg px-3 py-1.5 flex-1">
            <span className="font-semibold text-xs">
              {c.users?.full_name}
            </span>
            <p className="text-xs text-gray-600">{c.content}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onComment(post.id, commentText);
              setCommentText("");
            }
          }}
        />
        <button
          onClick={() => {
            onComment(post.id, commentText);
            setCommentText("");
          }}
          className="bg-primary text-white px-3 rounded-lg text-sm hover:bg-primary-dark"
        >
          Send
        </button>
      </div>
    </div>
  );
}