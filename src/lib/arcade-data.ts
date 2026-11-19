import { cache } from "react";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { arcadeScores, communitySquads, type ArcadeScore, type CommunitySquad } from "@/db/schema";
import { classFamily, classRank, getPlayerSheets, normalizeClass } from "@/lib/player-sheets";
import {
  computePlayerStats,
  emptyLine,
  getLeagueData,
  teamHonoursForPlayer,
} from "@/lib/stats";

export type SeasonSnapshot = {
  rating: number | null;
  cls: string;
  wage: number | null;
  team: string;
  role: string;
  position: string | null;
};

export type CardTier = "ICON" | "HERO" | "TOTW" | "GOLD" | "SILVER";

export type CardAttributes = {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
};

export type ArcadePlayer = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  robloxUserId: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  detailedPosition: string;
  currentTeam: string;
  currentTeamBadge: string | null;
  primaryClub: string;
  clubs: string[];
  seasons: Array<"S1" | "S2" | "S3" | "S4">;
  s2: SeasonSnapshot | null;
  s3: SeasonSnapshot | null;
  s4: SeasonSnapshot | null;
  peakOvr: number;
  latestOvr: number;
  peakClass: string;
  classFamilies: string[];
  peakWage: number;
  s4Wage: number;
  awards: string[];
  teamTrophies: string[];
  isS1Winner: boolean;
  hasManagerRole: boolean;
  career: {
    apps: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    motm: number;
  };
  tier: CardTier;
  attrs: CardAttributes;
};

const CLUB_CANONICAL: Record<string, string> = {
  "villareal": "Villareal",
  "girona": "Girona",
  "real madrid": "Real Madrid C.F.",
  "real madrid c.f.": "Real Madrid C.F.",
  "barcelona": "F.C. Barcelona",
  "f.c. barcelona": "F.C. Barcelona",
  "sporting cp": "Sporting CP",
  "atletico madrid": "Atletico Madrid",
  "athletic club": "Athletic Club",
  "f.c. porto": "F.C. Porto",
  "porto": "F.C. Porto",
  "a.c. milan": "A.C. Milan",
  "milan": "A.C. Milan",
  "s.s. lazio": "S.S. Lazio",
  "lazio": "S.S. Lazio",
  "como 1907": "Como 1907",
  "bologna f.c.": "Bologna F.C.",
  "inter milan": "Inter Milan",
  "atalanta b.c.": "Atalanta B.C.",
  "a.c.f. fiorentina": "A.C.F. Fiorentina",
  "s.s.c. napoli": "S.S.C. Napoli",
  "juventus": "Juventus",
  "netherlands": "Netherlands",
  "belgium": "Belgium",
  "spain": "Spain",
  "italy": "Italy",
  "portugal": "Portugal",
};

function canonicalClub(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toUpperCase() === "FREE AGENT" || trimmed === "—") return null;
  return CLUB_CANONICAL[trimmed.toLowerCase()] ?? trimmed;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function mapPositionGroup(pos: string | null | undefined, fallback: "GK" | "DEF" | "MID" | "FWD"): "GK" | "DEF" | "MID" | "FWD" {
  if (!pos) return fallback;
  const p = pos.toUpperCase();
  if (p === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB", "DEF"].includes(p)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM", "MID"].includes(p)) return "MID";
  if (["ST", "CF", "LW", "RW", "FWD"].includes(p)) return "FWD";
  return fallback;
}

