import Link from "next/link";
import { notFound } from "next/navigation";
import { CompetitionForm } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { StandingsTable } from "@/components/StandingsTable";
import { CompetitionIcon, PageHeader, Panel, TeamCrest } from "@/components/ui";
import { competitionLabel, formatDateTime } from "@/lib/site";
import { computeStandings, getLeagueData, podiumForCompetition, teamsForCompetition } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const comp = data.competitionById.get(Number(id));
  if (!comp) notFound();
  const fixtures = data.matches.filter((m) => m.competitionId === comp.id).reverse();
  const played = fixtures.filter((m) => m.status === "played");
  const podium = podiumForCompetition(data, comp.id);
  const entrants = teamsForCompetition(data, comp.id);
  const registered = new Set((data.entrantsByCompetition.get(comp.id) ?? []).map((e) => e.teamId));
  const available = data.teams.filter((t) => !registered.has(t.id));

  return (
    <>
      <PageHeader
        eyebrow="Admin / Competition"
        title={<span className="flex items-center gap-3"><CompetitionIcon competition={comp} />{competitionLabel(comp)}</span>}
        subtitle={`${entrants.length} teams · ${played.length} matches played`}
        actions={
          <>
            <Link href={`/competitions/${comp.id}`} className="btn">Public page</Link>
            <Link href={`/admin/matches?comp=${comp.id}`} className="btn btn-primary">+ Add match</Link>
            <Link href="/admin/competitions" className="btn">← All competitions</Link>
          </>
        }
      />
      <Flash ok={ok} error={error} />

      <Panel title="Competition details">
        <div className="p-5"><CompetitionForm competition={comp} action="updateCompetition" /></div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Tournament entrants" description="Registered teams appear even before any fixtures are entered.">
          {entrants.length ? (
            <ul className="divide-y divide-white/[0.06]">
              {entrants.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <TeamCrest team={t} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{t.name}</span>
                  {podium.champion?.id === t.id ? <span className="chip chip-amber">Champion</span> : null}
                  {podium.runnerUp?.id === t.id ? <span className="chip">Runner-up</span> : null}
                  {registered.has(t.id) ? (
                    <ConfirmForm
                      action="removeCompetitionEntrant"
                      hidden={{ competitionId: comp.id, teamId: t.id }}
                      message={`Remove ${t.name} from entrants? This won't erase their recorded podium result or fixtures.`}
                    >Remove</ConfirmForm>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-6 text-sm text-zinc-500">No entrants yet. Add a national team below.</p>}
          <AdminForm action="addCompetitionEntrant" resetOnSuccess className="flex flex-wrap gap-2 border-t border-white/[0.06] p-5">
            <input type="hidden" name="competitionId" value={comp.id} />
            <select name="teamId" defaultValue="" className="input min-w-44 flex-1" required>
              <option value="">Select a team...</option>
              <optgroup label="National teams">
                {available.filter((t) => t.kind === "nation").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
              <optgroup label="Clubs">
                {available.filter((t) => t.kind === "club").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
            </select>
            <SubmitButton>Add entrant</SubmitButton>
          </AdminForm>
        </Panel>

        <Panel title="Official podium" description="Store the confirmed winner and runner-up even when historical scores aren't available.">
          <AdminForm action="setCompetitionPodium" className="space-y-4 p-5">
            <input type="hidden" name="competitionId" value={comp.id} />
            <label className="block">
              <span className="label">🥇 Winner</span>
              <select className="input" name="championId" defaultValue={podium.champion?.id ?? ""}>
                <option value="">Not decided</option>
                {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">🥈 Runner-up</span>
              <select className="input" name="runnerUpId" defaultValue={podium.runnerUp?.id ?? ""}>
                <option value="">Not decided</option>
                {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <p className="text-xs text-zinc-500">The winner&apos;s trophy is updated automatically. These results are separate from match-derived statistics.</p>
            <SubmitButton>Save podium</SubmitButton>
          </AdminForm>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="TABLE">
          {played.length ? <StandingsTable standings={computeStandings(data, comp.id)} data={data} compact /> : (
            <p className="px-5 py-8 text-sm text-zinc-500">No match results entered. The official podium above still appears on the public archive.</p>
          )}
        </Panel>
        <Panel title="Fixtures" description="Open a match to edit the score, lineups and goals.">
          {fixtures.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {fixtures.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/matches/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm transition hover:bg-white/[0.03]">
                    <span className="text-zinc-300">
                      {data.teamById.get(m.homeTeamId)?.shortName}{" "}
                      <span className="font-mono font-bold text-white">
                        {m.status === "played" ? `${m.homeScore}–${m.awayScore}` : "vs"}
                      </span>{" "}
                      {data.teamById.get(m.awayTeamId)?.shortName}
                    </span>
                    <span className="text-xs text-zinc-500">{m.round ? `${m.round} · ` : ""}{formatDateTime(m.playedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-8 text-sm text-zinc-500">Fixtures not yet recorded.</p>}
        </Panel>
      </div>

      <Panel className="mt-6" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-zinc-400">Deleting this competition removes its podium, entrants, fixtures and trophies.</p>
          <ConfirmForm action="deleteCompetition" hidden={{ id: comp.id }} message={`Delete ${competitionLabel(comp)} and all its results?`}>
            Delete competition
          </ConfirmForm>
        </div>
      </Panel>
    </>
  );
}
