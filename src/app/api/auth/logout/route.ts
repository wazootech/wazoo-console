import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearTokenCookies } from "@/lib/session-cookie";

export async function POST() {
  clearTokenCookies(await cookies());
  return NextResponse.json({ ok: true });
}
