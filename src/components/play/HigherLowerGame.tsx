"use client";

import { useMemo, useState } from "react";
import { MiniLeaderboard, PlaySubnav, ScoreSubmitBox } from "@/components/play/PlayChrome";
import type { ArcadeScore } from "@/db/schema";
import type { ArcadePlayer } from "@/lib/arcade-data";
import { cn, formatWage } from "@/lib/site";

type StatMode = "wage" | "ovr";

function pickChallenger(pool: ArcadePlayer[], current: ArcadePlayer): ArcadePlayer {
  const candidates = pool.filter((p) => p.id !== current.id);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? current;
}

export function HigherLowerGame({
  players,
  initialScores,
}: {
  players: ArcadePlayer[];
  initialScores: ArcadeScore[];
}) {
  // Use players with real sheet appearances so values are meaningful and varied
  const pool = useMemo(
    () => players.filter((p) => p.seasons.length > 0 && p.peakWage > 0),
    [players],
  );

  const [statMode, setStatMode] = useState<StatMode>("wage");
  const [champion, setChampion] = useState<ArcadePlayer>(() => pool[0] ?? players[0]);
  const [challenger, setChallenger] = useState<ArcadePlayer>(() =>
    pickChallenger(pool.length ? pool : players, pool[0] ?? players[0]),
  );
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [revealed, setRevealed] = useState<"win" | "lose" | null>(null);
  const [gameOverStreak, setGameOverStreak] = useState<number | null>(null);
  const [scores, setScores] = useState<ArcadeScore[]>(initialScores);

  const valOf = (p: ArcadePlayer) => (statMode === "wage" ? p.peakWage : p.peakOvr);
  const fmtVal = (p: ArcadePlayer) =>
    statMode === "wage" ? formatWage(p.peakWage) : `${p.peakOvr} OVR`;

  function resetRun(nextMode: StatMode = statMode) {
    const activePool = pool.length ? pool : players;
    const first = activePool[Math.floor(Math.random() * activePool.length)];
    const second = pickChallenger(activePool, first);
    setStatMode(nextMode);
    setChampion(first);
    setChallenger(second);
    setStreak(0);
    setRevealed(null);
    setGameOverStreak(null);
  }

  function guess(direction: "higher" | "lower") {
    if (revealed !== null) return;
    const a = valOf(champion);
    const b = valOf(challenger);
    const correct = direction === "higher" ? b >= a : b <= a;

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
      setRevealed("win");
      setTimeout(() => {
        const activePool = pool.length ? pool : players;
        const nextChallenger = pickChallenger(activePool, challenger);
        setChampion(challenger);
        setChallenger(nextChallenger);
        setRevealed(null);
      }, 950);
    } else {
      setRevealed("lose");
      setGameOverStreak(streak);
    }
  }

  return (
    <>
      <PlaySubnav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">RSL ARCADE / STREAK BLITZ</p>
          <h1 className="page-title">
            Higher or Lower<span className="text-orange-400">.</span>
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Does the challenger have a higher or lower peak RSL {statMode === "wage" ? "sheet wage" : "overall rating"}? Equal values count in your favour!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => resetRun("wage")}
            className={cn("btn btn-sm", statMode === "wage" && "btn-primary")}
          >
            💰 Peak Wage Mode
          </button>
          <button
            type="button"
            onClick={() => resetRun("ovr")}
            className={cn("btn btn-sm", statMode === "ovr" && "btn-primary")}
          >
            ⭐ Peak OVR Mode
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {/* Streak scoreboard */}
          <div className="panel flex items-center justify-between px-5 py-3.5 text-xs">
            <span>
              Current Streak:{" "}
              <strong className="font-mono text-lg font-black text-orange-300">{streak}</strong>
            </span>
            <span>
              Session Best:{" "}
              <strong className="font-mono text-lg font-black text-amber-300">{bestStreak}</strong>
            </span>
          </div>

          {/* Face-off arena */}
          <div className="relative grid gap-4 md:grid-cols-2">
            {/* Holder card */}
            <div className="panel flex flex-col items-center justify-between border-orange-400/35 p-6 text-center">
              <span className="chip chip-orange">DEFENDING HOLDER</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={champion.avatarUrl}
                alt={champion.username}
                className="mt-4 h-28 w-28 rounded-full border-2 border-orange-400/45 bg-[#0b1530] object-cover shadow-xl"
              />
              <div className="mt-4">
                <h2 className="text-2xl font-black text-white">{champion.username}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {champion.detailedPosition} · {champion.primaryClub}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Active: {champion.seasons.join(", ") || "RSL Roster"}
                </p>
              </div>
              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-[#071026] py-3.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {statMode === "wage" ? "PEAK SHEET WAGE" : "PEAK RATING"}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-amber-300">
                  {fmtVal(champion)}
                </p>
              </div>
            </div>

            {/* VS pill */}
            <div className="pointer-events-none hidden md:flex absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#0b1530] text-xs font-black text-orange-300 shadow-2xl">
              VS
            </div>

            {/* Challenger card */}
            <div
              className={cn(
                "panel flex flex-col items-center justify-between p-6 text-center transition",
                revealed === "win" && "border-emerald-400/60 bg-emerald-500/10",
                revealed === "lose" && "border-red-400/60 bg-red-500/10",
              )}
            >
              <span className="chip chip-blue">CHALLENGER</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={challenger.avatarUrl}
                alt={challenger.username}
                className="mt-4 h-28 w-28 rounded-full border-2 border-blue-400/45 bg-[#0b1530] object-cover shadow-xl"
              />
              <div className="mt-4">
                <h2 className="text-2xl font-black text-white">{challenger.username}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {challenger.detailedPosition} · {challenger.primaryClub}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Active: {challenger.seasons.join(", ") || "RSL Roster"}
                </p>
              </div>

              {revealed ? (
                <div className="mt-5 w-full rounded-2xl border border-white/15 bg-[#071026] py-3.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {revealed === "win" ? "✔ CORRECT!" : "✖ STREAK ENDED"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-2xl font-black",
                      revealed === "win" ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {fmtVal(challenger)}
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => guess("higher")}
                    className="btn btn-primary py-3 text-xs font-black uppercase tracking-wider"
                  >
                    ▲ Higher
                  </button>
                  <button
                    type="button"
                    onClick={() => guess("lower")}
                    className="btn py-3 text-xs font-black uppercase tracking-wider hover:border-amber-300/50"
                  >
                    ▼ Lower
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Game over summary + leaderboard submit */}
          {revealed === "lose" ? (
            <div className="space-y-3">
              <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="eyebrow">RUN OVER</p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    You reached a streak of {gameOverStreak ?? 0}!
                  </h3>
                </div>
                <button type="button" onClick={() => resetRun(statMode)} className="btn btn-primary btn-sm">
                  Play again ↻
                </button>
              </div>

              {(gameOverStreak ?? 0) > 0 ? (
                <ScoreSubmitBox
                  game="higher-lower"
                  score={gameOverStreak ?? 0}
                  detail={`${statMode === "wage" ? "Peak Wage" : "Peak OVR"} Blitz`}
                  label="Post streak to Hall of Fame"
                  onSaved={(entry) =>
                    setScores((prev) => [entry, ...prev].sort((a, b) => b.score - a.score))
                  }
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <MiniLeaderboard title="🔥 Streak Hall of Fame" scores={scores} unit="streak" />
      </div>
    </>
  );
}
