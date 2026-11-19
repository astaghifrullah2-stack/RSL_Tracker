import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { playerSheetRows, playerSheets, players, teams } from "../src/db/schema";

type S4Player = {
  cls: string;
  rating: number;
  username: string;
  wage: number;
  team: string;
  role: string;
  robloxId: string;
  penalty: number;
};

// All 101 players from the S4 screenshots in exact order from first to last:
const S4_DATA: S4Player[] = [
  // ---- X CLASS ----
  { cls: "X", rating: 93, username: "Dembe3le", wage: 500000, team: "FREE AGENT", role: "PLAYER", robloxId: "1704142055", penalty: 0 },
  { cls: "X", rating: 92, username: "Ioqawa", wage: 475000, team: "FREE AGENT", role: "PLAYER", robloxId: "1066066514", penalty: 0 },
  { cls: "X", rating: 91, username: "Zvlatan", wage: 450000, team: "FREE AGENT", role: "PLAYER", robloxId: "8229784554", penalty: 0 },

  // ---- S CLASS ----
  { cls: "S+", rating: 90, username: "Rocha90", wage: 425000, team: "FREE AGENT", role: "PLAYER", robloxId: "9887108799", penalty: 0 },
  { cls: "S+", rating: 90, username: "nunken_insanio", wage: 425000, team: "FREE AGENT", role: "PLAYER", robloxId: "1442972160", penalty: 0 },
  { cls: "S+", rating: 89, username: "12110924", wage: 400000, team: "FREE AGENT", role: "PLAYER", robloxId: "7443295630", penalty: 0 },
  { cls: "S+", rating: 89, username: "sharkythefemmy", wage: 400000, team: "FREE AGENT", role: "PLAYER", robloxId: "7443295630", penalty: 0 },
  { cls: "S+", rating: 89, username: "Suitsei", wage: 400000, team: "FREE AGENT", role: "PLAYER", robloxId: "7249849725", penalty: 0 },
  { cls: "S", rating: 88, username: "Pop_102852", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "3679642600", penalty: 0 },
  { cls: "S", rating: 88, username: "kyniesta", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "2368415314", penalty: 0 },
  { cls: "S", rating: 88, username: "LivingInLiverpool", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "7491953352", penalty: 0 },
  { cls: "S", rating: 88, username: "azerty160911", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "5177808554", penalty: 0 },
  { cls: "S", rating: 88, username: "Meteoric_Sky", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "6109957910", penalty: 0 },
  { cls: "S", rating: 88, username: "santomaledetto", wage: 375000, team: "FREE AGENT", role: "PLAYER", robloxId: "4686830478", penalty: 0 },
  { cls: "S-", rating: 87, username: "g45g", wage: 350000, team: "FREE AGENT", role: "PLAYER", robloxId: "1988809485", penalty: 0 },
  { cls: "S-", rating: 87, username: "tekkplus", wage: 350000, team: "FREE AGENT", role: "PLAYER", robloxId: "11200311947", penalty: 0 },
  { cls: "S-", rating: 87, username: "sensationalf", wage: 350000, team: "FREE AGENT", role: "PLAYER", robloxId: "3576665957", penalty: 0 },
  { cls: "S-", rating: 87, username: "95vision", wage: 350000, team: "FREE AGENT", role: "PLAYER", robloxId: "7820321151", penalty: 0 },
  { cls: "S-", rating: 87, username: "mousa0100", wage: 350000, team: "FREE AGENT", role: "PLAYER", robloxId: "8681333855", penalty: 0 },

  // ---- A CLASS ----
  { cls: "A+", rating: 86, username: "RelixMoon", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "1442972160", penalty: 0 },
  { cls: "A+", rating: 86, username: "MaguireTheBestCB_OAT", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "4686830478", penalty: 0 },
  { cls: "A+", rating: 86, username: "44cinz", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "8681333855", penalty: 0 },
  { cls: "A+", rating: 86, username: "bloodexchange", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "7820321151", penalty: 0 },
  { cls: "A+", rating: 86, username: "Ulecia09", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "3074951690", penalty: 0 },
  { cls: "A+", rating: 86, username: "Rayanhyd2011", wage: 325000, team: "FREE AGENT", role: "PLAYER", robloxId: "1347995331", penalty: 0 },
  { cls: "A", rating: 85, username: "ih1or", wage: 300000, team: "FREE AGENT", role: "PLAYER", robloxId: "10030225578", penalty: 0 },
  { cls: "A", rating: 85, username: "Joxahi", wage: 300000, team: "FREE AGENT", role: "PLAYER", robloxId: "1885851981", penalty: 0 },
  { cls: "A", rating: 85, username: "vorenixyz", wage: 300000, team: "FREE AGENT", role: "PLAYER", robloxId: "9807032401", penalty: 0 },
  { cls: "A", rating: 85, username: "Kvluta", wage: 300000, team: "FREE AGENT", role: "PLAYER", robloxId: "1325194104", penalty: 0 },
  { cls: "A", rating: 85, username: "cashKACE_sports", wage: 300000, team: "FREE AGENT", role: "PLAYER", robloxId: "2754213767", penalty: 0 },
  { cls: "A", rating: 85, username: "123_aldesh", wage: 300000, team: "ITALY", role: "MANAGER", robloxId: "917230909", penalty: 0 },
  { cls: "A", rating: 84, username: "VaMangerDeLherbe", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "5247713611", penalty: 0 },
  { cls: "A", rating: 84, username: "perro_4688", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "4227890840", penalty: 0 },
  { cls: "A", rating: 84, username: "Sopcerk", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "3062045448", penalty: 0 },
  { cls: "A", rating: 84, username: "TvaatStudio", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "2205710348", penalty: 0 },
  { cls: "A", rating: 84, username: "earrqwadqfqf", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "4876051395", penalty: 0 },
  { cls: "A", rating: 84, username: "z_rne", wage: 275000, team: "SPAIN", role: "MANAGER", robloxId: "3035493421", penalty: 0 },
  { cls: "A", rating: 84, username: "OBAMESSON2", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "4876051395", penalty: 0 },
  { cls: "A", rating: 84, username: "sousachieff", wage: 275000, team: "FREE AGENT", role: "PLAYER", robloxId: "7923145904", penalty: 0 },
  { cls: "A-", rating: 83, username: "Shn4ke", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "1885851981", penalty: 0 },
  { cls: "A-", rating: 83, username: "cloudzandthuner7", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "5113765875", penalty: 0 },
  { cls: "A-", rating: 83, username: "prolegend191", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "1536345438", penalty: 0 },
  { cls: "A-", rating: 83, username: "alawilo3", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "2536573064", penalty: 0 },
  { cls: "A-", rating: 83, username: "ediuzt", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "1672098443", penalty: 0 },
  { cls: "A-", rating: 83, username: "MDuckQ", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "160390069", penalty: 0 },
  { cls: "A-", rating: 83, username: "markobogicevic2", wage: 250000, team: "FREE AGENT", role: "PLAYER", robloxId: "4327879365", penalty: 0 },

  // ---- B CLASS ----
  { cls: "B+", rating: 82, username: "duhfan2", wage: 225000, team: "FREE AGENT", role: "PLAYER", robloxId: "10321011990", penalty: 0 },
  { cls: "B+", rating: 82, username: "Wulsino", wage: 225000, team: "NETHERLANDS", role: "MANAGER", robloxId: "3679642600", penalty: 0 },
  { cls: "B+", rating: 82, username: "Sabaluka1119", wage: 225000, team: "FREE AGENT", role: "PLAYER", robloxId: "9019129455", penalty: 0 },
  { cls: "B+", rating: 82, username: "raees6978", wage: 225000, team: "FREE AGENT", role: "PLAYER", robloxId: "7619657061", penalty: 0 },
  { cls: "B+", rating: 82, username: "adam_gamer581", wage: 225000, team: "FREE AGENT", role: "PLAYER", robloxId: "5326099362", penalty: 0 },
  { cls: "B", rating: 81, username: "pablothes4", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "9769217388", penalty: 0 },
  { cls: "B", rating: 81, username: "uptrevel2", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "10571898472", penalty: 0 },
  { cls: "B", rating: 81, username: "kew4l", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "687974925", penalty: 0 },
  { cls: "B", rating: 81, username: "anxssen_madrid", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "1839301279", penalty: 0 },
  { cls: "B", rating: 81, username: "Solely122011", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "11384734693", penalty: 0 },
  { cls: "B", rating: 81, username: "xr5me", wage: 200000, team: "FREE AGENT", role: "PLAYER", robloxId: "500152823", penalty: 0 },
  { cls: "B", rating: 80, username: "ID0HOWICAN", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "1536345438", penalty: 0 },
  { cls: "B", rating: 80, username: "NeymarJrTvink", wage: 175000, team: "PORTUGAL", role: "MANAGER", robloxId: "2906488940", penalty: 0 },
  { cls: "B", rating: 80, username: "MatiasJesus0108", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "1287447960", penalty: 0 },
  { cls: "B", rating: 80, username: "cashKACE_Music", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "2536573064", penalty: 0 },
  { cls: "B", rating: 80, username: "xurjfirkxjwjfo", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "1163725704", penalty: 0 },
  { cls: "B", rating: 80, username: "dani10blox", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "10789564949", penalty: 0 },
  { cls: "B", rating: 80, username: "p7gba", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "653769605", penalty: 0 },
  { cls: "B", rating: 80, username: "IJonxYz", wage: 175000, team: "FREE AGENT", role: "PLAYER", robloxId: "2507129617", penalty: 0 },
  { cls: "B-", rating: 79, username: "BaleisGoated11Wales", wage: 150000, team: "FREE AGENT", role: "PLAYER", robloxId: "2902059062", penalty: 0 },
  { cls: "B-", rating: 79, username: "yocalmdownjamaa", wage: 150000, team: "FREE AGENT", role: "PLAYER", robloxId: "9182815640", penalty: 0 },
  { cls: "B-", rating: 79, username: "NEYMARJR555512", wage: 150000, team: "FREE AGENT", role: "PLAYER", robloxId: "5805105301", penalty: 0 },
  { cls: "B-", rating: 79, username: "Trekeus5_rdt", wage: 150000, team: "FREE AGENT", role: "PLAYER", robloxId: "5838454992", penalty: 0 },
  { cls: "B-", rating: 79, username: "midoxiious", wage: 150000, team: "FREE AGENT", role: "PLAYER", robloxId: "1419421204", penalty: 0 },

  // ---- C CLASS ----
  { cls: "C+", rating: 78, username: "zayan15f", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "2300474470", penalty: 0 },
  { cls: "C+", rating: 78, username: "XDveline", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "10303270878", penalty: 0 },
  { cls: "C+", rating: 78, username: "freakkvara", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "696238060", penalty: 0 },
  { cls: "C+", rating: 78, username: "cloudzy6", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "8521570752", penalty: 0 },
  { cls: "C+", rating: 78, username: "amxinho2", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "7932084052", penalty: 0 },
  { cls: "C+", rating: 78, username: "kingcharzuki", wage: 125000, team: "FREE AGENT", role: "PLAYER", robloxId: "200570168", penalty: 0 },
  { cls: "C", rating: 77, username: "santo14131332", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "3170649127", penalty: 0 },
  { cls: "C", rating: 77, username: "Ron_UmGamerNormal", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "4222507035", penalty: 0 },
  { cls: "C", rating: 77, username: "aimbot3000robot", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "3527596421", penalty: 0 },
  { cls: "C", rating: 77, username: "17vval", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "8628901258", penalty: 0 },
  { cls: "C", rating: 77, username: "veulauro", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "2542601380", penalty: 0 },
  { cls: "C", rating: 77, username: "jaboc_ur", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "7246562214", penalty: 0 },
  { cls: "C", rating: 77, username: "aspiotackling", wage: 100000, team: "FREE AGENT", role: "PLAYER", robloxId: "8402549927", penalty: 0 },
  { cls: "C", rating: 76, username: "fir3hunt3r56", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "2957124902", penalty: 0 },
  { cls: "C", rating: 76, username: "want_noting", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "7106597338", penalty: 0 },
  { cls: "C", rating: 76, username: "FriedsWorld", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "3872468574", penalty: 0 },
  { cls: "C", rating: 76, username: "fabretzko", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "1928488930", penalty: 0 },
  { cls: "C", rating: 76, username: "football_alex", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "3891580588", penalty: 0 },
  { cls: "C", rating: 76, username: "Birloclacer", wage: 75000, team: "FREE AGENT", role: "PLAYER", robloxId: "5386664199", penalty: 0 },
  { cls: "C", rating: 75, username: "KartYBAalt", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "2843328066", penalty: 0 },
  { cls: "C", rating: 75, username: "TheBosnianComplex", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "2050441872", penalty: 0 },
  { cls: "C", rating: 75, username: "Zlonxvoo", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "8681333855", penalty: 0 },
  { cls: "C", rating: 75, username: "sushsisksksk", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "3901834233", penalty: 0 },
  { cls: "C", rating: 75, username: "gx_fabio11", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "5557627187", penalty: 0 },
  { cls: "C", rating: 75, username: "maxuele", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "559813257", penalty: 0 },
  { cls: "C", rating: 75, username: "Zvzin", wage: 50000, team: "FREE AGENT", role: "PLAYER", robloxId: "932742569", penalty: 0 },
  { cls: "C-", rating: 74, username: "estemar11", wage: 25000, team: "FREE AGENT", role: "PLAYER", robloxId: "4135670224", penalty: 0 },
  { cls: "C-", rating: 74, username: "JeremiahTheGamer01", wage: 25000, team: "FREE AGENT", role: "PLAYER", robloxId: "1701805598", penalty: 0 },
  { cls: "C-", rating: 74, username: "super_herosssssss", wage: 25000, team: "FREE AGENT", role: "PLAYER", robloxId: "2323665871", penalty: 0 },
  { cls: "C-", rating: 74, username: "funnygamerfunnyxx", wage: 25000, team: "FREE AGENT", role: "PLAYER", robloxId: "29325261", penalty: 0 },
  { cls: "C-", rating: 74, username: "valen7159", wage: 25000, team: "FREE AGENT", role: "PLAYER", robloxId: "1754616944", penalty: 0 },
];

