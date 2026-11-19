import { count, sql } from "drizzle-orm";
import { db } from "../db";
import {
  competitionEntrants,
  competitionPlacements,
  competitions,
  playerSheetRows,
  playerSheets,
  players,
  siteContent,
  teamSeasonRosters,
  teams,
  trophies,
  type CompetitionStatus,
  type CompetitionType,
  type NewPlayer,
  type NewTeam,
} from "../db/schema";

/** The honours supplied by the league. No match scores or player stats are invented. */
const FOUNDED = "2026";

const ARCHIVE_TEAMS: NewTeam[] = [
  { name: "Villareal", shortName: "VIL", kind: "club", primaryColor: "#f7d21e", secondaryColor: "#092b76", badgeUrl: "/images/teams/villareal.png", founded: FOUNDED },
  { name: "Girona", shortName: "GIR", kind: "club", primaryColor: "#d82333", secondaryColor: "#101c3b", badgeUrl: "/images/teams/girona.png", founded: FOUNDED },
  { name: "Real Madrid C.F.", shortName: "RMA", kind: "club", primaryColor: "#f1d6a0", secondaryColor: "#182e72", badgeUrl: "/images/teams/real-madrid.png", founded: FOUNDED },
  { name: "F.C. Barcelona", shortName: "BAR", kind: "club", primaryColor: "#ad1644", secondaryColor: "#073d88", badgeUrl: "/images/teams/barcelona.png", founded: FOUNDED },
  { name: "Sporting CP", shortName: "SPO", kind: "club", primaryColor: "#25a868", secondaryColor: "#112928", badgeUrl: "/images/teams/sporting-cp.png", founded: FOUNDED },
  { name: "Athletic Club", shortName: "ATH", kind: "club", primaryColor: "#e0242b", secondaryColor: "#0f1522", founded: FOUNDED },
  { name: "F.C. Porto", shortName: "POR", kind: "club", primaryColor: "#1f5fbf", secondaryColor: "#0d2036", founded: FOUNDED },
  { name: "A.C. Milan", shortName: "MIL", kind: "club", primaryColor: "#db262c", secondaryColor: "#101115", badgeUrl: "/images/teams/ac-milan.png", founded: FOUNDED },
  { name: "S.S. Lazio", shortName: "LAZ", kind: "club", primaryColor: "#92c5ed", secondaryColor: "#163760", badgeUrl: "/images/teams/lazio.png", founded: FOUNDED },
  { name: "Como 1907", shortName: "COM", kind: "club", primaryColor: "#377ac4", secondaryColor: "#102856", badgeUrl: "/images/teams/como.png", founded: FOUNDED },
  { name: "Netherlands", shortName: "NED", kind: "nation", primaryColor: "#ff7518", secondaryColor: "#1045ad", badgeUrl: "/images/teams/netherlands.png", founded: FOUNDED },
  { name: "Belgium", shortName: "BEL", kind: "nation", primaryColor: "#f7c739", secondaryColor: "#ed2939", badgeUrl: "/images/teams/belgium.png", founded: FOUNDED },
];

