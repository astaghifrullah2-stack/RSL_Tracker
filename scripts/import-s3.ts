import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { playerSheetRows, playerSheets, players } from "../src/db/schema";
import { resolveRobloxUsers } from "../src/lib/roblox";

type S3Row = {
  playerClass: string;
  rating: number;
  username: string;
  wage: number;
  team: string;
  role?: "PLAYER" | "MANAGER";
  robloxId?: string;
  penalty: number;
};

/** S3 playersheet transcribed in exact order from the four screenshots. */
const S3_DATA: S3Row[] = [
  // ---------------- X CLASS ----------------
  { playerClass: "X", rating: 95, username: "Kylzno", wage: 600000, team: "Atalanta B.C.", role: "PLAYER", robloxId: "2368415314", penalty: 0 },
  { playerClass: "X", rating: 94, username: "Ervxttini", wage: 575000, team: "Bologna F.C.", role: "PLAYER", robloxId: "1491265355", penalty: 0 },
  { playerClass: "X", rating: 93, username: "LivingInLiverpool", wage: 550000, team: "FREE AGENT", role: "PLAYER", robloxId: "7491953352", penalty: 0 },
  { playerClass: "X", rating: 92, username: "Zvlatan", wage: 525000, team: "FREE AGENT", role: "PLAYER", robloxId: "8229784554", penalty: 0 },
  { playerClass: "X", rating: 91, username: "santomaledetto", wage: 500000, team: "Como 1907", role: "MANAGER", robloxId: "5366943651", penalty: 0 },

  // ---------------- S CLASS ----------------
  { playerClass: "S+", rating: 90, username: "Sensationalf", wage: 475000, team: "Como 1907", role: "PLAYER", robloxId: "9867108799", penalty: 0 },
  { playerClass: "S+", rating: 90, username: "Iwannarott", wage: 475000, team: "Bologna F.C.", role: "PLAYER", robloxId: "7443295630", penalty: 0 },
  { playerClass: "S+", rating: 89, username: "RelixMoon", wage: 475000, team: "Atalanta B.C.", role: "PLAYER", robloxId: "1442972160", penalty: 0 },
  { playerClass: "S+", rating: 89, username: "nunken_insanio", wage: 450000, team: "Inter Milan", role: "PLAYER", robloxId: "2573706735", penalty: 0 },
  { playerClass: "S+", rating: 89, username: "True_Nihility", wage: 450000, team: "Bologna F.C.", role: "PLAYER", robloxId: "1073982676", penalty: 0 },
  { playerClass: "S", rating: 88, username: "Wulsino", wage: 425000, team: "Como 1907", role: "PLAYER", robloxId: "3679642600", penalty: 0 },
  { playerClass: "S", rating: 88, username: "Pop_102852", wage: 525000, team: "A.C. Milan", role: "PLAYER", robloxId: "5177808554", penalty: 100000 },
  { playerClass: "S", rating: 88, username: "Meteoric_Sky", wage: 425000, team: "S.S. Lazio", role: "PLAYER", robloxId: "6109957910", penalty: 0 },
  { playerClass: "S", rating: 88, username: "MaguireTheBestCB_OAT", wage: 425000, team: "Bologna F.C.", role: "PLAYER", robloxId: "4686830478", penalty: 0 },
  { playerClass: "S-", rating: 87, username: "Swizj", wage: 425000, team: "FREE AGENT", role: "PLAYER", robloxId: "1988809485", penalty: 0 },
  { playerClass: "S-", rating: 87, username: "thunder65q", wage: 425000, team: "FREE AGENT", role: "PLAYER", robloxId: "866467179", penalty: 0 },
  { playerClass: "S-", rating: 87, username: "ih1or", wage: 400000, team: "S.S.C. Napoli", role: "PLAYER", robloxId: "3576665957", penalty: 0 },
  { playerClass: "S-", rating: 87, username: "bloodexchange", wage: 400000, team: "Atalanta B.C.", role: "PLAYER", robloxId: "7820321151", penalty: 0 },
  { playerClass: "S-", rating: 87, username: "44Cinz", wage: 400000, team: "FREE AGENT", role: "PLAYER", robloxId: "8681333855", penalty: 0 },

  // ---------------- A CLASS ----------------
  { playerClass: "A+", rating: 86, username: "Ivan65q", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "1653428282", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "kobayagi", wage: 375000, team: "FREE AGENT", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "cloudzandthuner7", wage: 375000, team: "Inter Milan", role: "PLAYER", robloxId: "5113765875", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "Amir_Martinez23", wage: 375000, team: "FREE AGENT", robloxId: "5856976457", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "95vision", wage: 375000, team: "S.S. Lazio", role: "PLAYER", robloxId: "10150284980", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "Mortolion", wage: 375000, team: "FREE AGENT", robloxId: "1614893216", penalty: 0 },
  { playerClass: "A+", rating: 86, username: "tekkplus", wage: 375000, team: "Como 1907", role: "PLAYER", robloxId: "11200311947", penalty: 0 },
  { playerClass: "A", rating: 85, username: "Rayanhyd2011", wage: 350000, team: "FREE AGENT", robloxId: "1347995331", penalty: 0 },
  { playerClass: "A", rating: 85, username: "TvaatStudio", wage: 350000, team: "FREE AGENT", robloxId: "2205710348", penalty: 0 },
  { playerClass: "A", rating: 85, username: "Levidenboer", wage: 350000, team: "FREE AGENT", robloxId: "445267264", penalty: 0 },
  { playerClass: "A", rating: 85, username: "Aymendz55", wage: 350000, team: "Como 1907", robloxId: "1783771389", penalty: 0 },
  { playerClass: "A", rating: 85, username: "defin23233894", wage: 350000, team: "FREE AGENT", robloxId: "3200767921", penalty: 0 },
  { playerClass: "A", rating: 84, username: "PlaxnetSupreme", wage: 325000, team: "FREE AGENT", robloxId: "1551608449", penalty: 0 },
  { playerClass: "A", rating: 84, username: "Ulecia09", wage: 325000, team: "Bologna F.C.", robloxId: "3074951690", penalty: 0 },
  { playerClass: "A", rating: 84, username: "cashKACE_sports", wage: 325000, team: "Inter Milan", robloxId: "2754213767", penalty: 0 },
  { playerClass: "A", rating: 84, username: "Kvluta", wage: 325000, team: "Inter Milan", robloxId: "1325194104", penalty: 0 },
  { playerClass: "A", rating: 84, username: "azerty160911", wage: 325000, team: "FREE AGENT", robloxId: "160390069", penalty: 0 },
  { playerClass: "A", rating: 84, username: "Rocha90", wage: 325000, team: "FREE AGENT", robloxId: "47693999", penalty: 0 },
  { playerClass: "A-", rating: 83, username: "xr5me", wage: 300000, team: "Bologna F.C.", robloxId: "500152823", penalty: 0 },
  { playerClass: "A-", rating: 83, username: "GGGDFR", wage: 300000, team: "Inter Milan", robloxId: "66365318", penalty: 0 },
  { playerClass: "A-", rating: 83, username: "pablothes4", wage: 300000, team: "FREE AGENT", robloxId: "10571898472", penalty: 0 },
  { playerClass: "A-", rating: 83, username: "ediuzt", wage: 350000, team: "FREE AGENT", robloxId: "1672098443", penalty: 450000 },
  { playerClass: "A-", rating: 83, username: "MDuckQ", wage: 300000, team: "Bologna F.C.", robloxId: "160390069", penalty: 0 },
  { playerClass: "A-", rating: 83, username: "AyoubExro", wage: 300000, team: "FREE AGENT", robloxId: "10239595322", penalty: 0 },

  // ---------------- B CLASS ----------------
  { playerClass: "B+", rating: 82, username: "Joxahi", wage: 275000, team: "Bologna F.C.", robloxId: "1885851981", penalty: 0 },
  { playerClass: "B+", rating: 82, username: "duhfan2", wage: 275000, team: "FREE AGENT", robloxId: "10321011990", penalty: 0 },
  { playerClass: "B+", rating: 82, username: "Sabaluka1119", wage: 325000, team: "Inter Milan", robloxId: "9019129455", penalty: 50000 },
  { playerClass: "B+", rating: 82, username: "raees6978", wage: 275000, team: "FREE AGENT", robloxId: "7619657061", penalty: 0 },
  { playerClass: "B+", rating: 82, username: "perro_4688", wage: 275000, team: "FREE AGENT", robloxId: "4227890840", penalty: 0 },
  { playerClass: "B", rating: 81, username: "BrunoFernandes", wage: 250000, team: "A.C.F. Fiorentina", role: "MANAGER", robloxId: "9769217388", penalty: 0 },
  { playerClass: "B", rating: 81, username: "VaMangerDeLherbe", wage: 250000, team: "Como 1907", robloxId: "5247713611", penalty: 0 },
  { playerClass: "B", rating: 81, username: "uptrevel2", wage: 250000, team: "FREE AGENT", robloxId: "687974925", penalty: 0 },
  { playerClass: "B", rating: 81, username: "kew4l", wage: 250000, team: "FREE AGENT", robloxId: "1839301279", penalty: 0 },
  { playerClass: "B", rating: 81, username: "hailetor9", wage: 250000, team: "Atalanta B.C.", robloxId: "3856260433", penalty: 0 },
  { playerClass: "B", rating: 81, username: "Solely122011", wage: 250000, team: "FREE AGENT", robloxId: "5866604607", penalty: 0 },
  { playerClass: "B", rating: 80, username: "prolegend191", wage: 225000, team: "FREE AGENT", robloxId: "1536345438", penalty: 0 },
  { playerClass: "B", rating: 80, username: "Mousa0100", wage: 225000, team: "FREE AGENT", robloxId: "651120149", penalty: 0 },
  { playerClass: "B", rating: 80, username: "Shn4ke", wage: 225000, team: "Atalanta B.C.", role: "MANAGER", robloxId: "1885851981", penalty: 0 },
  { playerClass: "B", rating: 80, username: "alawilo3", wage: 225000, team: "FREE AGENT", robloxId: "2536573064", penalty: 0 },
  { playerClass: "B", rating: 80, username: "cashKACE_Music", wage: 225000, team: "FREE AGENT", robloxId: "2769121491", penalty: 0 },
  { playerClass: "B", rating: 80, username: "thejohn_421", wage: 225000, team: "FREE AGENT", robloxId: "10789564949", penalty: 0 },
  { playerClass: "B", rating: 80, username: "dani10blox", wage: 225000, team: "FREE AGENT", robloxId: "653769605", penalty: 0 },
  { playerClass: "B", rating: 80, username: "p7gba", wage: 225000, team: "A.C.F. Fiorentina", robloxId: "2507129617", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "IJonxYz", wage: 200000, team: "FREE AGENT", robloxId: "2902059062", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "BaleisGoated11Wales", wage: 200000, team: "FREE AGENT", robloxId: "9182815640", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "yocalmdownjamaa", wage: 200000, team: "FREE AGENT", robloxId: "5805105301", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "NEYMARJR555512", wage: 200000, team: "FREE AGENT", robloxId: "5838454992", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "Trekeus5_rdt", wage: 200000, team: "Bologna F.C.", role: "MANAGER", robloxId: "1163725704", penalty: 0 },
  { playerClass: "B-", rating: 79, username: "xurjfirkxjwjfo", wage: 250000, team: "A.C. Milan", robloxId: "2769121491", penalty: 50000 },
  { playerClass: "B-", rating: 79, username: "midoxiious", wage: 200000, team: "A.C.F. Fiorentina", robloxId: "2470139900", penalty: 0 },

  // ---------------- C CLASS ----------------
  { playerClass: "C+", rating: 78, username: "zayan15f", wage: 175000, team: "FREE AGENT", robloxId: "2300474470", penalty: 0 },
  { playerClass: "C+", rating: 78, username: "XDveline", wage: 175000, team: "FREE AGENT", robloxId: "10303270878", penalty: 0 },
  { playerClass: "C+", rating: 78, username: "freakkvara", wage: 175000, team: "Inter Milan", robloxId: "696238060", penalty: 0 },
  { playerClass: "C+", rating: 78, username: "cloudzy6", wage: 175000, team: "FREE AGENT", robloxId: "8521570752", penalty: 50000 },
  { playerClass: "C+", rating: 78, username: "amxinho2", wage: 175000, team: "A.C.F. Fiorentina", robloxId: "7932084052", penalty: 0 },
  { playerClass: "C+", rating: 78, username: "kingcharzuki", wage: 175000, team: "FREE AGENT", robloxId: "200570168", penalty: 0 },
  { playerClass: "C", rating: 77, username: "santo14131332", wage: 150000, team: "Juventus", role: "MANAGER", robloxId: "3170649127", penalty: 0 },
  { playerClass: "C", rating: 77, username: "Ron_UmGamerNormal", wage: 150000, team: "A.C. Milan", role: "MANAGER", robloxId: "4222507035", penalty: 0 },
  { playerClass: "C", rating: 77, username: "aimbot3000robot", wage: 150000, team: "FREE AGENT", robloxId: "3527596421", penalty: 0 },
  { playerClass: "C", rating: 77, username: "yoilazerboi", wage: 150000, team: "S.S. Lazio", robloxId: "1704142055", penalty: 0 },
  { playerClass: "C", rating: 77, username: "17vval", wage: 150000, team: "FREE AGENT", robloxId: "8628901258", penalty: 0 },
  { playerClass: "C", rating: 77, username: "veulauro", wage: 150000, team: "FREE AGENT", robloxId: "2542601380", penalty: 0 },
  { playerClass: "C", rating: 77, username: "Tyieboy90", wage: 150000, team: "Atalanta B.C.", robloxId: "9740657398", penalty: 0 },
  { playerClass: "C", rating: 77, username: "jaboc_ur", wage: 150000, team: "FREE AGENT", robloxId: "7246562214", penalty: 0 },
  { playerClass: "C", rating: 77, username: "aspiotackling", wage: 150000, team: "FREE AGENT", robloxId: "8402549927", penalty: 0 },
  { playerClass: "C", rating: 76, username: "fir3hunt3r56", wage: 125000, team: "FREE AGENT", robloxId: "2957124902", penalty: 0 },
  { playerClass: "C", rating: 76, username: "want_noting", wage: 125000, team: "FREE AGENT", robloxId: "7106597338", penalty: 0 },
  { playerClass: "C", rating: 76, username: "FriedsWorld", wage: 125000, team: "S.S.C. Napoli", role: "MANAGER", robloxId: "3872468574", penalty: 0 },
  { playerClass: "C", rating: 76, username: "fabretzko", wage: 125000, team: "FREE AGENT", robloxId: "1928488930", penalty: 0 },
  { playerClass: "C", rating: 76, username: "football_alex", wage: 125000, team: "FREE AGENT", robloxId: "3891580588", penalty: 0 },
  { playerClass: "C", rating: 76, username: "Birloclacer", wage: 125000, team: "FREE AGENT", robloxId: "5386664199", penalty: 0 },
  { playerClass: "C", rating: 75, username: "KartYBAalt", wage: 100000, team: "FREE AGENT", robloxId: "2843328066", penalty: 0 },
  { playerClass: "C", rating: 75, username: "TheBosnianComplex", wage: 100000, team: "FREE AGENT", robloxId: "2050441872", penalty: 0 },
  { playerClass: "C", rating: 75, username: "Zlonxvoo", wage: 100000, team: "FREE AGENT", robloxId: "8681333855", penalty: 0 },
  { playerClass: "C", rating: 75, username: "sushsisksksk", wage: 100000, team: "FREE AGENT", robloxId: "3901834233", penalty: 0 },
  { playerClass: "C", rating: 75, username: "gx_fabio11", wage: 100000, team: "FREE AGENT", robloxId: "5557627187", penalty: 0 },
  { playerClass: "C", rating: 75, username: "maxuele", wage: 100000, team: "FREE AGENT", robloxId: "559813257", penalty: 0 },
  { playerClass: "C", rating: 75, username: "Zvzin", wage: 100000, team: "FREE AGENT", robloxId: "932742569", penalty: 0 },
  { playerClass: "C-", rating: 74, username: "estemar11", wage: 75000, team: "FREE AGENT", robloxId: "4135670224", penalty: 0 },
  { playerClass: "C-", rating: 74, username: "JeremiahTheGamer01", wage: 75000, team: "FREE AGENT", robloxId: "1701805598", penalty: 0 },
  { playerClass: "C-", rating: 74, username: "super_herosssssss", wage: 75000, team: "FREE AGENT", robloxId: "2323665871", penalty: 0 },
  { playerClass: "C-", rating: 74, username: "funnygamerfunnyxx", wage: 75000, team: "FREE AGENT", robloxId: "29325261", penalty: 0 },
  { playerClass: "C-", rating: 74, username: "valen7159", wage: 75000, team: "FREE AGENT", robloxId: "1754616944", penalty: 0 },
];

