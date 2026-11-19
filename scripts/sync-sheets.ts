import "dotenv/config";
import { db, pool } from "../src/db";
import { playerSheetRows, playerSheets, players } from "../src/db/schema";

async function main() {
  const existing = await db.select({ id: playerSheets.id }).from(playerSheets);
  if (existing.length) {
    console.log("Playersheets already exist — leaving them untouched.");
    return;
  }

  const roster = await db.select({ id: players.id, name: players.name, teamId: players.teamId }).from(players);
  const sheets = await db.insert(playerSheets).values([
    { slug: "s2", label: "S2 Playersheet", season: "Season 2", description: "S2 archived playersheet", isCurrent: false, isVerified: false, sortOrder: 2 },
    { slug: "s3", label: "S3 Playersheet", season: "Season 3", description: "S3 archived playersheet", isCurrent: false, isVerified: false, sortOrder: 3 },
    { slug: "s4", label: "S4 Playersheet", season: "Season 4", description: "S4 current playersheet", isCurrent: true, isVerified: false, sortOrder: 4 },
  ]).returning({ id: playerSheets.id, slug: playerSheets.slug });

  const values: Array<typeof playerSheetRows.$inferInsert> = [];
  for (const sheet of sheets) {
    roster.forEach((player, index) => {
      values.push({
        sheetId: sheet.id,
        playerId: player.id,
        username: player.name,
        teamId: player.teamId,
        role: sheet.slug === "s2" && player.name.toLowerCase() === "wulsino" ? "MANAGER" : "PLAYER",
        playerClass: "UNRATED",
        sortOrder: index,
      });
    });
  }
  if (values.length) await db.insert(playerSheetRows).values(values);
  console.log(`Created ${sheets.length} playersheets with ${values.length} roster rows. Classes and wages remain unrecorded.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
