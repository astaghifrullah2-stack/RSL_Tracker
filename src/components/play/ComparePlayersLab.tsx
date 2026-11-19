"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FutCard } from "@/components/play/FutCard";
import { PlaySubnav } from "@/components/play/PlayChrome";
import type { ArcadePlayer } from "@/lib/arcade-data";
import { cn, formatWage } from "@/lib/site";

const RIVALRY_PRESETS: Array<[string, string, string]> = [
  ["Dembe3le", "Ioqawa", "S4 X-Class Top 2"],
  ["Zvlatan", "Kylzno", "All-Era Superstars"],
  ["Ervxttini", "LivingInLiverpool", "Elite Scorers & Mids"],
  ["RelixMoon", "nunken_insanio", "Defensive Titans"],
];

function RadarHexagon({ a, b }: { a: ArcadePlayer; b: ArcadePlayer }) {
  const axes: Array<[string, number, number]> = [
    ["AER", a.attrs.pac, b.attrs.pac],
    ["SHO", a.attrs.sho, b.attrs.sho],
    ["PAS", a.attrs.pas, b.attrs.pas],
    ["DRI", a.attrs.dri, b.attrs.dri],
    ["DEF", a.attrs.def, b.attrs.def],
    ["INT", a.attrs.phy, b.attrs.phy],
  ];

  const cx = 140;
  const cy = 140;
  const maxR = 96;

  const point = (idx: number, ratio: number) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 6;
    return [cx + Math.cos(angle) * maxR * ratio, cy + Math.sin(angle) * maxR * ratio] as const;
  };

  const poly = (vals: number[]) =>
    vals
      .map((v, i) => {
        const r = Math.max(0.18, Math.min(1, (v - 35) / 65));
        const [x, y] = point(i, r);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg viewBox="0 0 280 280" className="mx-auto h-64 w-64 sm:h-72 sm:w-72" aria-label="Attribute radar chart">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={Array.from({ length: 6 }, (_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        );
      })}
      {/* Player B polygon (Gold) */}
      <polygon
        points={poly(axes.map((x) => x[2]))}
        fill="rgba(245, 198, 57, 0.22)"
        stroke="#f5c639"
        strokeWidth="2.5"
      />
      {/* Player A polygon (Orange) */}
      <polygon
        points={poly(axes.map((x) => x[1]))}
        fill="rgba(255, 117, 24, 0.26)"
        stroke="#ff7518"
        strokeWidth="2.5"
      />
      {axes.map(([label], i) => {
        const [lx, ly] = point(i, 1.2);
        return (
          <text
            key={label}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-300 text-[11px] font-black"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function PlayerPicker({
  label,
  accent,
  selected,
  players,
  onSelect,
}: {
  label: string;
  accent: "orange" | "gold";
  selected: ArcadePlayer;
  players: ArcadePlayer[];
  onSelect: (p: ArcadePlayer) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players.slice(0, 25);
    return players
      .filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          p.primaryClub.toLowerCase().includes(q) ||
          p.peakClass.toLowerCase().includes(q),
      )
      .slice(0, 25);
  }, [players, query]);

  return (
    <div className="relative">
      <p
        className={cn(
          "mb-1.5 text-[10px] font-black uppercase tracking-[.2em]",
          accent === "orange" ? "text-orange-300" : "text-amber-300",
        )}
      >
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border bg-[#0b1634] px-3.5 py-2.5 text-left transition hover:brightness-110",
          accent === "orange" ? "border-orange-400/45" : "border-amber-300/45",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selected.avatarUrl}
          alt={selected.username}
          className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white">{selected.username}</p>
          <p className="truncate text-[11px] text-slate-400">
            {selected.peakOvr} OVR · {selected.peakClass} · {selected.primaryClub}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-white/15 bg-[#070f26] p-3 shadow-2xl">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username, club, class…"
            className="input text-xs"
          />
          <ul className="mt-2 max-h-64 divide-y divide-white/[0.06] overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 px-2 py-2 text-left text-xs transition hover:bg-white/[0.06]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  <span className="min-w-0 flex-1 truncate font-bold text-white">{p.username}</span>
                  <span className="font-mono font-black text-orange-300">{p.peakOvr}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ComparePlayersLab({ players, initialA, initialB }: { players: ArcadePlayer[]; initialA?: number; initialB?: number }) {
  const findByName = (name: string) =>
    players.find((p) => p.username.toLowerCase() === name.toLowerCase());

  const [playerA, setPlayerA] = useState<ArcadePlayer>(
    () => players.find(p => p.id === initialA) ?? findByName("Dembe3le") ?? players[0],
  );
  const [playerB, setPlayerB] = useState<ArcadePlayer>(
    () => players.find(p => p.id === initialB && p.id !== playerA.id) ?? players.find(p => p.username.toLowerCase() === "zvlatan" && p.id !== playerA.id) ?? players.find(p => p.id !== playerA.id) ?? players[0],
  );

  function pickRandom() {
    if (players.length < 2) return;
    const topPool = players.slice(0, Math.min(60, players.length));
    const idxA = Math.floor(Math.random() * topPool.length);
    let idxB = Math.floor(Math.random() * topPool.length);
    if (idxB === idxA) idxB = (idxA + 1) % topPool.length;
    setPlayerA(topPool[idxA]);
    setPlayerB(topPool[idxB]);
  }

  const metrics = [
    { label: "Peak OVR Rating", a: playerA.peakOvr, b: playerB.peakOvr, fmt: (v: number) => `${v}` },
    { label: "Current / Latest OVR", a: playerA.latestOvr, b: playerB.latestOvr, fmt: (v: number) => `${v}` },
    { label: "Peak Season Wage", a: playerA.peakWage, b: playerB.peakWage, fmt: (v: number) => formatWage(v) },
    { label: "Individual Awards", a: playerA.awards.length, b: playerB.awards.length, fmt: (v: number) => `${v}` },
    { label: "Team Silverware", a: playerA.teamTrophies.length, b: playerB.teamTrophies.length, fmt: (v: number) => `${v}` },
    { label: "Seasons on Record", a: playerA.seasons.length, b: playerB.seasons.length, fmt: (v: number) => `${v}` },
    { label: "Aerial (AER)", a: playerA.attrs.pac, b: playerB.attrs.pac, fmt: (v: number) => `${v}` },
    { label: "Shooting (SHO)", a: playerA.attrs.sho, b: playerB.attrs.sho, fmt: (v: number) => `${v}` },
    { label: "Passing (PAS)", a: playerA.attrs.pas, b: playerB.attrs.pas, fmt: (v: number) => `${v}` },
    { label: "Dribbling (DRI)", a: playerA.attrs.dri, b: playerB.attrs.dri, fmt: (v: number) => `${v}` },
    { label: "Defending (DEF)", a: playerA.attrs.def, b: playerB.attrs.def, fmt: (v: number) => `${v}` },
    { label: "Instinct (INT)", a: playerA.attrs.phy, b: playerB.attrs.phy, fmt: (v: number) => `${v}` },
  ];

  const winsA = metrics.filter((m) => m.a > m.b).length;
  const winsB = metrics.filter((m) => m.b > m.a).length;

  return (
    <>
      <PlaySubnav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">RSL ARCADE / HEAD-TO-HEAD LAB</p>
          <h1 className="page-title">
            Compare players<span className="text-orange-400">.</span>
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Compare any two RSL players across S2–S4 playersheets, peak wages, card attributes, trophies and awards.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPlayerA(playerB);
              setPlayerB(playerA);
            }}
            className="btn btn-sm"
          >
            ⇄ Swap sides
          </button>
          <button type="button" onClick={pickRandom} className="btn btn-primary btn-sm">
            🎲 Random matchup
          </button>
        </div>
      </div>

      {/* Rivalry presets */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Featured rivalries:
        </span>
        {RIVALRY_PRESETS.map(([n1, n2, tag]) => {
          const p1 = findByName(n1);
          const p2 = findByName(n2);
          if (!p1 || !p2) return null;
          return (
            <button
              key={`${n1}-${n2}`}
              type="button"
              onClick={() => {
                setPlayerA(p1);
                setPlayerB(p2);
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-orange-400/45 hover:text-white"
            >
              {p1.username} vs {p2.username} <span className="text-slate-500">· {tag}</span>
            </button>
          );
        })}
      </div>

      {/* Pickers */}
      <div className="grid gap-4 md:grid-cols-2">
        <PlayerPicker
          label="Corner A (Orange)"
          accent="orange"
          selected={playerA}
          players={players}
          onSelect={setPlayerA}
        />
        <PlayerPicker
          label="Corner B (Gold)"
          accent="gold"
          selected={playerB}
          players={players}
          onSelect={setPlayerB}
        />
      </div>

      {/* Cards + Radar */}
      <div className="panel mt-6 grid items-center gap-6 p-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col items-center">
          <FutCard player={playerA} size="lg" />
          <Link href={`/players/${playerA.id}`} className="mt-3 text-xs font-bold text-orange-300 hover:underline">
            Open full profile ↗
          </Link>
        </div>

        <div className="text-center">
          <p className="eyebrow mb-1">ATTRIBUTE RADAR</p>
          <RadarHexagon a={playerA} b={playerB} />
          <div className="mt-2 flex items-center justify-center gap-5 text-xs font-extrabold">
            <span className="flex items-center gap-1.5 text-orange-300">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> {playerA.username}
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> {playerB.username}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <FutCard player={playerB} size="lg" />
          <Link href={`/players/${playerB.id}`} className="mt-3 text-xs font-bold text-amber-300 hover:underline">
            Open full profile ↗
          </Link>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="mt-6 rounded-2xl border border-orange-400/35 bg-gradient-to-r from-orange-500/15 via-[#101e45] to-amber-400/15 p-5 text-center">
        <p className="eyebrow">SCOUTING VERDICT</p>
        <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
          {winsA > winsB
            ? `🏆 ${playerA.username} edges the Tale of the Tape (${winsA}–${winsB})`
            : winsB > winsA
              ? `🏆 ${playerB.username} edges the Tale of the Tape (${winsB}–${winsA})`
              : `⚖️ Dead heat! Tied ${winsA}–${winsB} across categories`}
        </h2>
      </div>

      {/* Tale of the Tape bars + Season trajectory */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="panel overflow-hidden">
          <header className="border-b border-white/[0.07] px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Tale of the Tape</h3>
          </header>
          <div className="divide-y divide-white/[0.05] p-5">
            {metrics.map((m) => {
              const sum = (m.a || 0) + (m.b || 0);
              const pctA = sum > 0 ? Math.round((m.a / sum) * 100) : 50;
              return (
                <div key={m.label} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className={cn("font-mono font-black", m.a >= m.b ? "text-orange-300" : "text-slate-400")}>
                      {m.fmt(m.a)}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {m.label}
                    </span>
                    <span className={cn("font-mono font-black", m.b >= m.a ? "text-amber-300" : "text-slate-400")}>
                      {m.fmt(m.b)}
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="bg-orange-500 transition-all"
                      style={{ width: `${pctA}%` }}
                    />
                    <div
                      className="bg-amber-300 transition-all"
                      style={{ width: `${100 - pctA}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Season-by-season playersheet trajectory */}
          <div className="panel overflow-hidden">
            <header className="border-b border-white/[0.07] px-5 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Season-by-Season Sheet Trajectory
              </h3>
            </header>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>{playerA.username}</th>
                  <th>{playerB.username}</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["S2 Sheet", playerA.s2, playerB.s2],
                    ["S3 Sheet", playerA.s3, playerB.s3],
                    ["S4 Sheet", playerA.s4, playerB.s4],
                  ] as const
                ).map(([label, sa, sb]) => (
                  <tr key={label}>
                    <td className="font-bold text-slate-300">{label}</td>
                    <td>
                      {sa ? (
                        <div>
                          <span className="font-black text-orange-300">
                            {sa.cls} · {sa.rating ?? "—"}
                          </span>
                          <span className="block text-[11px] text-slate-400">{ formatWage(sa.wage) }</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td>
                      {sb ? (
                        <div>
                          <span className="font-black text-amber-300">
                            {sb.cls} · {sb.rating ?? "—"}
                          </span>
                          <span className="block text-[11px] text-slate-400">{ formatWage(sb.wage) }</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Honours comparison */}
          <div className="panel p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Honours &amp; Awards
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-black text-orange-300">{playerA.username}</p>
                {[...playerA.awards, ...playerA.teamTrophies].length ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-300">
                    {[...playerA.awards, ...playerA.teamTrophies].map((aw, idx) => (
                      <li key={idx}>🏆 {aw}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No awards recorded yet.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-black text-amber-300">{playerB.username}</p>
                {[...playerB.awards, ...playerB.teamTrophies].length ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-300">
                    {[...playerB.awards, ...playerB.teamTrophies].map((aw, idx) => (
                      <li key={idx}>🏆 {aw}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No awards recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
