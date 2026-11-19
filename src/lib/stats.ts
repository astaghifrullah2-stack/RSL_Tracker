import { cache } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import {
  appearances,
  competitionEntrants,
  competitionPlacements,
  competitions,
  goals,
  matches,
  players,
  siteContent,
  teamSeasonRosters,
  teams,
  trophies,
  type Appearance,
  type Competition,
  type CompetitionEntrant,
  type CompetitionPlacement,
  type Goal,
  type Match,
  type Player,
  type SiteContent,
  type Team,
  type TeamSeasonRoster,
  type Trophy,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// Data loading (memoised per request)
// ---------------------------------------------------------------------------
export type LeagueData = {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
  entrants: CompetitionEntrant[];
  placements: CompetitionPlacement[];
  entrantsByCompetition: Map<number, CompetitionEntrant[]>;
  placementsByCompetition: Map<number, CompetitionPlacement[]>;
  /** Chronological (oldest first). */
  matches: Match[];
  goals: Goal[];
  appearances: Appearance[];
  trophies: Trophy[];
  seasonRosters: TeamSeasonRoster[];
  /** Admin-managed homepage artwork (GFX, Team of the Season…). */
  content: SiteContent[];
  activeContent: SiteContent[];
  teamById: Map<number, Team>;
  playerById: Map<number, Player>;
  competitionById: Map<number, Competition>;
  matchById: Map<number, Match>;
  goalsByMatch: Map<number, Goal[]>;
  appsByMatch: Map<number, Appearance[]>;
};

export function matchTime(m: Match) {
  return (m.playedAt ?? m.createdAt).getTime();
}

export const getLeagueData = cache(async (): Promise<LeagueData> => {
  const [teamRows, playerRows, compRows, entrantRows, placementRows, matchRows, goalRows, appRows, trophyRows, contentRows, seasonRosterRows] =
    await Promise.all([
      db.select().from(teams).orderBy(asc(teams.name)),
      db.select().from(players).orderBy(asc(players.name)),
      db.select().from(competitions).orderBy(asc(competitions.createdAt), asc(competitions.id)),
      db.select().from(competitionEntrants),
      db.select().from(competitionPlacements).orderBy(asc(competitionPlacements.placement)),
      db.select().from(matches),
      db.select().from(goals).orderBy(asc(goals.minute), asc(goals.id)),
      db.select().from(appearances).orderBy(asc(appearances.id)),
      db.select().from(trophies).orderBy(asc(trophies.awardedAt), asc(trophies.id)),
      db.select().from(siteContent).orderBy(asc(siteContent.sortOrder), asc(siteContent.id)),
      db.select().from(teamSeasonRosters).orderBy(asc(teamSeasonRosters.sortOrder), asc(teamSeasonRosters.id)),
    ]);

  const sortedMatches = [...matchRows].sort(
    (a, b) => matchTime(a) - matchTime(b) || a.id - b.id,
  );

  const goalsByMatch = new Map<number, Goal[]>();
  for (const g of goalRows) {
    const list = goalsByMatch.get(g.matchId) ?? [];
    list.push(g);
    goalsByMatch.set(g.matchId, list);
  }
  const appsByMatch = new Map<number, Appearance[]>();
  for (const a of appRows) {
    const list = appsByMatch.get(a.matchId) ?? [];
    list.push(a);
    appsByMatch.set(a.matchId, list);
  }
  const entrantsByCompetition = new Map<number, CompetitionEntrant[]>();
  for (const e of entrantRows) {
    const list = entrantsByCompetition.get(e.competitionId) ?? [];
    list.push(e);
    entrantsByCompetition.set(e.competitionId, list);
  }
  const placementsByCompetition = new Map<number, CompetitionPlacement[]>();
  for (const p of placementRows) {
    const list = placementsByCompetition.get(p.competitionId) ?? [];
    list.push(p);
    placementsByCompetition.set(p.competitionId, list);
  }

  return {
    teams: teamRows,
    players: playerRows,
    competitions: compRows,
    content: contentRows,
    activeContent: contentRows.filter((c) => c.isActive),
    entrants: entrantRows,
    placements: placementRows,
    entrantsByCompetition,
    placementsByCompetition,
    matches: sortedMatches,
    goals: goalRows,
    appearances: appRows,
    trophies: trophyRows,
    seasonRosters: seasonRosterRows,
    teamById: new Map(teamRows.map((t) => [t.id, t])),
    playerById: new Map(playerRows.map((p) => [p.id, p])),
    competitionById: new Map(compRows.map((c) => [c.id, c])),
    matchById: new Map(sortedMatches.map((m) => [m.id, m])),
    goalsByMatch,
    appsByMatch,
  };
});

// ---------------------------------------------------------------------------
// Scoping
// ---------------------------------------------------------------------------
export type StatScope = {
  competitionId?: number;
  teamId?: number;
  playerId?: number;
  season?: string;
};

/** Played matches that fall inside the scope (chronological). */
export function matchesInScope(data: LeagueData, scope: StatScope = {}) {
  return data.matches.filter((m) => {
    if (m.status !== "played") return false;
    if (scope.competitionId && m.competitionId !== scope.competitionId) return false;
    if (scope.season) {
      const c = data.competitionById.get(m.competitionId);
      if ((c?.season ?? "") !== scope.season) return false;
    }
    if (scope.teamId && m.homeTeamId !== scope.teamId && m.awayTeamId !== scope.teamId) {
      return false;
    }
    return true;
  });
}

export function seasons(data: LeagueData) {
  return [...new Set(data.competitions.map((c) => c.season).filter((s): s is string => !!s))];
}

// ---------------------------------------------------------------------------
// Player statistics
// ---------------------------------------------------------------------------
export type PlayerStatLine = {
  playerId: number;
  apps: number;
  goals: number;
  assists: number;
  penalties: number;
  ownGoals: number;
  cleanSheets: number;
  motm: number;
  yellows: number;
  reds: number;
  hatTricks: number;
  wins: number;
  draws: number;
  losses: number;
};

export type StatKey = keyof Omit<PlayerStatLine, "playerId">;

export const STAT_COLUMNS: Array<{ key: StatKey; label: string; title: string }> = [
  { key: "apps", label: "Apps", title: "Appearances" },
  { key: "goals", label: "G", title: "Goals" },
  { key: "assists", label: "A", title: "Assists" },
  { key: "cleanSheets", label: "CS", title: "Clean sheets" },
  { key: "motm", label: "MOTM", title: "Man of the match awards" },
  { key: "hatTricks", label: "HT", title: "Hat-tricks" },
  { key: "penalties", label: "PEN", title: "Penalty goals" },
  { key: "ownGoals", label: "OG", title: "Own goals" },
  { key: "yellows", label: "YC", title: "Yellow cards" },
  { key: "reds", label: "RC", title: "Red cards" },
  { key: "wins", label: "W", title: "Wins" },
  { key: "draws", label: "D", title: "Draws" },
  { key: "losses", label: "L", title: "Losses" },
];

export function emptyLine(playerId: number): PlayerStatLine {
  return {
    playerId,
    apps: 0,
    goals: 0,
    assists: 0,
    penalties: 0,
    ownGoals: 0,
    cleanSheets: 0,
    motm: 0,
    yellows: 0,
    reds: 0,
    hatTricks: 0,
    wins: 0,
    draws: 0,
    losses: 0,
  };
}

export function computePlayerStats(data: LeagueData, scope: StatScope = {}) {
  const lines = new Map<number, PlayerStatLine>();
  const line = (id: number) => {
    let l = lines.get(id);
    if (!l) {
      l = emptyLine(id);
      lines.set(id, l);
    }
    return l;
  };
  const wantPlayer = (id: number | null | undefined): id is number =>
    id != null && (!scope.playerId || id === scope.playerId);

  for (const m of matchesInScope(data, scope)) {
    const apps = data.appsByMatch.get(m.id) ?? [];
    const matchGoals = data.goalsByMatch.get(m.id) ?? [];
    const appTeam = new Map<number, number>();

    for (const a of apps) {
      appTeam.set(a.playerId, a.teamId);
      if (scope.teamId && a.teamId !== scope.teamId) continue;
      if (!wantPlayer(a.playerId)) continue;
      const l = line(a.playerId);
      l.apps++;
      l.yellows += a.yellowCards;
      if (a.redCard) l.reds++;
      const isHome = a.teamId === m.homeTeamId;
      const gf = isHome ? m.homeScore : m.awayScore;
      const ga = isHome ? m.awayScore : m.homeScore;
      if (a.position === "GK" && ga === 0) l.cleanSheets++;
      if (gf > ga) l.wins++;
      else if (gf === ga) l.draws++;
      else l.losses++;
    }

    const perScorer = new Map<number, number>();
    for (const g of matchGoals) {
      if (g.isOwnGoal) {
        if (g.scorerId != null && wantPlayer(g.scorerId)) {
          const scorerTeam =
            appTeam.get(g.scorerId) ??
            (g.teamId === m.homeTeamId ? m.awayTeamId : m.homeTeamId);
          if (!scope.teamId || scorerTeam === scope.teamId) line(g.scorerId).ownGoals++;
        }
        continue;
      }
      if (scope.teamId && g.teamId !== scope.teamId) continue;
      if (g.scorerId != null && wantPlayer(g.scorerId)) {
        const l = line(g.scorerId);
        l.goals++;
        if (g.isPenalty) l.penalties++;
        perScorer.set(g.scorerId, (perScorer.get(g.scorerId) ?? 0) + 1);
      }
      if (g.assistId != null && wantPlayer(g.assistId)) line(g.assistId).assists++;
    }
    for (const [pid, n] of perScorer) if (n >= 3) line(pid).hatTricks++;

    if (m.motmPlayerId != null && wantPlayer(m.motmPlayerId)) {
      const t =
        appTeam.get(m.motmPlayerId) ?? data.playerById.get(m.motmPlayerId)?.teamId ?? null;
      if (!scope.teamId || t === scope.teamId) line(m.motmPlayerId).motm++;
    }
  }
  return [...lines.values()];
}

export function playerStatLine(data: LeagueData, playerId: number, scope: StatScope = {}) {
  return computePlayerStats(data, { ...scope, playerId })[0] ?? emptyLine(playerId);
}

export function sortLines(
  lines: PlayerStatLine[],
  key: StatKey,
  data: LeagueData,
  dir: "asc" | "desc" = "desc",
) {
  const sign = dir === "desc" ? -1 : 1;
  return [...lines].sort((a, b) => {
    if (a[key] !== b[key]) return sign * (a[key] - b[key]);
    if (key !== "goals" && a.goals !== b.goals) return b.goals - a.goals;
    if (a.assists !== b.assists) return b.assists - a.assists;
    const an = data.playerById.get(a.playerId)?.name ?? "";
    const bn = data.playerById.get(b.playerId)?.name ?? "";
    return an.localeCompare(bn);
  });
}

// ---------------------------------------------------------------------------
// Team records & standings
// ---------------------------------------------------------------------------
export type FormResult = "W" | "D" | "L";

export type TeamRecord = {
  teamId: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  cleanSheets: number;
  form: FormResult[];
  longestUnbeaten: number;
  longestWinStreak: number;
  biggestWin: { match: Match; margin: number } | null;
};

export function emptyRecord(teamId: number): TeamRecord {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    cleanSheets: 0,
    form: [],
    longestUnbeaten: 0,
    longestWinStreak: 0,
    biggestWin: null,
  };
}

