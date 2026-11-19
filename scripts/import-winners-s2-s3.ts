import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { players, teamSeasonRosters, teams } from "../src/db/schema";
import { resolveRobloxUsers } from "../src/lib/roblox";

type WinnerEntry = {
  username: string;
  discordHandle: string;
};

/**
 * Real Madrid C.F. — RSL Season 2 Winners, exact order from the screenshot.
 * The screenshot lists "bloodexchange" twice (two Discord handles). Both
 * handles are preserved on that player's single roster card.
 */
const REAL_MADRID_S2_WINNERS: WinnerEntry[] = [
  { username: "bloodexchange", discordHandle: "daviezs / daviezs." },
  { username: "cloudzandthuner7", discordHandle: "cloudzandthuner67" },
  { username: "IJonxYz", discordHandle: "fozyL" },
  { username: "kyniesta", discordHandle: "kylzno" },
  { username: "LivingInLiverpool", discordHandle: "livinginliverpool1" },
  { username: "MaguireTheBestCB_OAT", discordHandle: "tsunderesuki" },
  { username: "rayanhyd2011", discordHandle: "rayanhyd2011" },
  { username: "ryudxn7", discordHandle: "dan1el_park" },
  { username: "uptrevel2", discordHandle: "wirypenguin1466" },
  { username: "wharrton", discordHandle: "wharrrton." },
];

/** A.C. Milan — RSL Season 3 Winners, exact order from the screenshot. */
const AC_MILAN_S3_WINNERS: WinnerEntry[] = [
  { username: "12110924", discordHandle: "skttbnp" },
  { username: "azerty160911", discordHandle: "capy4269" },
  { username: "ediuzt", discordHandle: "ediuzt." },
  { username: "ih1or", discordHandle: "ih1or" },
  { username: "JJ_Triggz", discordHandle: "csteeeze" },
  { username: "malgorzataparzonka", discordHandle: ".voov_." },
  { username: "rocha90", discordHandle: "rvlkh" },
  { username: "Solely122011", discordHandle: "trk_cinz" },
  { username: "Sopcerk", discordHandle: "mazaclass" },
  { username: "z_rne", discordHandle: "z_rne" },
  { username: "Zvlatan", discordHandle: "zvlatan" },
];

/** Como 1907 — RSL Season 3 Coppa Italia Winners, exact order from the screenshot. */
const COMO_COPPA_S3_WINNERS: WinnerEntry[] = [
  { username: "AkumaAwakend", discordHandle: "akuma082905" },
  { username: "eikeaura2", discordHandle: "eikejosel908" },
  { username: "FDCrostas", discordHandle: "0kdot." },
  { username: "GuillaumeRestes", discordHandle: "orbisssss" },
  { username: "MatiasJesus0108", discordHandle: "matiascsca." },
  { username: "moseyzs", discordHandle: "moseyyzs" },
  { username: "Nicolas_legend15", discordHandle: "nicolas_legend15" },
  { username: "prolegend191", discordHandle: "prolegend191" },
  { username: "santomaledetto", discordHandle: "coco1023123" },
  { username: "VaMangerDeLherbe", discordHandle: "holy" },
  { username: "xhingxj", discordHandle: "kingnikolaos" },
];

/** Misspellings in the older sheets that are the same Roblox account. */
const CANONICAL_ALIASES: Array<{ from: string; to: string; canonicalName: string }> = [
  { from: "ryundxn7", to: "ryudxn7", canonicalName: "ryudxn7" },
  { from: "VaMangherDeLherbe", to: "VaMangerDeLherbe", canonicalName: "VaMangerDeLherbe" },
];

