import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    message: "Payment integration coming soon.",
  });
}
