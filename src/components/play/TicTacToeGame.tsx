"use client";

import { useEffect, useMemo, useState } from "react";
import { MiniLeaderboard, PlaySubnav, ScoreSubmitBox } from "@/components/play/PlayChrome";
import type { ArcadeScore } from "@/db/schema";
import type { ArcadePlayer } from "@/lib/arcade-data";
import { cn } from "@/lib/site";

type Rule = {
  id: string;
  label: string;
  sub: string;
  group: "club" | "season" | "class" | "stat" | "pos" | "honour";
  badge?: string;
  match: (p: ArcadePlayer) => boolean;
};

const ROW_RULES: Rule[] = [
  { id: "club-rma", label: "Real Madrid C.F.", sub: "Club history", group: "club", badge: "/images/teams/real-madrid.png", match: (p) => p.clubs.includes("Real Madrid C.F.") },
  { id: "club-bar", label: "F.C. Barcelona", sub: "Club history", group: "club", badge: "/images/teams/barcelona.png", match: (p) => p.clubs.includes("F.C. Barcelona") },
  { id: "club-spo", label: "Sporting CP", sub: "Club history", group: "club", badge: "/images/teams/sporting-cp.png", match: (p) => p.clubs.includes("Sporting CP") },
  { id: "club-atm", label: "Atletico Madrid", sub: "S2 sheet club", group: "club", match: (p) => p.clubs.includes("Atletico Madrid") },
  { id: "club-bol", label: "Bologna F.C.", sub: "S3 sheet club", group: "club", match: (p) => p.clubs.includes("Bologna F.C.") },
  { id: "club-int", label: "Inter Milan", sub: "S3 sheet club", group: "club", match: (p) => p.clubs.includes("Inter Milan") },
  { id: "club-com", label: "Como 1907", sub: "Club history", group: "club", badge: "/images/teams/como.png", match: (p) => p.clubs.includes("Como 1907") },
  { id: "club-vil", label: "Villareal", sub: "S1 Champions / Club", group: "club", badge: "/images/teams/villareal.png", match: (p) => p.clubs.includes("Villareal") },
  { id: "sea-s2", label: "S2 Playersheet", sub: "Appeared in S2", group: "season", match: (p) => p.seasons.includes("S2") },
  { id: "sea-s3", label: "S3 Playersheet", sub: "Appeared in S3", group: "season", match: (p) => p.seasons.includes("S3") },
  { id: "sea-s4", label: "S4 Playersheet", sub: "Appeared in S4", group: "season", match: (p) => p.seasons.includes("S4") },
];

const COL_RULES: Rule[] = [
  { id: "cls-xs", label: "X or S Class", sub: "Peak sheet tier", group: "class", match: (p) => p.classFamilies.includes("X") || p.classFamilies.includes("S") },
  { id: "cls-a", label: "A Class", sub: "Any A+/A/A- sheet", group: "class", match: (p) => p.classFamilies.includes("A") },
  { id: "cls-b", label: "B Class", sub: "Any B+/B/B- sheet", group: "class", match: (p) => p.classFamilies.includes("B") },
  { id: "ovr-85", label: "85+ Peak OVR", sub: "Overall rating", group: "stat", match: (p) => p.peakOvr >= 85 },
  { id: "ovr-82", label: "82+ Peak OVR", sub: "Overall rating", group: "stat", match: (p) => p.peakOvr >= 82 },
  { id: "wage-300", label: "$300k+ Wage", sub: "Peak season wage", group: "stat", match: (p) => p.peakWage >= 300000 },
  { id: "wage-200", label: "$200k+ Wage", sub: "Peak season wage", group: "stat", match: (p) => p.peakWage >= 200000 },
  { id: "honour-any", label: "Trophy / Award", sub: "Award or S1 Winner", group: "honour", match: (p) => p.awards.length > 0 || p.isS1Winner || p.teamTrophies.length > 0 },
  { id: "pos-def", label: "Defender / CB", sub: "Position", group: "pos", match: (p) => p.position === "DEF" || p.detailedPosition === "CB" },
  { id: "pos-mid", label: "Midfielder", sub: "CM / CDM / CAM", group: "pos", match: (p) => p.position === "MID" || ["CM", "CDM", "CAM"].includes(p.detailedPosition) },
  { id: "pos-fwd", label: "Attacker / ST", sub: "ST / LW / RW", group: "pos", match: (p) => p.position === "FWD" || ["ST", "LW", "RW"].includes(p.detailedPosition) },
  { id: "multi-sea", label: "2+ Seasons", sub: "Veteran on record", group: "season", match: (p) => p.seasons.length >= 2 },
];

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type Mode = "solo" | "pvp" | "bot";
type Owner = "X" | "O";

