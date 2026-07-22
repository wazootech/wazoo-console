import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { tokenCookieName } from "@/lib/server-auth";

export async function POST() {
  (await cookies()).delete(tokenCookieName);
  return NextResponse.json({ ok: true });
}
