import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchList } from "@/components/MatchRow";
import { StandingsTable } from "@/components/StandingsTable";
import {
  CompetitionIcon,
  CompetitionStatusBadge,
  CompetitionTypeBadge,
  EmptyState,
  PageHeader,
  Panel,
  PlayerAvatar,
  PlayerLink,
  RankBadge,
  StatCard,
  TeamCrest,
  TeamLink,
} from "@/components/ui";
import { formatDate, playerLabel, seasonInfo } from "@/lib/site";
import {
  computePlayerStats,
  computeStandings,
  getLeagueData,
  podiumForCompetition,
  sortLines,
  teamsForCompetition,
  winningSquadForCompetition,
  type LeagueData,
  type PlayerStatLine,
  type StatKey,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competitionId = Number(id);
  const data = await getLeagueData();
  const comp = data.competitionById.get(competitionId);
  if (!comp) notFound();

  const chapter = seasonInfo(comp.season);
  const participants = teamsForCompetition(data, comp.id);
  const podium = podiumForCompetition(data, comp.id);
  const winningSquad = winningSquadForCompetition(data, comp.id);
  const fixtures = data.matches.filter((m) => m.competitionId === competitionId);
  const played = fixtures.filter((m) => m.status === "played").reverse();
  const upcoming = fixtures.filter((m) => m.status !== "played");
  const goalsTotal = played.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
  const standings = participants.length ? computeStandings(data, competitionId) : [];
  const lines = computePlayerStats(data, { competitionId });
  const scorers = sortLines(lines, "goals", data).filter((l) => l.goals > 0).slice(0, 8);
  const assists = sortLines(lines, "assists", data).filter((l) => l.assists > 0).slice(0, 8);
  const keepers = sortLines(lines, "cleanSheets", data).filter((l) => l.cleanSheets > 0).slice(0, 5);
  const motm = sortLines(lines, "motm", data).filter((l) => l.motm > 0).slice(0, 5);
  const individualAwards = data.trophies.filter((t) => t.competitionId === competitionId && t.kind === "individual");

  return (
    <>
      <PageHeader
        eyebrow={`${comp.season ?? "RSL"} / ${chapter?.era ?? "Competition"}`}
        title={<span className="flex items-center gap-4"><CompetitionIcon competition={comp} size="lg" /><span>{comp.name}<span className="text-orange-400">.</span></span></span>}
        subtitle={<span className="flex flex-wrap items-center gap-2"><CompetitionTypeBadge type={comp.type} /><CompetitionStatusBadge status={comp.status} />{comp.season ? <span className="chip">{comp.season}</span> : null}{comp.startDate ? <span className="text-slate-400">{formatDate(comp.startDate)}{comp.endDate ? ` – ${formatDate(comp.endDate)}` : ""}</span> : null}</span>}
        actions={<><Link href="/competitions" className="btn">← Competitions</Link><Link href="/archive" className="btn btn-primary">The archive ↗</Link></>}
      />
      {comp.description ? <p className="-mt-4 mb-7 max-w-3xl text-sm leading-relaxed text-slate-400">{comp.description}</p> : null}

      {podium.champion || podium.runnerUp ? (
        <section className="mb-7 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PodiumCard team={podium.champion} label="01 / CHAMPIONS" sub="Official winner" winner />
            <PodiumCard team={podium.runnerUp} label="02 / RUNNERS-UP" sub="Official runner-up" />
          </div>
          {winningSquad ? (
            <div className="panel border-amber-400/25 bg-amber-400/[0.03] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">
                  🏆 {winningSquad.team.name} · {winningSquad.label} ({winningSquad.members.length})
                </p>
                <Link href={`/teams/${winningSquad.team.id}`} className="text-xs font-bold text-orange-300 hover:text-orange-200">
                  View club profile ↗
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {winningSquad.members.map(({ entry, player }) => (
                  <Link
                    key={entry.id}
                    href={`/players/${player.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0c1836] py-1 pl-1.5 pr-3 text-xs font-bold text-white transition hover:border-amber-400/50 hover:text-amber-200"
                  >
                    <PlayerAvatar player={player} team={winningSquad.team} size="sm" />
                    <span>{playerLabel(player)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="euros-hero mb-7 overflow-hidden rounded-2xl p-6 sm:p-7">
          <p className="eyebrow mb-2">S4 / THE INTERNATIONAL CHAPTER</p>
          <h2 className="text-2xl font-black text-white sm:text-3xl">The road to the title starts here<span className="text-orange-400">.</span></h2>
          <p className="mt-2 max-w-lg text-sm text-slate-300">No champion has been crowned. Follow the national teams and the results as the tournament progresses.</p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={comp.status === "completed" ? "Teams on record" : "Registered teams"} value={participants.length} />
        <StatCard label="Matches logged" value={played.length} hint={fixtures.length ? `${fixtures.length} total fixtures` : "Fixtures to be added"} />
        <StatCard label="Goals recorded" value={goalsTotal} accent />
        <StatCard label="Top scorer" value={scorers[0] ? playerLabel(data.playerById.get(scorers[0].playerId)) : "—"} hint={scorers[0] ? `${scorers[0].goals} goals` : "Awaiting match stats"} />
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {standings.length ? (
            <Panel title="TABLE" description="Every team starts at zero. Rows update automatically once real match results are entered.">
              <StandingsTable standings={standings} data={data} />
            </Panel>
          ) : null}

          {played.length ? <Panel title="Results" description="Match reports, scorers and assists"><MatchList matches={played} data={data} showCompetition={false} showScorers /></Panel> : null}
          {upcoming.length ? <Panel title="Upcoming fixtures"><MatchList matches={upcoming} data={data} showCompetition={false} /></Panel> : null}

          {!fixtures.length ? (
            <Panel title="Match archive">
              <div className="px-5 py-10 text-center"><span className="text-3xl">⚽</span><h3 className="mt-3 text-sm font-extrabold text-white">{comp.status === "completed" ? "The honours are on the record" : "Matchdays coming soon"}</h3><p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">{comp.status === "completed" ? "The official winner and runner-up are confirmed above. Match-by-match scores, scorers and player stats have not been provided yet and will only appear when recorded." : "Fixtures and results will appear here when they are entered in the tracker."}</p></div>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title={comp.type === "tournament" ? "National teams" : "Clubs on record"} description={`${participants.length} registered`}>
            {participants.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {participants.map((team) => (
                  <li key={team.id} className="flex items-center gap-3 px-5 py-3">
                    <TeamCrest team={team} size="md" />
                    <div className="min-w-0 flex-1"><TeamLink team={team} size="xs" bold className="text-sm" /><p className="text-[11px] text-slate-500">{team.kind === "nation" ? "National team" : "Club"}</p></div>
                    {podium.champion?.id === team.id ? <span className="chip chip-amber">🥇</span> : podium.runnerUp?.id === team.id ? <span className="chip">🥈</span> : null}
                  </li>
                ))}
              </ul>
            ) : <EmptyState>No entrants registered yet.</EmptyState>}
          </Panel>

          {scorers.length ? <Board title="Top scorers" lines={scorers} statKey="goals" data={data} /> : null}
          {assists.length ? <Board title="Assists" lines={assists} statKey="assists" data={data} /> : null}
          {keepers.length ? <Board title="Clean sheets" lines={keepers} statKey="cleanSheets" data={data} /> : null}
          {motm.length ? <Board title="Player of the match" lines={motm} statKey="motm" data={data} /> : null}

          {individualAwards.length ? (
            <Panel title="Individual honours"><ul className="divide-y divide-white/[0.06]">{individualAwards.map((award) => { const player = award.playerId ? data.playerById.get(award.playerId) : null; return <li key={award.id} className="flex items-center gap-3 px-5 py-3"><span className="text-2xl">{award.icon}</span><div><p className="text-sm font-bold text-white">{award.name}</p><PlayerLink player={player} /></div></li>; })}</ul></Panel>
          ) : null}
          {played.length ? <Link href={`/stats?comp=${comp.id}`} className="btn w-full">Full player statistics ↗</Link> : null}
        </div>
      </div>
    </>
  );
}

function PodiumCard({ team, label, sub, winner = false }: { team: ReturnType<typeof podiumForCompetition>["champion"]; label: string; sub: string; winner?: boolean }) {
  return (
    <div className={`panel flex items-center gap-4 p-5 sm:p-6 ${winner ? "border-amber-400/30 bg-amber-400/[0.04]" : ""}`}>
      <div className="relative"><TeamCrest team={team} size="xl" />{winner ? <span className="absolute -bottom-3 -right-2 text-xl">🏆</span> : null}</div>
      <div className="min-w-0"><p className={`text-[11px] font-black uppercase tracking-[.18em] ${winner ? "text-amber-300" : "text-slate-400"}`}>{label}</p><p className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{team?.name ?? "TBD"}</p><p className="text-xs text-slate-400">{sub}</p></div>
    </div>
  );
}

function Board({ title, lines, statKey, data }: { title: string; lines: PlayerStatLine[]; statKey: StatKey; data: LeagueData }) {
  return <Panel title={title}><ul className="divide-y divide-white/[0.05]">{lines.map((l, i) => { const p = data.playerById.get(l.playerId); const t = p?.teamId ? data.teamById.get(p.teamId) : null; return <li key={l.playerId} className="flex items-center gap-3 px-5 py-2.5"><RankBadge rank={i + 1} /><div className="min-w-0 flex-1"><PlayerLink player={p} team={t} className="text-sm" /></div><span className="text-base font-black tabular-nums text-orange-400">{l[statKey]}</span></li>; })}</ul></Panel>;
}
