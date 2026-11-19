import { MatchList } from "@/components/MatchRow";
import { UrlSelect } from "@/components/UrlSelect";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { competitionLabel, formatDate, site } from "@/lib/site";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string; team?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const data = await getLeagueData();
  const competitionId = sp.comp ? Number(sp.comp) : undefined;
  const teamId = sp.team ? Number(sp.team) : undefined;
  const status = sp.status || undefined;

  const filtered = data.matches.filter((m) => {
    if (competitionId && m.competitionId !== competitionId) return false;
    if (teamId && m.homeTeamId !== teamId && m.awayTeamId !== teamId) return false;
    if (status && m.status !== status) return false;
    return true;
  });

  const upcoming = filtered.filter((m) => m.status !== "played");
  const results = filtered.filter((m) => m.status === "played").reverse();

  // Group results by day
  const days = new Map<string, typeof results>();
  for (const m of results) {
    const key = formatDate(m.playedAt);
    days.set(key, [...(days.get(key) ?? []), m]);
  }

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} database`}
        title="Matches"
        subtitle="Fixtures and results across every competition."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <UrlSelect
          param="comp"
          allLabel="All competitions"
          options={[...data.competitions].reverse().map((c) => ({ value: String(c.id), label: competitionLabel(c) }))}
        />
        <UrlSelect
          param="team"
          allLabel="All teams"
          options={data.teams.map((t) => ({ value: String(t.id), label: t.name }))}
        />
        <UrlSelect
          param="status"
          allLabel="Results & fixtures"
          options={[
            { value: "played", label: "Results only" },
            { value: "scheduled", label: "Fixtures only" },
            { value: "postponed", label: "Postponed" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState>No matches match this selection.</EmptyState>
        </Panel>
      ) : (
        <div className="space-y-6">
          {upcoming.length && status !== "played" ? (
            <Panel title="Upcoming & other fixtures" description={`${upcoming.length} scheduled`}>
              <MatchList matches={upcoming} data={data} highlightTeamId={teamId} />
            </Panel>
          ) : null}

          {[...days.entries()].map(([day, ms]) => (
            <Panel key={day} title={day} description={`${ms.length} ${ms.length === 1 ? "match" : "matches"}`}>
              <MatchList matches={ms} data={data} showScorers highlightTeamId={teamId} />
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
