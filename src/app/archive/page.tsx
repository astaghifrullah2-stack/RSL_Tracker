import Image from "next/image";
import Link from "next/link";
import {
  CompetitionIcon,
  CompetitionStatusBadge,
  EmptyState,
  Panel,
  PlayerAvatar,
  TeamCrest,
} from "@/components/ui";
import type { Competition, Team } from "@/db/schema";
import { playerLabel, seasons } from "@/lib/site";
import {
  getLeagueData,
  podiumForCompetition,
  teamsForCompetition,
  winningSquadForCompetition,
  type LeagueData,
} from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Season archive",
  description: "The RSL Season 1–4 archive: Spanish League, Italian League and the current EUROS, with every official winner and runner-up.",
};

export default async function ArchivePage() {
  const data = await getLeagueData();
  const chapterCount = seasons.filter((s) => data.competitions.some((c) => c.season === s.season)).length;
  const titles = data.placements.filter((p) => p.placement === 1).length;

  return (
    <>
      <div className="mb-9 grid items-end gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow mb-3">THE RSL STORY / VOL. 01—04</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Season <span className="text-orange-400">archive.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">From the first Spanish League title to the current EUROS. Every champion, every runner-up, every chapter of RSL — preserved here.</p>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-[#102042]/80 px-5 py-4">
          <div><span className="block text-3xl font-black leading-none text-orange-300">{String(chapterCount).padStart(2, "0")}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Seasons</span></div>
          <span className="h-9 w-px bg-white/10" />
          <div><span className="block text-3xl font-black leading-none text-white">{String(titles).padStart(2, "0")}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Titles</span></div>
          <span className="h-9 w-px bg-white/10" />
          <div><span className="block text-3xl font-black leading-none text-white">{String(data.competitions.length).padStart(2, "0")}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Events</span></div>
        </div>
      </div>

      <nav className="mb-9 flex flex-wrap gap-2" aria-label="Jump to season">
        {[...seasons].reverse().map((s) => (
          <a key={s.number} href={`#season-${s.number}`} className="btn btn-sm border-white/10 hover:border-orange-400/40">
            <span style={{ color: s.accent }} className="font-black">S{s.number}</span> {s.era}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {[...seasons].reverse().map((chapter) => {
          const comps = data.competitions.filter((c) => c.season === chapter.season);
          if (!comps.length) return null;
          const isCurrent = chapter.number === "04";
          const entrants = isCurrent ? comps.flatMap((c) => teamsForCompetition(data, c.id)) : [];
          return (
            <section id={`season-${chapter.number}`} key={chapter.number} className="scroll-mt-32">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#121f42] text-3xl font-black tabular-nums tracking-tighter" style={{ color: chapter.accent }}>S{chapter.number}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[.24em]" style={{ color: chapter.accent }}>RSL {chapter.season} {isCurrent ? "• CURRENT" : "• ARCHIVE"}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">{chapter.era}</h2>
                  <p className="text-xs text-slate-400">{chapter.subtitle} · {comps.length} {comps.length === 1 ? "competition" : "competitions"}</p>
                </div>
                <span className="hidden h-px flex-1 bg-gradient-to-r from-white/15 to-transparent lg:block" />
              </div>

              {isCurrent ? (
                <div className="euros-hero relative overflow-hidden rounded-2xl p-5 sm:p-7">
                  <div className="relative z-10 grid items-center gap-6 md:grid-cols-[1fr_130px]">
                    <div>
                      <p className="eyebrow mb-2">THE NEXT CHAPTER</p>
                      <h3 className="text-3xl font-black text-white">The EUROS <span className="text-orange-400">are here.</span></h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">The international chapter is underway. No champion has been crowned yet; fixtures, squads and match records will be published as they&apos;re entered.</p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {entrants.map((team) => <TeamFlag key={team.id} team={team} />)}
                      </div>
                      <Link href={`/competitions/${comps[0].id}`} className="btn btn-primary mt-5">Enter the EUROS hub ↗</Link>
                    </div>
                    <Image src="/images/rsl-euros-crest.png" alt="EUROS crest" width={260} height={260} className="mx-auto h-32 w-32 rounded-full object-cover shadow-2xl" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {comps.map((c) => <ArchiveCompetitionCard key={c.id} competition={c} data={data} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {data.competitions.length === 0 ? <Panel><EmptyState>The archive is empty. Load the RSL archive from Admin to get started.</EmptyState></Panel> : null}

      <div className="mt-12 border-t border-white/10 pt-5 text-center text-xs text-slate-500">Official podiums are recorded independently of match statistics. Historical match and player stats will appear only when real scores and lineups are added.</div>
    </>
  );
}

function TeamFlag({ team }: { team: Team }) {
  return <Link href={`/teams/${team.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-1.5 pr-3.5 text-xs font-bold text-white transition hover:border-orange-400/50"><TeamCrest team={team} size="sm" />{team.name}</Link>;
}

function ArchiveCompetitionCard({ competition: c, data }: { competition: Competition; data: LeagueData }) {
  const { champion, runnerUp } = podiumForCompetition(data, c.id);
  const winningSquad = winningSquadForCompetition(data, c.id);
  return (
    <div className="panel group overflow-hidden transition hover:border-orange-500/30 hover:bg-[#172247]">
      <div className="archive-accent h-[3px] w-full" />
      <div className="p-5">
        <Link href={`/competitions/${c.id}`} className="flex items-start gap-3">
          <CompetitionIcon competition={c} size="md" />
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{c.type === "league" ? "LEAGUE TITLE" : "CUP COMPETITION"}</p><h3 className="mt-0.5 text-lg font-black text-white transition group-hover:text-orange-200">{c.name}</h3></div>
          <CompetitionStatusBadge status={c.status} />
        </Link>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <PodiumSpot place="01 / CHAMPIONS" team={champion} winner />
          <PodiumSpot place="02 / RUNNERS-UP" team={runnerUp} />
        </div>
        {winningSquad ? (
          <div className="mt-4 border-t border-white/[0.07] pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-300">
              {winningSquad.team.name} · {winningSquad.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {winningSquad.members.map(({ entry, player }) => (
                <Link
                  key={entry.id}
                  href={`/players/${player.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1634] py-0.5 pl-1 pr-2.5 text-[11px] font-semibold text-slate-200 transition hover:border-amber-400/45 hover:text-amber-200"
                >
                  <PlayerAvatar player={player} team={winningSquad.team} size="sm" className="h-5 w-5 rounded-full" />
                  <span>{playerLabel(player)}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 text-right">
          <Link href={`/competitions/${c.id}`} className="text-[11px] font-bold text-orange-300 hover:text-orange-200">
            View competition ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

function PodiumSpot({ place, team, winner = false }: { place: string; team: Team | null; winner?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-3 ${winner ? "border-amber-400/25 bg-amber-400/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}>
      {team ? <TeamCrest team={team} size="md" /> : <span className="text-xl">{winner ? "🏆" : "🥈"}</span>}
      <div className="min-w-0"><p className={`truncate text-[9px] font-black uppercase tracking-wider ${winner ? "text-amber-300" : "text-slate-400"}`}>{place}</p><p className="mt-1 truncate text-xs font-bold text-white sm:text-sm">{team?.name ?? "TBD"}</p></div>
    </div>
  );
}
