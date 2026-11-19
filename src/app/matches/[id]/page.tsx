import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EmptyState,
  MatchStatusBadge,
  Panel,
  PlayerAvatar,
  PlayerLink,
  PositionBadge,
  TeamCrest,
} from "@/components/ui";
import type { Appearance, Goal, Team } from "@/db/schema";
import { cn, competitionLabel, formatDateTime, playerLabel } from "@/lib/site";
import { getLeagueData, type LeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

const POS_ORDER = ["GK", "DEF", "MID", "FWD"];

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  const data = await getLeagueData();
  const match = data.matchById.get(matchId);
  if (!match) notFound();

  const home = data.teamById.get(match.homeTeamId);
  const away = data.teamById.get(match.awayTeamId);
  const comp = data.competitionById.get(match.competitionId);
  const goals = data.goalsByMatch.get(match.id) ?? [];
  const apps = data.appsByMatch.get(match.id) ?? [];
  const motm = match.motmPlayerId ? data.playerById.get(match.motmPlayerId) : null;
  const motmTeam = motm
    ? data.teamById.get(apps.find((a) => a.playerId === motm.id)?.teamId ?? motm.teamId ?? -1)
    : null;
  const played = match.status === "played";

  const lineup = (teamId: number) =>
    apps
      .filter((a) => a.teamId === teamId)
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <Link href={`/competitions/${match.competitionId}`} className="font-semibold link">
            {competitionLabel(comp)}
          </Link>
          {match.round ? <span>· {match.round}</span> : null}
          <MatchStatusBadge status={match.status} />
        </div>
        <Link href="/matches" className="btn btn-sm">
          ← All matches
        </Link>
      </div>

      {/* Scoreboard */}
      <section className="panel relative overflow-hidden px-6 py-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-[0.12]"
          style={{ background: `linear-gradient(90deg, ${home?.primaryColor ?? "#22c55e"}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.12]"
          style={{ background: `linear-gradient(270deg, ${away?.primaryColor ?? "#22c55e"}, transparent)` }}
        />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamSide team={home} align="right" />
          <div className="text-center">
            {played ? (
              <p className="font-mono text-5xl font-black tabular-nums text-white sm:text-6xl">
                {match.homeScore}
                <span className="mx-2 text-zinc-600">–</span>
                {match.awayScore}
              </p>
            ) : (
              <p className="text-2xl font-black uppercase tracking-widest text-zinc-500">vs</p>
            )}
            <p className="mt-2 text-xs text-zinc-500">{formatDateTime(match.playedAt)}</p>
            {match.venue ? <p className="text-xs text-zinc-600">{match.venue}</p> : null}
          </div>
          <TeamSide team={away} align="left" />
        </div>

        {played && goals.length ? (
          <div className="relative mt-6 grid grid-cols-2 gap-6 text-xs text-zinc-400">
            <ul className="space-y-1 text-right">
              {goals.filter((g) => g.teamId === match.homeTeamId).map((g) => (
                <li key={g.id}><GoalText goal={g} data={data} /></li>
              ))}
            </ul>
            <ul className="space-y-1">
              {goals.filter((g) => g.teamId === match.awayTeamId).map((g) => (
                <li key={g.id}><GoalText goal={g} data={data} /></li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {motm ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-5 py-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Man of the match</p>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <PlayerAvatar player={motm} team={motmTeam} size="sm" />
              <PlayerLink player={motm} team={motmTeam} />
              {motmTeam ? <span className="text-xs text-zinc-500">{motmTeam.name}</span> : null}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Timeline" className="lg:col-span-1">
          {goals.length ? (
            <ol className="divide-y divide-white/[0.05]">
              {goals.map((g) => {
                const isHome = g.teamId === match.homeTeamId;
                const team = data.teamById.get(g.teamId);
                const scorer = g.scorerId ? data.playerById.get(g.scorerId) : null;
                const assist = g.assistId ? data.playerById.get(g.assistId) : null;
                return (
                  <li key={g.id} className={cn("flex items-start gap-3 px-5 py-3", !isHome && "flex-row-reverse text-right")}>
                    <span className="mt-0.5 w-10 shrink-0 font-mono text-xs font-bold text-orange-400">
                      {g.minute != null ? `${g.minute}'` : "—"}
                    </span>
                    <TeamCrest team={team} size="xs" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {scorer ? <PlayerLink player={scorer} team={team} /> : "Unknown scorer"}
                        {g.isOwnGoal ? <span className="ml-1 text-xs text-red-300">(OG)</span> : null}
                        {g.isPenalty ? <span className="ml-1 text-xs text-zinc-400">(pen)</span> : null}
                      </p>
                      {assist ? (
                        <p className="text-xs text-zinc-500">assist: {playerLabel(assist)}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState>{played ? "No goal events recorded." : "Match not played yet."}</EmptyState>
          )}
          {match.notes ? (
            <p className="border-t border-white/[0.06] px-5 py-3 text-xs text-zinc-400">{match.notes}</p>
          ) : null}
        </Panel>

        <Lineup team={home} apps={lineup(match.homeTeamId)} data={data} match={match} />
        <Lineup team={away} apps={lineup(match.awayTeamId)} data={data} match={match} />
      </div>
    </>
  );
}

function TeamSide({ team, align }: { team: Team | undefined; align: "left" | "right" }) {
  if (!team) return <div />;
  return (
    <Link
      href={`/teams/${team.id}`}
      className={cn(
        "flex items-center gap-3 sm:gap-4",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <TeamCrest team={team} size="xl" className="hidden sm:inline-flex" />
      <TeamCrest team={team} size="lg" className="sm:hidden" />
      <span>
        <span className="block text-base font-extrabold text-white sm:text-2xl">{team.name}</span>
        <span className="block text-xs text-zinc-500">{team.shortName}</span>
      </span>
    </Link>
  );
}

function GoalText({ goal, data }: { goal: Goal; data: LeagueData }) {
  const scorer = goal.scorerId ? data.playerById.get(goal.scorerId) : null;
  return (
    <span>
      ⚽ {scorer ? playerLabel(scorer) : "Unknown"}
      {goal.minute != null ? ` ${goal.minute}'` : ""}
      {goal.isOwnGoal ? " (OG)" : goal.isPenalty ? " (P)" : ""}
    </span>
  );
}

function Lineup({
  team,
  apps,
  data,
  match,
}: {
  team: Team | undefined;
  apps: Appearance[];
  data: LeagueData;
  match: { homeTeamId: number; homeScore: number; awayScore: number; status: string; motmPlayerId: number | null };
}) {
  const conceded = team?.id === match.homeTeamId ? match.awayScore : match.homeScore;
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <TeamCrest team={team} size="xs" /> {team?.name ?? "Team"}
        </span>
      }
      description="Lineup"
    >
      {apps.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {apps.map((a) => {
            const p = data.playerById.get(a.playerId);
            const matchGoals = (data.goalsByMatch.get(a.matchId) ?? []).filter(
              (g) => g.scorerId === a.playerId && !g.isOwnGoal,
            ).length;
            const matchAssists = (data.goalsByMatch.get(a.matchId) ?? []).filter(
              (g) => g.assistId === a.playerId,
            ).length;
            const cs = a.position === "GK" && match.status === "played" && conceded === 0;
            return (
              <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                <PositionBadge position={a.position} />
                <div className="min-w-0 flex-1">
                  <PlayerLink player={p} team={team} className="text-sm" />
                </div>
                <span className="flex items-center gap-1 text-xs">
                  {matchGoals ? <span className="chip chip-green">⚽ {matchGoals}</span> : null}
                  {matchAssists ? <span className="chip">A {matchAssists}</span> : null}
                  {cs ? <span className="chip chip-blue">CS</span> : null}
                  {match.motmPlayerId === a.playerId ? <span className="chip chip-amber">⭐</span> : null}
                  {a.yellowCards > 0 ? <span className="inline-block h-3.5 w-2.5 rounded-sm bg-yellow-400" title="Yellow card" /> : null}
                  {a.redCard ? <span className="inline-block h-3.5 w-2.5 rounded-sm bg-red-500" title="Red card" /> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>No lineup recorded.</EmptyState>
      )}
    </Panel>
  );
}