async function fetchRobloxThumbnails(userIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(userIds.filter((id) => /^\d+$/.test(id)))];
  // Roblox thumbnail API accepts up to 100 userIds per request
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${chunk.join(",")}&size=150x150&format=Png&isCircular=false`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const json = (await response.json()) as { data?: Array<{ targetId: number; imageUrl?: string; state?: string }> };
        for (const item of json?.data ?? []) {
          if (item.imageUrl) result.set(String(item.targetId), item.imageUrl);
        }
      }
    } catch (e) {
      console.warn("Roblox thumbnail fetch warning:", e);
    }
  }
  return result;
}

async function main() {
  console.log(`Starting S4 import: ${S4_DATA.length} players...`);

  // 1. Fetch exact avatar headshot URLs for all Roblox User IDs
  const allIds = S4_DATA.map((p) => p.robloxId);
  const avatarMap = await fetchRobloxThumbnails(allIds);
  console.log(`Fetched ${avatarMap.size}/${new Set(allIds).size} unique Roblox avatar headshot URLs.`);

  // 2. Ensure national teams exist in teams table (Italy, Spain, Portugal, Netherlands)
  const existingTeams = await db.select().from(teams);
  const teamByName = new Map(existingTeams.map((t) => [t.name.toUpperCase(), t]));

  const nationalTeamsToEnsure = [
    { name: "Italy", shortName: "ITA", badgeUrl: "/images/teams/italy.png", manager: "123_aldesh" },
    { name: "Spain", shortName: "ESP", badgeUrl: "/images/teams/spain.png", manager: "z_rne" },
    { name: "Portugal", shortName: "PRT", badgeUrl: "/images/teams/portugal.png", manager: "NeymarJrTvink" },
    { name: "Netherlands", shortName: "NED", badgeUrl: "/images/teams/netherlands.png", manager: "Wulsino" },
  ];

  for (const nt of nationalTeamsToEnsure) {
    if (!teamByName.has(nt.name.toUpperCase())) {
      const [inserted] = await db
        .insert(teams)
        .values({
          name: nt.name,
          shortName: nt.shortName,
          kind: "nation",
          badgeUrl: nt.badgeUrl,
          manager: nt.manager,
          founded: "2026",
          primaryColor: nt.name === "Spain" ? "#d82333" : nt.name === "Italy" ? "#1f5fbf" : "#ff7518",
          secondaryColor: "#10245c",
        })
        .returning();
      teamByName.set(nt.name.toUpperCase(), inserted);
    } else {
      const team = teamByName.get(nt.name.toUpperCase())!;
      await db
        .update(teams)
        .set({
          badgeUrl: nt.badgeUrl,
          manager: nt.manager,
        })
        .where(eq(teams.id, team.id));
    }
  }

  // 3. Ensure all players exist in `players` table with accurate robloxUserId and robloxAvatarUrl
  const existingPlayers = await db.select().from(players);
  const playerByName = new Map(existingPlayers.map((p) => [p.name.toLowerCase(), p]));

  for (const row of S4_DATA) {
    const avatar = avatarMap.get(row.robloxId) ?? null;
    const existing = playerByName.get(row.username.toLowerCase());
    const assignedTeam = row.team !== "FREE AGENT" ? teamByName.get(row.team.toUpperCase())?.id ?? null : null;

    if (existing) {
      await db
        .update(players)
        .set({
          robloxUserId: row.robloxId,
          robloxAvatarUrl: avatar,
          teamId: assignedTeam ?? existing.teamId,
        })
        .where(eq(players.id, existing.id));
      playerByName.set(row.username.toLowerCase(), {
        ...existing,
        robloxUserId: row.robloxId,
        robloxAvatarUrl: avatar,
      });
    } else {
      const [inserted] = await db
        .insert(players)
        .values({
          name: row.username,
          displayName: row.username,
          robloxUserId: row.robloxId,
          robloxAvatarUrl: avatar,
          teamId: assignedTeam,
          position: "MID",
          isActive: true,
        })
        .returning();
      playerByName.set(row.username.toLowerCase(), inserted);
    }
  }
  console.log(`Updated/inserted players table for all S4 players.`);

  // 4. Find S4 player sheet
  const sheets = await db.select().from(playerSheets);
  const s4Sheet = sheets.find((s) => s.slug === "s4");
  if (!s4Sheet) throw new Error("S4 player sheet not found.");

  // 5. Delete existing S4 sheet rows and insert all 101 rows in exact order
  await db.delete(playerSheetRows).where(eq(playerSheetRows.sheetId, s4Sheet.id));

  const rowsToInsert = S4_DATA.map((row, idx) => {
    const player = playerByName.get(row.username.toLowerCase());
    const avatar = avatarMap.get(row.robloxId) ?? player?.robloxAvatarUrl ?? null;
    const assignedTeam = row.team !== "FREE AGENT" ? teamByName.get(row.team.toUpperCase())?.id ?? null : null;

    return {
      sheetId: s4Sheet.id,
      playerId: player?.id ?? null,
      username: row.username,
      playerClass: row.cls,
      rating: row.rating,
      teamId: assignedTeam,
      teamName: row.team,
      role: row.role,
      wage: row.wage,
      penalty: row.penalty,
      robloxUserId: row.robloxId,
      robloxAvatarUrl: avatar,
      sortOrder: idx + 1, // Exact order 1 to 101
      position: null,
      nation: row.team !== "FREE AGENT" ? row.team : null,
      notes: null,
    };
  });

  await db.insert(playerSheetRows).values(rowsToInsert);
  await db
    .update(playerSheets)
    .set({
      isVerified: true,
      isCurrent: true,
      description: "S4 current playersheet imported from the official S4 sheet in exact order.",
    })
    .where(eq(playerSheets.id, s4Sheet.id));

  console.log(`Successfully imported all ${rowsToInsert.length} rows into S4 Playersheet in exact order!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