/** The roster as supplied. Every stat starts at zero until real matches are recorded. */
const ROSTER: string[] = [
  "Dembe3le", "Ioqawa", "Zvlatan", "Rocha90", "nunken_insanio", "True_Nihility", "sharkythefemmy",
  "Suitsei", "Pop_102852", "kyniesta", "LivingInLiverpool", "azerty160911", "Meteoric_Sky",
  "santomaledetto", "g45g", "tekkplus", "sensationalf", "95vision", "mousa0100", "RelixMoon",
  "MaguireTheBestCB_OAT", "44cinz", "bloodexchange", "Ulecia09", "Rayanhyd2011", "ih1or", "Joxahi",
  "vorenixyz", "Kvluta", "cashKACE_sports", "VaMangerDeLherbe", "perro_4688", "Sopcerk",
  "TvaatStudio", "earrqwadqfqf", "z_rne", "OBAMESSON2", "sousachieff", "Shn4ke",
  "cloudzandthuner7", "prolegend191", "alawilo3", "ediuzt", "MDuckQ", "markobogicevic2", "duhfan2",
  "Wulsino", "Sabaluka1119", "raees6978", "adam_gamer581", "pablothes4", "uptrevel2", "kew4l",
  "anxssen_madrid", "Solely122011", "xr5me", "ID0HOWICAN", "NeymarJrTvink", "MatiasJesus0108",
  "cashKACE_Music", "xurjfirkxjwjfo", "dani10blox", "p7gba", "IJonxYz", "BaleisGoated11Wales",
  "yocalmdownjamaa", "NEYMARJR555512", "Trekeus5_rdt", "midoxiious", "zayan15f", "XDveline",
  "freakkvara", "cloudzy6", "amxinho2", "kingcharzuki", "santo14131332", "Ron_UmGamerNormal",
  "aimbot3000robot", "17vval", "veulauro", "jaboc_ur", "aspiotackling", "fir3hunt3r56",
  "want_noting", "FriedsWorld", "fabretzko", "football_alex", "Birloclacer", "KartYBAalt",
  "TheBosnianComplex", "Zlonxvoo", "sushsisksksk", "gx_fabio11", "maxuele", "Zvzin", "estemar11",
  "JeremiahTheGamer01", "super_herosssssss", "funnygamerfunnyxx", "valen7159",
];

/** Award winners and season-winner squad members not in the roster list above. */
const EXTRA_PLAYERS = [
  "JJ_Triggz", "PoacherPlus", "Dembele_Prime18", "Levidenboer", "yoilazerboi", "VanWacky_Sus",
  "Air0nic", "Ervxttini", "iwannarott", "12110924", "ryudxn7", "wharrton", "malgorzataparzonka",
  "AkumaAwakend", "eikeaura2", "FDCrostas", "GuillaumeRestes", "moseyzs", "Nicolas_legend15",
  "xhingxj",
];

/**
 * Squad allocation by team abbreviation. Award winners are pinned to the team
 * their award lists; everyone else is distributed so every club has a squad.
 * Team assignments can be changed at any time from the Admin panel.
 */
