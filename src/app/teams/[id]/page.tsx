import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchList } from "@/components/MatchRow";
import { StandingsTable } from "@/components/StandingsTable";
import {
  CompetitionIcon,
  EmptyState,
  FormPips,
  PageHeader,
  Panel,
  PlayerAvatar,
  PlayerLink,
  PositionBadge,
  StatCard,
  TeamCrest,
} from "@/components/ui";
import { competitionLabel, formatDate, formatWage, pct, playerLabel } from "@/lib/site";
import {
  computePlayerStats,
  computeStandings,
  emptyLine,
  getLeagueData,
  resultsForTeam,
  seasonRostersForTeam,
  sortLines,
  squadForTeam,
  teamRecord,
  teamsForCompetition,
  trophiesForTeam,
} from "@/lib/stats";
import { getTransferData, transfersForClub } from "@/lib/transfers";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  const data = await getLeagueData();
  const team = data.teamById.get(teamId);
  if (!team) notFound();

  const record = teamRecord(data, teamId);
  const cabinet = trophiesForTeam(data, teamId);
  const honours = resultsForTeam(data, teamId);
  const titles = honours.filter((r) => r.placement === 1).length;
  const runnersUp = honours.filter((r) => r.placement === 2).length;
  const seasonRosters = seasonRostersForTeam(data, teamId);
  const squad = squadForTeam(data, teamId);
  const transferData = await getTransferData();
  const clubMoves = transfersForClub(transferData, team.name);
  const teamStats = new Map(computePlayerStats(data, { teamId }).map((line) => [line.playerId, line]));
  const squadRows = squad
    .map((p) => ({ player: p, line: teamStats.get(p.id) ?? emptyLine(p.id) }))
    .sort((a, b) => ["GK", "DEF", "MID", "FWD"].indexOf(a.player.position) - ["GK", "DEF", "MID", "FWD"].indexOf(b.player.position) || (a.player.number ?? 99) - (b.player.number ?? 99));
  const topScorers = sortLines([...teamStats.values()], "goals", data).filter((l) => l.goals > 0).slice(0, 5);
  const teamMatches = data.matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
  const results = teamMatches.filter((m) => m.status === "played").reverse();
  const fixtures = teamMatches.filter((m) => m.status !== "played");
  const entered = data.competitions.filter((c) => teamsForCompetition(data, c.id).some((t) => t.id === teamId));
  const activeCompetition = entered.find((c) => c.status === "ongoing" && teamMatches.some((m) => m.competitionId === c.id && m.status === "played"));

  return (
    <>
      <PageHeader
        eyebrow={team.kind === "nation" ? "S4 / EUROS / NATIONAL TEAM" : "RSL / CLUB ARCHIVE"}
        title={<span className="flex items-center gap-4"><TeamCrest team={team} size="xl" /><span>{team.name}<span className="text-orange-400">.</span></span></span>}
        subtitle={<>{team.description ? <span className="block">{team.description}</span> : null}<span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>{team.kind === "nation" ? "National team" : "Club"} · {team.shortName}</span>{team.manager ? <span>Manager: <strong className="text-white">{team.manager}</strong></span> : null}{team.founded ? <span>Founded: <strong className="text-white">{team.founded}</strong></span> : null}</span></>}
        actions={<Link href="/teams" className="btn">← All teams</Link>}
      />

      {team.kind === "nation" && entered.some((c) => c.name === "EUROS") ? (
        <Link href={`/competitions/${entered.find((c) => c.name === "EUROS")!.id}`} className="mb-6 flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[0.07] px-5 py-3 text-sm text-orange-100 transition hover:bg-orange-500/[0.12]"><span className="text-xl">🏆</span><span className="flex-1 font-bold">Season 4 EUROS entrant</span><span>View tournament ↗</span></Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Titles" value={titles} accent />
        <StatCard label="Runner-up finishes" value={runnersUp} />
        <StatCard label="Matches logged" value={record.played} hint={record.played ? `${pct(record.wins, record.played)} win rate` : "Only verified scores count"} />
        <StatCard label="Wins" value={record.wins} />
        <StatCard label="Goals scored" value={record.gf} />
        <StatCard label="Clean sheets" value={record.cleanSheets} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Season history" description="Official competition finishes; separate from match-by-match statistics.">
            {entered.length ? (
              <div className="divide-y divide-white/[0.06]">
                {[...entered].reverse().map((c) => {
                  const finish = honours.find((h) => h.competition?.id === c.id);
                  const competitionRecord = teamRecord(data, teamId, { competitionId: c.id });
                  return (
                    <Link key={c.id} href={`/competitions/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.035]">
                      <CompetitionIcon competition={c} size="sm" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{c.name}</p><p className="text-xs text-slate-500">{c.season}{competitionRecord.played ? ` · ${competitionRecord.wins}W ${competitionRecord.draws}D ${competitionRecord.losses}L` : " · Match stats not recorded"}</p></div>
                      {finish?.placement === 1 ? <span className="chip chip-amber">🥇 Winners</span> : finish?.placement === 2 ? <span className="chip">🥈 Runner-up</span> : <span className="chip chip-orange">Current</span>}
                    </Link>
                  );
                })}
              </div>
            ) : <EmptyState>No competition entries yet.</EmptyState>}
          </Panel>

          {seasonRosters.map((roster) => (
            <Panel
              key={roster.season}
              title={`${team.name} · ${roster.label}`}
              description={`${roster.members.length} championship squad members${roster.titles.length ? ` · ${roster.titles.map((c) => c.name).join(" & ")}` : ""}`}
              action={<span className="chip chip-amber">🏆 {roster.season}</span>}
            >
              <div className="grid gap-3 p-5 sm:grid-cols-2 md:grid-cols-3">
                {roster.members.map(({ entry, player }) => (
                  <Link
                    key={entry.id}
                    href={`/players/${player.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3 transition hover:border-amber-400/45 hover:bg-amber-400/[0.08]"
                  >
                    <PlayerAvatar player={player} team={team} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-white group-hover:text-amber-200">
                        {playerLabel(player)}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        @{player.name}
                        {entry.discordHandle ? ` · ${entry.discordHandle}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          ))}

          <Panel title="Squad" description={`${squad.length} players · auto-filled from each player's current team`}>
            {squadRows.length ? (
              <div className="overflow-x-auto"><table className="table-base"><thead><tr><th className="w-10">#</th><th>Player</th><th>Pos</th><th className="text-center">Apps</th><th className="text-center">G</th><th className="text-center">A</th><th className="text-center">CS</th><th className="text-center">MOTM</th></tr></thead><tbody>
                {squadRows.map(({ player, line }) => <tr key={player.id}><td className="tabular-nums text-slate-500">{player.number ?? "—"}</td><td><PlayerLink player={player} team={team} showAvatar />{player.displayName ? <span className="ml-2 text-xs text-slate-500">@{player.name}</span> : null}</td><td><PositionBadge position={player.position} /></td><td className="text-center tabular-nums">{line.apps}</td><td className="text-center tabular-nums font-bold text-white">{line.goals}</td><td className="text-center tabular-nums">{line.assists}</td><td className="text-center tabular-nums">{line.cleanSheets}</td><td className="text-center tabular-nums">{line.motm}</td></tr>)}
              </tbody></table></div>
            ) : <EmptyState>No players have been registered yet. Real squad and scoring records will appear when they&apos;re added.</EmptyState>}
          </Panel>

          {results.length ? <Panel title="Results" action={<FormPips form={record.form} />}><MatchList matches={results} data={data} highlightTeamId={teamId} showScorers /></Panel> : null}
          {fixtures.length ? <Panel title="Upcoming fixtures"><MatchList matches={fixtures} data={data} highlightTeamId={teamId} /></Panel> : null}
          {activeCompetition ? <Panel title="TABLE" description={competitionLabel(activeCompetition)}><StandingsTable standings={computeStandings(data, activeCompetition.id)} data={data} highlightTeamId={teamId} /></Panel> : null}
        </div>

        <div className="space-y-6">
          <Panel title="Trophy cabinet" description={titles ? `${titles} official ${titles === 1 ? "title" : "titles"}` : undefined}>
            {cabinet.length ? <ul className="divide-y divide-white/[0.06]">{cabinet.map((t) => <li key={t.id} className="flex items-center gap-3 px-5 py-3"><span className="text-2xl">{t.icon}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-slate-500">{[t.season, t.awardedAt ? formatDate(t.awardedAt) : null].filter(Boolean).join(" · ")}</p></div></li>)}</ul> : <EmptyState>No titles yet. The cabinet awaits.</EmptyState>}
          </Panel>
          {runnersUp ? (
            <Panel title="Finals reached"><ul className="divide-y divide-white/[0.06]">{honours.filter((h) => h.placement === 2 && h.competition).map((h) => <li key={h.competition!.id} className="flex items-center gap-3 px-5 py-3"><span className="text-lg">🥈</span><div><Link href={`/competitions/${h.competition!.id}`} className="text-sm font-bold link">{h.competition!.name}</Link><p className="text-xs text-slate-500">{h.competition!.season} · Runner-up</p></div></li>)}</ul></Panel>
          ) : null}
          <Panel title="Top goalscorer" description="Updates automatically from recorded goals">
            {topScorers.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {topScorers.map((l) => <li key={l.playerId} className="flex items-center justify-between gap-3 px-5 py-2.5"><PlayerLink player={data.playerById.get(l.playerId)} team={team} className="text-sm" /><span className="font-black text-orange-300">{l.goals} <span className="text-xs font-normal text-slate-500">goals</span></span></li>)}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-2xl">⚽</p>
                <p className="mt-2 text-sm font-bold text-white">No goals recorded yet</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{squad.length ? `${squad.length} players are on the books. The scoring chart fills in as real matches are entered.` : "Add players to this team in the Admin panel to build the squad."}</p>
              </div>
            )}
          </Panel>
          <Panel title="Squad list" description={`${squad.length} registered players`}>
            {squadRows.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {squadRows.map(({ player }) => (
                  <li key={player.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{player.number ?? "—"}</span>
                    <PlayerLink player={player} team={team} showAvatar className="min-w-0 flex-1 text-sm" />
                    <PositionBadge position={player.position} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No players assigned yet.</EmptyState>
            )}
          </Panel>
          <Panel
            title="Transfer log"
            description="Players who joined or left across the recorded season windows"
            action={<Link href="/transfers" className="text-xs font-bold text-orange-300 hover:text-orange-200">Transfer centre ↗</Link>}
          >
            {clubMoves.joined.length || clubMoves.left.length ? (
              <div className="divide-y divide-white/[0.06]">
                {[...clubMoves.joined.map((m) => ({ ...m, direction: "in" as const })), ...clubMoves.left.map((m) => ({ ...m, direction: "out" as const }))]
                  .sort((a, b) => {
                    const order: Record<string, number> = { "S1→S2": 1, "S2→S3": 2, "S3→S4": 3 };
                    return order[b.window] - order[a.window];
                  })
                  .map((m) => {
                    const timeline = transferData.timelines.find((t) => t.timelineId === m.timelineId);
                    if (!timeline) return null;
                    return (
                      <div key={`${m.timelineId}-${m.window}-${m.direction}`} className="flex items-center gap-3 px-5 py-3">
                        <span className={`chip ${m.direction === "in" ? "chip-green" : "chip-red"}`}>
                          {m.direction === "in" ? "IN ➜" : "OUT ➜"}
                        </span>
                        <Link href={`/players/${timeline.playerId}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={timeline.avatarUrl} alt={timeline.username} loading="lazy" className="h-8 w-8 rounded-full border border-white/10 object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-extrabold text-white">{timeline.displayName}</span>
                            <span className="block truncate text-[10px] text-slate-500">
                              {m.from.short} → {m.to.short} · {m.window}
                            </span>
                          </span>
                        </Link>
                        <span className="font-mono text-[11px] font-bold text-amber-200">
                          {formatWage(m.from.wage)} → {formatWage(m.to.wage)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState>No season transfers recorded for this club yet.</EmptyState>
            )}
          </Panel>
          {!results.length ? <div className="panel p-5"><p className="eyebrow mb-2">ON THE RECORD</p><p className="text-sm font-bold text-white">The history is here. The numbers come next.</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Honours above are official. Goals, appearances and match records are shown only after actual results are entered.</p></div> : null}
        </div>
      </div>
    </>
  );
}