const NAME_ALIASES: Record<string, string> = {
  // Spelling as it appears in the screenshots → the canonical roster username.
  "santomaledetto": "santomaledetto",
  "iwannarott": "iwannarott",
  "kylzno": "kyniesta",
  "mousa0100": "mousa0100",
  "mortolion": "mortolion",
  "cloudzandthuner7": "cloudzandthuner7",
  "kvluta": "kvluta",
  "sabaluka1119": "sabaluka1119",
};

function parseTeam(text: string) {
  return text.trim();
}

async function fetchThumbnails(userIds: string[]) {
  const result = new Map<string, string>();
  const unique = [...new Set(userIds.filter((id) => /^\d+$/.test(id)))];
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(",")}&size=150x150&format=Png&isCircular=false`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const payload = (await response.json()) as { data?: Array<{ targetId: number; imageUrl?: string }> };
      for (const item of payload.data ?? []) {
        if (item.imageUrl) result.set(String(item.targetId), item.imageUrl);
      }
    } catch (error) {
      console.warn("thumbnail lookup failed", error);
    }
  }
  return result;
}

async function main() {
  console.log(`Importing ${S3_DATA.length} S3 rows in screenshot order.`);
  const [sheet] = await db.select().from(playerSheets).where(eq(playerSheets.slug, "s3"));
  if (!sheet) throw new Error("S3 playersheet not found.");

  const existingPlayers = await db.select({
    id: players.id,
    name: players.name,
    robloxUserId: players.robloxUserId,
    robloxAvatarUrl: players.robloxAvatarUrl,
  }).from(players);
  const playerByName = new Map(existingPlayers.map((player) => [player.name.toLowerCase(), player]));

  const unresolvedNames = S3_DATA
    .filter((row) => !row.robloxId && !playerByName.has(row.username.toLowerCase()))
    .map((row) => row.username);
  const resolvedUsers = new Map<string, { userId: number | null; headshotUrl: string | null }>();
  for (let i = 0; i < unresolvedNames.length; i += 100) {
    const batch = unresolvedNames.slice(i, i + 100);
    const resolved = await resolveRobloxUsers(batch);
    for (const [username, identity] of resolved) {
      resolvedUsers.set(username.toLowerCase(), { userId: identity.userId, headshotUrl: identity.headshotUrl });
    }
  }

  const avatarMap = await fetchThumbnails(S3_DATA.map((row) => {
    const existing = playerByName.get(row.username.toLowerCase());
    return row.robloxId ?? existing?.robloxUserId ?? String(resolvedUsers.get(row.username.toLowerCase())?.userId ?? "");
  }));

  // Keep a real player profile for every imported sheet username, linking rows to
  // existing accounts when possible. Unknown historical clubs remain free text.
  for (const row of S3_DATA) {
    const existing = playerByName.get(row.username.toLowerCase());
    const identity = resolvedUsers.get(row.username.toLowerCase());
    const id = row.robloxId ?? existing?.robloxUserId ?? (identity?.userId != null ? String(identity.userId) : null);
    const avatar = (id ? avatarMap.get(id) : null) ?? identity?.headshotUrl ?? existing?.robloxAvatarUrl ?? null;

    if (existing) {
      playerByName.set(row.username.toLowerCase(), {
        ...existing,
        robloxUserId: existing.robloxUserId ?? id,
        robloxAvatarUrl: existing.robloxAvatarUrl ?? avatar,
      });
      if ((!existing.robloxUserId && id) || (!existing.robloxAvatarUrl && avatar)) {
        await db.update(players).set({
          robloxUserId: existing.robloxUserId ?? id,
          robloxAvatarUrl: existing.robloxAvatarUrl ?? avatar,
        }).where(eq(players.id, existing.id));
      }
      continue;
    }

    const [inserted] = await db.insert(players).values({
      name: row.username,
      displayName: row.username,
      robloxUserId: id,
      robloxAvatarUrl: avatar,
      isActive: true,
    }).returning({
      id: players.id,
      name: players.name,
      robloxUserId: players.robloxUserId,
      robloxAvatarUrl: players.robloxAvatarUrl,
    });
    playerByName.set(row.username.toLowerCase(), inserted);
  }

  const ready = await db.select({ id: players.id, name: players.name, robloxUserId: players.robloxUserId, robloxAvatarUrl: players.robloxAvatarUrl }).from(players);
  const playersByName = new Map(ready.map((player) => [player.name.toLowerCase(), player]));

  await db.delete(playerSheetRows).where(eq(playerSheetRows.sheetId, sheet.id));

  const rows = S3_DATA.map((row, index) => {
    const linkedPlayer = playersByName.get(row.username.toLowerCase());
    const robloxUserId = row.robloxId ?? linkedPlayer?.robloxUserId ?? null;
    const robloxAvatarUrl = (robloxUserId ? avatarMap.get(robloxUserId) : null) ?? linkedPlayer?.robloxAvatarUrl ?? null;
    return {
      sheetId: sheet.id,
      playerId: linkedPlayer?.id ?? null,
      username: row.username,
      playerClass: row.playerClass,
      rating: row.rating,
      teamId: null,
      teamName: parseTeam(row.team),
      role: row.role ?? "PLAYER",
      wage: row.wage,
      penalty: row.penalty,
      robloxUserId,
      robloxAvatarUrl,
      sortOrder: index + 1,
    };
  });

  await db.insert(playerSheetRows).values(rows);
  await db.update(playerSheets).set({
    isVerified: true,
    isCurrent: false,
    description: "S3 playersheet imported from the official screenshots in exact order. Other season-sheet fields preserved as shown.",
  }).where(eq(playerSheets.id, sheet.id));

  const linked = rows.filter((row) => row.robloxAvatarUrl).length;
  console.log(`S3 import complete: ${rows.length} rows, ${linked} rows with avatars, all players profile-linked.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
