import Link from "next/link";
import { MatchForm } from "@/components/admin/forms";
import { Flash } from "@/components/admin/ui";
import { UrlSelect } from "@/components/UrlSelect";
import { EmptyState, MatchStatusBadge, PageHeader, Panel, TeamCrest } from "@/components/ui";
import { competitionLabel, formatDateTime } from "@/lib/site";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminMatches({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; comp?: string }>;
}) {
  const { ok, error, comp } = await searchParams;
  const data = await getLeagueData();
  const competitionId = comp ? Number(comp) : undefined;
  const list = [...data.matches]
    .reverse()
    .filter((m) => !competitionId || m.competitionId === competitionId);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Matches"
        subtitle="Create fixtures, then open a match to enter lineups, goals and the man of the match."
      />
      <Flash ok={ok} error={error} />

      {data.teams.length < 2 || data.competitions.length === 0 ? (
        <Panel className="mb-6">
          <EmptyState>
            You need at least two teams and one competition before creating a match.{" "}
            <Link href="/admin/teams" className="font-semibold text-orange-400">Add teams</Link> ·{" "}
            <Link href="/admin/competitions" className="font-semibold text-orange-400">Add a competition</Link>
          </EmptyState>
        </Panel>
      ) : (
        <Panel title="New match" className="mb-6">
          <div className="p-5">
            <MatchForm
              competitions={data.competitions}
              teams={data.teams}
              players={data.players}
              action="createMatch"
            />
          </div>
        </Panel>
      )}

      <Panel
        title="All matches"
        description={`${list.length} shown`}
        action={
          <div className="w-56">
            <UrlSelect
              param="comp"
              allLabel="All competitions"
              className="input py-1.5 text-xs"
              options={[...data.competitions].reverse().map((c) => ({ value: String(c.id), label: competitionLabel(c) }))}
            />
          </div>
        }
      >
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Competition</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th className="text-center">Sheet</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((m) => {
                  const home = data.teamById.get(m.homeTeamId);
                  const away = data.teamById.get(m.awayTeamId);
                  const apps = data.appsByMatch.get(m.id)?.length ?? 0;
                  const gs = data.goalsByMatch.get(m.id)?.length ?? 0;
                  const scoreMismatch = m.status === "played" && gs !== m.homeScore + m.awayScore;
                  return (
                    <tr key={m.id}>
                      <td className="text-xs text-zinc-400">{formatDateTime(m.playedAt)}</td>
                      <td className="text-xs text-zinc-400">
                        {competitionLabel(data.competitionById.get(m.competitionId))}
                        {m.round ? <span className="block text-zinc-600">{m.round}</span> : null}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 text-sm">
                          <TeamCrest team={home} size="xs" />
                          <span className="font-semibold text-white">{home?.shortName}</span>
                          <span className="font-mono font-bold text-white">
                            {m.status === "played" ? `${m.homeScore}–${m.awayScore}` : "vs"}
                          </span>
                          <span className="font-semibold text-white">{away?.shortName}</span>
                          <TeamCrest team={away} size="xs" />
                        </span>
                      </td>
                      <td><MatchStatusBadge status={m.status} /></td>
                      <td className="text-center text-xs text-zinc-400">
                        {apps} players · {gs} goals
                        {scoreMismatch ? <span className="chip chip-amber ml-2">score ≠ goals</span> : null}
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/matches/${m.id}`} className="btn btn-sm">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No matches yet.</EmptyState>
        )}
      </Panel>
    </>
  );
}
