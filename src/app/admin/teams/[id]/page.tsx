import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, PlayerOptions, TeamForm } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { PageHeader, Panel, PlayerAvatar, TeamCrest } from "@/components/ui";
import { playerLabel, seasons } from "@/lib/site";
import { getLeagueData, seasonRostersForTeam } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminTeamEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const team = data.teamById.get(Number(id));
  if (!team) notFound();
  const squad = data.players.filter((p) => p.teamId === team.id);
  const seasonRosters = seasonRostersForTeam(data, team.id);
  const fixtures = data.matches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id).length;

  return (
    <>
      <PageHeader
        eyebrow="Admin · Team"
        title={
          <span className="flex items-center gap-3">
            <TeamCrest team={team} size="lg" /> {team.name}
          </span>
        }
        subtitle={`${squad.length} players · ${fixtures} fixtures`}
        actions={
          <>
            <Link href={`/teams/${team.id}`} className="btn">View public page</Link>
            <Link href="/admin/teams" className="btn">← Teams</Link>
          </>
        }
      />
      <Flash ok={ok} error={error} />

      <Panel title="Edit team">
        <div className="p-5">
          <TeamForm team={team} action="updateTeam" />
        </div>
      </Panel>

      <Panel
        className="mt-6"
        title="Season squads & winners"
        description="Record historic championship squads (e.g. Season 1 Winners) so they stay preserved on the club page, archive, and player profiles."
      >
        {seasonRosters.length ? (
          <div className="divide-y divide-white/[0.06]">
            {seasonRosters.map((roster) => (
              <div key={roster.season} className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-white">
                    {roster.label} <span className="text-xs font-normal text-slate-400">({roster.season} · {roster.members.length} players)</span>
                  </p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {roster.members.map(({ entry, player }) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1634] px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <PlayerAvatar player={player} team={team} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-white">{playerLabel(player)}</span>
                          {entry.discordHandle ? (
                            <span className="block truncate text-[10px] text-slate-400">{entry.discordHandle}</span>
                          ) : null}
                        </span>
                      </span>
                      <ConfirmForm
                        action="removeSeasonRosterPlayer"
                        hidden={{ id: entry.id, teamId: team.id }}
                        message={`Remove ${playerLabel(player)} from ${team.name} (${roster.label})?`}
                      >
                        Remove
                      </ConfirmForm>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-slate-400">No historical season squads recorded for this team yet.</p>
        )}

        <AdminForm
          action="addSeasonRosterPlayer"
          resetOnSuccess
          className="grid gap-4 border-t border-white/[0.06] p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input type="hidden" name="teamId" value={team.id} />
          <Field label="Player">
            <select name="playerId" required defaultValue="" className="input">
              <option value="">Select player…</option>
              <PlayerOptions players={data.players} teams={data.teams} />
            </select>
          </Field>
          <Field label="Season">
            <select name="season" defaultValue="Season 1" className="input">
              {seasons.map((s) => (
                <option key={s.season} value={s.season}>{s.season} · {s.era}</option>
              ))}
            </select>
          </Field>
          <Field label="Squad title">
            <input name="label" defaultValue="Season 1 Winners" className="input" placeholder="Season 1 Winners" />
          </Field>
          <Field label="Discord handle (optional)">
            <input name="discordHandle" className="input" placeholder="e.g. zvlatan" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton>+ Add to season squad</SubmitButton>
          </div>
        </AdminForm>
      </Panel>

      <Panel className="mt-6" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-zinc-400">
            Deleting this team also deletes its matches, goals and trophies. Players become free agents.
          </p>
          <ConfirmForm
            action="deleteTeam"
            hidden={{ id: team.id }}
            message={`Delete ${team.name} and all of its matches? This cannot be undone.`}
          >
            Delete team
          </ConfirmForm>
        </div>
      </Panel>
    </>
  );
}
