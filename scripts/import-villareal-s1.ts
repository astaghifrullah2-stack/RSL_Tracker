import "dotenv/config";
import { and, eq, notInArray } from "drizzle-orm";
import { db, pool } from "../src/db";
import { players, teamSeasonRosters, teams } from "../src/db/schema";
import { resolveRobloxUsers } from "../src/lib/roblox";

type WinnerEntry = {
  username: string;
  discordHandle: string;
};

/** Villareal Season 1 Winners squad in exact order from the screenshot. */
const VILLAREAL_S1_WINNERS: WinnerEntry[] = [
  { username: "Dembe3le", discordHandle: "ayaanzxq" },
  { username: "ediuzt", discordHandle: "ediuzt." },
  { username: "MDuckQ", discordHandle: "m._.duck" },
  { username: "nunken_insanio", discordHandle: "lyv_nnnnq" },
  { username: "Pop_102852", discordHandle: "karim097756" },
  { username: "RelixMoon", discordHandle: "relixmoon" },
  { username: "Sabaluka1119", discordHandle: "atpjshh" },
  { username: "want_noting", discordHandle: "orbissss" },
  { username: "Zvlatan", discordHandle: "zvlatan" },
];

async function main() {
  const [villareal] = await db.select().from(teams).where(eq(teams.shortName, "VIL"));
  if (!villareal) throw new Error("Villareal team (VIL) not found in database.");

  // Clean up duplicate Zvlatan row (id=195) if present so only canonical id=3 remains
  const allPlayers = await db.select().from(players);
  const zvlatanRows = allPlayers
    .filter((p) => p.name.toLowerCase() === "zvlatan")
    .sort((a, b) => a.id - b.id);
  if (zvlatanRows.length > 1) {
    for (const dup of zvlatanRows.slice(1)) {
      await db.delete(players).where(eq(players.id, dup.id));
      console.log(`Removed duplicate player row id=${dup.id} (${dup.name}).`);
    }
  }

  // Refresh player map & resolve Roblox accounts + headshots
  const refreshed = await db.select().from(players);
  const byLowerName = new Map(refreshed.map((p) => [p.name.toLowerCase(), p]));
  const identities = await resolveRobloxUsers(VILLAREAL_S1_WINNERS.map((w) => w.username));

  const winnerPlayerIds: number[] = [];

  for (const entry of VILLAREAL_S1_WINNERS) {
    const existing = byLowerName.get(entry.username.toLowerCase());
    const identity = identities.get(entry.username);
    const robloxUserId =
      identity?.userId != null ? String(identity.userId) : existing?.robloxUserId ?? null;
    const robloxAvatarUrl = identity?.headshotUrl ?? existing?.robloxAvatarUrl ?? null;

    if (existing) {
      await db
        .update(players)
        .set({
          teamId: villareal.id,
          robloxUserId,
          robloxAvatarUrl,
          robloxVerified: identity?.verified ?? existing.robloxVerified,
        })
        .where(eq(players.id, existing.id));
      winnerPlayerIds.push(existing.id);
    } else {
      const [inserted] = await db
        .insert(players)
        .values({
          name: entry.username,
          teamId: villareal.id,
          robloxUserId,
          robloxAvatarUrl,
          robloxVerified: identity?.verified ?? false,
          position: "MID",
          isActive: true,
        })
        .returning({ id: players.id });
      winnerPlayerIds.push(inserted.id);
    }
  }

  // Unassign random seed placeholder players that were previously attached to Villareal
  await db
    .update(players)
    .set({ teamId: null })
    .where(and(eq(players.teamId, villareal.id), notInArray(players.id, winnerPlayerIds)));

  // Replace Villareal's Season 1 Winners roster in exact screenshot order
  await db
    .delete(teamSeasonRosters)
    .where(and(eq(teamSeasonRosters.teamId, villareal.id), eq(teamSeasonRosters.season, "Season 1")));

  await db.insert(teamSeasonRosters).values(
    VILLAREAL_S1_WINNERS.map((entry, idx) => ({
      teamId: villareal.id,
      playerId: winnerPlayerIds[idx],
      season: "Season 1",
      label: "Season 1 Winners",
      discordHandle: entry.discordHandle,
      sortOrder: idx + 1,
    })),
  );

  await db
    .update(teams)
    .set({
      description:
        "RSL Season 1 Double Champions — winners of LALIGA and the Supercopa de España.",
    })
    .where(eq(teams.id, villareal.id));

  console.log(
    `Imported ${VILLAREAL_S1_WINNERS.length} players into Villareal (Season 1 Winners): ${VILLAREAL_S1_WINNERS.map((w) => w.username).join(", ")}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
