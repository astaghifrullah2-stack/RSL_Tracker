import Link from "next/link";
import { PlayerSheetFilters } from "@/components/PlayerSheetFilters";
import { EmptyState } from "@/components/ui";
import { cn, initials } from "@/lib/site";
import {
  classRank,
  filterSheetRows,
  formatFamily,
  formatWage,
  getPlayerSheets,
  getSheetRowsView,
  groupSheetRows,
  nationFlag,
  normalizeClass,
  ratingRange,
  sheetTabLabel,
  type SheetRowView,
} from "@/lib/player-sheets";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Playersheets",
  description: "The current RSL playersheet and the preserved season archives, starting with S2.",
};

export default async function PlayersheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ sheet?: string; q?: string; class?: string; team?: string }>;
}) {
  const sp = await searchParams;
  const sheetData = await getPlayerSheets();
  const selected =
    sheetData.sheets.find((sheet) => sheet.slug === sp.sheet?.toLowerCase()) ??
    sheetData.current;
  const currentShort = sheetData.current?.label.split(" ")[0] ?? "—";
  const archiveCount = sheetData.sheets.filter((sheet) => !sheet.isCurrent).length;
  const archiveNames = sheetData.sheets.filter((sheet) => !sheet.isCurrent).map((sheet) => sheet.label.split(" ")[0]);
  const archiveDescription = archiveNames.length
    ? `${archiveNames[0]}–${archiveNames[archiveNames.length - 1]}`
    : "past season";

  if (!selected) {
    return (
      <>
        <SheetHero current="—" archives={0} description="The playersheet archive is ready for its first import." />
        <div className="panel mt-8">
          <EmptyState>No playersheets have been created yet. Add S2 from the Admin panel to begin the archive.</EmptyState>
        </div>
      </>
    );
  }

  const allRows = await getSheetRowsView(selected.id);
  const filteredRows = filterSheetRows(allRows, {
    q: sp.q,
    className: sp.class,
    team: sp.team,
  });
  const groups = groupSheetRows(filteredRows);
  const classes = [...new Set(allRows.map((row) => normalizeClass(row.playerClass)))].sort(
    (a, b) => classRank(a) - classRank(b) || a.localeCompare(b),
  );
  const teams = [...new Set(allRows.map((row) => row.teamLabel))].sort((a, b) => a.localeCompare(b));
  const selectedShort = selected.label.split(" ")[0];

  return (
    <>
      <SheetHero
        current={currentShort}
        archives={archiveCount}
        description={`The current ${currentShort} playersheet, alongside the preserved ${archiveDescription} archives.`}
      />

      <section className="mt-7 border-t border-white/[0.08] pt-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{selected.label}</h2>
              <span className={cn("chip", selected.isCurrent ? "chip-orange" : "chip-blue")}>
                {selected.isCurrent ? "CURRENT" : "ARCHIVE"}
              </span>
              {!selected.isVerified ? <span className="chip">DRAFT</span> : <span className="chip chip-amber">VERIFIED</span>}
            </div>
            <p className="mt-1 text-xs text-slate-400">{selected.description || `${selectedShort} playersheet archive`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.sourceUrl ? (
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer noopener" className="btn btn-sm">
                Original sheet ↗
              </a>
            ) : null}
            <a href={`/api/sheets/export?sheet=${selected.slug}`} className="btn btn-sm" download>
              Export CSV ↓
            </a>
            <Link href={`/admin/sheets/${selected.id}`} className="btn btn-sm">Edit sheet</Link>
          </div>
        </div>

        <nav className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#0b1530] p-2 [scrollbar-width:none]" aria-label="Playersheet seasons">
          {sheetData.sheets.map((sheet) => {
            const active = sheet.id === selected.id;
            return (
              <Link
                key={sheet.id}
                href={`/sheets?sheet=${sheet.slug}`}
                className={cn(
                  "min-w-20 flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-xs font-extrabold transition",
                  active
                    ? "bg-orange-500 text-[#11152b] shadow-[0_0_24px_rgba(255,117,24,.16)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {sheetTabLabel(sheet)}
              </Link>
            );
          })}
        </nav>

        <div className="mb-5">
          <h3 className="inline-block border-b-2 border-orange-500 pb-2 text-sm font-extrabold text-orange-300">Playersheet</h3>
        </div>

        <PlayerSheetFilters classes={classes} teams={teams} count={filteredRows.length} />

        <div className="my-5 px-1 text-sm leading-relaxed text-slate-400">
          {selected.isVerified ? (
            <p>Verified {selectedShort} playersheet · {allRows.length} players on record.</p>
          ) : (
            <p>
              Draft roster assembled from tracker records. Classes and wages remain blank until the original spreadsheet is supplied;
              paste the real sheet in Admin to replace or update this archive.
            </p>
          )}
        </div>

        {groups.length ? (
          <>
            <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#0c1731]">
              <div className="hidden min-w-[930px] grid-cols-[110px_minmax(230px,1.5fr)_minmax(150px,1fr)_100px_130px_120px_100px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-500 sm:grid">
                <span>Class / rating</span><span>Player</span><span>Team / club</span><span>{selected.slug === "s2" ? "Position" : "Role"}</span><span className="text-right">Wage</span><span className="text-right">Owner ID</span><span className="text-right">Penalty</span>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {groups.map((group) => {
                const range = ratingRange(group.rows);
                return (
                  <section key={group.family} className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#0c1731]/90">
                    <header className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-5 py-3", familyHeaderTone(group.family))}>
                      <h4 className="text-[12px] font-black uppercase tracking-[.22em]">{formatFamily(group.family)}</h4>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-300/80">
                        {range ? <span>{range}</span> : null}
                        <span className="text-slate-400">{group.rows.length} {group.rows.length === 1 ? "player" : "players"}</span>
                      </div>
                    </header>
                    <div className="divide-y divide-white/[0.055]">
                      {group.rows.map((row) => <SheetRow key={row.id} row={row} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="panel mt-4">
            <EmptyState>{allRows.length ? "No players match these filters." : "This sheet has no rows yet. Paste the spreadsheet in Admin to populate it."}</EmptyState>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Showing {filteredRows.length} of {allRows.length} players in {selectedShort}.</span>
          <Link href="/stats" className="font-bold text-orange-300 hover:text-orange-200">Open performance statistics ↗</Link>
        </div>
      </section>
    </>
  );
}

function SheetHero({ current, archives, description }: { current: string; archives: number; description: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="text-5xl font-black tracking-[-.045em] text-white sm:text-6xl">Playersheets<span className="text-orange-400">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
      </div>
      <div className="flex gap-7 pr-1">
        <div className="border-l border-white/10 pl-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Current</p><p className="mt-1 text-3xl font-black text-white">{current}</p></div>
        <div className="border-l border-white/10 pl-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Archives</p><p className="mt-1 text-3xl font-black text-white">{archives}</p></div>
      </div>
    </header>
  );
}

function familyHeaderTone(family: string) {
  if (family === "X") return "bg-gradient-to-r from-[#173a12]/80 via-[#102a1b]/40 to-transparent text-[#bdf72c] border-b border-[#a3e635]/30";
  if (family === "S") return "bg-gradient-to-r from-[#7a3209]/85 via-[#5a2305]/40 to-transparent text-[#ff8a3d] border-b border-[#f97316]/30";
  if (family === "A") return "bg-gradient-to-r from-[#0c2f7a]/85 via-[#081e52]/40 to-transparent text-[#60a5fa] border-b border-[#3b82f6]/30";
  if (family === "B") return "bg-gradient-to-r from-[#6e0d45]/85 via-[#4a072d]/40 to-transparent text-[#f472b6] border-b border-[#ec4899]/30";
  if (family === "C") return "bg-gradient-to-r from-[#3b126e]/85 via-[#270b4a]/40 to-transparent text-[#c084fc] border-b border-[#a855f7]/30";
  return "bg-white/[0.03] text-slate-300 border-b border-white/[0.08]";
}

function classTone(className: string) {
  if (className.startsWith("X")) return "text-[#bdf72c] border-[#bdf72c]/40";
  if (className.startsWith("S")) return "text-orange-300 border-orange-400/40";
  if (className.startsWith("A")) return "text-blue-300 border-blue-400/40";
  if (className.startsWith("B")) return "text-pink-300 border-pink-400/40";
  if (className.startsWith("C")) return "text-purple-300 border-purple-400/40";
  return "text-slate-400 border-white/20";
}

function SheetRow({ row }: { row: SheetRowView }) {
  const rating = row.rating;
  const avatarSrc =
    row.avatarUrl ||
    `/api/roblox/avatar-image?userId=${row.robloxUserId || ""}&username=${encodeURIComponent(row.username)}`;
  const isManager = row.role === "MANAGER";

  const content = (
    <>
      <span className="flex items-center gap-1.5">
        <span className={cn("inline-flex min-w-10 items-center justify-center rounded-md border bg-white/[0.04] px-1.5 py-1 text-[11px] font-black", classTone(row.playerClass))}>
          {normalizeClass(row.playerClass) === "UNRATED" ? "—" : normalizeClass(row.playerClass)}
        </span>
        {rating != null ? <span className="text-sm font-black tabular-nums text-white">{rating}</span> : null}
      </span>

      <span className="flex min-w-0 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={row.username}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-[#111c36] object-cover ring-1 ring-white/10"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold text-white">{row.username}</span>
          <span className="block truncate text-[10px] text-slate-500 sm:hidden">ID {row.robloxUserId ?? "—"}</span>
        </span>
      </span>

      <span className="truncate text-[11px] font-bold uppercase tracking-wide">
        <span
          className={cn(
            row.teamLabel === "NETHERLANDS" && "text-orange-400 font-extrabold",
            row.teamLabel === "SPAIN" && "text-yellow-400 font-extrabold",
            row.teamLabel === "ITALY" && "text-emerald-400 font-extrabold",
            row.teamLabel === "PORTUGAL" && "text-rose-400 font-extrabold",
            row.teamLabel === "FREE AGENT" && "text-slate-400",
            row.teamLabel.includes("ATALANTA") && "text-blue-300",
            row.teamLabel.includes("BOLOGNA") && "text-red-400",
            row.teamLabel.includes("COMO") && "text-sky-300",
            row.teamLabel.includes("INTER") && "text-blue-400",
            row.teamLabel.includes("NAPOLI") && "text-sky-300",
            row.teamLabel.includes("FIORENTINA") && "text-violet-300",
            row.teamLabel.includes("JUVENTUS") && "text-slate-200",
            !["NETHERLANDS", "SPAIN", "ITALY", "PORTUGAL", "FREE AGENT"].includes(row.teamLabel) &&
              !["ATALANTA", "BOLOGNA", "COMO", "INTER", "NAPOLI", "FIORENTINA", "JUVENTUS"].some((name) => row.teamLabel.includes(name)) &&
              "text-slate-300",
          )}
        >
          {row.teamLabel}
        </span>
      </span>

      <span className={cn("text-[11px] font-black uppercase tracking-wider", isManager ? "text-amber-300" : "text-slate-400")}>
        {row.role}
      </span>

      <span className="text-right text-sm font-black tabular-nums text-amber-300">
        {formatWage(row.wage)}
      </span>

      <span className="text-right font-mono text-[11px] text-slate-400">
        {row.robloxUserId ?? "—"}
      </span>

      <span className="text-right text-[11px] font-black tabular-nums text-red-400">
        {formatWage(row.penalty)}
      </span>
    </>
  );

  const classes =
    "grid grid-cols-[90px_minmax(0,1.5fr)_auto] items-center gap-3 px-5 py-3 transition hover:bg-white/[0.035] sm:grid-cols-[110px_minmax(230px,1.5fr)_minmax(150px,1fr)_100px_130px_120px_100px] sm:min-w-[930px]";
  return row.profileHref ? <Link href={row.profileHref} className={classes}>{content}</Link> : <div className={classes}>{content}</div>;
}
