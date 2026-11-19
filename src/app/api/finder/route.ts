import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { competitions, players, teams } from "@/db/schema";
import type { FinderEntry } from "@/lib/hub-types";
import { navLinks, playMenuLinks } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Public, read-only search index. No admin fields or session data leave the server. */
export async function GET() {
  try {
    const [roster, clubs, events] = await Promise.all([
      db.select({ id: players.id, username: players.name, display: players.displayName, avatar: players.robloxAvatarUrl, userId: players.robloxUserId, position: players.position, club: teams.name })
        .from(players).leftJoin(teams, eq(players.teamId, teams.id)).orderBy(asc(players.name)),
      db.select({ id: teams.id, name: teams.name, code: teams.shortName, kind: teams.kind, image: teams.badgeUrl }).from(teams).orderBy(asc(teams.name)),
      db.select({ id: competitions.id, name: competitions.name, season: competitions.season, type: competitions.type, image: competitions.badgeUrl }).from(competitions).orderBy(asc(competitions.name)),
    ]);
    const entries: FinderEntry[] = [
      ...navLinks.concat(playMenuLinks.map(x => ({href: x.href, label: x.label}))).map(p => ({ key: `page:${p.href}`, type: "Page" as const, title: p.href === "/" ? "League overview" : p.label, detail: p.href.startsWith("/play") ? "RSL Arcade" : "League navigation", keywords: p.href, href: p.href })),
      ...events.map(c => ({ key: `comp:${c.id}`, type: "Competition" as const, title: c.name, detail: [c.season, c.type].filter(Boolean).join(" · "), keywords: `${c.name} ${c.season ?? ""}`, href: `/competitions/${c.id}`, image: c.image })),
      ...clubs.map(t => ({ key: `team:${t.id}`, type: "Team" as const, title: t.name, detail: `${t.code} · ${t.kind === "nation" ? "National team" : "Club"}`, keywords: `${t.name} ${t.code}`, href: `/teams/${t.id}`, image: t.image })),
      ...roster.map(p => ({ key: `player:${p.id}`, type: "Player" as const, playerId: p.id, title: p.username, detail: `${p.position} · ${p.club ?? "Free agent"}`, keywords: `${p.display ?? ""} ${p.userId ?? ""} ${p.club ?? ""}`, href: `/players/${p.id}`, image: p.avatar || `/api/roblox/avatar-image?username=${encodeURIComponent(p.username)}` })),
    ];
    return Response.json({ entries }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  } catch {
    return Response.json({ error: "The league directory is temporarily unavailable." }, { status: 503 });
  }
}
