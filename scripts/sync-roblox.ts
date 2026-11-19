import "dotenv/config";
import { eq, isNull } from "drizzle-orm";
import { db, pool } from "../src/db";
import { players } from "../src/db/schema";
import { resolveRobloxUsers } from "../src/lib/roblox";

async function main() {
  const roster = await db.select({ id: players.id, name: players.name, teamId: players.teamId }).from(players);
  console.log(`Resolving ${roster.length} Roblox usernames…`);
  const identities = await resolveRobloxUsers(roster.map((r) => r.name));
  let linked = 0;
  for (const row of roster) {
    const identity = identities.get(row.name);
    if (!identity) continue;
    await db.update(players).set({
      robloxUserId: identity.userId != null ? String(identity.userId) : null,
      robloxAvatarUrl: identity.headshotUrl,
      robloxVerified: identity.verified,
    }).where(eq(players.id, row.id));
    if (identity.userId) linked++;
  }
  const [remaining] = await db.select({ n: players.id }).from(players).where(isNull(players.robloxUserId));
  console.log(`Linked ${linked}/${roster.length} Roblox accounts.`);
}

main().finally(() => pool.end());
