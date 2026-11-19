import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CompetitionIcon,
  EmptyState,
  PageHeader,
  Panel,
  PlayerAvatar,
  PositionBadge,
  StatCard,
  TeamCrest,
} from "@/components/ui";
import { TrophyArt } from "@/components/TrophyArt";
import { WatchButton } from "@/components/hub/Watchlist";
import {
  competitionLabel,
  formatDate,
  playerLabel,
  positionNames,
  ratio,
} from "@/lib/site";
import { resolveRobloxUser } from "@/lib/roblox";
import { getPlayerSheetHistory, normalizeClass, formatWage, nationFlag } from "@/lib/player-sheets";
import {
  championshipSquadsForPlayer,
  getLeagueData,
  playerStatLine,
  resultsForTeam,
  teamHonoursForPlayer,
  trophiesForPlayer,
} from "@/lib/stats";
import { getTransferData, timelineForPlayer } from "@/lib/transfers";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);
  const data = await getLeagueData();
  const player = data.playerById.get(playerId);
  if (!player) notFound();

  const team = player.teamId ? data.teamById.get(player.teamId) : null;
  const career = playerStatLine(data, playerId);
  const awards = trophiesForPlayer(data, playerId);
  const teamHonours = teamHonoursForPlayer(data, playerId);
  const championshipSquads = championshipSquadsForPlayer(data, playerId);
  const teamFinishes = team ? resultsForTeam(data, team.id) : [];
  const transferTimeline = timelineForPlayer(await getTransferData(), playerId);

  // Roblox account + live avatar, resolved server-side and cached.
  const roblox = await resolveRobloxUser(player.name);
  const avatarUrl = player.robloxAvatarUrl ?? roblox?.headshotUrl ?? null;
  const robloxId = player.robloxUserId ?? roblox?.userId ?? null;
  const verified = player.robloxVerified || roblox?.verified || false;
  const displayName = player.displayName?.trim() || roblox?.displayName || null;

  const sheetHistory = await getPlayerSheetHistory(playerId);
  const hasStats = career.apps > 0 || career.goals > 0 || career.assists > 0;
  const hasAnything = hasStats || awards.length > 0 || teamHonours.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={team ? `${team.name} / player profile` : "Free agent / player profile"}
        title={
          <span className="flex items-center gap-4">
            <PlayerAvatar player={{ ...player, robloxAvatarUrl: avatarUrl }} team={team} size="2xl" />
            <span>
              <span className="block">{playerLabel({ ...player, displayName })}</span>
              <span className="block text-base font-semibold text-slate-500">@{player.name}</span>
            </span>
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <PositionBadge position={player.position} />
            <span className="text-slate-400">{positionNames[player.position]}</span>
            {player.number != null ? <span className="chip">#{player.number}</span> : null}
            {verified ? <span className="chip chip-amber">✔ Verified on Roblox</span> : null}
            {team ? (
              <Link href={`/teams/${team.id}`} className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white">
                <TeamCrest team={team} size="xs" /> {team.name}
              </Link>
            ) : (
              <span className="text-slate-400">Free agent</span>
            )}
          </span>
        }
        actions={<><WatchButton playerId={player.id} username={player.name}/><Link href="/players" className="btn">← All players</Link></>}
      />

      {player.bio ? <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-400">{player.bio}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Career statistics" description="All values are zero until real matches are recorded.">
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-6">
              <StatCard label="Apps" value={career.apps} />
              <StatCard label="Goals" value={career.goals} accent />
              <StatCard label="Assists" value={career.assists} />
              <StatCard label="Clean sheets" value={career.cleanSheets} />
              <StatCard label="MOTM" value={career.motm} />
              <StatCard label="G+A / game" value={ratio(career.goals + career.assists, career.apps)} />
            </div>
            <dl className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.05] text-sm sm:grid-cols-4">
              {[
                ["Penalties", career.penalties],
                ["Own goals", career.ownGoals],
                ["Hat-tricks", career.hatTricks],
                ["Yellow cards", career.yellows],
                ["Red cards", career.reds],
                ["Wins", career.wins],
                ["Draws", career.draws],
                ["Losses", career.losses],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-[#0b1634] px-5 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="text-lg font-black text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {!hasAnything ? (
              <p className="border-t border-white/[0.06] px-5 py-4 text-xs text-slate-500">
                No statistics recorded yet — this player is on the roster and their numbers will fill in as matches are entered.
              </p>
            ) : null}
          </Panel>

          <Panel title="Individual awards" description={`${awards.length} recognised by the league`}>
            {awards.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {awards.map((award) => {
                  const comp = award.competitionId ? data.competitionById.get(award.competitionId) : null;
                  return (
                    <li key={award.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="h-12 w-12 shrink-0">
                        <TrophyArt name={award.name} kind={award.kind} imageUrl={award.imageUrl} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{award.name}</p>
                        <p className="text-xs text-slate-500">
                          {[
                            award.season,
                            comp ? competitionLabel(comp) : null,
                            award.awardedAt ? formatDate(award.awardedAt) : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                        {award.notes ? <p className="mt-1 text-[11px] text-slate-400">{award.notes}</p> : null}
                      </div>
                      {comp ? <CompetitionIcon competition={comp} size="sm" /> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-2xl">🏅</p>
                <p className="mt-2 text-sm font-bold text-white">No individual awards yet</p>
                <p className="mt-1 text-xs text-slate-400">Awards appear here the moment they are recorded in the tracker.</p>
              </div>
            )}
          </Panel>

          {sheetHistory.length ? (
            <Panel title="Playersheet record" description="Class, rating and wage from each season sheet">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th>Season</th><th>Class</th><th className="text-center">Rating</th><th>Position</th><th>Nation</th><th className="text-right">Wage</th></tr></thead>
                  <tbody>
                    {sheetHistory.map((entry) => (
                      <tr key={`${entry.sheetSlug}-${entry.sheetSeason}`}>
                        <td><Link href={`/sheets?sheet=${entry.sheetSlug}`} className="font-bold link">{entry.sheetLabel}</Link></td>
                        <td><span className="chip chip-orange">{normalizeClass(entry.playerClass) === "UNRATED" ? "Unrated" : normalizeClass(entry.playerClass)}</span></td>
                        <td className="text-center font-black text-white">{entry.rating ?? "—"}</td>
                        <td className="text-zinc-300">{entry.position ?? "—"}</td>
                        <td className="text-zinc-300">{nationFlag(entry.nation)} {entry.nation ?? "—"}</td>
                        <td className="text-right font-bold text-amber-300">{formatWage(entry.wage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {championshipSquads.length ? (
            <Panel title="Championship squads" description="Official season-winning rosters on record">
              <ul className="divide-y divide-white/[0.06]">
                {championshipSquads.map(({ entry, team: squadTeam, titles }) => (
                  <li key={entry.id} className="flex items-center gap-4 px-5 py-4">
                    <TeamCrest team={squadTeam} size="md" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/teams/${squadTeam.id}`} className="truncate text-sm font-extrabold link">
                        {squadTeam.name} · {entry.label}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {[
                          entry.season,
                          titles.length ? titles.map((t) => t.name).join(" & ") : null,
                          entry.discordHandle ? `Discord: ${entry.discordHandle}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="chip chip-amber">🏆 Winner</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {teamHonours.length ? (
            <Panel title="Team trophies" description="Club & national silverware">
              <ul className="divide-y divide-white/[0.06]">
                {teamHonours.map((trophy) => {
                  const winnerTeam = trophy.teamId ? data.teamById.get(trophy.teamId) : null;
                  return (
                    <li key={trophy.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="h-12 w-12 shrink-0">
                        <TrophyArt name={trophy.name} kind={trophy.kind} imageUrl={trophy.imageUrl} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{trophy.name}</p>
                        <p className="text-xs text-slate-500">
                          {[
                            winnerTeam?.name,
                            trophy.season,
                            trophy.awardedAt ? formatDate(trophy.awardedAt) : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {winnerTeam ? <TeamCrest team={winnerTeam} size="sm" /> : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title="Roblox account">
            <div className="flex items-center gap-4 p-5">
              <PlayerAvatar player={{ ...player, robloxAvatarUrl: avatarUrl }} team={team} size="xl" />
              <dl className="min-w-0 flex-1 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Username</dt><dd className="truncate font-semibold text-white">@{player.name}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Roblox ID</dt><dd className="font-mono font-semibold text-white">{robloxId ?? "Not linked"}</dd></div>
                {verified ? <div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="chip chip-amber">Verified</dd></div> : null}
              </dl>
            </div>
            {robloxId ? (
              <a href={`https://www.roblox.com/users/${robloxId}/profile`} target="_blank" rel="noreferrer noopener" className="btn mx-5 mb-5 w-[calc(100%-2.5rem)]">
                Open Roblox profile ↗
              </a>
            ) : (
              <p className="mx-5 mb-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200">
                This username hasn&apos;t been linked yet. Use “Link Roblox” in the Admin player editor to attach the account and avatar.
              </p>
            )}
          </Panel>

          <Panel title="Current team">
            {team ? (
              <div className="p-5">
                <Link href={`/teams/${team.id}`} className="flex items-center gap-3 transition hover:opacity-90">
                  <TeamCrest team={team} size="lg" />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-black text-white">{team.name}</span>
                    <span className="block text-xs text-slate-500">{team.kind === "nation" ? "National team" : "Club"} · Est. {team.founded ?? "2026"}</span>
                  </span>
                </Link>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MiniStat label="Titles" value={teamFinishes.filter((f) => f.placement === 1).length} />
                  <MiniStat label="Runner-up" value={teamFinishes.filter((f) => f.placement === 2).length} />
                  <MiniStat label="Squad" value={data.players.filter((p) => p.teamId === team.id).length} />
                </div>
                <Link href={`/teams/${team.id}`} className="btn mt-4 w-full">Visit team page ↗</Link>
              </div>
            ) : (
              <EmptyState>This player is currently a free agent.</EmptyState>
            )}
          </Panel>

          {transferTimeline ? (
            <Panel
              title="Transfer history"
              description="Club switch by club switch · updates automatically from each season's playersheet"
              action={<Link href="/transfers" className="text-xs font-bold text-orange-300 hover:text-orange-200">Transfer centre ↗</Link>}
            >
              <ol className="relative space-y-0 p-5">
                {transferTimeline.spots.map((spot, i) => (
                  <li key={spot.season} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < transferTimeline.spots.length - 1 ? (
                      <span className="absolute left-[13px] top-8 h-full w-px bg-gradient-to-b from-orange-400/40 to-transparent" />
                    ) : null}
                    <span
                      className="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black"
                      style={{ borderColor: `${spot.color}88`, background: `${spot.color}1c`, color: spot.onRecord ? "#fff" : "#64748b" }}
                    >
                      {spot.season}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        {spot.badgeUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={spot.badgeUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : null}
                        <span className={`truncate text-sm font-extrabold ${spot.onRecord ? "text-white" : "text-slate-500"}`}>
                          {spot.club}
                        </span>
                        {i > 0 && transferTimeline.spots[i - 1].onRecord && spot.onRecord ? (
                          transferTimeline.spots[i - 1].club !== spot.club ? (
                            <span className="chip chip-green text-[10px]">↔ Transfer</span>
                          ) : (
                            <span className="chip text-[10px]">Stayed</span>
                          )
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {spot.onRecord
                          ? [
                              spot.seasonLabel,
                              spot.cls ?? null,
                              spot.rating ? `${spot.rating} OVR` : null,
                              spot.wage ? formatWage(spot.wage) : null,
                              spot.role === "MANAGER" ? "Manager" : null,
                              spot.detail,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : `${spot.seasonLabel} · No sheet record`}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          <Panel title="Discipline">
            <dl className="grid grid-cols-2 gap-px bg-white/[0.05] text-sm">
              {[
                ["Yellow cards", career.yellows],
                ["Red cards", career.reds],
                ["Own goals", career.ownGoals],
                ["Win rate", career.apps ? `${Math.round((career.wins / career.apps) * 100)}%` : "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-[#0b1634] px-5 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="text-lg font-black text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#071229]/60 py-2 text-center">
      <p className="text-base font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
