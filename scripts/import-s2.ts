import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { playerSheetRows, playerSheets, players } from "../src/db/schema";
import { resolveRobloxUsers } from "../src/lib/roblox";

type S2Row = {
  cls: string;
  rating: number;
  username: string;
  wage: number;
  team: string;
  position: string;
  /** Screenshot UserID when legible; otherwise resolve it by username. */
  robloxId?: string;
};

/** S2 screenshots transcribed in displayed order, top to bottom. */
const S2_DATA: S2Row[] = [
  // ---- X CLASS ----
  { cls: "X+", rating: 94, username: "Zvlatan", wage: 400000, team: "F.C. BARCELONA", position: "ST", robloxId: "8229784554" },
  { cls: "X+", rating: 93, username: "Kylzno", wage: 350000, team: "REAL MADRID C.F.", position: "CAM", robloxId: "2368415314" },
  { cls: "X", rating: 92, username: "LivingInLiverpool", wage: 400000, team: "REAL MADRID C.F.", position: "CM", robloxId: "7491953352" },
  { cls: "X", rating: 91, username: "plaetini", wage: 350000, team: "FREE AGENT", position: "ST", robloxId: "1396395266" },

  // ---- S CLASS ----
  { cls: "S+", rating: 90, username: "ervxttini", wage: 400000, team: "F.C. BARCELONA", position: "ST", robloxId: "1491265353" },
  { cls: "S+", rating: 89, username: "hugosxnchezz", wage: 300000, team: "REAL MADRID C.F.", position: "CDM", robloxId: "348002908" },
  { cls: "S+", rating: 89, username: "TvaatStudio", wage: 300000, team: "S.S.C. NAPOLI", position: "ST", robloxId: "2205710348" },
  { cls: "S+", rating: 88, username: "RelixMoon", wage: 275000, team: "SPORTING CP", position: "CB", robloxId: "1442972160" },
  { cls: "S", rating: 87, username: "sensationalf", wage: 275000, team: "SPORTING CP", position: "CB", robloxId: "9887108799" },
  { cls: "S", rating: 87, username: "hugobossjs123", wage: 325000, team: "F.C. BARCELONA", position: "ST", robloxId: "1491264532" },
  { cls: "S", rating: 87, username: "PlaxnetSupreme", wage: 275000, team: "FREE AGENT", position: "CDM", robloxId: "1551608449" },
  { cls: "S", rating: 87, username: "rayanhyd2011", wage: 325000, team: "REAL MADRID C.F.", position: "GK", robloxId: "1347995331" },
  { cls: "S", rating: 86, username: "mousa0100", wage: 300000, team: "FREE AGENT", position: "CM", robloxId: "631120149" },
  { cls: "S", rating: 86, username: "iwannarott", wage: 250000, team: "ATLETICO MADRID", position: "ST", robloxId: "7443295630" },
  { cls: "S", rating: 86, username: "pop_102852", wage: 300000, team: "SPORTING CP", position: "CB", robloxId: "5177808554" },
  { cls: "S", rating: 86, username: "levidenboer", wage: 250000, team: "S.S.C. NAPOLI", position: "CM", robloxId: "445267246" },
  { cls: "S", rating: 86, username: "nunken_insanio", wage: 275000, team: "F.C. BARCELONA", position: "CB", robloxId: "2673706735" },
  { cls: "S-", rating: 85, username: "Ulecia09", wage: 225000, team: "REAL MADRID C.F.", position: "CM", robloxId: "3074951690" },
  { cls: "S-", rating: 85, username: "air0nic", wage: 225000, team: "FREE AGENT", position: "ST", robloxId: "5366943651" },
  { cls: "S-", rating: 85, username: "Sam_player0808", wage: 275000, team: "F.C. BARCELONA", position: "CDM", robloxId: "2754213767" },
  { cls: "S-", rating: 85, username: "alisilass", wage: 225000, team: "ATLETICO MADRID", position: "GK", robloxId: "8373187491" },
  { cls: "S-", rating: 85, username: "aymendz55", wage: 225000, team: "SPORTING CP", position: "CB", robloxId: "1783771389" },
  { cls: "S-", rating: 85, username: "vikingbro", wage: 225000, team: "ATLETICO MADRID", position: "CB", robloxId: "1179603442" },

  // ---- A CLASS ----
  { cls: "A+", rating: 84, username: "ediuzt", wage: 200000, team: "REAL MADRID C.F.", position: "CB", robloxId: "1672098443" },
  { cls: "A+", rating: 84, username: "loqawa", wage: 200000, team: "REAL MADRID C.F.", position: "ST", robloxId: "1066066514" },
  { cls: "A+", rating: 84, username: "malagazetaperzonka", wage: 200000, team: "SPORTING CP", position: "CB", robloxId: "176735832" },
  { cls: "A+", rating: 84, username: "alan_246810", wage: 200000, team: "FREE AGENT", position: "CM", robloxId: "86854854" },
  { cls: "A+", rating: 84, username: "bloodexchange", wage: 200000, team: "SPORTING CP", position: "CM", robloxId: "7820321151" },
  { cls: "A+", rating: 84, username: "MDuckQ", wage: 200000, team: "SPORTING CP", position: "CB", robloxId: "160390069" },
  { cls: "A+", rating: 84, username: "azerty160911", wage: 200000, team: "REAL MADRID C.F.", position: "ST", robloxId: "1593333422" },
  { cls: "A+", rating: 84, username: "wulsino", wage: 200000, team: "SPORTING CP", position: "CB", robloxId: "3679642600" },
  { cls: "A+", rating: 84, username: "rocha90", wage: 200000, team: "ATLETICO MADRID", position: "ST", robloxId: "47693999" },
  { cls: "A+", rating: 84, username: "ABMDraklo", wage: 200000, team: "FREE AGENT", position: "CM", robloxId: "332818702" },
  { cls: "A+", rating: 84, username: "defin23233894", wage: 200000, team: "REAL MADRID C.F.", position: "GK", robloxId: "3200767921" },
  { cls: "A+", rating: 83, username: "95vision", wage: 200000, team: "ATLETICO MADRID", position: "CDM", robloxId: "10150284980" },
  { cls: "A+", rating: 83, username: "baitedor", wage: 200000, team: "F.C. BARCELONA", position: "CB", robloxId: "3856260433" },
  { cls: "A+", rating: 83, username: "haruun678", wage: 200000, team: "REAL MADRID C.F.", position: "CM", robloxId: "325194104" },
  { cls: "A+", rating: 83, username: "kobayagi", wage: 200000, team: "REAL MADRID C.F.", position: "CB", robloxId: "882136163" },
  { cls: "A+", rating: 83, username: "MaguireTheBestCB_OAT", wage: 200000, team: "REAL MADRID C.F.", position: "CB", robloxId: "4686830478" },
  { cls: "A+", rating: 83, username: "ih1or", wage: 200000, team: "REAL MADRID C.F.", position: "CM", robloxId: "3576665957" },
  { cls: "A+", rating: 83, username: "44Cinz", wage: 200000, team: "F.C. BARCELONA", position: "CB", robloxId: "8681333855" },
  { cls: "A", rating: 82, username: "mortolion", wage: 175000, team: "F.C. BARCELONA", position: "CB", robloxId: "1614893216" },
  { cls: "A", rating: 82, username: "emir_martinez23", wage: 275000, team: "REAL MADRID C.F.", position: "GK", robloxId: "5869676457" },
  { cls: "A", rating: 82, username: "uptrevel2", wage: 225000, team: "REAL MADRID C.F.", position: "ST", robloxId: "687974925" },
  { cls: "A", rating: 82, username: "VaMangerDeLherbe", wage: 175000, team: "SPORTING CP", position: "CB", robloxId: "5247713611" },
  { cls: "A", rating: 82, username: "bobobobobobobobo", wage: 175000, team: "ATLETICO MADRID", position: "GK", robloxId: "1018405510" },
  { cls: "A", rating: 82, username: "kingcharzuki", wage: 175000, team: "FREE AGENT", position: "CM", robloxId: "200570168" },
  { cls: "A", rating: 82, username: "cloudzandthunder7", wage: 175000, team: "REAL MADRID C.F.", position: "CB", robloxId: "513765875" },
  { cls: "A", rating: 82, username: "perro_4688", wage: 175000, team: "REAL MADRID C.F.", position: "RW", robloxId: "4227890840" },
  { cls: "A", rating: 82, username: "alawilo3", wage: 225000, team: "FREE AGENT", position: "CB", robloxId: "2536573064" },
  { cls: "A", rating: 81, username: "GGGDFR", wage: 175000, team: "F.C. BARCELONA", position: "CM", robloxId: "6365318" },
  { cls: "A", rating: 81, username: "xr5me", wage: 175000, team: "SPORTING CP", position: "LW", robloxId: "500152823" },
  { cls: "A", rating: 81, username: "CashKACE_Music", wage: 175000, team: "FREE AGENT", position: "CDM", robloxId: "2769121491" },
  { cls: "A", rating: 81, username: "Vorenixyz", wage: 175000, team: "FREE AGENT", position: "CB", robloxId: "9807032401" },
  { cls: "A", rating: 81, username: "Mr_DuckiQ", wage: 175000, team: "FREE AGENT", position: "CB", robloxId: "3884765780" },
  { cls: "A", rating: 81, username: "wharton", wage: 225000, team: "FREE AGENT", position: "CDM", robloxId: "7550621758" },
  { cls: "A", rating: 81, username: "yilazerboi", wage: 175000, team: "F.C. BARCELONA", position: "CB", robloxId: "1704142055" },
  { cls: "A", rating: 81, username: "Solely122011", wage: 175000, team: "REAL MADRID C.F.", position: "CM", robloxId: "5866604607" },
  { cls: "A", rating: 81, username: "abrarinho_skillz", wage: 175000, team: "REAL MADRID C.F.", position: "CB", robloxId: "2699566329" },
  { cls: "A", rating: 81, username: "prolegend191", wage: 175000, team: "FREE AGENT", position: "ST", robloxId: "1536345438" },
  { cls: "A", rating: 80, username: "duhfan2", wage: 200000, team: "FREE AGENT", position: "ST", robloxId: "10321011990" },
  { cls: "A", rating: 80, username: "Dani10Blox", wage: 150000, team: "REAL MADRID C.F.", position: "GK", robloxId: "653769605" },
  { cls: "A", rating: 80, username: "want_noting", wage: 150000, team: "FREE AGENT", position: "CM", robloxId: "7106597338" },
  { cls: "A", rating: 80, username: "mateusz13pl6", wage: 150000, team: "ATLETICO MADRID", position: "ST", robloxId: "848468844" },
  { cls: "A", rating: 80, username: "vizarooo", wage: 150000, team: "FREE AGENT", position: "CM", robloxId: "250729617" },
  { cls: "A", rating: 80, username: "Meteoric_Sky", wage: 150000, team: "SPORTING CP", position: "GK", robloxId: "6109957910" },
  { cls: "A", rating: 80, username: "pablothes4", wage: 150000, team: "FREE AGENT", position: "CB", robloxId: "10571898472" },

  // ---- B CLASS ----
  { cls: "B+", rating: 79, username: "ender23end", wage: 125000, team: "FREE AGENT", position: "GK", robloxId: "3828494496" },
  { cls: "B+", rating: 80, username: "raees6978", wage: 150000, team: "F.C. BARCELONA", position: "GK", robloxId: "7619657061" },
  { cls: "B+", rating: 79, username: "zancielo", wage: 125000, team: "FREE AGENT", position: "CM", robloxId: "1076242641" },
  { cls: "B+", rating: 79, username: "KartYBAalt", wage: 125000, team: "FREE AGENT", position: "CDM", robloxId: "2843328066" },
  { cls: "B+", rating: 79, username: "Zlonxvoo", wage: 125000, team: "FREE AGENT", position: "CM", robloxId: "8681333855" },
  { cls: "B+", rating: 79, username: "ryundxn7", wage: 150000, team: "REAL MADRID C.F.", position: "CB", robloxId: "2352526302" },
  { cls: "B+", rating: 79, username: "leftrightskilled", wage: 125000, team: "FREE AGENT", position: "RW", robloxId: "9769217388" },
  { cls: "B+", rating: 79, username: "super_herosssssss", wage: 125000, team: "FREE AGENT", position: "GK", robloxId: "2323665871" },
  { cls: "B+", rating: 78, username: "3vthu", wage: 125000, team: "FREE AGENT", position: "CB", robloxId: "8149855899" },
  { cls: "B+", rating: 78, username: "demolay7999", wage: 125000, team: "FREE AGENT", position: "CB", robloxId: "2690762699" },
  { cls: "B+", rating: 78, username: "midoxiious", wage: 125000, team: "FREE AGENT", position: "CB", robloxId: "2470139900" },
  { cls: "B+", rating: 78, username: "sushsisksksk", wage: 125000, team: "FREE AGENT", position: "CM", robloxId: "3901834233" },
  { cls: "B+", rating: 78, username: "1KhaledPro1", wage: 125000, team: "FREE AGENT", position: "GK", robloxId: "1103729499" },
  { cls: "B+", rating: 78, username: "Sileendpeer", wage: 125000, team: "FREE AGENT", position: "CM", robloxId: "2702070805" },
  { cls: "B+", rating: 78, username: "FriedsWorld", wage: 125000, team: "FREE AGENT", position: "GK", robloxId: "3872468574" },
  { cls: "B+", rating: 78, username: "G4G4QRI", wage: 125000, team: "FREE AGENT", position: "GK", robloxId: "5628691195" },
  { cls: "B+", rating: 78, username: "Lukapropopoo9", wage: 125000, team: "FREE AGENT", position: "CB", robloxId: "1765682650" },
  { cls: "B+", rating: 78, username: "DidaBrazilGK", wage: 125000, team: "F.C. BARCELONA", position: "CB", robloxId: "3993255411" },
  { cls: "B+", rating: 78, username: "IJustMissBeingHappy", wage: 125000, team: "FREE AGENT", position: "ST", robloxId: "4612257519" },
  { cls: "B+", rating: 78, username: "IJonxYz", wage: 125000, team: "REAL MADRID C.F.", position: "GK", robloxId: "2902059062" },
  { cls: "B+", rating: 78, username: "bombake_pepemreke", wage: 125000, team: "FREE AGENT", position: "CB", robloxId: "3257214359" },
  { cls: "B", rating: 77, username: "anissenyH", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "1141976132" },
  { cls: "B", rating: 77, username: "Sabaluka1119", wage: 150000, team: "FREE AGENT", position: "LW", robloxId: "9019129455" },
  { cls: "B", rating: 77, username: "revolfsaea", wage: 100000, team: "FREE AGENT", position: "ST", robloxId: "5688882993" },
  { cls: "B", rating: 77, username: "samurai8873", wage: 100000, team: "FREE AGENT", position: "ST", robloxId: "7293207294" },
  { cls: "B", rating: 77, username: "NEYMARJR555512", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "5838454992" },
  { cls: "B", rating: 77, username: "E3micExpressYankasap", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "5632676792" },
  { cls: "B", rating: 77, username: "trekeus5_rdt", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "1163725704" },
  { cls: "B", rating: 77, username: "2kB4RR", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "565394655" },
  { cls: "B", rating: 77, username: "latelyarrived", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "7502249455" },
  { cls: "B", rating: 77, username: "duoman9", wage: 100000, team: "FREE AGENT", position: "LW", robloxId: "7920478985" },
  { cls: "B", rating: 77, username: "Nooxius_xluzd", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "6229907871" },
  { cls: "B", rating: 77, username: "kartal1616", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "2697243569" },
  { cls: "B", rating: 77, username: "maribuu", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "826287492" },
  { cls: "B", rating: 77, username: "valen7159", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "1754616944" },
  { cls: "B", rating: 77, username: "bniestaa", wage: 100000, team: "FREE AGENT", position: "CDM", robloxId: "10887898162" },
  { cls: "B", rating: 77, username: "assistmacho", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "9656849187" },
  { cls: "B", rating: 77, username: "llorise", wage: 100000, team: "FREE AGENT", position: "RW", robloxId: "4477507377" },
  { cls: "B", rating: 77, username: "eboyeboy", wage: 100000, team: "FREE AGENT", position: "LW", robloxId: "3331929512" },
  { cls: "B", rating: 77, username: "babz24y", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "1687482102" },
  { cls: "B", rating: 76, username: "BaleisGoated11Wales", wage: 100000, team: "ATLETICO MADRID", position: "CB", robloxId: "9182815640" },
  { cls: "B", rating: 76, username: "opgpedisthu", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "539210769" },
  { cls: "B", rating: 76, username: "lawnsawg", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "794654934" },
  { cls: "B", rating: 76, username: "Tyieboy90", wage: 150000, team: "REAL MADRID C.F.", position: "CB", robloxId: "9740657398" },
  { cls: "B", rating: 76, username: "AyoubExro", wage: 100000, team: "ATLETICO MADRID", position: "ST", robloxId: "10239595322" },
  { cls: "B", rating: 76, username: "amxinho2", wage: 100000, team: "FREE AGENT", position: "LW", robloxId: "7932084052" },
  { cls: "B", rating: 76, username: "Weshking12000", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "1067118549" },
  { cls: "B", rating: 76, username: "FFslFF2", wage: 100000, team: "FREE AGENT", position: "GK", robloxId: "444133621" },
  { cls: "B", rating: 76, username: "999hpxd", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "776666441" },
  { cls: "B", rating: 76, username: "Hakimi_111", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "37980888" },
  { cls: "B", rating: 76, username: "JeremiahTheGamer01", wage: 100000, team: "FREE AGENT", position: "CDM", robloxId: "1701805598" },
  { cls: "B", rating: 76, username: "jaboc_ur", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "7246562214" },
  { cls: "B", rating: 76, username: "gx_Fabio11", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "5557627187" },
  { cls: "B", rating: 76, username: "thejohn_421", wage: 100000, team: "ATLETICO MADRID", position: "ST", robloxId: "10789564949" },
  { cls: "B", rating: 76, username: "lorr55677", wage: 100000, team: "ATLETICO MADRID", position: "CB", robloxId: "3705944" },
  { cls: "B", rating: 76, username: "TheEpicXninija", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "2866533" },
  { cls: "B", rating: 76, username: "SultanKnowzyComeback", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "6080694" },
  { cls: "B", rating: 76, username: "Beluga3333pro", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "3074444" },
  { cls: "B", rating: 76, username: "AkumaAwakened", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "9247655" },
  { cls: "B", rating: 76, username: "musgo23", wage: 100000, team: "FREE AGENT", position: "CM", robloxId: "10337929" },
  { cls: "B", rating: 76, username: "Aimbot3000Robot", wage: 150000, team: "FREE AGENT", position: "CB", robloxId: "3527596421" },
  { cls: "B", rating: 76, username: "bilbi322", wage: 100000, team: "FREE AGENT", position: "CB", robloxId: "1028898" },
  { cls: "B-", rating: 75, username: "ProGodGemini", wage: 75000, team: "FREE AGENT", position: "RW", robloxId: "2402408" },
  { cls: "B-", rating: 75, username: "matycha_akub822", wage: 75000, team: "FREE AGENT", position: "CB", robloxId: "201894" },
  { cls: "B-", rating: 75, username: "TheBloxyColaMania", wage: 75000, team: "FREE AGENT", position: "CB", robloxId: "8557304" },
];

