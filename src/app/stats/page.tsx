import Link from "next/link";
import { UrlSelect } from "@/components/UrlSelect";
import {
  EmptyState,
  PageHeader,
  Panel,
  PlayerLink,
  PositionBadge,
  RankBadge,
  TeamLink,
} from "@/components/ui";
import { cn, competitionLabel, ratio, site } from "@/lib/site";
import {
  STAT_COLUMNS,
  computePlayerStats,
  getLeagueData,
  seasons,
  sortLines,
  type StatKey,
} from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Player statistics" };

const SORTABLE = new Set<string>(STAT_COLUMNS.map((c) => c.key));

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string; season?: string; team?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const data = await getLeagueData();

  const competitionId = sp.comp ? Number(sp.comp) : undefined;
  const teamId = sp.team ? Number(sp.team) : undefined;
  const season = sp.season || undefined;
  const sort: StatKey = sp.sort && SORTABLE.has(sp.sort) ? (sp.sort as StatKey) : "goals";
  const dir = sp.dir === "asc" ? "asc" : "desc";

  const lines = sortLines(
    computePlayerStats(data, { competitionId, teamId, season }),
    sort,
    data,
    dir,
  );

  const scopeLabel = [
    competitionId ? competitionLabel(data.competitionById.get(competitionId)) : null,
    season && !competitionId ? season : null,
    teamId ? data.teamById.get(teamId)?.name : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const headerLink = (key: StatKey) => {
    const params = new URLSearchParams();
    if (sp.comp) params.set("comp", sp.comp);
    if (sp.season) params.set("season", sp.season);
    if (sp.team) params.set("team", sp.team);
    params.set("sort", key);
    if (sort === key && dir === "desc") params.set("dir", "asc");
    return `/stats?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} database`}
        title="Player statistics"
        subtitle="Full statistical breakdown for every player. Filter by competition, season or team and click a column to sort."
        actions={<Link href="/sheets" className="btn">Playersheet archives ↗</Link>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <UrlSelect
          param="comp"
          allLabel="All competitions"
          clears={["season"]}
          options={[...data.competitions].reverse().map((c) => ({
            value: String(c.id),
            label: competitionLabel(c),
          }))}
        />
        <UrlSelect
          param="season"
          allLabel="All seasons"
          clears={["comp"]}
          options={seasons(data).map((s) => ({ value: s, label: s }))}
        />
        <UrlSelect
          param="team"
          allLabel="All teams"
          options={data.teams.map((t) => ({ value: String(t.id), label: t.name }))}
        />
      </div>

      <Panel
        title={scopeLabel || "All-time"}
        description={`${lines.length} players · sorted by ${STAT_COLUMNS.find((c) => c.key === sort)?.title.toLowerCase()}`}
      >
        {lines.length === 0 ? (
          <EmptyState>No statistics recorded for this selection yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  {STAT_COLUMNS.map((c) => (
                    <th key={c.key} className="text-center" title={c.title}>
                      <Link
                        href={headerLink(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-white",
                          sort === c.key && "text-orange-400",
                        )}
                      >
                        {c.label}
                        {sort === c.key ? <span>{dir === "desc" ? "↓" : "↑"}</span> : null}
                      </Link>
                    </th>
                  ))}
                  <th className="text-center" title="Goals + assists per game">G+A/G</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const p = data.playerById.get(l.playerId);
                  const t = p?.teamId ? data.teamById.get(p.teamId) : null;
                  return (
                    <tr key={l.playerId}>
                      <td className="text-center"><RankBadge rank={i + 1} /></td>
                      <td><PlayerLink player={p} team={t} showAvatar /></td>
                      <td>{t ? <TeamLink team={t} size="xs" className="text-sm" /> : <span className="text-zinc-500">—</span>}</td>
                      <td>{p ? <PositionBadge position={p.position} /> : null}</td>
                      {STAT_COLUMNS.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "text-center tabular-nums",
                            sort === c.key ? "font-bold text-white" : "text-zinc-300",
                          )}
                        >
                          {l[c.key]}
                        </td>
                      ))}
                      <td className="text-center tabular-nums text-zinc-400">
                        {ratio(l.goals + l.assists, l.apps)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
