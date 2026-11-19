import Link from "next/link";
import {
  CompetitionIcon,
  CompetitionStatusBadge,
  CompetitionTypeBadge,
  EmptyState,
  PageHeader,
  Panel,
  TeamCrest,
} from "@/components/ui";
import type { Competition } from "@/db/schema";
import { seasons, site } from "@/lib/site";
import { getLeagueData, podiumForCompetition, teamsForCompetition, type LeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Competitions" };

export default async function CompetitionsPage() {
  const data = await getLeagueData();

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} / all chapters`}
        title={<>Competitions<span className="text-orange-400">.</span></>}
        subtitle="Four seasons. Spanish and Italian club football. One new international stage. Explore the competitions that made RSL."
        actions={<Link href="/archive" className="btn btn-primary">Season archive ↗</Link>}
      />

      {data.competitions.length === 0 ? <Panel><EmptyState>No competitions have been created yet.</EmptyState></Panel> : null}

      <div className="space-y-10">
        {[...seasons].reverse().map((chapter) => {
          const entries = data.competitions.filter((c) => c.season === chapter.season);
          if (!entries.length) return null;
          return (
            <section key={chapter.season}>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#152348] text-sm font-black" style={{ color: chapter.accent }}>S{chapter.number}</span>
                <div><p className="text-[10px] font-black uppercase tracking-[.17em]" style={{ color: chapter.accent }}>{chapter.season} {chapter.number === "04" ? "/ CURRENT" : "/ ARCHIVE"}</p><h2 className="text-lg font-black text-white">{chapter.era}</h2></div>
                <Link href={`/archive#season-${chapter.number}`} className="ml-auto hidden text-xs font-bold text-orange-300 hover:text-orange-200 sm:block">View season ↗</Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {entries.map((c) => <CompetitionCard key={c.id} competition={c} data={data} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function CompetitionCard({ competition: c, data }: { competition: Competition; data: LeagueData }) {
  const fixtures = data.matches.filter((m) => m.competitionId === c.id);
  const played = fixtures.filter((m) => m.status === "played");
  const { champion, runnerUp } = podiumForCompetition(data, c.id);
  const participants = teamsForCompetition(data, c.id);
  const isEuros = c.type === "tournament";

  return (
    <Link href={`/competitions/${c.id}`} className="panel group relative block overflow-hidden p-5 transition hover:border-orange-400/35 hover:bg-[#172244]">
      {isEuros ? <span className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 via-blue-600 to-red-500" /> : null}
      <div className="flex items-start gap-4">
        <CompetitionIcon competition={c} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5"><CompetitionTypeBadge type={c.type} /><CompetitionStatusBadge status={c.status} /></div>
          <h3 className="truncate text-xl font-black text-white transition group-hover:text-orange-200">{c.name}</h3>
          <p className="mt-1 text-xs text-slate-400">{c.season} · {isEuros ? "Netherlands × Belgium" : c.type === "league" ? "League championship" : "Cup competition"}</p>
        </div>
        <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-orange-300">↗</span>
      </div>
      {c.description ? <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-400">{c.description}</p> : null}

      {champion || runnerUp ? (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.08] pt-4">
          {champion ? <div className="flex items-center gap-2"><TeamCrest team={champion} size="sm" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Winner</p><p className="text-sm font-bold text-white">{champion.name}</p></div></div> : null}
          {runnerUp ? <div className="flex items-center gap-2"><TeamCrest team={runnerUp} size="sm" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runner-up</p><p className="text-sm font-bold text-white">{runnerUp.name}</p></div></div> : null}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-xs text-slate-400">
          {participants.slice(0, 4).map((t) => <TeamCrest key={t.id} team={t} size="sm" />)}
          <span>{participants.length} national {participants.length === 1 ? "team" : "teams"} registered · {played.length} matches played</span>
        </div>
      )}
    </Link>
  );
}
