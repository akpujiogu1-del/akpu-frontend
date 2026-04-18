"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { ImageIcon, Send, Heart, MessageCircle, X, MoreHorizontal } from "lucide-react";

// 1. Define Types for better DX
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
      
      const { data: p } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();
      
      setProfile(p);
    };

    initSession();
    loadPosts();

    const ch = supabase
      .channel("community-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => loadPosts()
      )
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
      .select(`
        *,
        users(full_name, avatar_url),
        comments(*, users(full_name, avatar_url)),
        likes(user_id)
      `)
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
        
        const { data: up, error: upError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile);
          
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
      loadPosts(); // Manually refresh in case realtime is slow
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  }

  // ... rest of your toggleLike and addComment functions stay the same