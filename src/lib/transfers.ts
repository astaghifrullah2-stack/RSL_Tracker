import { cache } from "react";
import { canonicalClubName, clubColor, clubShortName, isNationClub } from "@/lib/club-names";
import { getPlayerSheets } from "@/lib/player-sheets";
import { getLeagueData, type LeagueData } from "@/lib/stats";
import type { Team } from "@/db/schema";

export const TRANSFER_SEASONS = ["S1", "S2", "S3", "S4"] as const;
export type TransferSeason = (typeof TRANSFER_SEASONS)[number];

export type SeasonSpot = {
  season: TransferSeason;
  seasonLabel: string;
  /** Canonical club name, "Free Agent", or "No record". */
  club: string;
  short: string;
  color: string;
  teamId: number | null;
  badgeUrl: string | null;
  isNation: boolean;
  isFree: boolean;
  onRecord: boolean;
  role: string;
  wage: number | null;
  rating: number | null;
  cls: string | null;
  detail: string | null;
};

export type TransferMove = {
  timelineId: number;
  playerUsername: string;
  window: "S1→S2" | "S2→S3" | "S3→S4";
  fromSeason: TransferSeason;
  toSeason: TransferSeason;
  from: SeasonSpot;
  to: SeasonSpot;
  kind: "move" | "stayed";
};

export type PlayerTransferTimeline = {
  timelineId: number;
  playerId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  robloxUserId: string | null;
  position: string;
  spots: SeasonSpot[];
  moves: TransferMove[];
  moveCount: number;
};

type SheetRowLike = {
  playerId: number | null;
  username: string;
  teamId: number | null;
  teamName: string | null;
  role: string;
  playerClass: string;
  rating: number | null;
  wage: number | null;
  penalty: number | null;
  robloxUserId: string | null;
  robloxAvatarUrl: string | null;
};

/** Find a live Team record for a canonical club name if one exists. */
function teamForClub(data: LeagueData, club: string | null): Team | null {
  if (!club) return null;
  const needle = club.toLowerCase();
  return (
    data.teams.find(
      (t) =>
        t.name.toLowerCase() === needle ||
        t.name.toLowerCase().replace(/[^a-z]/g, "") === needle.replace(/[^a-z]/g, ""),
    ) ?? null
  );
}

function makeSpot(
  data: LeagueData,
  season: TransferSeason,
  options: {
    clubRaw: string | null | undefined;
    teamId?: number | null;
    role?: string;
    wage?: number | null;
    rating?: number | null;
    cls?: string | null;
    detail?: string | null;
    onRecord: boolean;
  },
): SeasonSpot {
  const seasonLabel = `Season ${season.slice(1)}`;

  if (!options.onRecord) {
    return {
      season,
      seasonLabel,
      club: "No record",
      short: "—",
      color: clubColor(null),
      teamId: null,
      badgeUrl: null,
      isNation: false,
      isFree: false,
      onRecord: false,
      role: options.role ?? "",
      wage: null,
      rating: null,
      cls: null,
      detail: null,
    };
  }

  let club: string | null = null;
  let short = "FA";
  let color = clubColor(null);
  let badgeUrl: string | null = null;
  let isNation = false;

  if (options.teamId != null) {
    const team = data.teamById.get(options.teamId);
    if (team) {
      club = team.name;
      short = team.shortName;
      color = team.primaryColor;
      badgeUrl = team.badgeUrl;
      isNation = team.kind === "nation";
    }
  }
  if (!club) {
    const canonical = canonicalClubName(options.clubRaw);
    if (canonical) {
      club = canonical;
      short = clubShortName(canonical);
      color = clubColor(canonical);
      isNation = isNationClub(canonical);
      const team = teamForClub(data, canonical);
      if (team) {
        badgeUrl = team.badgeUrl;
        if (!color || color === "#64748b") color = team.primaryColor;
      }
    }
  }
  if (!club) {
    club = "Free Agent";
    short = "FA";
    color = clubColor("Free Agent");
  }

  return {
    season,
    seasonLabel,
    club,
    short,
    color,
    teamId: options.teamId ?? null,
    badgeUrl,
    isNation,
    isFree: club === "Free Agent",
    onRecord: true,
    role: options.role ?? "PLAYER",
    wage: options.wage ?? null,
    rating: options.rating ?? null,
    cls: options.cls ?? null,
    detail: options.detail ?? null,
  };
}