const ALIASES: Record<string, string> = {
  loqawa: "Ioqawa",
  yilazerboi: "yoilazerboi",
  cloudzandthunder7: "cloudzandthuner7",
  "cashkace_music": "cashKACE_Music",
  kylzno: "Kylzno",
  "vamangerdelherbe": "VaMangerDeLherbe",
};

async function resolveBatch(usernames: string[]) {
  const results = new Map<string, { userId: number | null; headshotUrl: string | null }>();
  for (let i = 0; i < usernames.length; i += 100) {
    const resolved = await resolveRobloxUsers(usernames.slice(i, i + 100));
    for (const [name, identity] of resolved) {
      results.set(name.toLowerCase(), { userId: identity.userId, headshotUrl: identity.headshotUrl });
    }
  }
  return results;
}

async function fetchThumbnails(userIds: string[]) {
  const result = new Map<string, string>();
  const unique = [...new Set(userIds.filter((id) => /^\d+$/.test(id)))];
  for (let index = 0; index < unique.length; index += 100) {
    const ids = unique.slice(index, index + 100);
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(",")}&size=150x150&format=Png&isCircular=false`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const json = (await response.json()) as { data?: Array<{ targetId: number; imageUrl?: string }> };
      for (const item of json.data ?? []) if (item.imageUrl) result.set(String(item.targetId), item.imageUrl);
    } catch {
      // Keep existing/cached avatars if Roblox thumbnails are temporarily unavailable.
    }
  }
  return result;
}

async function main() {
  console.log(`S2 screenshot import: ${S2_DATA.length} players in exact image order.`);
  const [sheet] = await db.select().from(playerSheets).where(eq(playerSheets.slug, "s2"));
  if (!sheet) throw new Error("S2 playersheet not found.");

  const existingPlayers = await db.select({
    id: players.id,
    name: players.name,
    robloxUserId: players.robloxUserId,
    robloxAvatarUrl: players.robloxAvatarUrl,
  }).from(players);
  const byName = new Map(existingPlayers.map((player) => [player.name.toLowerCase(), player]));
  const toResolve = S2_DATA.map((row) => row.username);
  const resolved = await resolveBatch(toResolve);

  const idByName = new Map<string, string>();
  for (const row of S2_DATA) {
    const found = byName.get(row.username.toLowerCase()) ?? byName.get((ALIASES[row.username.toLowerCase()] ?? "").toLowerCase());
    const fromApi = resolved.get(row.username.toLowerCase());
    const id = fromApi?.userId != null ? String(fromApi.userId) : found?.robloxUserId ?? row.robloxId ?? null;
    if (id) idByName.set(row.username.toLowerCase(), id);
  }
  const avatarById = await fetchThumbnails([...idByName.values()]);

  // Ensure each sheet name can open a player profile. Preserve existing global
  // team assignments; club/Free Agent affiliation is stored on the archive row.
  for (const row of S2_DATA) {
    const key = row.username.toLowerCase();
    const current = byName.get(key) ?? byName.get((ALIASES[key] ?? "").toLowerCase());
    const account = resolved.get(key);
    const robloxUserId = idByName.get(key) ?? null;
    const avatar = (robloxUserId ? avatarById.get(robloxUserId) : null) ?? account?.headshotUrl ?? current?.robloxAvatarUrl ?? null;
    if (current) {
      if ((!current.robloxUserId && robloxUserId) || (!current.robloxAvatarUrl && avatar)) {
        await db.update(players).set({
          robloxUserId: current.robloxUserId ?? robloxUserId,
          robloxAvatarUrl: current.robloxAvatarUrl ?? avatar,
        }).where(eq(players.id, current.id));
      }
      continue;
    }
    const [inserted] = await db.insert(players).values({
      name: row.username,
      displayName: row.username,
      robloxUserId,
      robloxAvatarUrl: avatar,
      isActive: true,
    }).returning({ id: players.id, name: players.name, robloxUserId: players.robloxUserId, robloxAvatarUrl: players.robloxAvatarUrl });
    byName.set(key, inserted);
  }

  const finalPlayers = await db.select({ id: players.id, name: players.name, robloxUserId: players.robloxUserId, robloxAvatarUrl: players.robloxAvatarUrl }).from(players);
  const profileByName = new Map(finalPlayers.map((player) => [player.name.toLowerCase(), player]));
  await db.delete(playerSheetRows).where(eq(playerSheetRows.sheetId, sheet.id));

  const imported = S2_DATA.map((row, index) => {
    const key = row.username.toLowerCase();
    const player = profileByName.get(key) ?? profileByName.get((ALIASES[key] ?? "").toLowerCase());
    const identity = resolved.get(key);
    const robloxUserId = idByName.get(key) ?? player?.robloxUserId ?? null;
    const robloxAvatarUrl = (robloxUserId ? avatarById.get(robloxUserId) : null) ?? identity?.headshotUrl ?? player?.robloxAvatarUrl ?? null;
    return {
      sheetId: sheet.id,
      playerId: player?.id ?? null,
      username: row.username,
      playerClass: row.cls,
      rating: row.rating,
      position: row.position,
      role: row.position,
      teamId: null,
      teamName: row.team,
      nation: null,
      robloxUserId,
      robloxAvatarUrl,
      wage: row.wage,
      penalty: null,
      notes: null,
      sortOrder: index + 1,
    };
  });

  await db.insert(playerSheetRows).values(imported);
  await db.update(playerSheets).set({
    isCurrent: false,
    isVerified: true,
    description: "S2 playersheet imported from the supplied screenshots in exact order. Classes, ratings, wages and positions are recorded as shown.",
  }).where(eq(playerSheets.id, sheet.id));

  const avatars = imported.filter((row) => row.robloxAvatarUrl).length;
  console.log(`S2 import complete: ${imported.length} rows, ${avatars} Roblox avatars, ${imported.filter((row) => row.playerId != null).length} profile-linked rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
