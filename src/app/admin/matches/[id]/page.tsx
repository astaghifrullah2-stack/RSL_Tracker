import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, MatchForm, PlayerOptions } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { MatchStatusBadge, PageHeader, Panel, PositionBadge, TeamCrest } from "@/components/ui";
import { POSITIONS, type Player, type Team } from "@/db/schema";
import { competitionLabel, formatDateTime, playerLabel } from "@/lib/site";
import { getLeagueData, type LeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminMatchEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const match = data.matchById.get(Number(id));
  if (!match) notFound();

  const home = data.teamById.get(match.homeTeamId);
  const away = data.teamById.get(match.awayTeamId);
  const goals = data.goalsByMatch.get(match.id) ?? [];
  const apps = data.appsByMatch.get(match.id) ?? [];
  const goalCount = { home: goals.filter((g) => g.teamId === match.homeTeamId).length, away: goals.filter((g) => g.teamId === match.awayTeamId).length };
  const mismatch = goalCount.home !== match.homeScore || goalCount.away !== match.awayScore;

  return (
    <>
      <PageHeader
        eyebrow="Admin · Match"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <TeamCrest team={home} size="md" />
            <span>{home?.shortName}</span>
            <span className="font-mono text-orange-400">
              {match.status === "played" ? `${match.homeScore}–${match.awayScore}` : "vs"}
            </span>
            <span>{away?.shortName}</span>
            <TeamCrest team={away} size="md" />
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <MatchStatusBadge status={match.status} />
            <span>{competitionLabel(data.competitionById.get(match.competitionId))}</span>
            {match.round ? <span>· {match.round}</span> : null}
            <span>· {formatDateTime(match.playedAt)}</span>
          </span>
        }
        actions={
          <>
            <Link href={`/matches/${match.id}`} className="btn">View public page</Link>
            <Link href="/admin/matches" className="btn">← Matches</Link>
          </>
        }
      />
      <Flash ok={ok} error={error} />

      <Panel title="1 · Match details" description="Teams, kick-off, final score, status and man of the match.">
        <div className="p-5">
          <MatchForm match={match} competitions={data.competitions} teams={data.teams} players={data.players} action="updateMatch" />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LineupEditor team={home} match={match} data={data} />
        <LineupEditor team={away} match={match} data={data} />
      </div>

      <Panel
        className="mt-6"
        title="3 · Goals"
        description="Add each goal with scorer, assist and minute. Own goals are credited to the opposing team."
        action={
          mismatch && goals.length ? (
            <AdminForm action="syncScore">
              <input type="hidden" name="matchId" value={match.id} />
              <SubmitButton variant="default" className="btn-sm">
                Set score to {goalCount.home}–{goalCount.away} from goals
              </SubmitButton>
            </AdminForm>
          ) : null
        }
      >
        {goals.length ? (
          <ul className="divide-y divide-white/[0.05]">
            {goals.map((g) => {
              const team = data.teamById.get(g.teamId);
              const scorer = g.scorerId ? data.playerById.get(g.scorerId) : null;
              const assist = g.assistId ? data.playerById.get(g.assistId) : null;
              return (
                <li key={g.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-10 font-mono text-xs font-bold text-orange-400">{g.minute != null ? `${g.minute}'` : "—"}</span>
                  <TeamCrest team={team} size="xs" />
                  <span className="min-w-0 flex-1 text-zinc-200">
                    <span className="font-semibold text-white">{scorer ? playerLabel(scorer) : "Unknown"}</span>
                    {g.isOwnGoal ? <span className="chip chip-red ml-2">OG</span> : null}
                    {g.isPenalty ? <span className="chip ml-2">PEN</span> : null}
                    {assist ? <span className="ml-2 text-xs text-zinc-500">assist {playerLabel(assist)}</span> : null}
                  </span>
                  <ConfirmForm action="deleteGoal" hidden={{ id: g.id, matchId: match.id }} message="Remove this goal?">
                    Remove
                  </ConfirmForm>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-zinc-500">No goals recorded yet.</p>
        )}

        <AdminForm action="addGoal" resetOnSuccess className="grid gap-4 border-t border-white/[0.06] p-5 sm:grid-cols-2 lg:grid-cols-6">
          <input type="hidden" name="matchId" value={match.id} />
          <Field label="Goal for">
            <select name="teamId" required className="input" defaultValue={match.homeTeamId}>
              <option value={match.homeTeamId}>{home?.name} (home)</option>
              <option value={match.awayTeamId}>{away?.name} (away)</option>
            </select>
          </Field>
          <Field label="Scorer" className="lg:col-span-2">
            <select name="scorerId" className="input" defaultValue="">
              <option value="">Unknown</option>
              <PlayerOptions players={data.players} teams={data.teams} onlyTeams={[match.homeTeamId, match.awayTeamId]} />
            </select>
          </Field>
          <Field label="Assist" className="lg:col-span-2">
            <select name="assistId" className="input" defaultValue="">
              <option value="">None</option>
              <PlayerOptions players={data.players} teams={data.teams} onlyTeams={[match.homeTeamId, match.awayTeamId]} />
            </select>
          </Field>
          <Field label="Minute">
            <input name="minute" type="number" min={0} max={130} className="input" placeholder="45" />
          </Field>
          <div className="flex flex-wrap items-center gap-5 sm:col-span-2 lg:col-span-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" name="isPenalty" className="h-4 w-4 accent-orange-500" /> Penalty
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" name="isOwnGoal" className="h-4 w-4 accent-orange-500" /> Own goal
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" name="syncScore" className="h-4 w-4 accent-orange-500" /> Update score from goals
            </label>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 lg:text-right">
            <SubmitButton>+ Add goal</SubmitButton>
          </div>
        </AdminForm>
      </Panel>

      <Panel className="mt-6" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-zinc-400">Deleting the match removes its goals and lineups from every stat.</p>
          <ConfirmForm action="deleteMatch" hidden={{ id: match.id }} message="Delete this match and all of its events?">
            Delete match
          </ConfirmForm>
        </div>
      </Panel>
    </>
  );
}

function LineupEditor({
  team,
  match,
  data,
}: {
  team: Team | undefined;
  match: { id: number; homeTeamId: number; awayTeamId: number };
  data: LeagueData;
}) {
  if (!team) return null;
  const existing = (data.appsByMatch.get(match.id) ?? []).filter((a) => a.teamId === team.id);
  const byPlayer = new Map(existing.map((a) => [a.playerId, a]));
  const squad: Player[] = data.players.filter((p) => p.teamId === team.id);
  // Include players who appeared for this team but have since left
  for (const a of existing) {
    if (!squad.some((p) => p.id === a.playerId)) {
      const p = data.playerById.get(a.playerId);
      if (p) squad.push(p);
    }
  }
  const order = ["GK", "DEF", "MID", "FWD"];
  squad.sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position) || (a.number ?? 99) - (b.number ?? 99));
  const none = existing.length === 0;

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          2 · <TeamCrest team={team} size="xs" /> {team.name} lineup
        </span>
      }
      description={none ? "No lineup saved yet — everyone is pre-ticked, untick anyone who didn't play." : `${existing.length} players recorded`}
    >
      {squad.length ? (
        <AdminForm action="saveLineup">
          <input type="hidden" name="matchId" value={match.id} />
          <input type="hidden" name="teamId" value={team.id} />
          <table className="table-base">
            <thead>
              <tr>
                <th>Played</th>
                <th>Player</th>
                <th>Pos</th>
                <th className="text-center" title="Yellow cards">YC</th>
                <th className="text-center" title="Red card">RC</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => {
                const a = byPlayer.get(p.id);
                return (
                  <tr key={p.id}>
                    <td>
                      <input type="checkbox" name={`played_${p.id}`} defaultChecked={none ? p.isActive : !!a} className="h-4 w-4 accent-orange-500" />
                    </td>
                    <td>
                      <span className="font-semibold text-white">{playerLabel(p)}</span>
                      {p.teamId !== team.id ? <span className="chip ml-2">Former</span> : null}
                      <span className="ml-2"><PositionBadge position={p.position} /></span>
                    </td>
                    <td>
                      <select name={`pos_${p.id}`} defaultValue={a?.position ?? p.position} className="input w-24 py-1 text-xs">
                        {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </td>
                    <td className="text-center">
                      <input name={`yc_${p.id}`} type="number" min={0} max={2} defaultValue={a?.yellowCards ?? 0} className="input w-16 py-1 text-center text-xs" />
                    </td>
                    <td className="text-center">
                      <input type="checkbox" name={`rc_${p.id}`} defaultChecked={a?.redCard ?? false} className="h-4 w-4 accent-red-500" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-white/[0.06] p-4">
            <SubmitButton>Save lineup</SubmitButton>
          </div>
        </AdminForm>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          No players registered for {team.name}.{" "}
          <Link href="/admin/players" className="font-semibold text-orange-400">Add players</Link>
        </p>
      )}
    </Panel>
  );
}
