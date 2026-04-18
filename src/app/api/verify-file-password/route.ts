import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1. FIX: Await cookies for Next.js 15
    const cookieStore = await cookies();
    const { fileId, password } = await req.json();

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

    // 2. Auth Check: Ensure the person trying to access the file is a logged-in member
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Fetch file details
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("password_hash, storage_path")
      .eq("id", fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ valid: false, error: "File not found" }, { status: 404 });
    }

    // 4. Compare password with hashed version in DB
    const isValid = await bcrypt.compare(password, file.password_hash);

    return NextResponse.json({
      valid: isValid,
      // Only return the storage path if the password is correct
      storagePath: isValid ? file.storage_path : null,
    });

  } catch (err: any) {
    console.error("File verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}