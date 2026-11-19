import Link from "next/link";
import { PlayerForm } from "@/components/admin/forms";
import { AdminForm, Flash, SubmitButton } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel, PositionBadge, TeamCrest } from "@/components/ui";
import { playerLabel } from "@/lib/site";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminPlayers({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const sorted = [...data.players].sort((a, b) => {
    const ta = a.teamId ? data.teamById.get(a.teamId)?.name ?? "zzz" : "zzz";
    const tb = b.teamId ? data.teamById.get(b.teamId)?.name ?? "zzz" : "zzz";
    return ta.localeCompare(tb) || (a.number ?? 99) - (b.number ?? 99) || a.name.localeCompare(b.name);
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Players" subtitle="Register players and assign them to teams." />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="New player" className="lg:col-span-2">
          <div className="p-5">
            <PlayerForm teams={data.teams} action="createPlayer" />
          </div>
        </Panel>

        <Panel
          title="All players"
          description={`${data.players.length} total`}
          className="lg:col-span-3"
          action={
            <AdminForm action="syncAllRobloxAvatars">
              <SubmitButton variant="default" className="btn-sm">Sync Roblox avatars</SubmitButton>
            </AdminForm>
          }
        >
          {sorted.length ? (
            <div className="max-h-[70vh] overflow-auto">
              <table className="table-base">
                <thead className="sticky top-0 bg-[#0b1530]">
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Pos</th>
                    <th className="text-center">#</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => {
                    const t = p.teamId ? data.teamById.get(p.teamId) : null;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="font-semibold text-white">{playerLabel(p)}</span>
                          {p.displayName ? <span className="ml-2 text-xs text-zinc-500">@{p.name}</span> : null}
                          {!p.isActive ? <span className="chip ml-2">Inactive</span> : null}
                        </td>
                        <td>
                          {t ? (
                            <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
                              <TeamCrest team={t} size="xs" /> {t.name}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Free agent</span>
                          )}
                        </td>
                        <td><PositionBadge position={p.position} /></td>
                        <td className="text-center text-zinc-400">{p.number ?? "—"}</td>
                        <td className="text-right">
                          <Link href={`/admin/players/${p.id}`} className="btn btn-sm">Edit</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No players yet.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