export function sortRecords(records: TeamRecord[], data: LeagueData) {
  return [...records].sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      b.wins - a.wins ||
      (data.teamById.get(a.teamId)?.name ?? "").localeCompare(
        data.teamById.get(b.teamId)?.name ?? "",
      ),
  );
}

/**
 * Compute W/D/L records for every team that appears in matches within the
 * scope. Teams with only scheduled matches in the scope are included with
 * zeroed records (useful for standings before a season starts).
 */
export function computeTeamRecords(data: LeagueData, scope: StatScope = {}) {
  const records = new Map<number, TeamRecord>();
  const streaks = new Map<number, { unbeaten: number; wins: number }>();
  const rec = (id: number) => {
    let r = records.get(id);
    if (!r) {
      r = emptyRecord(id);
      records.set(id, r);
    }
    return r;
  };

  // Registered entrants appear before any fixtures have been entered.
  for (const entry of data.entrants) {
    if (scope.competitionId && entry.competitionId !== scope.competitionId) continue;
    if (scope.season && data.competitionById.get(entry.competitionId)?.season !== scope.season) continue;
    if (!scope.teamId || entry.teamId === scope.teamId) rec(entry.teamId);
  }

  // Include teams with any fixture in the scope
  for (const m of data.matches) {
    if (scope.competitionId && m.competitionId !== scope.competitionId) continue;
    if (scope.season) {
      const c = data.competitionById.get(m.competitionId);
      if ((c?.season ?? "") !== scope.season) continue;
    }
    if (scope.teamId && m.homeTeamId !== scope.teamId && m.awayTeamId !== scope.teamId) continue;
    rec(m.homeTeamId);
    rec(m.awayTeamId);
  }

  for (const m of matchesInScope(data, scope)) {
    for (const side of ["home", "away"] as const) {
      const teamId = side === "home" ? m.homeTeamId : m.awayTeamId;
      const gf = side === "home" ? m.homeScore : m.awayScore;
      const ga = side === "home" ? m.awayScore : m.homeScore;
      const r = rec(teamId);
      r.played++;
      r.gf += gf;
      r.ga += ga;
      r.gd = r.gf - r.ga;
      if (ga === 0) r.cleanSheets++;
      let result: FormResult;
      if (gf > ga) {
        result = "W";
        r.wins++;
        r.points += 3;
      } else if (gf === ga) {
        result = "D";
        r.draws++;
        r.points += 1;
      } else {
        result = "L";
        r.losses++;
      }
      r.form.push(result);
      const s = streaks.get(teamId) ?? { unbeaten: 0, wins: 0 };
      s.unbeaten = result === "L" ? 0 : s.unbeaten + 1;
      s.wins = result === "W" ? s.wins + 1 : 0;
      streaks.set(teamId, s);
      r.longestUnbeaten = Math.max(r.longestUnbeaten, s.unbeaten);
      r.longestWinStreak = Math.max(r.longestWinStreak, s.wins);
      if (result === "W") {
        const margin = gf - ga;
        if (!r.biggestWin || margin > r.biggestWin.margin) r.biggestWin = { match: m, margin };
      }
    }
  }

  for (const r of records.values()) r.form = r.form.slice(-5);
  if (scope.teamId) {
    const only = records.get(scope.teamId) ?? emptyRecord(scope.teamId);
    return [only];
  }
  return [...records.values()];
}

