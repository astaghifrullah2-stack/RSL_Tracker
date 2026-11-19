import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { playerSheetRows, playerSheets, players } from "../src/db/schema";

const fixes = [
  {
    username: "emir_martinez23",
    robloxUserId: "5856976457",
    avatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-3690EDE53FD75E29971C0D941F5FBE55-Png/150/150/AvatarHeadshot/Png/noFilter",
  },
  {
    username: "anissenyH",
    robloxUserId: "1141976132",
    avatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-A8D3EDD82F7CE99E30198AC88BCC7CD2-Png/150/150/AvatarHeadshot/Png/noFilter",
  },
  {
    username: "revolfsaea",
    robloxUserId: "5688882993",
    avatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-3811183071144476873918CED174A46F-Png/150/150/AvatarHeadshot/Png/noFilter",
  },
  {
    username: "opgpedisthu",
    robloxUserId: "539210769",
    avatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-0FD22DF250C473C93BABCDDA5D5FDD72-Png/150/150/AvatarHeadshot/Png/noFilter",
  },
];

async function main() {
  const [sheet] = await db.select({ id: playerSheets.id }).from(playerSheets).where(eq(playerSheets.slug, "s2"));
  if (!sheet) throw new Error("S2 playersheet not found.");

  for (const item of fixes) {
    await db.update(playerSheetRows).set({
      robloxUserId: item.robloxUserId,
      robloxAvatarUrl: item.avatarUrl,
    }).where(and(eq(playerSheetRows.sheetId, sheet.id), eq(playerSheetRows.username, item.username)));

    await db.update(players).set({
      robloxUserId: item.robloxUserId,
      robloxAvatarUrl: item.avatarUrl,
    }).where(eq(players.name, item.username));
  }
  console.log(`Repaired ${fixes.length} Roblox avatar links in S2.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
