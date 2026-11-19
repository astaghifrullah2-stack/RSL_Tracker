"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FutCard } from "@/components/play/FutCard";
import {
  BOARD_META,
  RANKINGS_VIEWS,
  SCOPE_META,
  boardKey,
  formatBoardValue,
  type BoardId,
  type RankingScope,
  type RankingsData,
  type RankingsView,
  type RankingRow,
} from "@/lib/rankings-meta";
import { cn, formatWage } from "@/lib/site";

const ORDERED_BOARDS: BoardId[] = [
  "goals",
  "assists",
  "cleanSheets",
  "motm",
  "rating",
  "index",
  "wage",
  "trophies",
  "titles",
  "seasons",
];

function BoardIcon({
  board,
  className,
}: {
  board: BoardId;
  className?: string;
}) {
  switch (board) {
    case "goals":
      return (
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <polygon points="12,7.5 16.2,10.5 14.6,15.5 9.4,15.5 7.8,10.5" fill="currentColor" fillOpacity="0.25" />
        </svg>
      );
    case "assists":
      return (
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "cleanSheets":
      return (
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3 19 6v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3Z" />
        </svg>
      );
    case "motm":
      return (
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor" aria-hidden>
          <path d="M12 2.5 14.7 9.3 21.5 12 14.7 14.7 12 21.5 9.3 14.7 2.5 12 9.3 9.3Z" />
        </svg>
      );
    case "rating":
      return (
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor" aria-hidden>
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
        </svg>
      );
    default:
      return <span className={cn("text-sm leading-none", className)}>{BOARD_META[board].icon}</span>;
  }
}

export function RankingsDashboard({ data, initialBoard = "index", initialScope = "all" }: { data: RankingsData; initialBoard?: BoardId; initialScope?: RankingScope }) {
  const [view, setView] = useState<RankingsView>("leaderboards");
  const [scope, setScope] = useState<RankingScope>(initialScope);
  const [board, setBoard] = useState<BoardId>(initialBoard);
  const [query, setQuery] = useState("");
  const [bankQuery, setBankQuery] = useState("");
  const [bankSort, setBankSort] = useState<{ key: string; dir: "desc" | "asc" }>({
    key: "index",
    dir: "desc",
  });

  const entries = useMemo(
    () => data.rankings[boardKey(scope, board)] ?? [],
    [data.rankings, scope, board],
  );
  const meta = BOARD_META[board];
  const maxValue = entries[0]?.value || 1;

  const matchesQuery = (row: RankingRow | undefined, q: string) => {
    if (!row || !q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      row.username.toLowerCase().includes(needle) ||
      row.displayName.toLowerCase().includes(needle) ||
      row.primaryClub.toLowerCase().includes(needle) ||
      (row.robloxUserId ?? "").includes(needle) ||
      row.clubs.some((c) => c.toLowerCase().includes(needle))
    );
  };

  const searched = useMemo(() => {
    if (!query.trim()) return entries.slice(3, 20);
    return entries.filter((e) => matchesQuery(data.byPlayer[e.playerId], query));
  }, [entries, query, data.byPlayer]);

  const top3 = entries.slice(0, 3);

  const sortedBank = useMemo(() => {
    const pool = data.rows.filter((r) => matchesQuery(r, bankQuery));
    const val = (r: RankingRow): number | string => {
      switch (bankSort.key) {
        case "name":
          return r.displayName.toLowerCase();
        case "club":
          return r.primaryClub.toLowerCase();
        case "pos":
          return r.detailedPosition;
        default:
          return (r.values[scope] as unknown as Record<string, number | null>)[bankSort.key] ?? 0;
      }
    };
    return [...pool].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      const cmp =
        typeof av === "string" || typeof bv === "string"
          ? String(av).localeCompare(String(bv))
          : (av as number) - (bv as number);
      return bankSort.dir === "desc" ? -cmp : cmp;
    });
  }, [data.rows, bankQuery, bankSort, scope]);

  function exportCsv() {
    const headers = [
      "Rank",
      "Player",
      "Roblox ID",
      "Club",
      "Position",
      "Seasons",
      "Sheet OVR",
      "Peak Wage",
      "Goals",
      "Assists",
      "Clean Sheets",
      "MOTM",
      "Titles",
      "Honours",
      "RSL Index",
    ];
    const lines = sortedBank.map((row, i) => {
      const v = row.values[scope];
      return [
        i + 1,
        row.username,
        row.robloxUserId ?? "",
        row.primaryClub,
        row.detailedPosition,
        row.seasonsCount,
        v.rating ?? "",
        v.wage ?? "",
        v.goals,
        v.assists,
        v.cleanSheets,
        v.motm,
        v.titles,
        v.trophies,
        row.values.all.index,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rsl-rankings-${scope}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const activeViewLabel = RANKINGS_VIEWS.find((v) => v.id === view)?.label ?? "Rankings";
  const heroTitle = view === "leaderboards" ? meta.label : activeViewLabel;
  const heroRankedCount =
    view === "leaderboards"
      ? entries.length
      : view === "clubs"
        ? data.clubs.length
        : view === "top25"
          ? Math.min(25, data.rows.length)
          : data.totals.players;
  const heroNoun = view === "clubs" ? "clubs ranked" : "players ranked";

  return (
    <>
      {/* View Switcher Strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Rankings views"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#090f22] p-1.5 [scrollbar-width:none]"
        >
          {RANKINGS_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                view === v.id
                  ? "border border-orange-500/45 bg-orange-500/15 text-white shadow-[0_0_20px_rgba(255,117,24,0.14)]"
                  : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              {v.icon ? <span className="text-xs">{v.icon}</span> : null}
              <span>{v.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 text-[11px] font-bold text-slate-500 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_#ff7518]" />
          <span>{data.totals.players} players · {data.totals.clubs} clubs · {data.totals.matches} matches logged</span>
        </div>
      </div>

      {/* Reference-styled Hero Card */}
      <section className="relative overflow-hidden rounded-[22px] border border-orange-500/35 bg-gradient-to-r from-[#0a1022] via-[#121629] to-[#2e170a] px-6 py-7 shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8">
        {/* Faint soccer ball / crest watermark on right side */}
        <svg
          viewBox="0 0 120 120"
          className="pointer-events-none absolute right-6 top-1/2 h-44 w-44 -translate-y-1/2 text-white/[0.045]"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden
        >
          <circle cx="60" cy="60" r="52" />
          <polygon points="60,34 84,51 75,79 45,79 36,51" fill="currentColor" fillOpacity="0.35" />
          <line x1="60" y1="8" x2="60" y2="34" />
          <line x1="109" y1="43" x2="84" y2="51" />
          <line x1="91" y1="102" x2="75" y2="79" />
          <line x1="29" y1="102" x2="45" y2="79" />
          <line x1="11" y1="43" x2="36" y2="51" />
        </svg>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-orange-400">
              RSL / RANKINGS
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {heroTitle}
              <span className="text-orange-400">.</span>
            </h1>
            <p className="mt-2.5 text-sm font-medium text-slate-400">
              {SCOPE_META[scope].short} · <span className="text-slate-300">{heroRankedCount} {heroNoun}</span>
            </p>
          </div>

          <label className="relative">
            <span className="sr-only">Ranking season</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as RankingScope)}
              className="w-60 cursor-pointer appearance-none rounded-xl border border-white/15 bg-[#0a1020]/95 px-4 py-3 pr-10 text-xs font-extrabold text-white shadow-inner transition hover:border-white/30 focus:border-orange-400/70 focus:outline-none"
            >
              {(Object.keys(SCOPE_META) as RankingScope[]).map((s) => (
                <option key={s} value={s}>
                  {SCOPE_META[s].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
              ▼
            </span>
          </label>
        </div>
      </section>

      {view === "leaderboards" ? (
        <>
          {/* Compact pill container matching reference */}
          <div className="mt-5">
            <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-white/[0.08] bg-[#0a1122] p-1.5">
              {ORDERED_BOARDS.map((b) => {
                const count = (data.rankings[boardKey(scope, b)] ?? []).length;
                const m = BOARD_META[b];
                const isActive = board === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBoard(b);
                      setQuery("");
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                      isActive
                        ? "border border-orange-500/65 bg-orange-500/12 text-white shadow-[0_0_20px_rgba(255,117,24,0.16)]"
                        : "border border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    <span style={{ color: isActive ? "#fff" : m.accent }}>
                      <BoardIcon board={b} />
                    </span>
                    <span>{m.label}</span>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black",
                          isActive
                            ? "bg-orange-500/25 text-orange-200"
                            : "bg-white/[0.06] text-slate-400",
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tagline + orange source attribution line */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="font-medium text-slate-400">{meta.tagline}</p>
            <p className="font-bold text-orange-400">{meta.sourceNote}</p>
          </div>

          {/* 3-Card Podium (always rendered — slots 01, 02, 03) */}
          <div className="mt-4 grid gap-3.5 md:grid-cols-3">
            {[0, 1, 2].map((slotIdx) => {
              const entry = top3[slotIdx];
              const row = entry ? data.byPlayer[entry.playerId] : undefined;
              const slotNum = String(slotIdx + 1).padStart(2, "0");

              if (!entry || !row) {
                return (
                  <div
                    key={slotIdx}
                    className="rounded-2xl border border-white/[0.08] bg-[#0a1122]/90 px-5 py-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 text-[11px] font-black text-slate-500">
                        {slotNum}
                      </span>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02] text-sm font-black text-slate-500">
                        ?
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-200">Spot available</p>
                        <p className="text-[11px] text-slate-500">
                          {meta.group === "match" ? "Awaiting match results" : "Awaiting sheet data"}
                        </p>
                      </div>
                      <span className="font-mono text-lg font-black text-slate-600">—</span>
                    </div>
                    <div className="mt-4 h-1 w-full rounded-full bg-white/[0.05]" />
                  </div>
                );
              }

              return (
                <Link
                  key={entry.playerId}
                  href={`/players/${row.playerId}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-[#0a1122]/95 px-5 py-4 transition hover:-translate-y-0.5",
                    slotIdx === 0
                      ? "border-orange-500/55 bg-gradient-to-br from-[#23140c] via-[#0d1428] to-[#0a1122] shadow-[0_12px_36px_rgba(255,117,24,0.16)]"
                      : "border-white/[0.09] hover:border-white/25",
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <RankCircle rank={entry.rank} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.avatarUrl}
                      alt={row.username}
                      className="h-11 w-11 shrink-0 rounded-full border border-white/20 bg-[#0d1630] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white group-hover:text-orange-200">
                        {row.displayName}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {row.primaryClub} · {row.detailedPosition}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {meta.unit}
                      </p>
                      <p
                        className="font-mono text-xl font-black tabular-nums leading-tight"
                        style={{ color: slotIdx === 0 ? "#ff8a3d" : meta.accent }}
                      >
                        {meta.format === "wage"
                          ? formatWage(entry.value)
                          : formatBoardValue(entry.value, meta.format)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Bar value={entry.value} max={maxValue} color={slotIdx === 0 ? "#ff7518" : meta.accent} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Unified Leaderboard Card */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1122]/90">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
              <div>
                <h2 className="text-sm font-black text-white">
                  {entries.length === 0 ? "The leaderboard" : "The rest of the top 20"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {entries.length === 0
                    ? meta.group === "match"
                      ? "No match stats have been entered yet"
                      : "No records found for this filter"
                    : query.trim()
                      ? `${searched.length} matches across the whole ladder`
                      : `Ranks 4–20 · ${SCOPE_META[scope].short} · ${entries.length} total ranked`}
                </p>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search every player..."
                className="w-56 rounded-xl border border-white/10 bg-[#070c1a] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-orange-500/60 focus:outline-none"
              />
            </header>

            {entries.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/35 bg-orange-500/10 text-orange-300">
                  <BoardIcon board={board} className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-black text-white">
                  {scope === "s1" && (board === "rating" || board === "wage")
                    ? "No Season 1 playersheet on record."
                    : "The stage is set. The record is still open."}
                </h3>
                <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-slate-400">
                  {scope === "s1" && (board === "rating" || board === "wage")
                    ? "Season 1 is preserved through championship squads and awards rather than a rated playersheet. Switch to S2–S4, or open RSL Index / Championships."
                    : meta.group === "match"
                      ? `No ${meta.label.toLowerCase()} have been recorded for ${SCOPE_META[scope].short.toLowerCase()} yet. This ranking only uses actual match entries — no scores are invented.`
                      : "Try switching seasons or explore another board."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBoard("rating");
                      if (scope === "s1") setScope("all");
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    ★ View Sheet OVR ({(data.rankings[boardKey(scope === "s1" ? "all" : scope, "rating")] ?? []).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBoard("index");
                      if (scope === "s1") setScope("all");
                    }}
                    className="btn btn-sm"
                  >
                    ⚡ View RSL Index ({data.totals.players})
                  </button>
                  <Link href="/admin/matches" className="btn btn-sm">
                    Record a match ↗
                  </Link>
                </div>
              </div>
            ) : searched.length ? (
              <ol className="divide-y divide-white/[0.045]">
                {searched.map((entry) => {
                  const row = data.byPlayer[entry.playerId];
                  if (!row) return null;
                  return (
                    <li key={entry.playerId}>
                      <Link
                        href={`/players/${row.playerId}`}
                        className="flex items-center gap-3.5 px-6 py-3 transition hover:bg-white/[0.025]"
                      >
                        <span className="w-7 shrink-0 text-center font-mono text-sm font-black tabular-nums text-slate-400">
                          {entry.rank}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.avatarUrl}
                          alt={row.username}
                          loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-full border border-white/15 bg-[#0d1630] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-white">{row.displayName}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {row.primaryClub} · {row.detailedPosition}
                          </p>
                        </div>
                        <span className="hidden w-24 shrink-0 text-right text-[11px] font-semibold text-slate-500 sm:block">
                          {row.seasonsCount} {row.seasonsCount === 1 ? "season" : "seasons"}
                        </span>
                        <div className="hidden w-32 shrink-0 sm:block md:w-44">
                          <Bar value={entry.value} max={maxValue} color={meta.accent} />
                        </div>
                        <span
                          className="w-24 shrink-0 text-right font-mono text-base font-black tabular-nums sm:w-28"
                          style={{ color: meta.accent }}
                        >
                          {meta.format === "wage"
                            ? formatWage(entry.value)
                            : formatBoardValue(entry.value, meta.format)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="px-6 py-12 text-center text-sm text-slate-500">
                No players match “{query}”.
              </p>
            )}
          </div>
        </>
      ) : null}

      {view === "top25" ? <Top25 data={data} /> : null}
      {view === "clubs" ? <ClubPower data={data} /> : null}
      {view === "seasons" ? (
        <SeasonLab
          data={data}
          onOpenSeason={(s) => {
            setScope(s);
            setBoard("index");
            setView("leaderboards");
          }}
        />
      ) : null}

      {view === "databank" ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1122]/90">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
            <div>
              <h2 className="text-base font-black text-white">
                Databank<span className="text-orange-400">.</span>
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Every ranked player, sortable, searchable and exportable · {SCOPE_META[scope].short}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={bankQuery}
                onChange={(e) => setBankQuery(e.target.value)}
                placeholder="Search players, clubs, IDs…"
                className="w-56 rounded-xl border border-white/10 bg-[#070c1a] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-orange-500/60 focus:outline-none"
              />
              <button type="button" onClick={exportCsv} className="btn btn-sm btn-primary">
                ↓ Export CSV
              </button>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="table-base min-w-[1000px]">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <Th label="Player" k="name" sort={bankSort} setSort={setBankSort} />
                  <Th label="Club" k="club" sort={bankSort} setSort={setBankSort} />
                  <Th label="Pos" k="pos" sort={bankSort} setSort={setBankSort} />
                  <Th label="Seasons" k="seasons" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="OVR" k="rating" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="Wage" k="wage" sort={bankSort} setSort={setBankSort} align="right" />
                  <Th label="G" k="goals" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="A" k="assists" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="CS" k="cleanSheets" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="MOTM" k="motm" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="Titles" k="titles" sort={bankSort} setSort={setBankSort} align="center" />
                  <Th label="Index" k="index" sort={bankSort} setSort={setBankSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedBank.slice(0, 200).map((row, i) => {
                  const v = row.values[scope];
                  return (
                    <tr key={row.playerId}>
                      <td className="text-center text-xs font-black text-slate-500">{i + 1}</td>
                      <td>
                        <Link href={`/players/${row.playerId}`} className="flex items-center gap-2 font-bold">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.avatarUrl} alt="" loading="lazy" className="h-7 w-7 rounded-full object-cover" />
                          <span className="truncate">{row.displayName}</span>
                        </Link>
                      </td>
                      <td className="text-xs text-slate-300">{row.primaryClub}</td>
                      <td className="text-xs text-slate-300">{row.detailedPosition}</td>
                      <td className="text-center tabular-nums text-slate-300">{row.seasonsCount}</td>
                      <td className="text-center tabular-nums font-black text-amber-300">{v.rating ?? "—"}</td>
                      <td className="text-right font-mono text-xs text-amber-200">
                        {v.wage != null ? formatWage(v.wage) : "—"}
                      </td>
                      <td className="text-center tabular-nums text-slate-300">{v.goals}</td>
                      <td className="text-center tabular-nums text-slate-300">{v.assists}</td>
                      <td className="text-center tabular-nums text-slate-300">{v.cleanSheets}</td>
                      <td className="text-center tabular-nums text-slate-300">{v.motm}</td>
                      <td className="text-center tabular-nums text-slate-300">{v.titles}</td>
                      <td className="text-right">
                        <span className="font-mono text-sm font-black text-orange-300">
                          {row.values.all.index}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/[0.06] px-6 py-3 text-[11px] text-slate-500">
            Showing {Math.min(200, sortedBank.length)} of {sortedBank.length} players. Season filter changes OVR, wage and match columns.
          </p>
        </div>
      ) : null}
    </>
  );
}

function RankCircle({ rank }: { rank: number }) {
  const padded = String(rank).padStart(2, "0");
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black",
        rank === 1 && "border-amber-300/60 bg-amber-400/20 text-amber-200",
        rank === 2 && "border-slate-300/45 bg-slate-300/15 text-slate-100",
        rank === 3 && "border-orange-500/45 bg-orange-500/15 text-orange-300",
        rank > 3 && "border-white/10 bg-white/[0.04] text-slate-400",
      )}
    >
      {padded}
    </span>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 10px ${color}44`,
        }}
      />
    </div>
  );
}

function Th({
  label,
  k,
  sort,
  setSort,
  align = "left",
}: {
  label: string;
  k: string;
  sort: { key: string; dir: "desc" | "asc" };
  setSort: (v: { key: string; dir: "desc" | "asc" }) => void;
  align?: "left" | "center" | "right";
}) {
  return (
    <th className={cn(align === "center" && "text-center", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => setSort({ key: k, dir: sort.key === k && sort.dir === "desc" ? "asc" : "desc" })}
        className={cn("inline-flex items-center gap-1 hover:text-white", sort.key === k && "text-orange-300")}
      >
        {label}
        {sort.key === k ? <span>{sort.dir === "desc" ? "↓" : "↑"}</span> : null}
      </button>
    </th>
  );
}

function Top25({ data }: { data: RankingsData }) {
  const entries = data.rankings[boardKey("all", "index")] ?? [];
  const top = entries.slice(0, 25);
  const podium = top.slice(0, 3);
  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">THE ELITE 25</p>
          <h2 className="text-2xl font-black text-white">
            Top 25 players<span className="text-orange-400">.</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">Ranked by all-time RSL Index. Every card is a real RSL player.</p>
        </div>
        <Link href="/play/compare" className="btn btn-sm">Compare two players ↗</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {podium.map((e, idx) => {
          const row = data.byPlayer[e.playerId];
          if (!row) return null;
          return (
            <div
              key={e.playerId}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-[#0a1122]/95 p-4",
                idx === 0 ? "border-orange-500/45 bg-gradient-to-br from-[#23140c] to-[#0a1122]" : "border-white/[0.08]",
              )}
            >
              <RankCircle rank={e.rank} />
              <Link href={`/players/${row.playerId}`} className="flex min-w-0 flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.avatarUrl} alt={row.username} className="h-12 w-12 rounded-full border border-white/15 object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{row.displayName}</span>
                  <span className="block truncate text-[11px] text-slate-400">{row.primaryClub}</span>
                </span>
              </Link>
              <span className="font-mono text-2xl font-black text-orange-300">{e.value}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {top.map((e) => {
          const row = data.byPlayer[e.playerId];
          if (!row) return null;
          return (
            <div key={e.playerId} className="relative">
              <span className="absolute -left-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/45 bg-[#101a35] text-xs font-black text-orange-200 shadow-lg">
                {e.rank}
              </span>
              <Link href={`/players/${row.playerId}`} className="block transition hover:-translate-y-1">
                <FutCard player={row.card} size="sm" subtitle={`${e.value} IDX`} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ClubPower({ data }: { data: RankingsData }) {
  const max = data.clubs[0]?.avgIndex ?? 1;
  const byTitles = [...data.clubs].sort((a, b) => b.titles - a.titles);
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1122]/90">
        <header className="border-b border-white/[0.06] px-6 py-4">
          <p className="eyebrow">CLUB POWER INDEX</p>
          <h2 className="mt-1 text-lg font-black text-white">Which club has the strongest roster?</h2>
          <p className="mt-1 text-xs text-slate-400">
            Average all-time RSL Index of every player who has represented the club.
          </p>
        </header>
        <ul className="divide-y divide-white/[0.05]">
          {data.clubs.map((c, i) => (
            <li key={c.club} className="flex items-center gap-3 px-6 py-3">
              <span className="w-6 text-center text-xs font-black text-slate-500">{i + 1}</span>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-black"
                style={{ borderColor: `${c.color}66`, background: `${c.color}22`, color: "#fff" }}
              >
                {c.short}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-white">{c.club}</p>
                  <span className="text-[10px] font-bold text-slate-500">{c.players} players</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Bar value={c.avgIndex} max={max} color={c.color} />
                  <span className="w-8 shrink-0 text-right font-mono text-xs font-black" style={{ color: c.color }}>
                    {c.avgIndex}
                  </span>
                </div>
              </div>
              {c.best ? (
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.best.avatarUrl} alt={c.best.name} className="h-7 w-7 rounded-full border border-white/10 object-cover" />
                  <div className="text-right">
                    <p className="max-w-24 truncate text-[11px] font-bold text-white">{c.best.name}</p>
                    <p className="text-[9px] text-slate-500">Best · {c.best.index} IDX</p>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1122]/90">
          <header className="border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">🏆 Trophy table</h3>
          </header>
          <ul className="divide-y divide-white/[0.05]">
            {byTitles.slice(0, 10).map((c, i) => (
              <li key={c.club} className="flex items-center gap-3 px-6 py-2.5 text-xs">
                <span className="w-5 text-center font-black text-slate-500">{i + 1}</span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate font-bold text-white">{c.club}</span>
                <span className="font-mono font-black text-amber-300">{c.titles}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0a1122]/90 p-5">
          <p className="eyebrow">LEAGUE INSIGHT</p>
          <h3 className="mt-1 text-base font-black text-white">A league built on movement</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Club power is calculated from each player&apos;s whole RSL history — including S2/S3/S4 sheet
            clubs and championship winner squads — so a single club legend can lift an entire era.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-[#070c1a] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Clubs ranked</p>
              <p className="text-xl font-black text-orange-300">{data.clubs.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#070c1a] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Official titles</p>
              <p className="text-xl font-black text-white">{data.totals.titles}</p>
            </div>
          </div>
          <Link href="/transfers" className="btn mt-4 w-full text-xs">Explore the Transfer Centre ↗</Link>
        </div>
      </div>
    </section>
  );
}

function SeasonLab({
  data,
  onOpenSeason,
}: {
  data: RankingsData;
  onOpenSeason: (scope: RankingScope) => void;
}) {
  const seasons = data.seasonSummaries.filter((s) => s.scope !== "all");
  const rated = seasons.filter((s) => s.avgOvr != null);
  const maxOvr = 100;
  const points = rated
    .map((s, i) => {
      const x = rated.length === 1 ? 150 : 20 + (i * 260) / (rated.length - 1);
      const y = 110 - ((s.avgOvr ?? 0) / maxOvr) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="mt-6 space-y-6">
      <div>
        <p className="eyebrow">SEASON LABORATORY</p>
        <h2 className="mt-1 text-2xl font-black text-white">
          Four chapters of RSL<span className="text-orange-400">.</span>
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-slate-400">
          Compare how the league&apos;s best players, ratings and wages shifted from the Spanish club eras to the EUROS.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0a1122]/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Average OVR evolution</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Mean playersheet rating, S2 → S4</p>
          </div>
          <span className="chip chip-orange">Sheet archives</span>
        </div>
        <svg viewBox="0 0 300 130" className="mt-4 h-40 w-full" preserveAspectRatio="none">
          {[20, 45, 70, 95].map((y) => (
            <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}
          <polyline points={points} fill="none" stroke="#ff7518" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {rated.map((s, i) => {
            const x = rated.length === 1 ? 150 : 20 + (i * 260) / (rated.length - 1);
            const y = 110 - ((s.avgOvr ?? 0) / maxOvr) * 90;
            return (
              <g key={s.scope}>
                <circle cx={x} cy={y} r="5" fill="#ff7518" stroke="#0a1020" strokeWidth="2" />
                <text x={x} y={y - 12} textAnchor="middle" className="fill-white text-[11px] font-black">
                  {s.avgOvr}
                </text>
                <text x={x} y="126" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {seasons.map((s, i) => (
          <div key={s.scope} className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1122]/90">
            <header
              className="border-b border-white/[0.06] px-5 py-4"
              style={{
                background: `linear-gradient(135deg, ${["#f2bd43", "#e76b53", "#75afd8", "#ff7518"][i]}22, transparent)`,
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">{s.label}</p>
              <h3 className="mt-1 text-lg font-black text-white">{s.era}</h3>
              <p className="text-[11px] text-slate-400">{s.ranked} players on record</p>
            </header>
            <div className="flex-1 space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-[#070c1a] px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Avg OVR</p>
                  <p className="text-lg font-black text-amber-300">{s.avgOvr ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#070c1a] px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Top wage</p>
                  <p className="font-mono text-xs font-black text-amber-200">
                    {s.highestWage ? formatWage(s.highestWage.value) : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Top 5 · RSL Index</p>
                <ol className="space-y-1.5">
                  {s.topFive.map((p, idx) => (
                    <li key={`${p.name}-${idx}`} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatarUrl} alt={p.name} loading="lazy" className="h-6 w-6 rounded-full border border-white/10 object-cover" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">{p.name}</span>
                      <span className="font-mono text-[11px] font-black text-orange-300">{p.value}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-white/[0.06] pt-3">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Champions</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.champions.length ? (
                    s.champions.map((c) => (
                      <span key={c} className="chip chip-amber">🏆 {c}</span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">To be crowned</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenSeason(s.scope)}
              className="w-full border-t border-white/[0.06] px-5 py-3 text-center text-[11px] font-black text-orange-300 transition hover:bg-white/[0.03]"
            >
              Open {s.label} ladder →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