export function computeStandings(data: LeagueData, competitionId: number) {
  return sortRecords(computeTeamRecords(data, { competitionId }), data);
}

export function teamRecord(data: LeagueData, teamId: number, scope: StatScope = {}) {
  return computeTeamRecords(data, { ...scope, teamId })[0] ?? emptyRecord(teamId);
}

// ---------------------------------------------------------------------------
// Trophies
// ---------------------------------------------------------------------------
export function trophiesForTeam(data: LeagueData, teamId: number) {
  return data.trophies.filter((t) => t.teamId === teamId && t.kind === "team");
}

export function trophiesForPlayer(data: LeagueData, playerId: number) {
  return data.trophies.filter((t) => t.playerId === playerId);
}

/** Team trophies won while a player was on the team (approximation: current team). */
export function trophyCounts(data: LeagueData) {
  const byTeam = new Map<number, number>();
  const byPlayer = new Map<number, number>();
  for (const t of data.trophies) {
    if (t.kind === "team" && t.teamId != null) byTeam.set(t.teamId, (byTeam.get(t.teamId) ?? 0) + 1);
    if (t.playerId != null) byPlayer.set(t.playerId, (byPlayer.get(t.playerId) ?? 0) + 1);
  }
  return { byTeam, byPlayer };
}

// ---------------------------------------------------------------------------
// Player match log
// ---------------------------------------------------------------------------
export type PlayerMatchLog = {
  match: Match;
  teamId: number | null;
  appeared: boolean;
  goals: number;
  assists: number;
  ownGoals: number;
  motm: boolean;
  cleanSheet: boolean;
  result: FormResult | null;
};

