"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { ImageIcon, Send, Heart, MessageCircle, X, MoreHorizontal } from "lucide-react";

interface Post {
  id: string;
  created_at: string;
  content: string;
  image_url: string | null;
  author_id: string;
  users: { full_name: string; avatar_url: string | null };
  comments: any[];
  likes: { user_id: string }[];
}

export default function FeedPage() {
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: p } = await supabase.from("users").select("*").eq("id", data.user.id).single();
      setProfile(p);
    };

    initSession();
    loadPosts();

    const ch = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select(`*, users(full_name, avatar_url), comments(*, users(full_name, avatar_url)), likes(user_id)`)
      .is("deleted_at", null)
      .eq("scope", "community")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts(data as unknown as Post[] ?? []);
  }

  async function handlePost() {
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const path = `posts/${userId}/${Date.now()}.${fileExt}`;
        const { data: up, error: upError } = await supabase.storage.from("post-images").upload(path, imageFile);
        if (upError) throw upError;
        image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
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
      toast.success("Shared with the community!");
      loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    }
    loadPosts();
  }

  async function addComment(postId: string, text: string) {
    if (!profile?.comment_enabled) {
      toast.error("Your commenting privileges are restricted.");
      return;
    }
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      content: text,
    });
    if (error) toast.error("Failed to post comment");
    loadPosts();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-gray-100 transition-all focus-within:shadow-md">
          <div className="flex gap-4">
            <img
              src={profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name ?? 'User')}`}
              className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-white shadow-sm"
              alt="Profile"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell the community what's happening..."
              className="flex-1 bg-gray-50 rounded-2xl p-4 resize-none text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border-none transition-all"
              rows={3}
            />
          </div>

          {imagePreview && (
            <div className="relative mt-4 rounded-2xl overflow-hidden border">
              <img src={imagePreview} className="w-full max-h-64 object-cover" alt="Preview" />
              <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition">
              <ImageIcon size={18} className="text-primary" /> Attach Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            <button onClick={handlePost} disabled={posting || (!content.trim() && !imageFile)} className="flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-40 shadow-lg shadow-primary/20">
              <Send size={14} /> {posting ? "Sharing…" : "Post to Feed"}
            </button>
          </div>
        </div>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} userId={userId} onLike={toggleLike} onComment={addComment} />
        ))}
      </div>

      <aside className="hidden lg:block space-y-6">
        <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Community Notice</h3>
          <p className="text-xs leading-relaxed opacity-80">Welcome to the Akpu Town portal. Please ensure all posts respect community guidelines.</p>
        </div>
      </aside>
    </div>
  );
}

function PostCard({ post, userId, onLike, onComment }: any) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const liked = post.likes?.some((l: any) => l.user_id === userId);

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={post.users?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.users?.full_name ?? 'User')}`} className="w-11 h-11 rounded-2xl object-cover border border-gray-50" alt="Author" />
            <div>
              <p className="font-black text-gray-900 text-sm">{post.users?.full_name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button className="text-gray-300 hover:text-gray-600"><MoreHorizontal size={20} /></button>
        </div>

        {post.content && <p className="text-gray-700 text-sm leading-relaxed mb-4">{post.content}</p>}
        {post.image_url && (
          <div className="rounded-[1.5rem] overflow-hidden border border-gray-50 mb-4">
            <img src={post.image_url} alt="Post content" className="w-full object-cover max-h-[450px]" />
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
          <button onClick={() => onLike(post.id, liked)} className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${liked ? "text-red-500 scale-110" : "text-gray-400 hover:text-red-500"}`}>
            <Heart size={18} fill={liked ? "currentColor" : "none"} /> {post.likes?.length ?? 0}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition">
            <MessageCircle size={18} /> {post.comments?.length ?? 0}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-gray-50/50 p-6 space-y-4 border-t border-gray-50">
          {post.comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <img src={c.users?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.users?.full_name ?? 'User')}`} className="w-8 h-8 rounded-xl object-cover shrink-0 mt-0.5" alt="Avatar" />
              <div className="flex-1">
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm inline-block min-w-[120px]">
                  <p className="font-black text-[10px] text-primary uppercase tracking-tighter mb-1">{c.users?.full_name}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the conversation..."
              className="flex-1 text-sm bg-white border-none rounded-xl px-4 py-2.5 outline-none shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) {
                  onComment(post.id, commentText);
                  setCommentText("");
                }
              }}
            />
            <button onClick={() => { if (commentText.trim()) { onComment(post.id, commentText); setCommentText(""); } }} className="bg-gray-900 text-white px-4 rounded-xl text-xs font-black uppercase shadow-sm">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}