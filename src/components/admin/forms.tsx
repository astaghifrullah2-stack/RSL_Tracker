import type { ReactNode } from "react";
import { AdminForm, SubmitButton } from "@/components/admin/ui";
import type { AdminActionName } from "@/lib/admin-action-names";
import {
  COMPETITION_STATUSES,
  COMPETITION_TYPES,
  MATCH_STATUSES,
  POSITIONS,
  type Competition,
  type Match,
  type Player,
  type Team,
} from "@/db/schema";
import {
  competitionLabel,
  competitionStatusLabels,
  competitionTypeLabels,
  playerLabel,
  positionNames,
  toDateTimeLocal,
} from "@/lib/site";

type Action = AdminActionName;

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function PlayerOptions({
  players,
  teams,
  onlyTeams,
}: {
  players: Player[];
  teams: Team[];
  onlyTeams?: number[];
}) {
  const groups = teams.filter((t) => !onlyTeams || onlyTeams.includes(t.id));
  const free = players.filter((p) => !p.teamId);
  return (
    <>
      {groups.map((t) => {
        const list = players.filter((p) => p.teamId === t.id);
        if (!list.length) return null;
        return (
          <optgroup key={t.id} label={t.name}>
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {playerLabel(p)}
                {p.displayName ? ` (@${p.name})` : ""} · {p.position}
              </option>
            ))}
          </optgroup>
        );
      })}
      {!onlyTeams && free.length ? (
        <optgroup label="Free agents">
          {free.map((p) => (
            <option key={p.id} value={p.id}>
              {playerLabel(p)} · {p.position}
            </option>
          ))}
        </optgroup>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
export function TeamForm({ team, action }: { team?: Team; action: Action }) {
  return (
    <AdminForm action={action} resetOnSuccess={!team} className="grid gap-4 sm:grid-cols-2">
      {team ? <input type="hidden" name="id" value={team.id} /> : null}
      <Field label="Team name" className="sm:col-span-2">
        <input name="name" required defaultValue={team?.name ?? ""} className="input" placeholder="e.g. Netherlands" />
      </Field>
      <Field label="Abbreviation" hint="2–6 letters, shown when no badge is set">
        <input name="shortName" required maxLength={6} defaultValue={team?.shortName ?? ""} className="input uppercase" placeholder="NED" />
      </Field>
      <Field label="Type">
        <select name="kind" defaultValue={team?.kind ?? "club"} className="input">
          <option value="club">Club</option>
          <option value="nation">National team</option>
        </select>
      </Field>
      <Field label="Badge image" hint="Local image path (e.g. /images/teams/netherlands.png) or HTTPS URL" className="sm:col-span-2">
        <input name="badgeUrl" defaultValue={team?.badgeUrl ?? ""} className="input" placeholder="/images/teams/your-team.png" />
      </Field>
      <Field label="Manager / captain">
        <input name="manager" defaultValue={team?.manager ?? ""} className="input" placeholder="Roblox username" />
      </Field>
      <Field label="Primary colour">
        <input name="primaryColor" type="color" defaultValue={team?.primaryColor ?? "#ff7518"} className="input h-10 cursor-pointer p-1" />
      </Field>
      <Field label="Secondary colour">
        <input name="secondaryColor" type="color" defaultValue={team?.secondaryColor ?? "#10245c"} className="input h-10 cursor-pointer p-1" />
      </Field>
      <Field label="Founded">
        <input name="founded" defaultValue={team?.founded ?? ""} className="input" placeholder="2025" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea name="description" rows={3} defaultValue={team?.description ?? ""} className="input" placeholder="A short bio for the team page" />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton>{team ? "Save team" : "Create team"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
export function PlayerForm({ player, teams, action }: { player?: Player; teams: Team[]; action: Action }) {
  return (
    <AdminForm action={action} resetOnSuccess={!player} className="grid gap-4 sm:grid-cols-2">
      {player ? <input type="hidden" name="id" value={player.id} /> : null}
      <Field label="Roblox username">
        <input name="name" required defaultValue={player?.name ?? ""} className="input" placeholder="e.g. Zvlatan" />
      </Field>
      <Field label="Display name" hint="Optional nickname shown instead of the username">
        <input name="displayName" defaultValue={player?.displayName ?? ""} className="input" placeholder="Zvlatan" />
      </Field>
      <Field label="Current team" hint="Picking a team instantly files the player under that squad, so the team page shows them and their goals">
        <select name="teamId" defaultValue={player?.teamId ?? ""} className="input">
          <option value="">Free agent</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.kind === "nation" ? " (national)" : ""}</option>
          ))}
        </select>
      </Field>
      <Field label="Roblox user id" hint="Leave blank and use “Link Roblox” to resolve it automatically" className="sm:col-span-2">
        <input name="robloxUserId" inputMode="numeric" defaultValue={player?.robloxUserId ?? ""} className="input" placeholder="e.g. 156" />
      </Field>
      <Field label="Position">
        <select name="position" defaultValue={player?.position ?? "MID"} className="input">
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{p} · {positionNames[p]}</option>
          ))}
        </select>
      </Field>
      <Field label="Shirt number">
        <input name="number" type="number" min={0} max={99} defaultValue={player?.number ?? ""} className="input" />
      </Field>
      <Field label="Nationality">
        <input name="nationality" defaultValue={player?.nationality ?? ""} className="input" placeholder="England" />
      </Field>
      <Field label="Bio" className="sm:col-span-2">
        <textarea name="bio" rows={3} defaultValue={player?.bio ?? ""} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="isActive" defaultChecked={player?.isActive ?? true} className="h-4 w-4 accent-orange-500" />
        Active player
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>{player ? "Save player" : "Add player"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

// ---------------------------------------------------------------------------
// Competition
// ---------------------------------------------------------------------------
export function CompetitionForm({ competition, action }: { competition?: Competition; action: Action }) {
  return (
    <AdminForm action={action} resetOnSuccess={!competition} className="grid gap-4 sm:grid-cols-2">
      {competition ? <input type="hidden" name="id" value={competition.id} /> : null}
      <Field label="Name">
        <input name="name" required defaultValue={competition?.name ?? ""} className="input" placeholder="EUROS" />
      </Field>
      <Field label="Season" hint="Groups competitions together, e.g. “Season 4”">
        <input name="season" defaultValue={competition?.season ?? ""} className="input" placeholder="Season 1" />
      </Field>
      <Field label="Type">
        <select name="type" defaultValue={competition?.type ?? "league"} className="input">
          {COMPETITION_TYPES.map((t) => (
            <option key={t} value={t}>{competitionTypeLabels[t]}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={competition?.status ?? "upcoming"} className="input">
          {COMPETITION_STATUSES.map((s) => (
            <option key={s} value={s}>{competitionStatusLabels[s]}</option>
          ))}
        </select>
      </Field>
      <Field label="Tournament badge" hint="Local image path or HTTPS URL" className="sm:col-span-2">
        <input name="badgeUrl" defaultValue={competition?.badgeUrl ?? ""} className="input" placeholder="/images/rsl-euros-crest.png" />
      </Field>
      <Field label="Start date">
        <input name="startDate" type="date" defaultValue={competition?.startDate ?? ""} className="input" />
      </Field>
      <Field label="End date">
        <input name="endDate" type="date" defaultValue={competition?.endDate ?? ""} className="input" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea name="description" rows={3} defaultValue={competition?.description ?? ""} className="input" />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton>{competition ? "Save competition" : "Create competition"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------
export function MatchForm({
  match,
  competitions,
  teams,
  players,
  action,
}: {
  match?: Match;
  competitions: Competition[];
  teams: Team[];
  players: Player[];
  action: Action;
}) {
  return (
    <AdminForm action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {match ? <input type="hidden" name="id" value={match.id} /> : null}
      <Field label="Competition" className="sm:col-span-2">
        <select name="competitionId" required defaultValue={match?.competitionId ?? ""} className="input">
          <option value="">Select…</option>
          {[...competitions].reverse().map((c) => (
            <option key={c.id} value={c.id}>{competitionLabel(c)}</option>
          ))}
        </select>
      </Field>
      <Field label="Round / matchday">
        <input name="round" defaultValue={match?.round ?? ""} className="input" placeholder="Matchday 1, Final…" />
      </Field>
      <Field label="Venue">
        <input name="venue" defaultValue={match?.venue ?? ""} className="input" placeholder="RSL Arena" />
      </Field>

      <Field label="Home team">
        <select name="homeTeamId" required defaultValue={match?.homeTeamId ?? ""} className="input">
          <option value="">Select…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Home score">
        <input name="homeScore" type="number" min={0} defaultValue={match?.homeScore ?? 0} className="input" />
      </Field>
      <Field label="Away score">
        <input name="awayScore" type="number" min={0} defaultValue={match?.awayScore ?? 0} className="input" />
      </Field>
      <Field label="Away team">
        <select name="awayTeamId" required defaultValue={match?.awayTeamId ?? ""} className="input">
          <option value="">Select…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>

      <Field label="Kick-off">
        <input name="playedAt" type="datetime-local" defaultValue={toDateTimeLocal(match?.playedAt)} className="input" />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={match?.status ?? "scheduled"} className="input">
          {MATCH_STATUSES.map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </Field>
      <Field label="Man of the match" className="sm:col-span-2">
        <select name="motmPlayerId" defaultValue={match?.motmPlayerId ?? ""} className="input">
          <option value="">None</option>
          <PlayerOptions
            players={players}
            teams={teams}
            onlyTeams={match ? [match.homeTeamId, match.awayTeamId] : undefined}
          />
        </select>
      </Field>
      <Field label="Notes" className="sm:col-span-2 lg:col-span-4">
        <textarea name="notes" rows={2} defaultValue={match?.notes ?? ""} className="input" placeholder="Match report, context, anything worth remembering" />
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <SubmitButton>{match ? "Save match" : "Create match"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

// ---------------------------------------------------------------------------
// Trophy
// ---------------------------------------------------------------------------
export function TrophyForm({
  teams,
  players,
  competitions,
  action,
}: {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
  action: Action;
}) {
  return (
    <AdminForm action={action} resetOnSuccess className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Trophy / award name">
        <input name="name" required className="input" placeholder="League Champions, Golden Boot…" />
      </Field>
      <Field label="Kind">
        <select name="kind" defaultValue="team" className="input">
          <option value="team">Team trophy</option>
          <option value="individual">Individual award</option>
        </select>
      </Field>
      <Field label="Icon" hint="Any emoji fallback">
        <input name="icon" defaultValue="🏆" className="input" />
      </Field>
      <Field label="Trophy image" hint="Artwork shown next to the award on profiles — leave blank to use built-in badge art" className="sm:col-span-2 lg:col-span-3">
        <input name="imageUrl" className="input" placeholder="/images/trophies/golden-boot.png" />
      </Field>
      <Field label="Team" hint="Required for team trophies">
        <select name="teamId" defaultValue="" className="input">
          <option value="">—</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Player" hint="Required for individual awards">
        <select name="playerId" defaultValue="" className="input">
          <option value="">—</option>
          <PlayerOptions players={players} teams={teams} />
        </select>
      </Field>
      <Field label="Competition">
        <select name="competitionId" defaultValue="" className="input">
          <option value="">—</option>
          {[...competitions].reverse().map((c) => (
            <option key={c.id} value={c.id}>{competitionLabel(c)}</option>
          ))}
        </select>
      </Field>
      <Field label="Season">
        <input name="season" className="input" placeholder="Season 1" />
      </Field>
      <Field label="Date awarded">
        <input name="awardedAt" type="date" className="input" />
      </Field>
      <Field label="Notes">
        <input name="notes" className="input" placeholder="e.g. 14 goals" />
      </Field>
      <div className="sm:col-span-2 lg:col-span-3">
        <SubmitButton>Award trophy</SubmitButton>
      </div>
    </AdminForm>
  );
}