export function playerMatchLog(data: LeagueData, playerId: number): PlayerMatchLog[] {
  const log: PlayerMatchLog[] = [];
  for (const m of data.matches) {
    if (m.status !== "played") continue;
    const app = (data.appsByMatch.get(m.id) ?? []).find((a) => a.playerId === playerId);
    const gs = data.goalsByMatch.get(m.id) ?? [];
    const scored = gs.filter((g) => g.scorerId === playerId && !g.isOwnGoal).length;
    const og = gs.filter((g) => g.scorerId === playerId && g.isOwnGoal).length;
    const assisted = gs.filter((g) => g.assistId === playerId).length;
    const motm = m.motmPlayerId === playerId;
    if (!app && !scored && !assisted && !motm && !og) continue;
    const teamId =
      app?.teamId ??
      gs.find((g) => g.scorerId === playerId && !g.isOwnGoal)?.teamId ??
      gs.find((g) => g.assistId === playerId)?.teamId ??
      data.playerById.get(playerId)?.teamId ??
      null;
    let result: FormResult | null = null;
    let cleanSheet = false;
    if (teamId === m.homeTeamId || teamId === m.awayTeamId) {
      const gf = teamId === m.homeTeamId ? m.homeScore : m.awayScore;
      const ga = teamId === m.homeTeamId ? m.awayScore : m.homeScore;
      result = gf > ga ? "W" : gf === ga ? "D" : "L";
      cleanSheet = !!app && app.position === "GK" && ga === 0;
    }
    log.push({
      match: m,
      teamId,
      appeared: !!app,
      goals: scored,
      assists: assisted,
      ownGoals: og,
      motm,
      cleanSheet,
      result,
    });
  }
  return log.reverse();
}

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------
export function recentResults(data: LeagueData, n = 5) {
  return data.matches.filter((m) => m.status === "played").slice(-n).reverse();
}