type CellFill = {
  owner: Owner;
  player: ArcadePlayer;
  rarityCount: number;
  points: number;
};

function shuffle<T>(items: T[], rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Ensures all 9 cells have distinct valid RSL solutions. */
function generateSolvableBoard(players: ArcadePlayer[]): { rows: Rule[]; cols: Rule[] } {
  for (let attempt = 0; attempt < 180; attempt++) {
    const rows = shuffle(ROW_RULES).slice(0, 3);
    const cols = shuffle(COL_RULES).slice(0, 3);

    // Avoid duplicate season-vs-season rules that trivially overlap awkwardly
    const pools: ArcadePlayer[][] = [];
    let allNonEmpty = true;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const matches = players.filter((p) => rows[r].match(p) && cols[c].match(p));
        if (matches.length < 2) {
          allNonEmpty = false;
          break;
        }
        pools.push(matches);
      }
      if (!allNonEmpty) break;
    }
    if (!allNonEmpty) continue;

    // Backtracking check that 9 unique players can fill all 9 squares simultaneously
    const order = pools
      .map((pool, idx) => ({ idx, pool }))
      .sort((a, b) => a.pool.length - b.pool.length);
    const used = new Set<number>();

    const canAssign = (step: number): boolean => {
      if (step === 9) return true;
      for (const candidate of order[step].pool) {
        if (used.has(candidate.id)) continue;
        used.add(candidate.id);
        if (canAssign(step + 1)) return true;
        used.delete(candidate.id);
      }
      return false;
    };

    if (canAssign(0)) return { rows, cols };
  }

  return {
    rows: [ROW_RULES[8], ROW_RULES[9], ROW_RULES[10]],
    cols: [COL_RULES[0], COL_RULES[1], COL_RULES[2]],
  };
}

function checkWinner(cells: Array<CellFill | null>): { winner: Owner; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[b] && cells[c] && cells[a]!.owner === cells[b]!.owner && cells[a]!.owner === cells[c]!.owner) {
      return { winner: cells[a]!.owner, line };
    }
  }
  return null;
}

