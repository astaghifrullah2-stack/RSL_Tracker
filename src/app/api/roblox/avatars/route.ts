import { resolveRobloxUsers } from "@/lib/roblox";

export const dynamic = "force-dynamic";

/**
 * GET /api/roblox/avatars?usernames=a,b,c
 * Returns Roblox user ids, display names and avatar artwork for the tracker.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("usernames") ?? "";
  const usernames = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (!usernames.length) {
    return Response.json({ error: "Provide at least one username." }, { status: 400 });
  }

  try {
    const map = await resolveRobloxUsers(usernames);
    return Response.json({
      data: usernames.map((name) => map.get(name) ?? null).filter(Boolean),
    });
  } catch {
    return Response.json({ error: "Roblox lookup failed." }, { status: 502 });
  }
}