function computeAttributes(
  username: string,
  ovr: number,
  group: "GK" | "DEF" | "MID" | "FWD",
  detailed: string,
  awards: string[],
): CardAttributes {
  const seed = hashSeed(username);
  const jitter = (shift: number) => ((seed >>> shift) % 7) - 3; // -3..+3

  const awardStr = awards.join(" ").toLowerCase();
  const bootBonus = awardStr.includes("golden boot") || awardStr.includes("puskas") ? 4 : 0;
  const playmakerBonus = awardStr.includes("playmaker") ? 4 : 0;
  const defBonus = awardStr.includes("defensive") || awardStr.includes("golden glove") ? 5 : 0;
  const ballonBonus = awardStr.includes("ballon") || awardStr.includes("player of") ? 3 : 0;

  if (group === "GK") {
    return {
      pac: clamp(ovr - 6 + jitter(0) + ballonBonus, 55, 97),
      sho: clamp(ovr - 18 + jitter(3), 45, 88),
      pas: clamp(ovr - 4 + jitter(6) + playmakerBonus, 58, 96),
      dri: clamp(ovr - 5 + jitter(9) + defBonus, 60, 98),
      def: clamp(ovr + 2 + jitter(12) + defBonus + ballonBonus, 64, 99),
      phy: clamp(ovr + 1 + jitter(15) + defBonus, 62, 99),
    };
  }
  if (group === "DEF") {
    return {
      pac: clamp(ovr - 2 + jitter(0) + ballonBonus, 60, 96),
      sho: clamp(ovr - 14 + jitter(3) + bootBonus, 50, 90),
      pas: clamp(ovr - 5 + jitter(6) + playmakerBonus, 58, 95),
      dri: clamp(ovr - 4 + jitter(9), 58, 95),
      def: clamp(ovr + 3 + jitter(12) + defBonus + ballonBonus, 66, 99),
      phy: clamp(ovr + 2 + jitter(15) + defBonus + ballonBonus, 65, 99),
    };
  }
  if (group === "FWD") {
    const isWinger = detailed === "LW" || detailed === "RW";
    return {
      pac: clamp(ovr + (isWinger ? 4 : 2) + jitter(0) + ballonBonus, 66, 99),
      sho: clamp(ovr + 3 + jitter(3) + bootBonus + ballonBonus, 66, 99),
      pas: clamp(ovr - (isWinger ? 1 : 4) + jitter(6) + playmakerBonus, 60, 97),
      dri: clamp(ovr + 3 + jitter(9) + playmakerBonus + ballonBonus, 66, 99),
      def: clamp(ovr - 22 + jitter(12) + defBonus, 38, 84),
      phy: clamp(ovr - 2 + jitter(15) + ballonBonus, 60, 96),
    };
  }
  // MID
  const isCDM = detailed === "CDM";
  const isCAM = detailed === "CAM";
  return {
    pac: clamp(ovr + (isCAM ? 1 : -1) + jitter(0) + ballonBonus, 62, 97),
    sho: clamp(ovr + (isCAM ? 1 : -4) + jitter(3) + bootBonus + ballonBonus, 58, 97),
    pas: clamp(ovr + 3 + jitter(6) + playmakerBonus + ballonBonus, 66, 99),
    dri: clamp(ovr + 2 + jitter(9) + playmakerBonus + ballonBonus, 65, 99),
    def: clamp(ovr + (isCDM ? 2 : -8) + jitter(12) + defBonus, 52, 96),
    phy: clamp(ovr + (isCDM ? 2 : -2) + jitter(15) + defBonus, 60, 96),
  };
}

function computeTier(peakOvr: number, peakClass: string, awardsCount: number, isS1Winner: boolean): CardTier {
  const fam = classFamily(peakClass);
  if (peakOvr >= 93 || awardsCount >= 2) return "ICON";
  if (fam === "X" || isS1Winner || awardsCount === 1) return "HERO";
  if (fam === "S" || peakOvr >= 87) return "TOTW";
  if (fam === "A" || peakOvr >= 82) return "GOLD";
  return "SILVER";
}

