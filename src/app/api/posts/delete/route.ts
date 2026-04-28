import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  const { data: { session } } = await authClient.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, type } = await req.json();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (type === "comment") {
    const { data: comment } = await admin
      .from("comments").select("author_id").eq("id", postId).single();
    if (comment?.author_id !== session.user.id) {
      return NextResponse.json({ error: "Not your comment" }, { status: 403 });
    }
    await admin.from("comments")
      .update({ deleted_at: new Date().toISOString() }).eq("id", postId);
  } else {
    const { data: post } = await admin
      .from("posts").select("author_id").eq("id", postId).single();
    if (post?.author_id !== session.user.id) {
      return NextResponse.json({ error: "Not your post" }, { status: 403 });
    }
    await admin.from("posts")
      .update({ deleted_at: new Date().toISOString() }).eq("id", postId);
  }

  return NextResponse.json({ success: true });
}
