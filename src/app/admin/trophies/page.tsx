import { TrophyForm } from "@/components/admin/forms";
import { ConfirmForm, Flash } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel, TeamCrest } from "@/components/ui";
import { competitionLabel, formatDate, playerLabel } from "@/lib/site";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminTrophies({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const list = [...data.trophies].reverse();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Trophies & awards"
        subtitle="Team silverware (league titles, cups) and individual awards (Golden Boot, MVP, Golden Glove…)."
      />
      <Flash ok={ok} error={error} />

      <Panel title="Award a trophy">
        <div className="p-5">
          <TrophyForm teams={data.teams} players={data.players} competitions={data.competitions} action="createTrophy" />
        </div>
      </Panel>

      <Panel className="mt-6" title="All trophies" description={`${list.length} awarded`}>
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Trophy</th>
                  <th>Winner</th>
                  <th>Competition</th>
                  <th>Season</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => {
                  const team = t.teamId ? data.teamById.get(t.teamId) : null;
                  const player = t.playerId ? data.playerById.get(t.playerId) : null;
                  const comp = t.competitionId ? data.competitionById.get(t.competitionId) : null;
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className="mr-2 text-lg">{t.icon}</span>
                        <span className="font-semibold text-white">{t.name}</span>
                        <span className="chip ml-2">{t.kind}</span>
                        {t.notes ? <span className="ml-2 text-xs text-zinc-500">{t.notes}</span> : null}
                      </td>
                      <td>
                        {player ? (
                          <span className="text-zinc-200">{playerLabel(player)}</span>
                        ) : team ? (
                          <span className="inline-flex items-center gap-2 text-zinc-200">
                            <TeamCrest team={team} size="xs" /> {team.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-zinc-400">{comp ? competitionLabel(comp) : "—"}</td>
                      <td className="text-zinc-400">{t.season ?? "—"}</td>
                      <td className="text-zinc-500">{t.awardedAt ? formatDate(t.awardedAt) : "—"}</td>
                      <td className="text-right">
                        <ConfirmForm action="deleteTrophy" hidden={{ id: t.id }} message={`Remove ${t.name}?`}>
                          Remove
                        </ConfirmForm>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No trophies awarded yet.</EmptyState>
        )}
      </Panel>
    </>
  );
}
