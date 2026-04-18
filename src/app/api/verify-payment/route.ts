import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    // 1. Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const paystackData = await paystackRes.json();

    if (paystackData?.data?.status !== "success") {
      return NextResponse.json({
        success: false,
        error: "Payment not confirmed",
      }, { status: 400 });
    }

    // 2. FIX: Await the cookie store for Next.js 15 compatibility
    const cookieStore = await cookies();
    
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

    // 3. Update Database
    // Note: We await the result to make sure the update finishes
    const { error: dbError } = await supabase
      .from("payments")
      .update({ 
        status: "success", 
        metadata: paystackData.data 
      })
      .eq("reference", reference);

    if (dbError) {
      console.error("Supabase payment update error:", dbError);
      return NextResponse.json({ success: false, error: "Database update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Payment verification internal error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}