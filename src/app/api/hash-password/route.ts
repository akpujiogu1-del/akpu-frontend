import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1. Await cookies for Next.js 15 compatibility
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 2. Protect the route: Only logged-in users (or specific admins) should hash passwords
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" }, 
        { status: 400 }
      );
    }

    // 3. Generate the hash
    // Salt rounds: 12 is a good balance between security and speed
    const hash = await bcrypt.hash(password, 12);

    return NextResponse.json({ hash });

  } catch (err: any) {
    console.error("Hashing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}