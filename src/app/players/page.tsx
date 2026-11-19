import Link from "next/link";
import { PlayerFilters } from "@/components/PlayerFilters";
import {
  EmptyState,
  PageHeader,
  Panel,
  PositionBadge,
  TeamCrest,
} from "@/components/ui";
import { TrophyArt } from "@/components/TrophyArt";
import { POSITIONS, type Position } from "@/db/schema";
import { playerLabel, positionNames, site } from "@/lib/site";
import { computePlayerStats, emptyLine, getLeagueData, trophiesForPlayer } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players" };

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; team?: string; pos?: string; award?: string }>;
}) {
  const { q = "", team = "", pos = "", award = "" } = await searchParams;
  const data = await getLeagueData();
  const stats = new Map(computePlayerStats(data).map((l) => [l.playerId, l]));
  const awardsByPlayer = new Map<number, Awaited<ReturnType<typeof trophiesForPlayer>>>();
  for (const player of data.players) awardsByPlayer.set(player.id, trophiesForPlayer(data, player.id));

  const needle = q.trim().toLowerCase();
  const rows = data.players
    .filter((p) => {
      if (needle) {
        const hay = `${p.name} ${p.displayName ?? ""} ${p.robloxUserId ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (team === "free" && p.teamId) return false;
      if (team && team !== "free" && String(p.teamId ?? "") !== team) return false;
      if (pos && p.position !== pos) return false;
      if (award === "awarded" && !(awardsByPlayer.get(p.id)?.length)) return false;
      if (award === "none" && awardsByPlayer.get(p.id)?.length) return false;
      return true;
    })
    .map((p) => ({ player: p, line: stats.get(p.id) ?? emptyLine(p.id), awards: awardsByPlayer.get(p.id) ?? [] }))
    .sort(
      (a, b) =>
        b.awards.length - a.awards.length ||
        playerLabel(a.player).localeCompare(playerLabel(b.player)),
    );

  const spotlight = needle && rows.length ? rows.slice(0, 3) : [];

  return (
    <>
      <PageHeader
        eyebrow={`${site.short} / player database`}
        title={<>Players<span className="text-orange-400">.</span></>}
        subtitle="Search any Roblox player in the league. Profiles show their avatar, current team and every goal, assist and award on record."
      />

      <div className="mb-6">
        <PlayerFilters
          teams={data.teams.map((t) => ({ value: String(t.id), label: t.name }))}
          positions={POSITIONS.map((p) => ({ value: p, label: positionNames[p as Position] }))}
          total={rows.length}
        />
      </div>

      {spotlight.length ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {spotlight.map(({ player, awards }) => {
            const t = player.teamId ? data.teamById.get(player.teamId) : null;
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="panel group flex items-center gap-4 p-5 transition hover:border-orange-400/40"
              >
                <PlayerFace name={player.name} userId={player.robloxUserId} teamColor={t?.primaryColor} cached={player.robloxAvatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black text-white group-hover:text-orange-200">{playerLabel(player)}</p>
                  <p className="truncate text-xs text-slate-500">{t ? t.name : "Free agent"}</p>
                  {awards.length ? <p className="mt-1 text-[11px] font-bold text-amber-300">{awards.length} award{awards.length === 1 ? "" : "s"}</p> : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      <Panel title="The roster" description="Every registered Roblox player and their current team">
        {rows.length === 0 ? (
          <EmptyState>
            {data.players.length === 0
              ? "No players have been added yet."
              : "No players match this search."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th className="text-center" title="Appearances">Apps</th>
                  <th className="text-center" title="Goals">G</th>
                  <th className="text-center" title="Assists">A</th>
                  <th className="text-center" title="Clean sheets">CS</th>
                  <th>Individual awards</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ player, line, awards }) => {
                  const t = player.teamId ? data.teamById.get(player.teamId) : null;
                  return (
                    <tr key={player.id}>
                      <td>
                        <Link href={`/players/${player.id}`} className="group flex items-center gap-3">
                          <PlayerFace name={player.name} userId={player.robloxUserId} teamColor={t?.primaryColor} cached={player.robloxAvatarUrl} small />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-white group-hover:text-orange-200">{playerLabel(player)}</span>
                            <span className="block truncate text-[11px] text-slate-500">
                              {player.robloxUserId ? `Roblox ID ${player.robloxUserId}` : `@${player.name}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        {t ? (
                          <Link href={`/teams/${t.id}`} className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white">
                            <TeamCrest team={t} size="xs" /> {t.name}
                          </Link>
                        ) : (
                          <span className="text-slate-500">Free agent</span>
                        )}
                      </td>
                      <td><PositionBadge position={player.position} /></td>
                      <td className="text-center tabular-nums">{line.apps}</td>
                      <td className="text-center tabular-nums font-bold text-white">{line.goals}</td>
                      <td className="text-center tabular-nums">{line.assists}</td>
                      <td className="text-center tabular-nums">{line.cleanSheets}</td>
                      <td>
                        {awards.length ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            {awards.slice(0, 3).map((a) => (
                              <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200" title={a.name}>
                                <span className="h-3.5 w-3.5"><TrophyArt name={a.name} kind={a.kind} imageUrl={a.imageUrl} /></span>
                                <span className="max-w-32 truncate">{a.name}</span>
                              </span>
                            ))}
                            {awards.length > 3 ? <span className="chip">+{awards.length - 3}</span> : null}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="mt-3 text-xs text-slate-500">
        Showing {rows.length} of {data.players.length} players. All statistics start at zero until real matches are recorded.
      </p>
    </>
  );
}

/** Live Roblox headshot with an initials fallback so nothing ever looks broken. */
function PlayerFace({
  name,
  teamColor,
  cached,
  userId,
  small = false,
}: {
  name: string;
  fallback?: string;
  teamColor?: string;
  cached?: string | null;
  userId?: string | null;
  small?: boolean;
}) {
  const primary = teamColor ?? "#ff7518";
  const avatarSrc =
    cached ||
    (userId
      ? `/api/roblox/avatar-image?userId=${userId}&username=${encodeURIComponent(name)}`
      : `/api/roblox/avatar-image?username=${encodeURIComponent(name)}`);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc}
      alt={name}
      loading="lazy"
      className={`${small ? "h-10 w-10" : "h-14 w-14"} shrink-0 rounded-xl border object-cover ring-1 ring-white/10`}
      style={{ borderColor: `${primary}66`, background: `${primary}1a` }}
    />
  );
}
