import Link from "next/link";
import type { ReactNode } from "react";
import {
  CompetitionIcon,
  EmptyState,
  PageHeader,
  Panel,
  PlayerLink,
  RankBadge,
  StatCard,
  TeamCrest,
  TeamLink,
} from "@/components/ui";
import type { Match } from "@/db/schema";
import { competitionLabel, formatDate, ratio, site } from "@/lib/site";
import { computeRecords, getLeagueData, podiumForCompetition, type LeagueData, type PlayerStatLine, type TeamRecord } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Records" };

export default async function RecordsPage() {
  const data = await getLeagueData();
  const r = computeRecords(data);

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} database`}
        title={<>Records<span className="text-orange-400">.</span></>}
        subtitle="All-time league records. The tables below stay blank until real matches and player statistics are entered."
      />

      <Panel title="The champions" description="Confirmed RSL titles · Seasons 1–3" action={<Link href="/archive" className="btn btn-sm">Full archive ↗</Link>} className="mb-7">
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {[...data.competitions].reverse().filter((c) => c.status === "completed").slice(0, 8).map((c) => {
            const { champion, runnerUp } = podiumForCompetition(data, c.id);
            return (
              <Link key={c.id} href={`/competitions/${c.id}`} className="flex items-center gap-3 bg-[#101b37] p-4 transition hover:bg-[#192549]">
                <CompetitionIcon competition={c} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.name} · {c.season}</p><p className="mt-0.5 truncate text-sm font-extrabold text-white">{champion?.name ?? "TBD"}</p><p className="truncate text-[11px] text-slate-500">Runner-up: {runnerUp?.name ?? "TBD"}</p></div>
              </Link>
            );
          })}
        </div>
      </Panel>

      {!r.totals.matches ? (
        <div className="mb-7 panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="text-4xl">📊</span>
          <h2 className="text-lg font-black text-white">Statistical records are blank by design</h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            No matches have been recorded yet, so every goals, assists, appearances, clean-sheet and
            match milestone record is deliberately left empty. The confirmed champions above come from
            the official archive — the performance records begin as soon as real results are entered
            in the tracker.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Matches played" value={r.totals.matches} />
        <StatCard label="Total goals" value={r.totals.goals} accent />
        <StatCard label="Goals / match" value={r.totals.goalsPerMatch.toFixed(2)} />
        <StatCard label="Hat-tricks" value={r.totals.hatTricks} />
        <StatCard label="Clean sheets" value={r.totals.cleanSheets} />
      </div>

      <h2 className="eyebrow mt-10 mb-4">Individual records</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <PlayerBoard title="All-time top scorers" lines={r.topScorers} data={data} value={(l) => l.goals} sub={(l) => `${l.apps} apps · ${ratio(l.goals, l.apps)} per game`} />
        <PlayerBoard title="All-time assists" lines={r.topAssists} data={data} value={(l) => l.assists} sub={(l) => `${l.apps} apps`} />
        <PlayerBoard title="Most clean sheets" lines={r.mostCleanSheets} data={data} value={(l) => l.cleanSheets} sub={(l) => `${l.apps} apps`} />
        <PlayerBoard title="Most man of the match awards" lines={r.mostMotm} data={data} value={(l) => l.motm} sub={(l) => `${l.apps} apps`} />
        <PlayerBoard title="Most appearances" lines={r.mostApps} data={data} value={(l) => l.apps} sub={(l) => `${l.wins}W ${l.draws}D ${l.losses}L`} />
        <PlayerBoard title="Most hat-tricks" lines={r.mostHatTricks} data={data} value={(l) => l.hatTricks} sub={(l) => `${l.goals} goals`} />
        <PlayerBoard title="Best goals per game" description="Minimum 3 appearances" lines={r.bestGoalsPerGame} data={data} value={(l) => ratio(l.goals, l.apps)} sub={(l) => `${l.goals} in ${l.apps}`} />
        <PlayerBoard title="Best G+A per game" description="Minimum 3 appearances" lines={r.bestContribPerGame} data={data} value={(l) => ratio(l.goals + l.assists, l.apps)} sub={(l) => `${l.goals}G ${l.assists}A in ${l.apps}`} />
        <Panel title="Most decorated players" description="Individual awards">
          {r.mostDecoratedPlayers.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {r.mostDecoratedPlayers.slice(0, 10).map(({ playerId, count }, i) => {
                const p = data.playerById.get(playerId);
                const t = p?.teamId ? data.teamById.get(p.teamId) : null;
                return (
                  <li key={playerId} className="flex items-center gap-3 px-5 py-2.5">
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <PlayerLink player={p} team={t} className="text-sm" />
                      <p className="truncate text-xs text-zinc-500">
                        {data.trophies.filter((x) => x.playerId === playerId).map((x) => `${x.icon} ${x.name}`).join(", ")}
                      </p>
                    </div>
                    <span className="text-base font-black text-amber-300">{count}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState className="py-8">No awards yet.</EmptyState>
          )}
        </Panel>
      </div>

      <h2 className="eyebrow mt-10 mb-4">Match records</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Most goals in a single match" description="By one player">
          {r.bestSingleMatch.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {r.bestSingleMatch.map(({ playerId, match, goals }, i) => {
                const p = data.playerById.get(playerId);
                return (
                  <li key={`${playerId}-${match.id}`} className="flex items-center gap-3 px-5 py-2.5">
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <PlayerLink player={p} className="text-sm" />
                      <MatchLine match={match} data={data} />
                    </div>
                    <span className="text-base font-black text-orange-400">{goals}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState className="py-8">No goals recorded.</EmptyState>
          )}
        </Panel>
        <MatchBoard title="Biggest wins" matches={r.biggestWins} data={data} value={(m) => `+${Math.abs(m.homeScore - m.awayScore)}`} />
        <MatchBoard title="Highest-scoring matches" matches={r.highestScoring} data={data} value={(m) => String(m.homeScore + m.awayScore)} />
        <Panel title="Hat-trick club" description={`${r.hatTricks.length} recorded`} className="md:col-span-2 xl:col-span-3">
          {r.hatTricks.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className="text-center">Goals</th>
                    <th>Match</th>
                    <th>Competition</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {r.hatTricks.map(({ playerId, match, goals }) => {
                    const p = data.playerById.get(playerId);
                    const t = p?.teamId ? data.teamById.get(p.teamId) : null;
                    return (
                      <tr key={`${playerId}-${match.id}`}>
                        <td><PlayerLink player={p} team={t} showAvatar /></td>
                        <td className="text-center font-black text-orange-400">{goals}</td>
                        <td><MatchLine match={match} data={data} inline /></td>
                        <td className="text-zinc-400">{competitionLabel(data.competitionById.get(match.competitionId))}</td>
                        <td className="text-zinc-500">{formatDate(match.playedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="py-8">No hat-tricks yet. Someone go get one.</EmptyState>
          )}
        </Panel>
      </div>

      <h2 className="eyebrow mt-10 mb-4">Team records</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <TeamBoard title="Most wins" records={r.teamsByWins} data={data} value={(t) => t.wins} sub={(t) => `${t.played} played · ${t.points} pts`} />
        <TeamBoard title="Most goals scored" records={r.teamsByGoals} data={data} value={(t) => t.gf} sub={(t) => `${ratio(t.gf, t.played)} per match`} />
        <TeamBoard title="Most clean sheets" records={r.teamsByCleanSheets} data={data} value={(t) => t.cleanSheets} sub={(t) => `${t.ga} conceded`} />
        <TeamBoard title="Longest unbeaten run" records={r.teamsByUnbeaten} data={data} value={(t) => t.longestUnbeaten} sub={() => "matches"} />
        <TeamBoard title="Longest win streak" records={r.teamsByWinStreak} data={data} value={(t) => t.longestWinStreak} sub={() => "consecutive wins"} />
        <Panel title="Most decorated teams" description="Team trophies">
          {r.mostDecoratedTeams.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {r.mostDecoratedTeams.map(({ teamId, count }, i) => {
                const t = data.teamById.get(teamId);
                return (
                  <li key={teamId} className="flex items-center gap-3 px-5 py-2.5">
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <TeamLink team={t} bold />
                      <p className="truncate text-xs text-zinc-500">
                        {data.trophies.filter((x) => x.teamId === teamId && x.kind === "team").map((x) => `${x.icon} ${x.name}${x.season ? ` (${x.season})` : ""}`).join(", ")}
                      </p>
                    </div>
                    <span className="text-base font-black text-amber-300">{count}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState className="py-8">No trophies yet.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}

function MatchLine({ match, data, inline = false }: { match: Match; data: LeagueData; inline?: boolean }) {
  const home = data.teamById.get(match.homeTeamId);
  const away = data.teamById.get(match.awayTeamId);
  return (
    <Link href={`/matches/${match.id}`} className={inline ? "inline-flex items-center gap-1.5 text-sm link" : "mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"}>
      <TeamCrest team={home} size="xs" />
      <span>{home?.shortName}</span>
      <span className="font-mono font-bold text-zinc-300">{match.homeScore}–{match.awayScore}</span>
      <span>{away?.shortName}</span>
      <TeamCrest team={away} size="xs" />
      {!inline ? <span className="ml-1 text-zinc-600">· {formatDate(match.playedAt)}</span> : null}
    </Link>
  );
}

function PlayerBoard({
  title,
  description,
  lines,
  data,
  value,
  sub,
}: {
  title: string;
  description?: string;
  lines: PlayerStatLine[];
  data: LeagueData;
  value: (l: PlayerStatLine) => ReactNode;
  sub: (l: PlayerStatLine) => ReactNode;
}) {
  return (
    <Panel title={title} description={description}>
      {lines.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {lines.map((l, i) => {
            const p = data.playerById.get(l.playerId);
            const t = p?.teamId ? data.teamById.get(p.teamId) : null;
            return (
              <li key={l.playerId} className="flex items-center gap-3 px-5 py-2.5">
                <RankBadge rank={i + 1} />
                {t ? <TeamCrest team={t} size="sm" /> : null}
                <div className="min-w-0 flex-1">
                  <PlayerLink player={p} team={t} className="text-sm" />
                  <p className="text-xs text-zinc-500">{sub(l)}</p>
                </div>
                <span className="text-base font-black tabular-nums text-orange-400">{value(l)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState className="py-8">Nothing recorded yet.</EmptyState>
      )}
    </Panel>
  );
}

function TeamBoard({
  title,
  records,
  data,
  value,
  sub,
}: {
  title: string;
  records: TeamRecord[];
  data: LeagueData;
  value: (t: TeamRecord) => ReactNode;
  sub: (t: TeamRecord) => ReactNode;
}) {
  const rows = records.filter((t) => t.played > 0).slice(0, 8);
  return (
    <Panel title={title}>
      {rows.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {rows.map((t, i) => (
            <li key={t.teamId} className="flex items-center gap-3 px-5 py-2.5">
              <RankBadge rank={i + 1} />
              <div className="min-w-0 flex-1">
                <TeamLink team={data.teamById.get(t.teamId)} bold />
                <p className="text-xs text-zinc-500">{sub(t)}</p>
              </div>
              <span className="text-base font-black tabular-nums text-orange-400">{value(t)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-8">No matches played yet.</EmptyState>
      )}
    </Panel>
  );
}

function MatchBoard({
  title,
  matches,
  data,
  value,
}: {
  title: string;
  matches: Match[];
  data: LeagueData;
  value: (m: Match) => string;
}) {
  return (
    <Panel title={title}>
      {matches.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {matches.map((m, i) => {
            const home = data.teamById.get(m.homeTeamId);
            const away = data.teamById.get(m.awayTeamId);
            return (
              <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                <RankBadge rank={i + 1} />
                <Link href={`/matches/${m.id}`} className="flex min-w-0 flex-1 items-center gap-2 text-sm link">
                  <TeamCrest team={home} size="sm" />
                  <span className="truncate font-semibold">{home?.shortName}</span>
                  <span className="font-mono font-black text-white">{m.homeScore}–{m.awayScore}</span>
                  <span className="truncate font-semibold">{away?.shortName}</span>
                  <TeamCrest team={away} size="sm" />
                </Link>
                <span className="text-xs text-zinc-500">{formatDate(m.playedAt)}</span>
                <span className="text-base font-black tabular-nums text-orange-400">{value(m)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState className="py-8">No matches played yet.</EmptyState>
      )}
    </Panel>
  );
}