export function upcomingFixtures(data: LeagueData, n = 5) {
  return data.matches.filter((m) => m.status === "scheduled").slice(0, n);
}

/** Goals for a match grouped by the credited team. */
export function goalsByTeam(data: LeagueData, match: Match) {
  const gs = data.goalsByMatch.get(match.id) ?? [];
  return {
    home: gs.filter((g) => g.teamId === match.homeTeamId),
    away: gs.filter((g) => g.teamId === match.awayTeamId),
  };
}

export function teamsForCompetition(data: LeagueData, competitionId: number) {
  const ids = new Set<number>();
  for (const e of data.entrantsByCompetition.get(competitionId) ?? []) ids.add(e.teamId);
  for (const p of data.placementsByCompetition.get(competitionId) ?? []) ids.add(p.teamId);
  for (const m of data.matches) {
    if (m.competitionId !== competitionId) continue;
    ids.add(m.homeTeamId);
    ids.add(m.awayTeamId);
  }
  return [...ids].map((id) => data.teamById.get(id)).filter((t): t is Team => !!t);
}

/** Published podium results, independent of missing match-by-match statistics. */
export function podiumForCompetition(data: LeagueData, competitionId: number) {
  const placements = data.placementsByCompetition.get(competitionId) ?? [];
  const champion = placements.find((p) => p.placement === 1);
  const runnerUp = placements.find((p) => p.placement === 2);
  return {
    champion: champion ? data.teamById.get(champion.teamId) ?? null : null,
    runnerUp: runnerUp ? data.teamById.get(runnerUp.teamId) ?? null : null,
  };
}