export const getArcadeDataset = cache(async () => {
  const [league, sheets, scores, squads] = await Promise.all([
    getLeagueData(),
    getPlayerSheets(),
    db.select().from(arcadeScores).orderBy(desc(arcadeScores.score), desc(arcadeScores.createdAt)).limit(60),
    db.select().from(communitySquads).orderBy(desc(communitySquads.likes), desc(communitySquads.createdAt)).limit(24),
  ]);

  const sheetIdBySlug = new Map(sheets.sheets.map((s) => [s.slug, s.id]));
  const s2Rows = sheets.rowsBySheet.get(sheetIdBySlug.get("s2") ?? -1) ?? [];
  const s3Rows = sheets.rowsBySheet.get(sheetIdBySlug.get("s3") ?? -1) ?? [];
  const s4Rows = sheets.rowsBySheet.get(sheetIdBySlug.get("s4") ?? -1) ?? [];

  const s2ByPlayer = new Map<number, (typeof s2Rows)[number]>();
  const s3ByPlayer = new Map<number, (typeof s3Rows)[number]>();
  const s4ByPlayer = new Map<number, (typeof s4Rows)[number]>();
  const s2ByName = new Map<string, (typeof s2Rows)[number]>();
  const s3ByName = new Map<string, (typeof s3Rows)[number]>();
  const s4ByName = new Map<string, (typeof s4Rows)[number]>();

  for (const r of s2Rows) {
    if (r.playerId) s2ByPlayer.set(r.playerId, r);
    s2ByName.set(r.username.toLowerCase(), r);
  }
  for (const r of s3Rows) {
    if (r.playerId) s3ByPlayer.set(r.playerId, r);
    s3ByName.set(r.username.toLowerCase(), r);
  }
  for (const r of s4Rows) {
    if (r.playerId) s4ByPlayer.set(r.playerId, r);
    s4ByName.set(r.username.toLowerCase(), r);
  }

  const statMap = new Map(computePlayerStats(league).map((l) => [l.playerId, l]));
  const winnerSeasonsByPlayer = new Map<number, Set<string>>();
  for (const r of league.seasonRosters) {
    if (!winnerSeasonsByPlayer.has(r.playerId)) winnerSeasonsByPlayer.set(r.playerId, new Set());
    winnerSeasonsByPlayer.get(r.playerId)!.add(r.season);
  }
  const s1WinnerSet = new Set(
    league.seasonRosters.filter((r) => r.season === "Season 1").map((r) => r.playerId),
  );

  const toSnap = (row: (typeof s2Rows)[number] | undefined): SeasonSnapshot | null => {
    if (!row) return null;
    const teamObj = row.teamId ? league.teamById.get(row.teamId) : null;
    return {
      rating: row.rating ?? null,
      cls: normalizeClass(row.playerClass),
      wage: row.wage ?? null,
      team: canonicalClub(teamObj?.name ?? row.teamName) ?? "Free Agent",
      role: row.role || "PLAYER",
      position: row.position ?? null,
    };
  };

  const arcadePlayers: ArcadePlayer[] = league.players.map((p) => {
    const key = p.name.toLowerCase();
    const r2 = s2ByPlayer.get(p.id) ?? s2ByName.get(key);
    const r3 = s3ByPlayer.get(p.id) ?? s3ByName.get(key);
    const r4 = s4ByPlayer.get(p.id) ?? s4ByName.get(key);

    const s2 = toSnap(r2);
    const s3 = toSnap(r3);
    const s4 = toSnap(r4);

    const teamObj = p.teamId ? league.teamById.get(p.teamId) : null;
    const currentClub = canonicalClub(teamObj?.name);

    const clubSet = new Set<string>();
    if (currentClub) clubSet.add(currentClub);
    for (const sr of league.seasonRosters) {
      if (sr.playerId === p.id) {
        const st = league.teamById.get(sr.teamId);
        const c = canonicalClub(st?.name);
        if (c) clubSet.add(c);
      }
    }
    for (const snap of [s4, s3, s2]) {
      const c = canonicalClub(snap?.team);
      if (c) clubSet.add(c);
    }

    const individualAwards = league.trophies.filter(
      (t) => t.kind === "individual" && t.playerId === p.id,
    );
    for (const aw of individualAwards) {
      if (aw.teamId) {
        const awTeam = league.teamById.get(aw.teamId);
        const c = canonicalClub(awTeam?.name);
        if (c) clubSet.add(c);
      }
    }

    const winnerSeasons = winnerSeasonsByPlayer.get(p.id);
    const seasonsPlayed: Array<"S1" | "S2" | "S3" | "S4"> = [];
    if (
      s1WinnerSet.has(p.id) ||
      winnerSeasons?.has("Season 1") ||
      individualAwards.some((a) => a.season === "Season 1")
    ) {
      seasonsPlayed.push("S1");
    }
    if (s2 || winnerSeasons?.has("Season 2")) seasonsPlayed.push("S2");
    if (s3 || winnerSeasons?.has("Season 3")) seasonsPlayed.push("S3");
    if (s4) seasonsPlayed.push("S4");

    const ratings = [s4?.rating, s3?.rating, s2?.rating].filter(
      (v): v is number => v != null && v > 0,
    );
    const peakOvr = ratings.length ? Math.max(...ratings) : 76;
    const latestOvr = s4?.rating ?? s3?.rating ?? s2?.rating ?? 76;

    const classes = [s4?.cls, s3?.cls, s2?.cls]
      .filter((c): c is string => !!c && c !== "UNRATED");
    const peakClass = classes.length
      ? [...classes].sort((a, b) => classRank(a) - classRank(b))[0]
      : "C";
    const classFamilies = [...new Set(classes.map((c) => classFamily(c)))];

    const wages = [s4?.wage, s3?.wage, s2?.wage].filter(
      (w): w is number => w != null && w > 0,
    );
    const peakWage = wages.length ? Math.max(...wages) : 50000;
    const s4Wage = s4?.wage ?? s3?.wage ?? s2?.wage ?? 75000;

    const detailedPosition =
      s2?.position ||
      s3?.position ||
      s4?.position ||
      (p.position === "FWD" ? "ST" : p.position === "DEF" ? "CB" : p.position === "MID" ? "CM" : "GK");
    const positionGroup = mapPositionGroup(s2?.position ?? s3?.position ?? s4?.position, p.position);

    const awardNames = individualAwards.map((a) => `${a.name}${a.season ? ` (${a.season.replace("Season ", "S")})` : ""}`);
    const teamHonours = teamHonoursForPlayer(league, p.id).map(
      (t) => `${t.name}${t.season ? ` (${t.season.replace("Season ", "S")})` : ""}`,
    );
    const isS1Winner = s1WinnerSet.has(p.id);
    const isSeasonWinner = isS1Winner || !!winnerSeasonsByPlayer.has(p.id);
    const hasManagerRole = [s2?.role, s3?.role, s4?.role].some((r) => r === "MANAGER");

    const robloxUserId = p.robloxUserId ?? r4?.robloxUserId ?? r3?.robloxUserId ?? r2?.robloxUserId ?? null;
    const avatarUrl =
      p.robloxAvatarUrl ??
      r4?.robloxAvatarUrl ??
      r3?.robloxAvatarUrl ??
      r2?.robloxAvatarUrl ??
      `/api/roblox/avatar-image?userId=${robloxUserId || ""}&username=${encodeURIComponent(p.name)}`;

    const line = statMap.get(p.id) ?? emptyLine(p.id);
    const clubs = [...clubSet];
    const primaryClub = currentClub ?? clubs[0] ?? "Free Agent";
    const tier = computeTier(peakOvr, peakClass, awardNames.length, isSeasonWinner);
    const attrs = computeAttributes(p.name, peakOvr, positionGroup, detailedPosition, awardNames);

    return {
      id: p.id,
      username: p.name,
      displayName: p.displayName?.trim() || p.name,
      avatarUrl,
      robloxUserId,
      position: positionGroup,
      detailedPosition,
      currentTeam: currentClub ?? "Free Agent",
      currentTeamBadge: teamObj?.badgeUrl ?? null,
      primaryClub,
      clubs,
      seasons: seasonsPlayed,
      s2,
      s3,
      s4,
      peakOvr,
      latestOvr,
      peakClass,
      classFamilies,
      peakWage,
      s4Wage,
      awards: awardNames,
      teamTrophies: teamHonours,
      isS1Winner,
      hasManagerRole,
      career: {
        apps: line.apps,
        goals: line.goals,
        assists: line.assists,
        cleanSheets: line.cleanSheets,
        motm: line.motm,
      },
      tier,
      attrs,
    };
  });

  // Sort highest peak OVR first, then awards, then username
  arcadePlayers.sort(
    (a, b) =>
      b.peakOvr - a.peakOvr ||
      b.awards.length - a.awards.length ||
      b.peakWage - a.peakWage ||
      a.username.localeCompare(b.username),
  );

  return {
    players: arcadePlayers,
    scores: scores as ArcadeScore[],
    squads: squads as CommunitySquad[],
  };
});
