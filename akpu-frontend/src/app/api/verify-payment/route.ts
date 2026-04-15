import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { reference } = await req.json();

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
    });
  }

  const supabase = createRouteHandlerClient({ cookies });
  await supabase
    .from("payments")
    .update({ status: "success", metadata: paystackData.data })
    .eq("reference", reference);

  return NextResponse.json({ success: true });
}