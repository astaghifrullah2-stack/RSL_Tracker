import { cache } from "react";
import { getArcadeDataset } from "@/lib/arcade-data";
import { clubColor, clubShortName } from "@/lib/club-names";
import { computePlayerStats, getLeagueData, type PlayerStatLine } from "@/lib/stats";
import {
  BOARD_IDS,
  RANKING_SCOPES,
  SCOPE_META,
  boardKey,
  type RankingEntry,
  type RankingRow,
  type RankingsData,
  type ClubPowerRow,
  type SeasonSummary,
  type RankingScope,
} from "@/lib/rankings-meta";

export * from "@/lib/rankings-meta";

function norm(value: number, max: number) {
  return Math.min(1, Math.max(0, value / max));
}

export const getRankingsData = cache(async (): Promise<RankingsData> => {
  const [arcade, league] = await Promise.all([getArcadeDataset(), getLeagueData()]);

  // Match stats per season scope.
  const statLines = new Map<RankingScope, Map<number, PlayerStatLine>>();
  for (const scope of RANKING_SCOPES) {
    const season = SCOPE_META[scope].season;
    const lines = computePlayerStats(league, season ? { season } : {});
    statLines.set(scope, new Map(lines.map((l) => [l.playerId, l])));
  }

  // Individual awards & championship titles by player and season.
  const awardsBySeason = new Map<number, Map<string, number>>();
  const titlesBySeason = new Map<number, Map<string, number>>();
  const addTo = (map: Map<number, Map<string, number>>, pid: number, season: string, n: number) => {
    if (!map.has(pid)) map.set(pid, new Map());
    const inner = map.get(pid)!;
    inner.set(season, (inner.get(season) ?? 0) + n);
  };

  for (const t of league.trophies) {
    if (t.kind !== "individual" || t.playerId == null || !t.season) continue;
    addTo(awardsBySeason, t.playerId, t.season, 1);
  }
  for (const r of league.seasonRosters) {
    const wins = league.placements.filter(
      (p) =>
        p.teamId === r.teamId &&
        p.placement === 1 &&
        league.competitionById.get(p.competitionId)?.season === r.season,
    ).length;
    if (wins) addTo(titlesBySeason, r.playerId, r.season, wins);
  }
  const seasonTotal = (map: Map<number, Map<string, number>>, pid: number) =>
    [...(map.get(pid)?.values() ?? [])].reduce((a, b) => a + b, 0);

  const rows: RankingRow[] = arcade.players.map((p) => {
    const values = {} as RankingRow["values"];

    for (const scope of RANKING_SCOPES) {
      const season = SCOPE_META[scope].season;
      const line = statLines.get(scope)?.get(p.id);
      const snap = scope === "s2" ? p.s2 : scope === "s3" ? p.s3 : scope === "s4" ? p.s4 : null;

      const rating = scope === "all" ? p.peakOvr : scope === "s1" ? null : (snap?.rating ?? null);
      const wage = scope === "all" ? p.peakWage : scope === "s1" ? null : (snap?.wage ?? null);
      const awards = season
        ? (awardsBySeason.get(p.id)?.get(season) ?? 0)
        : seasonTotal(awardsBySeason, p.id);
      const titles = season
        ? (titlesBySeason.get(p.id)?.get(season) ?? 0)
        : seasonTotal(titlesBySeason, p.id);
      const goals = line?.goals ?? 0;
      const assists = line?.assists ?? 0;

      const bonus =
        0.3 * norm(awards, 3) +
        0.28 * norm(titles, 5) +
        0.2 * norm(p.seasons.length, 4) +
        0.12 * norm(wage ?? 0, 600000) +
        0.06 * norm(goals, 40) +
        0.04 * norm(assists, 30);
      const index = Math.min(99, Math.round((rating ?? p.peakOvr) * 0.62 + bonus * 38));

      values[scope] = {
        index,
        goals,
        assists,
        cleanSheets: line?.cleanSheets ?? 0,
        motm: line?.motm ?? 0,
        rating,
        wage,
        trophies: awards + titles,
        titles,
        seasons: p.seasons.length,
      };
    }

    return {
      playerId: p.id,
      username: p.username,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      robloxUserId: p.robloxUserId,
      position: p.position,
      detailedPosition: p.detailedPosition,
      currentTeam: p.currentTeam,
      primaryClub: p.primaryClub,
      clubs: p.clubs,
      seasons: p.seasons,
      seasonsCount: p.seasons.length,
      tier: p.tier,
      peakClass: p.peakClass,
      peakOvr: p.peakOvr,
      values,
      card: p,
    };
  });

  const byPlayer: Record<number, RankingRow> = {};
  for (const row of rows) byPlayer[row.playerId] = row;

  // Dense competition ranks (ties share a rank, e.g. 7, 7, 10).
  const rankings: Record<string, RankingEntry[]> = {};
  for (const scope of RANKING_SCOPES) {
    for (const board of BOARD_IDS) {
      const candidates = rows
        .filter((r) => {
          const v = r.values[scope][board];
          return v != null && v > 0;
        })
        .sort((a, b) => {
          const av = a.values[scope][board]!;
          const bv = b.values[scope][board]!;
          return (
            bv - av ||
            b.values.all.index! - a.values.all.index! ||
            b.peakOvr - a.peakOvr ||
            a.username.localeCompare(b.username)
          );
        });
      let lastValue: number | null = null;
      let lastRank = 0;
      rankings[boardKey(scope, board)] = candidates.map((r, i) => {
        const value = r.values[scope][board]!;
        const rank = value === lastValue ? lastRank : i + 1;
        lastValue = value;
        lastRank = rank;
        return { playerId: r.playerId, rank, value };
      });
    }
  }

  // Club power index from all-time RSL Index.
  const clubRows = new Map<string, RankingRow[]>();
  for (const row of rows) {
    for (const club of row.clubs) {
      if (!clubRows.has(club)) clubRows.set(club, []);
      clubRows.get(club)!.push(row);
    }
  }
  const clubs: ClubPowerRow[] = [...clubRows.entries()]
    .map(([club, members]) => {
      const indices = members.map((m) => m.values.all.index!);
      const best = [...members].sort((a, b) => b.values.all.index! - a.values.all.index!)[0] ?? null;
      const titles = league.placements.filter(
        (p) => p.placement === 1 && league.teamById.get(p.teamId)?.name === club,
      ).length;
      return {
        club,
        short: clubShortName(club),
        color: clubColor(club),
        players: members.length,
        avgIndex: Math.round(indices.reduce((a, b) => a + b, 0) / Math.max(1, indices.length)),
        totalIndex: indices.reduce((a, b) => a + b, 0),
        titles,
        best: best
          ? { name: best.displayName, avatarUrl: best.avatarUrl, index: best.values.all.index! }
          : null,
      };
    })
    .sort((a, b) => {
      // Clubs with a meaningful sample size lead the table; one-player clubs
      // are still listed but ranked after them.
      const aQualifies = a.players >= 3 ? 1 : 0;
      const bQualifies = b.players >= 3 ? 1 : 0;
      return (
        bQualifies - aQualifies ||
        b.avgIndex - a.avgIndex ||
        b.players - a.players ||
        a.club.localeCompare(b.club)
      );
    });

  // Season laboratory summaries.
  const eraByScope: Record<RankingScope, string> = {
    all: "Every chapter",
    s1: "Spanish League",
    s2: "Spanish League",
    s3: "Italian League",
    s4: "The EUROS",
  };
  const seasonSummaries: SeasonSummary[] = RANKING_SCOPES.map((scope) => {
    const season = SCOPE_META[scope].season;
    const eligible = rows.filter((r) => {
      if (scope === "all") return true;
      if (scope === "s1") {
        return (
          (titlesBySeason.get(r.playerId)?.get("Season 1") ?? 0) > 0 ||
          (awardsBySeason.get(r.playerId)?.get("Season 1") ?? 0) > 0 ||
          r.seasons.includes("S1")
        );
      }
      return r.values[scope].rating != null || r.values[scope].wage != null;
    });
    const rated = eligible
      .map((r) => ({ row: r, value: r.values[scope].index! }))
      .sort((a, b) => b.value - a.value || b.row.peakOvr - a.row.peakOvr);
    const ratedRows = rows.filter((r) => r.values[scope].rating != null);
    const ovrValues = ratedRows.map((r) => r.values[scope].rating!);
    const wageRows = rows.filter((r) => r.values[scope].wage != null);
    const wageLeader = [...wageRows].sort(
      (a, b) => (b.values[scope].wage ?? 0) - (a.values[scope].wage ?? 0),
    )[0];
    const championSet = new Set<string>();
    for (const p of league.placements) {
      if (p.placement !== 1) continue;
      const comp = league.competitionById.get(p.competitionId);
      if (season && comp?.season !== season) continue;
      const team = league.teamById.get(p.teamId);
      if (team) championSet.add(team.name);
    }
    return {
      scope,
      label: SCOPE_META[scope].short,
      era: eraByScope[scope],
      ranked: scope === "all" ? rows.length : eligible.length,
      avgOvr: ovrValues.length
        ? Math.round((ovrValues.reduce((a, b) => a + b, 0) / ovrValues.length) * 10) / 10
        : null,
      highestOvr: ratedRows.length
        ? (() => {
            const top = [...ratedRows].sort(
              (a, b) => (b.values[scope].rating ?? 0) - (a.values[scope].rating ?? 0),
            )[0];
            return { name: top.displayName, avatarUrl: top.avatarUrl, value: top.values[scope].rating! };
          })()
        : null,
      highestWage: wageLeader
        ? { name: wageLeader.displayName, avatarUrl: wageLeader.avatarUrl, value: wageLeader.values[scope].wage! }
        : null,
      champions: [...championSet],
      topFive: rated.slice(0, 5).map((x) => ({
        name: x.row.displayName,
        avatarUrl: x.row.avatarUrl,
        value: x.value,
        club: x.row.primaryClub,
      })),
    };
  });

  return {
    rows,
    byPlayer,
    rankings,
    clubs,
    seasonSummaries,
    totals: {
      players: rows.length,
      clubs: clubs.length,
      honours: league.trophies.filter((t) => t.kind === "individual").length,
      titles: league.placements.filter((p) => p.placement === 1).length,
      goals: rows.reduce((sum, r) => sum + r.values.all.goals!, 0),
      matches: league.matches.filter((m) => m.status === "played").length,
      ratedEntries: rows.filter((r) => r.values.all.rating != null).length,
    },
  };
});