async function main() {
  const [rma] = await db.select().from(teams).where(eq(teams.shortName, "RMA"));
  const [milan] = await db.select().from(teams).where(eq(teams.shortName, "MIL"));
  const [como] = await db.select().from(teams).where(eq(teams.shortName, "COM"));
  if (!rma || !milan || !como) {
    throw new Error("Real Madrid C.F. (RMA), A.C. Milan (MIL) or Como 1907 (COM) team not found.");
  }

  // Normalise the one Roblox username typo already in the database.
  for (const alias of CANONICAL_ALIASES) {
    const [oldPlayer] = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.name, alias.from));
    if (oldPlayer) {
      const [exact] = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.name, alias.canonicalName));
      if (!exact) {
        await db
          .update(players)
          .set({ name: alias.canonicalName, displayName: null })
          .where(eq(players.id, oldPlayer.id));
        console.log(`Normalised player name "${alias.from}" → "${alias.canonicalName}".`);
      }
    }
  }

  const allUsernames = [
    ...new Set(
      [...REAL_MADRID_S2_WINNERS, ...AC_MILAN_S3_WINNERS, ...COMO_COPPA_S3_WINNERS].map(
        (w) => w.username,
      ),
    ),
  ];
  const identities = await resolveRobloxUsers(allUsernames);

  const refreshed = await db.select().from(players);
  const byLowerName = new Map(refreshed.map((p) => [p.name.toLowerCase(), p]));

  async function resolvePlayer(username: string, teamId: number): Promise<number> {
    const existing = byLowerName.get(username.toLowerCase());
    const identity = identities.get(username);
    const robloxUserId = identity?.resolved && identity.userId != null ? String(identity.userId) : null;
    const robloxAvatarUrl = identity?.headshotUrl ?? null;

    if (existing) {
      const patch: Record<string, string | boolean> = {};
      if (robloxUserId) patch.robloxUserId = robloxUserId;
      if (robloxAvatarUrl) patch.robloxAvatarUrl = robloxAvatarUrl;
      if (identity?.resolved) patch.robloxVerified = identity.verified;
      if (Object.keys(patch).length > 0) {
        await db.update(players).set(patch).where(eq(players.id, existing.id));
      }
      return existing.id;
    }

    const [inserted] = await db
      .insert(players)
      .values({
        name: username,
        teamId,
        robloxUserId,
        robloxAvatarUrl,
        robloxVerified: identity?.verified ?? false,
        position: "MID",
        isActive: true,
      })
      .returning({ id: players.id });
    byLowerName.set(username.toLowerCase(), {
      ...inserted,
      name: username,
      displayName: null,
      teamId,
      robloxUserId,
      robloxAvatarUrl,
      robloxVerified: identity?.verified ?? false,
      position: "MID" as const,
      number: null,
      nationality: null,
      bio: null,
      isActive: true,
      createdAt: new Date(),
    } as (typeof refreshed)[number]);
    console.log(`Created player profile for ${username}${robloxUserId ? ` (Roblox ${robloxUserId})` : ""}.`);
    return inserted.id;
  }

  async function importRoster(
    teamId: number,
    season: string,
    label: string,
    winners: WinnerEntry[],
  ) {
    const rows: Array<{
      teamId: number;
      playerId: number;
      season: string;
      label: string;
      discordHandle: string;
      sortOrder: number;
    }> = [];

    for (let idx = 0; idx < winners.length; idx++) {
      const entry = winners[idx];
      const playerId = await resolvePlayer(entry.username, teamId);
      rows.push({
        teamId,
        playerId,
        season,
        label,
        discordHandle: entry.discordHandle,
        sortOrder: idx + 1,
      });
    }

    await db
      .delete(teamSeasonRosters)
      .where(and(eq(teamSeasonRosters.teamId, teamId), eq(teamSeasonRosters.season, season)));
    await db.insert(teamSeasonRosters).values(rows);
    console.log(`Imported ${rows.length} players into ${label} (${season}).`);
  }

  await importRoster(rma.id, "Season 2", "Season 2 Winners", REAL_MADRID_S2_WINNERS);
  await importRoster(milan.id, "Season 3", "Season 3 Winners", AC_MILAN_S3_WINNERS);
  await importRoster(como.id, "Season 3", "Coppa Italia Winners", COMO_COPPA_S3_WINNERS);

  await db
    .update(teams)
    .set({
      description:
        "RSL Season 2 Treble Winners — Supercopa de Iberia, Iberian League and Iberian Cup champions.",
    })
    .where(eq(teams.id, rma.id));
  await db
    .update(teams)
    .set({
      description:
        "RSL Season 3 Double Winners — Serie A and Supercoppa Italiana champions.",
    })
    .where(eq(teams.id, milan.id));
  await db
    .update(teams)
    .set({
      description: "RSL Season 3 Coppa Italia Winners — cup champions of the Italian chapter.",
    })
    .where(eq(teams.id, como.id));

  console.log("Season 2 & Season 3 winning squads imported successfully.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