const REAL_MADRID_S2_ROSTER: Array<{ username: string; discordHandle: string }> = [
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

const AC_MILAN_S3_ROSTER: Array<{ username: string; discordHandle: string }> = [
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

const COMO_COPPA_S3_ROSTER: Array<{ username: string; discordHandle: string }> = [
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

const SEASON_WINNER_ROSTERS: Array<{
  teamShort: string;
  season: string;
  label: string;
  roster: Array<{ username: string; discordHandle: string }>;
}> = [
  { teamShort: "VIL", season: "Season 1", label: "Season 1 Winners", roster: [] },
  { teamShort: "RMA", season: "Season 2", label: "Season 2 Winners", roster: REAL_MADRID_S2_ROSTER },
  { teamShort: "MIL", season: "Season 3", label: "Season 3 Winners", roster: AC_MILAN_S3_ROSTER },
  { teamShort: "COM", season: "Season 3", label: "Coppa Italia Winners", roster: COMO_COPPA_S3_ROSTER },
];

const VILLAREAL_S1_ROSTER: Array<{ username: string; discordHandle: string }> = [
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

const SQUADS: Record<string, string[]> = {
  VIL: VILLAREAL_S1_ROSTER.map((r) => r.username),
  GIR: ["True_Nihility", "sharkythefemmy", "Suitsei", "santomaledetto", "95vision", "MaguireTheBestCB_OAT", "Rayanhyd2011", "Joxahi", "VaMangerDeLherbe", "TvaatStudio", "z_rne", "sousachieff"],
  RMA: ["kyniesta", "LivingInLiverpool", "anxssen_madrid", "NeymarJrTvink", "NEYMARJR555512", "XDveline", "kingcharzuki", "Ron_UmGamerNormal", "jaboc_ur", "Zlonxvoo", "Zvzin"],
  BAR: ["azerty160911", "mousa0100", "g45g", "44cinz", "bloodexchange", "Ulecia09", "vorenixyz", "Kvluta", "Sopcerk", "earrqwadqfqf", "Shn4ke", "alawilo3"],
  SPO: ["tekkplus", "sensationalf", "Meteoric_Sky", "Wulsino", "cloudzandthuner7", "markobogicevic2", "duhfan2", "raees6978", "adam_gamer581", "pablothes4", "uptrevel2"],
  ATH: ["kew4l", "Solely122011", "xr5me", "MatiasJesus0108", "cashKACE_Music", "xurjfirkxjwjfo", "dani10blox", "p7gba", "IJonxYz", "yocalmdownjamaa", "Trekeus5_rdt", "midoxiious"],
  POR: ["ih1or", "zayan15f", "freakkvara", "cloudzy6", "amxinho2", "santo14131332", "17vval", "veulauro", "aspiotackling", "fir3hunt3r56", "FriedsWorld", "fabretzko"],
  MIL: ["football_alex", "Birloclacer", "KartYBAalt", "TheBosnianComplex", "sushsisksksk", "maxuele", "estemar11", "JeremiahTheGamer01", "super_herosssssss", "valen7159", "Rocha90"],
  LAZ: ["Ioqawa", "Rocha90", "cloudzy6", "maxuele"],
  COM: [],
  NED: [],
  BEL: [],
};

const POSITIONS_BY_INDEX: Array<"GK" | "DEF" | "MID" | "FWD"> = ["GK", "DEF", "DEF", "MID", "MID", "FWD"];

type IndividualAward = {
  award: string;
  season: string;
  /** Competition name, or null for global awards like the Ballon d'Or. */
  competition?: string;
  player: string;
  team?: string | null;
  notes?: string;
};

/** Individual awards exactly as supplied for Seasons 1 and 2. */
const INDIVIDUAL_AWARDS: IndividualAward[] = [
  // ---- Season 1 ----
  { award: "La Liga Player of The Season", season: "Season 1", competition: "LALIGA", player: "JJ_Triggz", team: "VIL" },
  { award: "Supercopa de España Player of The Tournament", season: "Season 1", competition: "Supercopa de España", player: "Zvlatan", team: "VIL" },
  { award: "La Liga Golden Boot", season: "Season 1", competition: "LALIGA", player: "JJ_Triggz", team: "VIL" },
  { award: "Supercopa de España Golden Boot", season: "Season 1", competition: "Supercopa de España", player: "Pop_102852", team: "VIL" },
  { award: "La Liga Playmaker of The Season", season: "Season 1", competition: "LALIGA", player: "PoacherPlus", team: "ATH" },
  { award: "Supercopa de España Playmaker of The Season", season: "Season 1", competition: "Supercopa de España", player: "MDuckQ", team: "VIL" },
  { award: "Ballon D'Or", season: "Season 1", player: "Zvlatan", team: "VIL" },
  { award: "Golden Boy", season: "Season 1", player: "Dembele_Prime18", team: "GIR" },
  { award: "Golden Glove", season: "Season 1", player: "Levidenboer", team: "GIR" },
  { award: "Defensive Player of the Season", season: "Season 1", player: "nunken_insanio", team: "VIL" },
  { award: "Manager of the Season", season: "Season 1", player: "yoilazerboi", team: "VIL" },
  { award: "Puskas Award", season: "Season 1", player: "VanWacky_Sus", team: "GIR" },
  { award: "Referee Of The Season", season: "Season 1", player: "ediuzt", team: null },
  // ---- Season 2 ----
  { award: "Supercopa de Iberia Player Of The Tournament", season: "Season 2", competition: "Supercopa de Iberia", player: "Air0nic", team: "SPO" },
  { award: "Supercopa de Iberia Golden Boot", season: "Season 2", competition: "Supercopa de Iberia", player: "Air0nic", team: "SPO" },
  { award: "Supercopa de Iberia Playmaker", season: "Season 2", competition: "Supercopa de Iberia", player: "Air0nic", team: "SPO" },
  { award: "Iberian League Player Of The Season", season: "Season 2", competition: "Iberian League", player: "Kyniesta", team: "RMA" },
  { award: "Iberian League Golden Boot", season: "Season 2", competition: "Iberian League", player: "Ervxttini", team: "BAR" },
  { award: "Iberian League Playmaker", season: "Season 2", competition: "Iberian League", player: "LivingInLiverpool", team: "RMA" },
  { award: "Iberian Cup Player Of The Tournament", season: "Season 2", competition: "Iberian Cup", player: "RelixMoon", team: "SPO" },
  { award: "Iberian Cup Golden Boot", season: "Season 2", competition: "Iberian Cup", player: "tekkplus", team: "SPO" },
  { award: "Iberian Cup Playmaker", season: "Season 2", competition: "Iberian Cup", player: "Levidenboer", team: "POR" },
  { award: "Ballon D'Or", season: "Season 2", player: "Kyniesta", team: "RMA" },
  { award: "Golden Boy", season: "Season 2", player: "ih1or", team: "POR" },
  { award: "Golden Glove", season: "Season 2", player: "Meteoric_Sky", team: "SPO" },
  { award: "Defensive Player of the Season", season: "Season 2", player: "sensationalf", team: "SPO" },
  { award: "Manager of the Season", season: "Season 2", player: "Wulsino", team: "SPO" },
  { award: "Puskas Award", season: "Season 2", player: "iwannarott", team: "RMA", notes: "Vs Benfica GW 3 Supercopa Iberiana" },
  { award: "Referee Of The Season", season: "Season 2", player: "Zvlatan", team: null },
];

const DEFAULT_CONTENT: Array<typeof siteContent.$inferInsert> = [
  {
    kind: "hero",
    title: "Season 4 · The EUROS",
    imageUrl: "/images/rsl-euros-crest.png",
    caption: "The international chapter — Netherlands × Belgium.",
    sortOrder: 0,
  },
];

type ArchiveCompetition = {
  name: string;
  season: string;
  type: CompetitionType;
  status: CompetitionStatus;
  description: string;
  badgeUrl?: string;
  winner?: string;
  runnerUp?: string;
  entrants?: string[];
};

const ARCHIVE_COMPETITIONS: ArchiveCompetition[] = [
  {
    name: "LALIGA", season: "Season 1", type: "league", status: "completed",
    description: "RSL Season 1 · Spanish League. The inaugural LaLiga campaign.",
    winner: "Villareal", runnerUp: "Girona",
  },
  {
    name: "Supercopa de España", season: "Season 1", type: "cup", status: "completed",
    badgeUrl: "/images/competitions/supercopa-espana.png",
    description: "RSL Season 1 · Spanish League. The Spanish Super Cup.",
    winner: "Villareal", runnerUp: "Girona",
  },
  {
    name: "Supercopa de Iberia", season: "Season 2", type: "cup", status: "completed",
    badgeUrl: "/images/competitions/supercopa-iberia.png",
    description: "RSL Season 2 · Spanish League. The Iberian Super Cup.",
    winner: "Real Madrid C.F.", runnerUp: "F.C. Barcelona",
  },
  {
    name: "Iberian League", season: "Season 2", type: "league", status: "completed",
    description: "RSL Season 2 · Spanish League. The Iberian League title.",
    winner: "Real Madrid C.F.", runnerUp: "F.C. Barcelona",
  },
  {
    name: "Iberian Cup", season: "Season 2", type: "cup", status: "completed",
    description: "RSL Season 2 · Spanish League. The Iberian Cup.",
    winner: "Real Madrid C.F.", runnerUp: "Sporting CP",
  },
  {
    name: "Serie A", season: "Season 3", type: "league", status: "completed",
    badgeUrl: "/images/competitions/serie-a.png",
    description: "RSL Season 3 · Italian League. The Serie A championship.",
    winner: "A.C. Milan", runnerUp: "S.S. Lazio",
  },
  {
    name: "Coppa Italia", season: "Season 3", type: "cup", status: "completed",
    badgeUrl: "/images/competitions/coppa-italia.png",
    description: "RSL Season 3 · Italian League. The Italian domestic cup.",
    winner: "Como 1907", runnerUp: "S.S. Lazio",
  },
  {
    name: "Supercoppa Italiana", season: "Season 3", type: "cup", status: "completed",
    badgeUrl: "/images/competitions/supercoppa-italiana.png",
    description: "RSL Season 3 · Italian League. The Italian Super Cup.",
    winner: "A.C. Milan", runnerUp: "S.S. Lazio",
  },
  {
    name: "EUROS", season: "Season 4", type: "tournament", status: "ongoing",
    badgeUrl: "/images/rsl-euros-crest.png",
    description: "RSL Season 4 · The Euros. A new international chapter with a Netherlands–Belgium identity. Fixtures, squads and results will be added as the tournament progresses.",
    entrants: ["Netherlands", "Belgium"],
  },
];

export async function hasAnyData() {
  const [[teamCount], [competitionCount]] = await Promise.all([
    db.select({ n: count() }).from(teams),
    db.select({ n: count() }).from(competitions),
  ]);
  return (teamCount?.n ?? 0) > 0 || (competitionCount?.n ?? 0) > 0;
}

/** Admin-only destructive tool. Callers must check authentication. */
export async function clearAllData() {
  await db.execute(sql`TRUNCATE TABLE player_sheet_rows, player_sheets, site_content, competition_placements, competition_entrants, trophies, appearances, goals, matches, competitions, players, teams RESTART IDENTITY CASCADE`);
}

/** Idempotent: refuses to overwrite a league that already contains data. */
export async function seedArchiveData() {
  if (await hasAnyData()) {
    return { ok: false as const, message: "The database already has data. Clear it before loading the RSL archive." };
  }

  return db.transaction(async (tx) => {
    const insertedTeams = await tx.insert(teams).values(ARCHIVE_TEAMS).returning({ id: teams.id, name: teams.name, shortName: teams.shortName });
    const teamByName = new Map(insertedTeams.map((team) => [team.name, team.id]));
    const teamByShort = new Map(insertedTeams.map((team) => [team.shortName, team.id]));

    // ---- Players: every stat stays at zero until real matches are recorded ----
    const assigned = new Map<string, number>();
    for (const [short, names] of Object.entries(SQUADS)) {
      const teamId = teamByShort.get(short);
      if (!teamId) continue;
      for (const name of names) if (!assigned.has(name)) assigned.set(name, teamId);
    }

    const roster = [...new Set([...ROSTER, ...EXTRA_PLAYERS])];
    const playerRows: NewPlayer[] = roster.map((name, index) => ({
      name,
      teamId: assigned.get(name) ?? null,
      position: POSITIONS_BY_INDEX[index % POSITIONS_BY_INDEX.length],
      number: (index % 30) + 1,
      isActive: true,
    }));
    const insertedPlayers = await tx.insert(players).values(playerRows).returning({ id: players.id, name: players.name });
    const playerByName = new Map(insertedPlayers.map((row) => [row.name.toLowerCase(), row.id]));

    // ---- Competitions ----
    const insertedCompetitions = await tx.insert(competitions).values(
      ARCHIVE_COMPETITIONS.map(({ winner: _w, runnerUp: _r, entrants: _e, ...competition }) => competition),
    ).returning({ id: competitions.id, name: competitions.name });
    const competitionByName = new Map(insertedCompetitions.map((row) => [row.name, row.id]));

    const entrantRows: Array<{ competitionId: number; teamId: number }> = [];
    const placementRows: Array<{ competitionId: number; teamId: number; placement: number }> = [];
    const trophyRows: Array<typeof trophies.$inferInsert> = [];

    ARCHIVE_COMPETITIONS.forEach((competition, index) => {
      const competitionId = insertedCompetitions[index].id;
      const participants = new Set([competition.winner, competition.runnerUp, ...(competition.entrants ?? [])]);
      for (const name of participants) {
        if (!name) continue;
        const teamId = teamByName.get(name);
        if (!teamId) throw new Error(`Unknown archived team: ${name}`);
        entrantRows.push({ competitionId, teamId });
      }
      if (competition.winner) {
        const teamId = teamByName.get(competition.winner)!;
        placementRows.push({ competitionId, teamId, placement: 1 });
        trophyRows.push({
          name: `${competition.name} Winners`,
          kind: "team",
          teamId,
          competitionId,
          season: competition.season,
          icon: "🏆",
        });
      }
      if (competition.runnerUp) {
        placementRows.push({ competitionId, teamId: teamByName.get(competition.runnerUp)!, placement: 2 });
        trophyRows.push({
          name: `${competition.name} Runner-Up`,
          kind: "team",
          teamId: teamByName.get(competition.runnerUp)!,
          competitionId,
          season: competition.season,
          icon: "🥈",
        });
      }
    });

    // ---- Individual awards, linked to real player profiles ----
    const missingAwards: string[] = [];
    for (const entry of INDIVIDUAL_AWARDS) {
      const playerId = playerByName.get(entry.player.toLowerCase());
      if (!playerId) {
        missingAwards.push(entry.player);
        continue;
      }
      trophyRows.push({
        name: entry.award,
        kind: "individual",
        playerId,
        teamId: entry.team ? teamByShort.get(entry.team) ?? null : null,
        competitionId: entry.competition ? competitionByName.get(entry.competition) ?? null : null,
        season: entry.season,
        icon: "🏆",
        notes: entry.notes ?? null,
      });
    }

    await tx.insert(competitionEntrants).values(entrantRows);
    await tx.insert(competitionPlacements).values(placementRows);
    await tx.insert(trophies).values(trophyRows);
    await tx.insert(siteContent).values(DEFAULT_CONTENT);

    // Official season-winning squads: Villareal S1, Real Madrid S2, AC Milan S3.
    for (const winner of SEASON_WINNER_ROSTERS) {
      const teamId = teamByShort.get(winner.teamShort);
      if (!teamId) continue;
      const source = winner.teamShort === "VIL" ? VILLAREAL_S1_ROSTER : winner.roster;
      const winnerRows = source
        .map((entry, idx) => {
          const pid = playerByName.get(entry.username.toLowerCase());
          return pid
            ? {
                teamId,
                playerId: pid,
                season: winner.season,
                label: winner.label,
                discordHandle: entry.discordHandle,
                sortOrder: idx + 1,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
      if (winnerRows.length) await tx.insert(teamSeasonRosters).values(winnerRows);
    }

    // Playersheet archive begins at S2 as requested. These are clearly marked
    // draft rosters: no class or wage is guessed from awards or current stats.
    const sheetSeeds = await tx.insert(playerSheets).values([
      { slug: "s2", label: "S2 Playersheet", season: "Season 2", description: "S2 archived playersheet", isCurrent: false, isVerified: false, sortOrder: 2 },
      { slug: "s3", label: "S3 Playersheet", season: "Season 3", description: "S3 archived roster awaiting its original spreadsheet", isCurrent: false, isVerified: false, sortOrder: 3 },
      { slug: "s4", label: "S4 Playersheet", season: "Season 4", description: "S4 current roster awaiting its original spreadsheet", isCurrent: true, isVerified: false, sortOrder: 4 },
    ]).returning({ id: playerSheets.id, slug: playerSheets.slug });
    const sheetRowsToInsert: Array<typeof playerSheetRows.$inferInsert> = [];
    for (const sheet of sheetSeeds) {
      insertedPlayers.forEach((player, index) => {
        sheetRowsToInsert.push({
          sheetId: sheet.id,
          playerId: player.id,
          username: player.name,
          teamId: assigned.get(player.name) ?? null,
          role: sheet.slug === "s2" && player.name.toLowerCase() === "wulsino" ? "MANAGER" : "PLAYER",
          playerClass: "UNRATED",
          wage: null,
          penalty: null,
          sortOrder: index,
        });
      });
    }
    await tx.insert(playerSheetRows).values(sheetRowsToInsert);

    const unassigned = roster.filter((name) => !assigned.has(name)).length;
    const suffix = missingAwards.length ? ` Skipped awards for unknown players: ${missingAwards.join(", ")}.` : "";
    return {
      ok: true as const,
      message: `RSL archive loaded: ${insertedTeams.length} teams, ${playerRows.length} players, ${insertedCompetitions.length} competitions, ${trophyRows.length} trophies and awards.${unassigned ? ` ${unassigned} players are free agents.` : ""}${suffix}`,
    };
  });
}