export const getTransferData = cache(async () => {
  const [data, sheets] = await Promise.all([getLeagueData(), getPlayerSheets()]);

  const sheetIdBySlug = new Map(sheets.sheets.map((s) => [s.slug, s.id]));
  const rowsFor = (slug: string): SheetRowLike[] =>
    (sheets.rowsBySheet.get(sheetIdBySlug.get(slug) ?? -1) ?? []) as unknown as SheetRowLike[];
  const s2Rows = rowsFor("s2");
  const s3Rows = rowsFor("s3");
  const s4Rows = rowsFor("s4");

  const byPlayerFor = (rows: SheetRowLike[]) => {
    const m = new Map<number, SheetRowLike>();
    for (const r of rows) if (r.playerId != null) m.set(r.playerId, r);
    return m;
  };
  const s2ByPlayer = byPlayerFor(s2Rows);
  const s3ByPlayer = byPlayerFor(s3Rows);
  const s4ByPlayer = byPlayerFor(s4Rows);

  // Season-winner rosters are authoritative club sources for their season.
  const rosterTeamBySeason = new Map<string, Map<number, number>>();
  const rosterHandleBySeason = new Map<string, Map<number, string>>();
  for (const r of data.seasonRosters) {
    if (!rosterTeamBySeason.has(r.season)) rosterTeamBySeason.set(r.season, new Map());
    rosterTeamBySeason.get(r.season)!.set(r.playerId, r.teamId);
    if (r.discordHandle) {
      if (!rosterHandleBySeason.has(r.season)) rosterHandleBySeason.set(r.season, new Map());
      rosterHandleBySeason.get(r.season)!.set(r.playerId, r.discordHandle);
    }
  }
  const s1RosterTeam = rosterTeamBySeason.get("Season 1") ?? new Map<number, number>();
  const s2RosterTeam = rosterTeamBySeason.get("Season 2") ?? new Map<number, number>();
  const s3RosterTeam = rosterTeamBySeason.get("Season 3") ?? new Map<number, number>();
  const s1Detail = new Map<number, string>();
  for (const [pid, handle] of rosterHandleBySeason.get("Season 1") ?? new Map()) {
    s1Detail.set(pid, `Discord: ${handle}`);
  }
  const s1AwardTeam = new Map<number, number>();
  for (const t of data.trophies) {
    if (t.kind === "individual" && t.season === "Season 1" && t.playerId != null && t.teamId != null) {
      if (!s1AwardTeam.has(t.playerId)) s1AwardTeam.set(t.playerId, t.teamId);
    }
  }

  const timelines: PlayerTransferTimeline[] = [];
  const allMoves: TransferMove[] = [];

  const rows = data.players
    .filter((p) => p.isActive || s2ByPlayer.has(p.id) || s3ByPlayer.has(p.id) || s4ByPlayer.has(p.id) || s1RosterTeam.has(p.id) || s1AwardTeam.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const p of rows) {
    const spots: SeasonSpot[] = [];

    // ---- S1 ----
    const s1TeamId = s1RosterTeam.get(p.id) ?? s1AwardTeam.get(p.id) ?? p.teamId;
    spots.push(
      makeSpot(data, "S1", {
        teamId: s1TeamId ?? null,
        clubRaw: null,
        role: s1RosterTeam.has(p.id) ? "PLAYER" : "PLAYER",
        detail: s1Detail.get(p.id) ?? null,
        onRecord: true,
      }),
    );

    // ---- S2 ----
    // Prefer the concrete club from the S2 playersheet. When that sheet lists
    // the player as a free agent (or has no row), the official Season 2 Winners
    // squad is the authoritative club record.
    const r2 = s2ByPlayer.get(p.id);
    const r2SheetClub = r2?.teamId != null || canonicalClubName(r2?.teamName) != null;
    const r2Winner = !r2SheetClub && s2RosterTeam.has(p.id);
    const r2Handle = rosterHandleBySeason.get("Season 2")?.get(p.id);
    spots.push(
      makeSpot(data, "S2", {
        teamId: r2Winner ? s2RosterTeam.get(p.id) ?? null : r2?.teamId ?? null,
        clubRaw: r2Winner ? undefined : r2 ? (r2.teamName ?? undefined) : undefined,
        role: r2?.role === "MANAGER" ? "MANAGER" : "PLAYER",
        wage: r2?.wage ?? null,
        rating: r2?.rating ?? null,
        cls: r2 && r2.playerClass !== "UNRATED" ? r2.playerClass : null,
        detail:
          [
            r2?.penalty ? `Penalty: ${r2.penalty.toLocaleString()} $` : null,
            r2Winner ? "Season 2 Winners squad" : null,
            r2Winner && r2Handle ? `Discord: ${r2Handle}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
        onRecord: !!r2 || r2Winner,
      }),
    );

    // ---- S3 ----
    const r3 = s3ByPlayer.get(p.id);
    const r3SheetClub = r3?.teamId != null || canonicalClubName(r3?.teamName) != null;
    const r3Winner = !r3SheetClub && s3RosterTeam.has(p.id);
    const r3Handle = rosterHandleBySeason.get("Season 3")?.get(p.id);
    spots.push(
      makeSpot(data, "S3", {
        teamId: r3Winner ? s3RosterTeam.get(p.id) ?? null : r3?.teamId ?? null,
        clubRaw: r3Winner ? undefined : r3 ? (r3.teamName ?? undefined) : undefined,
        role: r3?.role === "MANAGER" ? "MANAGER" : "PLAYER",
        wage: r3?.wage ?? null,
        rating: r3?.rating ?? null,
        cls: r3 && r3.playerClass !== "UNRATED" ? r3.playerClass : null,
        detail:
          [
            r3?.penalty ? `Penalty: ${r3.penalty.toLocaleString()} $` : null,
            r3Winner ? "Season 3 Winners squad" : null,
            r3Winner && r3Handle ? `Discord: ${r3Handle}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
        onRecord: !!r3 || r3Winner,
      }),
    );

    // ---- S4 ----
    const r4 = s4ByPlayer.get(p.id);
    spots.push(
      makeSpot(data, "S4", {
        teamId: r4?.teamId ?? null,
        clubRaw: r4 ? (r4.teamName ?? undefined) : undefined,
        role: r4?.role === "MANAGER" ? "MANAGER" : "PLAYER",
        wage: r4?.wage ?? null,
        rating: r4?.rating ?? null,
        cls: r4 && r4.playerClass !== "UNRATED" ? r4.playerClass : null,
        detail: r4?.penalty ? `Penalty: ${r4.penalty.toLocaleString()} $` : null,
        onRecord: !!r4,
      }),
    );

    const moves: TransferMove[] = [];
    for (let i = 0; i < TRANSFER_SEASONS.length - 1; i++) {
      const from = spots[i];
      const to = spots[i + 1];
      if (!from.onRecord || !to.onRecord) continue;
      const kind = from.club === to.club ? "stayed" : "move";
      const window: TransferMove["window"] =
        `${TRANSFER_SEASONS[i]}→${TRANSFER_SEASONS[i + 1]}` as TransferMove["window"];
      const move: TransferMove = {
        timelineId: 0,
        playerUsername: p.name,
        window,
        fromSeason: TRANSFER_SEASONS[i],
        toSeason: TRANSFER_SEASONS[i + 1],
        from,
        to,
        kind,
      };
      moves.push(move);
      if (kind === "move") allMoves.push(move);
    }

    const avatarUrl =
      p.robloxAvatarUrl ??
      r4?.robloxAvatarUrl ??
      r3?.robloxAvatarUrl ??
      r2?.robloxAvatarUrl ??
      `/api/roblox/avatar-image?userId=${p.robloxUserId ?? ""}&username=${encodeURIComponent(p.name)}`;

    timelines.push({
      timelineId: p.id,
      playerId: p.id,
      username: p.name,
      displayName: p.displayName?.trim() || p.name,
      avatarUrl,
      robloxUserId: p.robloxUserId ?? r4?.robloxUserId ?? r3?.robloxUserId ?? r2?.robloxUserId ?? null,
      position: p.position,
      spots,
      moves,
      moveCount: moves.filter((m) => m.kind === "move").length,
    });

    const timeline = timelines[timelines.length - 1];
    for (const m of timeline.moves) {
      m.timelineId = timeline.timelineId;
    }
  }

  allMoves.sort((a, b) => {
    const order: Record<TransferMove["window"], number> = { "S1→S2": 1, "S2→S3": 2, "S3→S4": 3 };
    return (
      order[b.window] - order[a.window] ||
      (b.to.wage ?? 0) - (a.to.wage ?? 0) ||
      (b.to.rating ?? 0) - (a.to.rating ?? 0) ||
      a.playerUsername.localeCompare(b.playerUsername)
    );
  });

  const clubs = new Set<string>();
  for (const t of timelines) for (const s of t.spots) if (s.onRecord && !s.isFree) clubs.add(s.club);

  const windowKeys: Array<TransferMove["window"]> = ["S1→S2", "S2→S3", "S3→S4"];
  const windowCounts = new Map<string, number>();
  for (const m of allMoves) windowCounts.set(m.window, (windowCounts.get(m.window) ?? 0) + 1);

  return {
    timelines,
    moves: allMoves,
    clubs: [...clubs].sort((a, b) => a.localeCompare(b)),
    windows: windowKeys,
    totals: {
      players: timelines.length,
      moves: allMoves.length,
      busiestWindow:
        windowKeys
          .map((w) => ({ window: w, count: windowCounts.get(w) ?? 0 }))
          .sort((a, b) => b.count - a.count)[0]?.window ?? null,
      freeAgentsS4:
        timelines.filter((t) => t.spots[3].onRecord && t.spots[3].isFree).length,
    },
  };
});

export function timelineForPlayer(
  data: Awaited<ReturnType<typeof getTransferData>>,
  playerId: number,
) {
  return data.timelines.find((t) => t.playerId === playerId) ?? null;
}

export function transfersForClub(data: Awaited<ReturnType<typeof getTransferData>>, clubName: string) {
  const needle = clubName.toLowerCase();
  const joined: TransferMove[] = [];
  const left: TransferMove[] = [];
  for (const move of data.moves) {
    if (move.kind !== "move") continue;
    if (move.to.club.toLowerCase() === needle) joined.push(move);
    if (move.from.club.toLowerCase() === needle) left.push(move);
  }
  return { joined, left };
}
