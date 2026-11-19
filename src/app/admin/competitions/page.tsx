import Link from "next/link";
import { CompetitionForm } from "@/components/admin/forms";
import { Flash } from "@/components/admin/ui";
import {
  CompetitionStatusBadge,
  CompetitionTypeBadge,
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/ui";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminCompetitions({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const list = [...data.competitions].reverse();

  return (
    <>
      <PageHeader eyebrow="Admin" title="Competitions" subtitle="League seasons, cups and friendlies." />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="New competition" className="lg:col-span-2">
          <div className="p-5">
            <CompetitionForm action="createCompetition" />
          </div>
        </Panel>

        <Panel title="All competitions" description={`${list.length} total`} className="lg:col-span-3">
          {list.length ? (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Competition</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-center">Matches</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const ms = data.matches.filter((m) => m.competitionId === c.id);
                  const played = ms.filter((m) => m.status === "played").length;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="font-semibold text-white">{c.name}</span>
                        {c.season ? <span className="ml-2 text-xs text-zinc-500">{c.season}</span> : null}
                      </td>
                      <td><CompetitionTypeBadge type={c.type} /></td>
                      <td><CompetitionStatusBadge status={c.status} /></td>
                      <td className="text-center text-zinc-400">{played}/{ms.length}</td>
                      <td className="text-right">
                        <Link href={`/admin/competitions/${c.id}`} className="btn btn-sm">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState>No competitions yet.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
