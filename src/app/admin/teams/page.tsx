import Link from "next/link";
import { TeamForm } from "@/components/admin/forms";
import { Flash } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel, TeamCrest } from "@/components/ui";
import { getLeagueData, trophyCounts } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminTeams({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const { byTeam } = trophyCounts(data);
  const squadSize = new Map<number, number>();
  for (const p of data.players) if (p.teamId) squadSize.set(p.teamId, (squadSize.get(p.teamId) ?? 0) + 1);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Teams" subtitle="Add and manage the clubs in the league." />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="New team" className="lg:col-span-2">
          <div className="p-5">
            <TeamForm action="createTeam" />
          </div>
        </Panel>

        <Panel title="All teams" description={`${data.teams.length} total`} className="lg:col-span-3">
          {data.teams.length ? (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Manager</th>
                  <th className="text-center">Players</th>
                  <th className="text-center">🏆</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="inline-flex items-center gap-2 font-semibold text-white">
                        <TeamCrest team={t} size="sm" /> {t.name}
                        <span className="text-xs text-zinc-500">{t.shortName}</span>
                      </span>
                    </td>
                    <td className="text-zinc-400">{t.manager ?? "—"}</td>
                    <td className="text-center">{squadSize.get(t.id) ?? 0}</td>
                    <td className="text-center">{byTeam.get(t.id) ?? 0}</td>
                    <td className="text-right">
                      <Link href={`/admin/teams/${t.id}`} className="btn btn-sm">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState>No teams yet — create the first one.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