export function resultsForTeam(data: LeagueData, teamId: number) {
  return data.placements
    .filter((p) => p.teamId === teamId)
    .map((p) => ({
      placement: p.placement,
      competition: data.competitionById.get(p.competitionId),
    }))
    .filter((p) => !!p.competition)
    .reverse();
}

/** Squad for a team: current players + anyone who appeared for them. */
export function squadForTeam(data: LeagueData, teamId: number) {
  const ids = new Set<number>(data.players.filter((p) => p.teamId === teamId).map((p) => p.id));
  return [...ids].map((id) => data.playerById.get(id)).filter((p): p is Player => !!p);
}

export type SeasonRosterMember = {
  entry: TeamSeasonRoster;
  player: Player;
};

export type SeasonRosterGroup = {
  season: string;
  label: string;
  members: SeasonRosterMember[];
  titles: Competition[];
};

/** Preserved season-winner / historical rosters for a team, grouped by season. */
export function seasonRostersForTeam(data: LeagueData, teamId: number): SeasonRosterGroup[] {
  const groups = new Map<string, { label: string; members: SeasonRosterMember[] }>();
  for (const entry of data.seasonRosters) {
    if (entry.teamId !== teamId) continue;
    const player = data.playerById.get(entry.playerId);
    if (!player) continue;
    const existing = groups.get(entry.season) ?? { label: entry.label, members: [] };
    existing.members.push({ entry, player });
    groups.set(entry.season, existing);
  }
  return [...groups.entries()].map(([season, group]) => {
    const titles = data.placements
      .filter((p) => p.teamId === teamId && p.placement === 1)
      .map((p) => data.competitionById.get(p.competitionId))
      .filter((c): c is Competition => !!c && c.season === season);
    return {
      season,
      label: group.label,
      members: group.members,
      titles,
    };
  });
}

/** Champion squad for a specific competition if the winning club has a recorded roster for that season. */
export function winningSquadForCompetition(data: LeagueData, competitionId: number) {
  const comp = data.competitionById.get(competitionId);
  if (!comp?.season) return null;
  const { champion } = podiumForCompetition(data, competitionId);
  if (!champion) return null;
  const roster = seasonRostersForTeam(data, champion.id).find((r) => r.season === comp.season);
  if (!roster || !roster.members.length) return null;
  return {
    team: champion,
    ...roster,
  };
}

