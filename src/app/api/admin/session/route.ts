import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const cookieAuthed = store.get(ADMIN_COOKIE_NAME)?.value === getSessionToken();
  return NextResponse.json(
    { authed: cookieAuthed },
    { headers: { "Cache-Control": "no-store" } },
  );
}
