import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { password } = await req.json();
  const hash = await bcrypt.hash(password, 12);
  return NextResponse.json({ hash });
}