/** Historical championship / season squads a player belongs to. */
export function championshipSquadsForPlayer(data: LeagueData, playerId: number) {
  return data.seasonRosters
    .filter((entry) => entry.playerId === playerId)
    .map((entry) => {
      const team = data.teamById.get(entry.teamId);
      if (!team) return null;
      const titles = data.placements
        .filter((p) => p.teamId === team.id && p.placement === 1)
        .map((p) => data.competitionById.get(p.competitionId))
        .filter((c): c is Competition => !!c && c.season === entry.season);
      return {
        entry,
        team,
        titles,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

/** Team trophies won by a player via their current team OR any recorded season roster. */
export function teamHonoursForPlayer(data: LeagueData, playerId: number) {
  const player = data.playerById.get(playerId);
  const currentTeamId = player?.teamId ?? null;
  const rosterEntries = data.seasonRosters.filter((r) => r.playerId === playerId);

  const seen = new Set<number>();
  const list: Trophy[] = [];
  for (const t of data.trophies) {
    if (t.kind !== "team" || t.teamId == null) continue;
    const matchesCurrent = currentTeamId != null && t.teamId === currentTeamId;
    const matchesSeasonRoster = rosterEntries.some(
      (r) => r.teamId === t.teamId && (!t.season || r.season === t.season),
    );
    if ((matchesCurrent || matchesSeasonRoster) && !seen.has(t.id)) {
      seen.add(t.id);
      list.push(t);
    }
  }
  return list;
}

// ---------------------------------------------------------------------------
// All-time records
// ---------------------------------------------------------------------------
export type ScorerMatchRecord = { playerId: number; match: Match; goals: number };

export function computeRecords(data: LeagueData) {
  const played = data.matches.filter((m) => m.status === "played");
  const lines = computePlayerStats(data);
  const teamRecs = computeTeamRecords(data);

  const topBy = (key: StatKey, n = 10) =>
    sortLines(lines, key, data)
      .filter((l) => l[key] > 0)
      .slice(0, n);

  const bestGoalsPerGame = lines
    .filter((l) => l.apps >= 3 && l.goals > 0)
    .sort((a, b) => b.goals / b.apps - a.goals / a.apps || b.goals - a.goals)
    .slice(0, 10);

  const bestContribPerGame = lines
    .filter((l) => l.apps >= 3 && l.goals + l.assists > 0)
    .sort(
      (a, b) =>
        (b.goals + b.assists) / b.apps - (a.goals + a.assists) / a.apps ||
        b.goals + b.assists - (a.goals + a.assists),
    )
    .slice(0, 10);

  const biggestWins = [...played]
    .filter((m) => m.homeScore !== m.awayScore)
    .sort((a, b) => Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore))
    .slice(0, 8);

  const highestScoring = [...played]
    .sort((a, b) => b.homeScore + b.awayScore - (a.homeScore + a.awayScore))
    .slice(0, 8);

  const scorerMatch: ScorerMatchRecord[] = [];
  for (const m of played) {
    const counts = new Map<number, number>();
    for (const g of data.goalsByMatch.get(m.id) ?? []) {
      if (g.isOwnGoal || g.scorerId == null) continue;
      counts.set(g.scorerId, (counts.get(g.scorerId) ?? 0) + 1);
    }
    for (const [playerId, n] of counts) scorerMatch.push({ playerId, match: m, goals: n });
  }
  scorerMatch.sort((a, b) => b.goals - a.goals || matchTime(b.match) - matchTime(a.match));
  const hatTricks = scorerMatch.filter((r) => r.goals >= 3);

  const { byTeam, byPlayer } = trophyCounts(data);
  const mostDecoratedTeams = [...byTeam.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([teamId, count]) => ({ teamId, count }));
  const mostDecoratedPlayers = [...byPlayer.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([playerId, count]) => ({ playerId, count }));

  const totalGoals = played.reduce((s, m) => s + m.homeScore + m.awayScore, 0);

  return {
    totals: {
      matches: played.length,
      goals: totalGoals,
      goalsPerMatch: played.length ? totalGoals / played.length : 0,
      hatTricks: hatTricks.length,
      cleanSheets: teamRecs.reduce((s, r) => s + r.cleanSheets, 0),
    },
    topScorers: topBy("goals"),
    topAssists: topBy("assists"),
    mostCleanSheets: topBy("cleanSheets"),
    mostMotm: topBy("motm"),
    mostApps: topBy("apps"),
    mostHatTricks: topBy("hatTricks"),
    bestGoalsPerGame,
    bestContribPerGame,
    biggestWins,
    highestScoring,
    bestSingleMatch: scorerMatch.slice(0, 8),
    hatTricks,
    teamsByWins: [...teamRecs].sort((a, b) => b.wins - a.wins || b.points - a.points),
    teamsByGoals: [...teamRecs].sort((a, b) => b.gf - a.gf),
    teamsByCleanSheets: [...teamRecs].sort((a, b) => b.cleanSheets - a.cleanSheets),
    teamsByUnbeaten: [...teamRecs].sort((a, b) => b.longestUnbeaten - a.longestUnbeaten),
    teamsByWinStreak: [...teamRecs].sort((a, b) => b.longestWinStreak - a.longestWinStreak),
    mostDecoratedTeams,
    mostDecoratedPlayers,
  };
}
