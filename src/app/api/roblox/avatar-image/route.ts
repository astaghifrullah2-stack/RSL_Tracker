import { NextResponse } from "next/server";
import { resolveRobloxUser } from "@/lib/roblox";

export const dynamic = "force-dynamic";

function thumbnailResponse(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".rbxcdn.com")) return null;
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "public, max-age=3600" } });
  } catch { return null; }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const userId = params.get("userId")?.trim();
  const username = params.get("username")?.trim();
  try {
    if (userId && /^\d{1,20}$/.test(userId)) {
      const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = (await res.json()) as { data?: Array<{ imageUrl?: string }> };
        const response = thumbnailResponse(json.data?.[0]?.imageUrl);
        if (response) return response;
      }
    }
    if (username && /^[A-Za-z0-9_]{2,32}$/.test(username)) {
      const response = thumbnailResponse((await resolveRobloxUser(username))?.headshotUrl);
      if (response) return response;
    }
  } catch { /* The league directory remains available if Roblox is offline. */ }
  return new Response(null, { status: 302, headers: { Location: "/images/player-placeholder.svg", "Cache-Control": "public, max-age=60" } });
}
