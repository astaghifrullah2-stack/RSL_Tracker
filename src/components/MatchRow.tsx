import Link from "next/link";
import type { Match } from "@/db/schema";
import { cn, competitionLabel, formatDateTime, playerLabel } from "@/lib/site";
import { goalsByTeam, type LeagueData } from "@/lib/stats";
import { TeamCrest } from "@/components/ui";

export function MatchRow({
  match,
  data,
  showCompetition = true,
  showScorers = false,
  highlightTeamId,
}: {
  match: Match;
  data: LeagueData;
  showCompetition?: boolean;
  showScorers?: boolean;
  highlightTeamId?: number;
}) {
  const home = data.teamById.get(match.homeTeamId);
  const away = data.teamById.get(match.awayTeamId);
  const comp = data.competitionById.get(match.competitionId);
  const played = match.status === "played";

  const resultFor = (teamId: number | undefined) => {
    if (!played || !teamId) return null;
    const gf = teamId === match.homeTeamId ? match.homeScore : match.awayScore;
    const ga = teamId === match.homeTeamId ? match.awayScore : match.homeScore;
    return gf > ga ? "W" : gf === ga ? "D" : "L";
  };
  const hl = highlightTeamId ? resultFor(highlightTeamId) : null;

  const scorers = showScorers && played ? goalsByTeam(data, match) : null;
  const scorerText = (list: NonNullable<typeof scorers>["home"]) =>
    list
      .map((g) => {
        const p = g.scorerId ? data.playerById.get(g.scorerId) : null;
        const name = p ? playerLabel(p) : "Unknown";
        const tag = g.isOwnGoal ? " (OG)" : g.isPenalty ? " (P)" : "";
        return `${name}${g.minute ? ` ${g.minute}'` : ""}${tag}`;
      })
      .join(", ");

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block px-4 py-3 transition hover:bg-white/[0.03] sm:px-5"
    >
      <div className="flex items-center gap-3">
        <div className="hidden w-36 shrink-0 text-xs text-zinc-500 sm:block">
          <p className="truncate">{formatDateTime(match.playedAt)}</p>
          {showCompetition ? (
            <p className="truncate text-zinc-600">{competitionLabel(comp)}</p>
          ) : match.round ? (
            <p className="truncate text-zinc-600">{match.round}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              highlightTeamId === match.homeTeamId ? "text-white" : "text-zinc-200",
            )}
          >
            {home?.name ?? "TBD"}
          </span>
          <TeamCrest team={home} size="sm" />
        </div>

        <div className="shrink-0">
          {played ? (
            <span
              className={cn(
                "inline-flex min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border px-2 py-1 font-mono text-sm font-black tabular-nums",
                hl === "W" && "border-orange-500/40 bg-orange-500/15 text-orange-200",
                hl === "L" && "border-red-500/40 bg-red-500/10 text-red-200",
                hl === "D" && "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
                !hl && "border-white/10 bg-black/40 text-white",
              )}
            >
              <span>{match.homeScore}</span>
              <span className="text-zinc-500">–</span>
              <span>{match.awayScore}</span>
            </span>
          ) : (
            <span className="inline-flex min-w-[4.5rem] items-center justify-center rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {match.status === "postponed" ? "PPD" : "vs"}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamCrest team={away} size="sm" />
          <span
            className={cn(
              "truncate text-sm font-semibold",
              highlightTeamId === match.awayTeamId ? "text-white" : "text-zinc-200",
            )}
          >
            {away?.name ?? "TBD"}
          </span>
        </div>

        <div className="hidden w-28 shrink-0 text-right text-xs text-zinc-500 lg:block">
          {match.round ?? (comp ? comp.name : "")}
        </div>
      </div>

      <div className="mt-1 text-[11px] text-zinc-500 sm:hidden">
        {formatDateTime(match.playedAt)}
        {showCompetition && comp ? ` · ${competitionLabel(comp)}` : ""}
        {match.round ? ` · ${match.round}` : ""}
      </div>

      {scorers && (scorers.home.length > 0 || scorers.away.length > 0) ? (
        <div className="mt-2 grid grid-cols-2 gap-4 text-[11px] text-zinc-500">
          <p className="truncate text-right">{scorerText(scorers.home)}</p>
          <p className="truncate">{scorerText(scorers.away)}</p>
        </div>
      ) : null}
    </Link>
  );
}

export function MatchList({
  matches,
  data,
  emptyText = "No matches to show.",
  ...rest
}: {
  matches: Match[];
  data: LeagueData;
  emptyText?: string;
  showCompetition?: boolean;
  showScorers?: boolean;
  highlightTeamId?: number;
}) {
  if (!matches.length) {
    return <p className="px-6 py-10 text-center text-sm text-zinc-500">{emptyText}</p>;
  }
  return (
    <div className="divide-y divide-white/[0.05]">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} data={data} {...rest} />
      ))}
    </div>
  );
}