export function TicTacToeGame({
  players,
  initialScores,
}: {
  players: ArcadePlayer[];
  initialScores: ArcadeScore[];
}) {
  const [mode, setMode] = useState<Mode>("solo");
  const [board, setBoard] = useState<{ rows: Rule[]; cols: Rule[] }>(() =>
    generateSolvableBoard(players),
  );
  const [cells, setCells] = useState<Array<CellFill | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<Owner>("X");
  const [guessesLeft, setGuessesLeft] = useState(12);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null);
  const [showCounts, setShowCounts] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<ArcadeScore[]>(initialScores);

  const cellPools = useMemo(() => {
    return Array.from({ length: 9 }, (_, idx) => {
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      return players.filter((p) => board.rows[r]?.match(p) && board.cols[c]?.match(p));
    });
  }, [board, players]);

  const usedPlayerIds = useMemo(
    () => new Set(cells.filter((c): c is CellFill => !!c).map((c) => c.player.id)),
    [cells],
  );

  const winResult = useMemo(() => checkWinner(cells), [cells]);
  const filledCount = cells.filter(Boolean).length;

  const gameOver =
    revealed ||
    filledCount === 9 ||
    (mode === "solo" && guessesLeft <= 0) ||
    (mode !== "solo" && !!winResult);

  const soloScore = useMemo(() => {
    const base = cells.reduce((acc, c) => acc + (c?.points ?? 0), 0);
    const fullGridBonus = filledCount === 9 && !revealed ? 250 : 0;
    const winBonus = mode === "bot" && winResult?.winner === "X" && !revealed ? 300 : 0;
    return base + fullGridBonus + winBonus;
  }, [cells, filledCount, mode, revealed, winResult]);

  function startNewGame(nextMode: Mode = mode) {
    setMode(nextMode);
    setBoard(generateSolvableBoard(players));
    setCells(Array(9).fill(null));
    setTurn("X");
    setGuessesLeft(12);
    setActiveCell(null);
    setSearch("");
    setRevealed(false);
    setFeedback(null);
  }

  // Bot turn logic when mode === "bot" and turn === "O"
  useEffect(() => {
    if (mode !== "bot" || turn !== "O" || gameOver) return;
    const timer = setTimeout(() => {
      const openIndices = cells
        .map((c, idx) => (c === null ? idx : -1))
        .filter((i) => i >= 0);
      if (!openIndices.length) return;

      // Bot picks winning move -> blocking move -> center -> random
      const pickLineMove = (targetOwner: Owner): number | null => {
        for (const line of WIN_LINES) {
          const vals = line.map((i) => cells[i]);
          const owned = vals.filter((v) => v?.owner === targetOwner).length;
          const emptyPos = line.find((i) => cells[i] === null);
          if (owned === 2 && emptyPos !== undefined) {
            const validForBot = cellPools[emptyPos].filter((p) => !usedPlayerIds.has(p.id));
            if (validForBot.length) return emptyPos;
          }
        }
        return null;
      };

      let targetIdx =
        pickLineMove("O") ??
        pickLineMove("X") ??
        (cells[4] === null && cellPools[4].some((p) => !usedPlayerIds.has(p.id)) ? 4 : null);

      if (targetIdx === null) {
        const playable = openIndices.filter((i) =>
          cellPools[i].some((p) => !usedPlayerIds.has(p.id)),
        );
        if (!playable.length) {
          setTurn("X");
          return;
        }
        targetIdx = playable[Math.floor(Math.random() * playable.length)];
      }

      const candidates = cellPools[targetIdx].filter((p) => !usedPlayerIds.has(p.id));
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (!chosen) {
        setTurn("X");
        return;
      }

      const next = [...cells];
      next[targetIdx] = {
        owner: "O",
        player: chosen,
        rarityCount: cellPools[targetIdx].length,
        points: 0,
      };
      setCells(next);
      setFeedback({
        tone: "info",
        text: `🤖 RSL Bot played ${chosen.username} at Row ${Math.floor(targetIdx / 3) + 1}, Col ${(targetIdx % 3) + 1}. Your turn!`,
      });
      setTurn("X");
    }, 650);

    return () => clearTimeout(timer);
  }, [cellPools, cells, gameOver, mode, turn, usedPlayerIds]);

  function submitGuess(player: ArcadePlayer) {
    if (activeCell === null || gameOver) return;
    if (usedPlayerIds.has(player.id)) {
      setFeedback({ tone: "err", text: `${player.username} is already on the grid!` });
      return;
    }

    const r = Math.floor(activeCell / 3);
    const c = activeCell % 3;
    const rowRule = board.rows[r];
    const colRule = board.cols[c];
    const matches = rowRule.match(player) && colRule.match(player);

    if (mode === "solo") {
      setGuessesLeft((g) => g - 1);
    }

    if (!matches) {
      const nextTurn = mode === "solo" ? "X" : turn === "X" ? "O" : "X";
      setFeedback({
        tone: "err",
        text: `✖ ${player.username} doesn't match "${rowRule.label}" + "${colRule.label}".${
          mode !== "solo" ? ` Turn passes to ${nextTurn}!` : ""
        }`,
      });
      if (mode !== "solo") setTurn(nextTurn);
      setActiveCell(null);
      setSearch("");
      return;
    }

    const rarity = cellPools[activeCell].length;
    // Rarer answers score higher (up to 160 pts per square)
    const pts = turn === "X" ? Math.max(60, 170 - rarity * 4) - (showCounts ? 10 : 0) : 0;

    const next = [...cells];
    next[activeCell] = {
      owner: turn,
      player,
      rarityCount: rarity,
      points: pts,
    };
    setCells(next);
    setFeedback({
      tone: "ok",
      text: `✔ ${player.username} locked in! (${rarity} valid RSL ${rarity === 1 ? "player fits" : "players fit"} this square${pts ? ` · +${pts} pts` : ""})`,
    });
    if (mode !== "solo") {
      setTurn(turn === "X" ? "O" : "X");
    }
    setActiveCell(null);
    setSearch("");
  }

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players.slice(0, 12);
    return players
      .filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q),
      )
      .slice(0, 16);
  }, [players, search]);

  return (
    <>
      <PlaySubnav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">RSL ARCADE / TIKI-TAKA-TOE</p>
          <h1 className="page-title">
            RSL Tic-Tac-Toe<span className="text-orange-400">.</span>
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Click any square and name a real RSL player who satisfies both the Row and Column criteria.
            Rarer picks earn bigger points!
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["solo", "Solo Grid (9/9)"],
              ["bot", "vs RSL Bot"],
              ["pvp", "2P Pass & Play"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => startNewGame(m)}
              className={cn("btn btn-sm", mode === m && "btn-primary")}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={() => startNewGame(mode)} className="btn btn-sm">
            ↻ New board
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div>
          {/* Status bar */}
          <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-xs">
            {mode === "solo" ? (
              <div className="flex items-center gap-4">
                <span>
                  Filled: <strong className="font-black text-white">{filledCount}/9</strong>
                </span>
                <span>
                  Guesses left:{" "}
                  <strong className={cn("font-black", guessesLeft <= 3 ? "text-red-300" : "text-orange-300")}>
                    {guessesLeft}
                  </strong>
                </span>
                <span>
                  Score: <strong className="font-mono text-sm font-black text-amber-300">{soloScore}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className={cn("rounded-lg px-2.5 py-1 font-black", turn === "X" ? "bg-orange-500 text-[#0b1228]" : "bg-white/5 text-slate-400")}>
                  ✕ Player 1 (NED)
                </span>
                <span className={cn("rounded-lg px-2.5 py-1 font-black", turn === "O" ? "bg-amber-400 text-[#0b1228]" : "bg-white/5 text-slate-400")}>
                  ◯ {mode === "bot" ? "RSL Bot" : "Player 2 (BEL)"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCounts((v) => !v)}
                className={cn("btn btn-sm", showCounts && "border-orange-400/50 text-orange-200")}
              >
                {showCounts ? "Hide pool counts" : "Hint: pool sizes"}
              </button>
              {!revealed && !gameOver ? (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="btn btn-sm text-slate-400"
                >
                  Give up &amp; reveal
                </button>
              ) : null}
            </div>
          </div>

          {feedback ? (
            <div
              className={cn(
                "mb-4 rounded-xl border px-4 py-3 text-xs font-bold",
                feedback.tone === "ok" && "border-orange-400/40 bg-orange-500/12 text-orange-100",
                feedback.tone === "err" && "border-red-500/35 bg-red-500/12 text-red-200",
                feedback.tone === "info" && "border-blue-400/35 bg-blue-500/12 text-blue-100",
              )}
            >
              {feedback.text}
            </div>
          ) : null}

          {/* 3x3 Tiki-Taka-Toe Board */}
          <div className="panel overflow-x-auto p-4 sm:p-6">
            <div className="grid min-w-[470px] grid-cols-[125px_repeat(3,minmax(105px,1fr))] gap-2.5 sm:grid-cols-[148px_repeat(3,minmax(120px,1fr))] sm:gap-3">
              {/* Top-left corner badge */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#081128] p-3 text-center">
                <span className="text-lg font-black tracking-tight text-orange-400">RSL</span>
                <span className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">
                  GRID 3×3
                </span>
              </div>

              {/* Column headers */}
              {board.cols.map((col) => (
                <div
                  key={col.id}
                  className="flex flex-col items-center justify-center rounded-2xl border border-blue-400/25 bg-[#0d1b3e] px-2.5 py-3 text-center"
                >
                  <span className="text-xs font-black text-white sm:text-sm">{col.label}</span>
                  <span className="mt-0.5 text-[10px] font-semibold text-slate-400">{col.sub}</span>
                </div>
              ))}

              {/* 3 rows */}
              {board.rows.map((row, rIdx) => (
                <div key={row.id} className="contents">
                  {/* Row header */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-400/25 bg-[#121e42] px-2.5 py-3 text-center">
                    {row.badge ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.badge} alt="" className="mb-1.5 h-7 w-7 object-contain" />
                    ) : null}
                    <span className="text-xs font-black text-white sm:text-sm">{row.label}</span>
                    <span className="mt-0.5 text-[10px] font-semibold text-slate-400">{row.sub}</span>
                  </div>

                  {/* 3 cells in row */}
                  {[0, 1, 2].map((cIdx) => {
                    const idx = rIdx * 3 + cIdx;
                    const fill = cells[idx];
                    const isWinningCell = winResult?.line.includes(idx);
                    const pool = cellPools[idx];

                    if (fill) {
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "relative flex min-h-[124px] flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition",
                            fill.owner === "X"
                              ? "border-orange-400/60 bg-orange-500/15"
                              : "border-amber-300/60 bg-amber-400/15",
                            isWinningCell && "ring-2 ring-white shadow-[0_0_25px_rgba(255,117,24,0.45)]",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-black",
                              fill.owner === "X"
                                ? "bg-orange-500 text-[#0b1126]"
                                : "bg-amber-300 text-[#0b1126]",
                            )}
                          >
                            {fill.owner}
                          </span>
                          <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-300">
                            {fill.player.peakOvr} OVR
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fill.player.avatarUrl}
                            alt={fill.player.username}
                            className="h-12 w-12 rounded-full border border-white/25 bg-[#09122a] object-cover"
                          />
                          <p className="mt-1.5 w-full truncate text-xs font-black text-white">
                            {fill.player.username}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-300">
                            {fill.points ? `+${fill.points} pts` : `Pool: ${fill.rarityCount}`}
                          </p>
                        </div>
                      );
                    }

                    if (revealed) {
                      const sample = pool.slice(0, 3);
                      return (
                        <div
                          key={idx}
                          className="flex min-h-[124px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#081128] p-2.5 text-center"
                        >
                          <p className="text-[9px] font-black uppercase tracking-wider text-orange-300">
                            {pool.length} valid
                          </p>
                          <ul className="mt-1 space-y-0.5 text-[11px] font-bold text-slate-200">
                            {sample.map((s) => (
                              <li key={s.id} className="truncate max-w-[110px]">
                                {s.username}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={gameOver || (mode === "bot" && turn === "O")}
                        onClick={() => {
                          setActiveCell(idx);
                          setSearch("");
                        }}
                        className={cn(
                          "group flex min-h-[124px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#09132d] p-3 text-center transition hover:border-orange-400/55 hover:bg-[#10204a] disabled:cursor-not-allowed disabled:opacity-50",
                          activeCell === idx && "border-orange-400 ring-2 ring-orange-400/40",
                        )}
                      >
                        <span className="text-2xl font-light text-slate-500 transition group-hover:scale-110 group-hover:text-orange-300">
                          +
                        </span>
                        <span className="mt-1 text-[10px] font-bold text-slate-500 group-hover:text-slate-300">
                          Pick player
                        </span>
                        {showCounts ? (
                          <span className="mt-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-orange-200">
                            {pool.length} fit
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* End-of-game banner & score submit */}
          {gameOver ? (
            <div className="mt-4 space-y-3">
              <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="eyebrow">ROUND COMPLETE</p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {winResult
                      ? winResult.winner === "X"
                        ? mode === "pvp"
                          ? "🏆 Player 1 (NED) wins 3-in-a-row!"
                          : "🏆 You defeated the RSL Bot!"
                        : mode === "pvp"
                          ? "🏆 Player 2 (BEL) wins 3-in-a-row!"
                          : "🤖 RSL Bot connected 3-in-a-row!"
                      : filledCount === 9 && !revealed
                        ? `🔥 Immaculate 9/9 Grid! (${soloScore} pts)`
                        : `Round finished · ${filledCount}/9 squares solved`}
                  </h2>
                </div>
                <div className="flex gap-2">
                  {!revealed ? (
                    <button type="button" onClick={() => setRevealed(true)} className="btn btn-sm">
                      See missed answers
                    </button>
                  ) : null}
                  <button type="button" onClick={() => startNewGame(mode)} className="btn btn-primary btn-sm">
                    Play again ↻
                  </button>
                </div>
              </div>

              {!revealed && soloScore > 0 && mode !== "pvp" ? (
                <ScoreSubmitBox
                  game="tic-tac-toe"
                  score={soloScore}
                  detail={`${mode === "bot" ? "vs Bot" : "Solo Grid"} · ${filledCount}/9 squares`}
                  onSaved={(entry) => setScores((prev) => [entry, ...prev].sort((a, b) => b.score - a.score))}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right column: Active square picker OR rules + leaderboard */}
        <div className="space-y-5">
          {activeCell !== null && !gameOver ? (
            <div className="panel p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="eyebrow">SELECT RSL PLAYER</p>
                  <h3 className="mt-1 text-base font-black text-white">
                    {board.rows[Math.floor(activeCell / 3)].label}{" "}
                    <span className="text-orange-400">×</span>{" "}
                    {board.cols[activeCell % 3].label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="btn btn-sm px-2.5 py-1"
                >
                  ✕
                </button>
              </div>

              <input
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type Roblox username…"
                className="input mt-3"
              />

              <ul className="mt-3 max-h-80 divide-y divide-white/[0.06] overflow-y-auto">
                {searchResults.map((p) => {
                  const used = usedPlayerIds.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={used}
                        onClick={() => submitGuess(p)}
                        className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition hover:bg-white/[0.05] disabled:opacity-40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.avatarUrl}
                          alt={p.username}
                          className="h-9 w-9 shrink-0 rounded-full border border-white/15 bg-[#0b1530] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-white">{p.username}</p>
                          <p className="truncate text-[11px] text-slate-400">
                            {p.detailedPosition} · {p.seasons.join("/")}
                          </p>
                        </div>
                        <span className="chip">{used ? "Used" : "Select"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="panel p-5">
              <p className="eyebrow">HOW IT WORKS</p>
              <h3 className="mt-1 text-base font-black text-white">League lore meets Tic-Tac-Toe</h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
                <li>• Every board is verified against the real RSL database so all 9 squares are solvable.</li>
                <li>• Club rules match a player&apos;s current club, Season 1 championship roster, or S2/S3/S4 sheet clubs.</li>
                <li>• Naming a rare answer (fewer valid players in the pool) awards up to <strong>166 pts</strong> per square!</li>
              </ul>
            </div>
          )}

          <MiniLeaderboard title="⊞ Tic-Tac-Toe Hall of Fame" scores={scores} unit="pts" />
        </div>
      </div>
    </>
  );
}
