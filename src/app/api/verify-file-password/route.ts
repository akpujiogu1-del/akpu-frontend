import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { fileId, password } = await req.json();

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: file } = await supabase
    .from("files")
    .select("password_hash, storage_path")
    .eq("id", fileId)
    .single();

  if (!file) return NextResponse.json({ valid: false });

  const valid = await bcrypt.compare(password, file.password_hash);
  return NextResponse.json({
    valid,
    storagePath: valid ? file.storage_path : null,
  });
}