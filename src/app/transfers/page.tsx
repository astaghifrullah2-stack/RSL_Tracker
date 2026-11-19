import Link from "next/link";
import { TransferFilters } from "@/components/TransferFilters";
import { EmptyState, PageHeader, Panel, RankBadge, StatCard } from "@/components/ui";
import { canonicalClubName } from "@/lib/club-names";
import { formatWage } from "@/lib/site";
import {
  getTransferData,
  type PlayerTransferTimeline,
  type SeasonSpot,
  type TransferMove,
} from "@/lib/transfers";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Transfer Centre",
  description: "Every RSL player's club across Seasons 1–4. Track who moved and who stayed — from S1 Villareal to the S4 EUROS.",
};

function ClubChip({ spot, className = "" }: { spot: SeasonSpot; className?: string }) {
  if (!spot.onRecord) {
    return <span className="chip border-white/10 text-slate-500">No record</span>;
  }
  const color = spot.color;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide ${className}`}
      style={{
        borderColor: `${color}55`,
        background: `${color}18`,
        color: spot.isFree ? "#94a3b8" : "#fff",
      }}
      title={spot.club}
    >
      {spot.badgeUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={spot.badgeUrl} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      )}
      <span className="truncate">{spot.short}</span>
    </span>
  );
}

function MoveRow({ move, data }: { move: TransferMove; data: Awaited<ReturnType<typeof getTransferData>> }) {
  const timeline = data.timelines.find((t) => t.timelineId === move.timelineId);
  if (!timeline) return null;
  return (
    <Link
      href={`/players/${timeline.playerId}`}
      className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.03] sm:flex-nowrap"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={timeline.avatarUrl}
        alt={timeline.username}
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-[#0b1530] object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-white">{timeline.username}</p>
        <p className="text-[11px] text-slate-500">{timeline.position}{timeline.robloxUserId ? ` · ID ${timeline.robloxUserId}` : ""}</p>
      </div>

      <div className="flex items-center gap-2">
        <ClubChip spot={move.from} />
        <span className="font-black text-orange-400">→→</span>
        <ClubChip spot={move.to} />
      </div>

      <div className="text-right">
        <span className="chip chip-blue">{move.window}</span>
        <p className="mt-1 font-mono text-[11px] font-bold text-amber-200">
          {formatWage(move.from.wage)} → {formatWage(move.to.wage)}
        </p>
      </div>
    </Link>
  );
}

function TimelineRow({ timeline }: { timeline: PlayerTransferTimeline }) {
  return (
    <tr>
      <td>
        <Link href={`/players/${timeline.playerId}`} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={timeline.avatarUrl}
            alt={timeline.username}
            loading="lazy"
            className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-[#0b1530] object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-white">{timeline.displayName}</span>
            <span className="block text-[10px] text-slate-500">@{timeline.username}</span>
          </span>
        </Link>
      </td>
      {timeline.spots.map((spot, i) => (
        <td key={spot.season}>
          <div className="flex items-center gap-2">
            <div>
              <ClubChip spot={spot} />
              <p className="mt-1 text-[10px] text-slate-500">
                {spot.onRecord
                  ? [
                      spot.cls ?? null,
                      spot.rating ? `${spot.rating} OVR` : null,
                      spot.wage ? formatWage(spot.wage) : null,
                      spot.role === "MANAGER" ? "Manager" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "No record"}
              </p>
            </div>
            {i < timeline.spots.length - 1 ? (
              <span className="text-[11px] font-black text-slate-600">→</span>
            ) : null}
          </div>
        </td>
      ))}
    </tr>
  );
}

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; club?: string; window?: string }>;
}) {
  const { q = "", club = "", window: windowFilter = "" } = await searchParams;
  const data = await getTransferData();

  const needle = q.trim().toLowerCase();
  const clubFilter = club ? canonicalClubName(club) ?? club : "";

  const matchesClub = (clubName: string) =>
    !clubFilter || clubName.toLowerCase() === clubFilter.toLowerCase();

  const filteredTimelines = data.timelines.filter((t) => {
    if (needle) {
      const hay = `${t.username} ${t.displayName} ${t.robloxUserId ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (clubFilter && !t.spots.some((s) => s.onRecord && s.club.toLowerCase() === clubFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredMoves = data.moves.filter((m) => {
    if (windowFilter && m.window !== windowFilter) return false;
    if (clubFilter) {
      const hitFrom = m.from.club.toLowerCase() === clubFilter.toLowerCase();
      const hitTo = m.to.club.toLowerCase() === clubFilter.toLowerCase();
      if (!hitFrom && !hitTo) return false;
    }
    if (needle) {
      const hay = `${m.playerUsername}`.toLowerCase();
      const timeline = data.timelines.find((t) => t.timelineId === m.timelineId);
      const idTxt = timeline?.robloxUserId ?? "";
      if (!hay.includes(needle) && !idTxt.includes(needle)) return false;
    }
    return true;
  });

  const travellers = [...data.timelines]
    .filter((t) => t.moveCount > 0)
    .sort((a, b) => b.moveCount - a.moveCount || a.username.localeCompare(b.username))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="RSL / CLUB LORE"
        title={
          <>
            Transfer <span className="text-orange-400">centre.</span>
          </>
        }
        subtitle="Every player's club across Seasons 1–4 — from the Spanish club eras to the international EUROS. Movements update automatically when playersheets and season rosters are imported."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Players on record" value={data.totals.players} />
        <StatCard label="Transfers made" value={data.totals.moves} accent />
        <StatCard label="Clubs involved" value={data.clubs.length} />
        <StatCard
          label="Busiest window"
          value={data.totals.busiestWindow ?? "—"}
          hint={data.totals.freeAgentsS4 ? `${data.totals.freeAgentsS4} free agents in S4` : undefined}
        />
      </div>

      <div className="mt-6">
        <TransferFilters
          clubs={data.clubs.map((c) => ({ value: c, label: c }))}
          windows={data.windows.map((w) => ({ value: w, label: `${w} window` }))}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <Panel
            title={windowFilter ? `${windowFilter} window moves` : "Biggest moves across S1–S4"}
            description={`${filteredMoves.length} ${filteredMoves.length === 1 ? "transfer" : "transfers"}${clubFilter ? ` involving ${clubFilter}` : ""}`}
          >
            {filteredMoves.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {filteredMoves.map((m, i) => (
                  <li key={`${m.timelineId}-${m.window}`}>
                    <MoveRow move={m} data={data} key={i} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No transfers match this selection. Every confirmed move appears here automatically.</EmptyState>
            )}
          </Panel>

          <Panel
            title="Club-by-club timelines (S1 → S4)"
            description={`${filteredTimelines.length} players shown · columns show each season's club, class, OVR and wage`}
          >
            {filteredTimelines.length ? (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>S1 · Spanish League</th>
                      <th>S2 · Spanish League</th>
                      <th>S3 · Italian League</th>
                      <th>S4 · EUROS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimelines.map((t) => (
                      <TimelineRow key={t.playerId} timeline={t} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No players match this selection.</EmptyState>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Most travelled players" description="Most club switches across S1–S4">
            {travellers.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {travellers.map((t, i) => (
                  <li key={t.playerId} className="flex items-center gap-3 px-5 py-3">
                    <RankBadge rank={i + 1} />
                    <Link href={`/players/${t.playerId}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.avatarUrl} alt={t.username} loading="lazy" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-white">{t.displayName}</span>
                        <span className="block truncate text-[10px] text-slate-500">
                          {t.spots.map((s) => s.short).join(" → ")}
                        </span>
                      </span>
                    </Link>
                    <span className="text-base font-black text-orange-300">{t.moveCount}↔</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>All players have stayed loyal so far.</EmptyState>
            )}
          </Panel>

          <Panel title="How the archive works">
            <ul className="space-y-2.5 p-5 text-xs leading-relaxed text-slate-300">
              <li>• <strong className="text-white">Season 1</strong> clubs come from the official championship rosters, S1 award records and the current squad register.</li>
              <li>• <strong className="text-white">S2–S4</strong> clubs come straight from the preserved playersheets in the Sheets archive.</li>
              <li>• When you paste a new season sheet in Admin, every transfer window updates instantly — no double entry.</li>
              <li>• Click any player to open their full profile with stats, awards and their complete transfer history.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
