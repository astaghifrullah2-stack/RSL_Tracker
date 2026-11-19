import Link from "next/link";
import { EmptyState, FormPips, PageHeader, Panel, TeamCrest } from "@/components/ui";
import type { Team } from "@/db/schema";
import { site } from "@/lib/site";
import { computeTeamRecords, getLeagueData, resultsForTeam, trophyCounts, type LeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const data = await getLeagueData();
  const records = new Map(computeTeamRecords(data).map((r) => [r.teamId, r]));
  const { byTeam } = trophyCounts(data);
  const squadSize = new Map<number, number>();
  for (const p of data.players) if (p.teamId) squadSize.set(p.teamId, (squadSize.get(p.teamId) ?? 0) + 1);
  const nationalTeams = data.teams.filter((t) => t.kind === "nation").sort((a, b) => a.name === "Netherlands" ? -1 : b.name === "Netherlands" ? 1 : a.name.localeCompare(b.name));
  const clubTeams = data.teams.filter((t) => t.kind === "club");

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} / the teams`}
        title={<>Every crest has a <span className="text-orange-400">story.</span></>}
        subtitle="The nations of the Season 4 EUROS and the clubs that shaped the Spanish and Italian chapters."
      />

      {nationalTeams.length ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-orange-400" /><h2 className="text-lg font-black text-white">Season 4 / National teams</h2><span className="text-xs text-slate-500">The EUROS</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {nationalTeams.map((team) => <NationCard key={team.id} team={team} count={squadSize.get(team.id) ?? 0} />)}
          </div>
        </section>
      ) : null}

      {clubTeams.length ? (
        <section>
          <div className="mb-4 flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-blue-400" /><h2 className="text-lg font-black text-white">The club archive</h2><span className="text-xs text-slate-500">Seasons 1—3</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubTeams.map((team) => {
              const r = records.get(team.id);
              const titles = byTeam.get(team.id) ?? 0;
              const finals = resultsForTeam(data, team.id).filter((result) => result.placement === 2).length;
              return (
                <Link key={team.id} href={`/teams/${team.id}`} className="panel group relative overflow-hidden p-5 transition hover:border-orange-400/30 hover:bg-[#182446]">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-15 blur-2xl transition group-hover:opacity-30" style={{ background: team.primaryColor }} />
                  <div className="relative flex items-center gap-3"><TeamCrest team={team} size="lg" /><div className="min-w-0"><h3 className="truncate text-lg font-black text-white transition group-hover:text-orange-200">{team.name}</h3><p className="text-[11px] uppercase tracking-wider text-slate-500">{team.shortName} • Club</p></div><span className="ml-auto self-start text-slate-500 group-hover:text-orange-300">↗</span></div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <MiniStat label="Titles" value={titles} tone="gold" />
                    <MiniStat label="Runner-up" value={finals} />
                    <MiniStat label="Players" value={squadSize.get(team.id) ?? 0} />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs text-slate-400">
                    <span>{r?.played ? `${r.wins}W · ${r.draws}D · ${r.losses}L` : "Match stats pending"}</span><FormPips form={r?.form ?? []} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {!data.teams.length ? <Panel><EmptyState>No teams have been added yet.</EmptyState></Panel> : null}
    </>
  );
}

function NationCard({ team, count }: { team: Team; count: number }) {
  const isDutch = team.shortName === "NED";
  return (
    <Link href={`/teams/${team.id}`} className="group relative flex min-h-44 items-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101d3d] p-6 transition hover:-translate-y-0.5 hover:border-white/25">
      <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(100deg, ${team.primaryColor} 0%, transparent 72%)` }} />
      <span className={`absolute bottom-0 left-0 top-0 w-1 ${isDutch ? "bg-orange-500" : "bg-gradient-to-b from-black via-yellow-400 to-red-500"}`} />
      <div className="relative"><TeamCrest team={team} size="xl" /><span className="pointer-events-none absolute -bottom-4 -right-4 text-6xl font-black text-white/[0.045]">{team.shortName}</span></div>
      <div className="relative min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-300">EUROS / S4</p><h3 className="mt-2 text-2xl font-black text-white group-hover:text-orange-100">{team.name}</h3><p className="mt-1 text-xs text-slate-400">{count ? `${count} registered players` : "Squad to be announced"}</p></div>
      <span className="relative self-start text-lg text-white/50 group-hover:text-white">↗</span>
    </Link>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "gold" }) {
  return <div className="rounded-lg border border-white/[0.06] bg-[#071229]/60 py-2 text-center"><p className={`text-lg font-black ${tone ? "text-amber-300" : "text-white"}`}>{value}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}
