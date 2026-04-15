import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { fileId, password } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

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